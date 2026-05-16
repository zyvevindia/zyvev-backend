/**
 * Review job listing, detail, and workflow transitions.
 */

const fs = require("fs");
const path = require("path");
const { loadRegistry } = require("../source-registry");
const { listJobs, setJobStatus, loadQueue, saveQueue } = require("../review-queue");
const {
  getPaths,
  loadJobById,
  loadJobArtifact,
  loadRawExtract,
  effectiveLifecycle,
  jobIdsInStagedManifests,
} = require("./helpers");
const { validateNormalizedSchema } = require("../spec-normalization");

function listJobsFiltered(filters = {}) {
  const paths = getPaths();
  const registry = loadRegistry();
  let items = loadQueue(paths.root).items.map((job) => {
    const source = registry.sources.find((s) => s.sourceId === job.sourceId);
    return {
      ...job,
      lifecycle: effectiveLifecycle(job, paths),
      brand: source?.brand || null,
      model: source?.model || null,
      sourceType: source?.sourceType || null,
      extractionStatus: source?.extractionStatus || null,
    };
  });

  if (filters.status) {
    items = items.filter(
      (j) => j.status === filters.status || j.lifecycle === filters.status
    );
  }
  if (filters.brand) {
    const b = String(filters.brand).toLowerCase();
    items = items.filter((j) => j.brand === b);
  }
  if (filters.sourceType) {
    items = items.filter((j) => j.sourceType === filters.sourceType);
  }
  if (filters.confidenceLevel) {
    items = items.filter((j) => {
      const raw = loadRawExtract(j.sourceId, paths);
      return raw?.confidenceLevel === filters.confidenceLevel;
    });
  }
  if (filters.extractionStatus) {
    items = items.filter((j) => j.extractionStatus === filters.extractionStatus);
  }

  return { generatedAt: new Date().toISOString(), count: items.length, items };
}

function getJobDetail(jobId) {
  const found = loadJobById(jobId);
  if (!found) return null;
  const { job, paths } = found;
  const registry = loadRegistry();
  const source = registry.sources.find((s) => s.sourceId === job.sourceId);
  const { artifact, error: artifactError } = loadJobArtifact(job, paths);
  const rawExtract = loadRawExtract(job.sourceId, paths);

  let schemaValidation = null;
  let fieldSummary = null;
  if (artifact) {
    schemaValidation = validateNormalizedSchema(artifact);
    fieldSummary = summarizeFields(artifact);
  }

  return {
    generatedAt: new Date().toISOString(),
    job: {
      ...job,
      lifecycle: effectiveLifecycle(job, paths),
      isStaged: jobIdsInStagedManifests(paths).has(job.jobId),
    },
    source: source || null,
    artifact,
    artifactError,
    rawExtractSummary: rawExtract
      ? {
          extractedAt: rawExtract.extractedAt,
          extractionMethod: rawExtract.extractionMethod,
          confidenceLevel: rawExtract.confidenceLevel,
          pageCount: rawExtract.payload?.pages?.length ?? 0,
          tableCount: rawExtract.payload?.tables?.length ?? 0,
        }
      : null,
    schemaValidation,
    fieldSummary,
  };
}

function summarizeFields(artifact) {
  const sections = [
    "pricing",
    "battery",
    "range",
    "charging",
    "practicality",
    "ownership",
    "safety",
  ];
  const fields = [];
  const unsupported = artifact._normalizationWarnings || [];
  const missing = artifact._missingFlatKeys || [];

  function walk(obj, prefix = "") {
    if (!obj || typeof obj !== "object") return;
    if ("value" in obj && "metadata" in obj) {
      fields.push({
        path: prefix,
        value: obj.value,
        metadata: obj.metadata,
        reviewStatus: obj.metadata?.reviewStatus || "pending_review",
        confidenceLevel: obj.metadata?.confidenceLevel,
        extractionMethod: obj.metadata?.extractionMethod,
      });
      return;
    }
    for (const [k, v] of Object.entries(obj)) {
      if (k.startsWith("_")) continue;
      walk(v, prefix ? `${prefix}.${k}` : k);
    }
  }

  for (const sec of sections) {
    if (artifact[sec]) walk(artifact[sec], sec);
  }

  return {
    fieldCount: fields.length,
    fields,
    unsupportedWarnings: unsupported,
    missingFlatKeys: missing,
    provenanceGaps: [],
  };
}

function approveJob(jobId, reviewerNotes = "") {
  const job = setJobStatus(null, jobId, "approved", reviewerNotes);
  updateLifecycleInQueue(jobId, "approved");
  return getJobDetail(jobId);
}

function rejectJob(jobId, reviewerNotes = "") {
  setJobStatus(null, jobId, "rejected", reviewerNotes);
  updateLifecycleInQueue(jobId, "rejected");
  return getJobDetail(jobId);
}

function sendToManualReview(jobId, reviewerNotes = "") {
  const paths = getPaths();
  const q = loadQueue(paths.root);
  const ix = q.items.findIndex((i) => i.jobId === jobId);
  if (ix < 0) throw new Error(`unknown jobId: ${jobId}`);
  q.items[ix].status = "needs_manual_review";
  q.items[ix].lifecycleStage = "needs_manual_review";
  if (reviewerNotes) q.items[ix].reviewerNotes = reviewerNotes;
  saveQueue(q, paths.root);
  return getJobDetail(jobId);
}

function returnToPendingReview(jobId, reviewerNotes = "") {
  const paths = getPaths();
  const q = loadQueue(paths.root);
  const ix = q.items.findIndex((i) => i.jobId === jobId);
  if (ix < 0) throw new Error(`unknown jobId: ${jobId}`);
  const job = q.items[ix];
  job.status = "pending_review";
  job.lifecycleStage = "pending_review";
  if (reviewerNotes) job.reviewerNotes = reviewerNotes;

  const abs = path.join(paths.root, job.artifactPath);
  const pendingDest = path.join(paths.pendingReview, path.basename(abs));
  if (fs.existsSync(abs) && abs !== pendingDest) {
    fs.renameSync(abs, pendingDest);
    job.artifactPath = path.relative(paths.root, pendingDest);
  }
  saveQueue(q, paths.root);
  return getJobDetail(jobId);
}

function updateLifecycleInQueue(jobId, stage) {
  const paths = getPaths();
  const q = loadQueue(paths.root);
  const ix = q.items.findIndex((i) => i.jobId === jobId);
  if (ix >= 0) {
    q.items[ix].lifecycleStage = stage;
    saveQueue(q, paths.root);
  }
}

module.exports = {
  listJobsFiltered,
  getJobDetail,
  approveJob,
  rejectJob,
  sendToManualReview,
  returnToPendingReview,
  summarizeFields,
};
