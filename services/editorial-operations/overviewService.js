/**
 * Editorial dashboard overview — ingestion queue + source registry snapshot.
 */

const fs = require("fs");
const path = require("path");
const { loadRegistry } = require("../source-registry");
const { loadQueue } = require("../review-queue");
const {
  getPaths,
  loadRawExtract,
  jobIdsInStagedManifests,
  effectiveLifecycle,
  listManifests,
} = require("./helpers");
const { validateNormalizedSchema } = require("../spec-normalization");

function countBy(items, keyFn) {
  const m = {};
  for (const item of items) {
    const k = keyFn(item);
    m[k] = (m[k] || 0) + 1;
  }
  return m;
}

function scanExtractedWarnings(paths) {
  const dir = paths.extracted;
  const warnings = [];
  if (!fs.existsSync(dir)) return warnings;

  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".raw.extract.json"))) {
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
      const sourceId = raw.sourceId;
      if (raw.confidenceLevel === "LOW" || raw._governance?.doNotPublish) {
        warnings.push({
          type: "low_confidence_extract",
          sourceId,
          tier1VariantSlug: raw.tier1VariantSlug,
          confidenceLevel: raw.confidenceLevel,
        });
      }
      const pages = raw.payload?.pages || [];
      const hasOcr = pages.some((p) => p.ocrUsed);
      if (hasOcr) {
        warnings.push({
          type: "ocr_used",
          sourceId,
          tier1VariantSlug: raw.tier1VariantSlug,
        });
      }
    } catch {
      warnings.push({ type: "invalid_extract_json", file });
    }
  }
  return warnings;
}

function buildOverview() {
  const paths = getPaths();
  const queue = loadQueue(paths.root);
  const registry = loadRegistry();
  const stagedIds = jobIdsInStagedManifests(paths);

  const jobs = queue.items.map((job) => {
    const lifecycle = effectiveLifecycle(job, paths);
    let provenanceWarnings = 0;
    try {
      const abs = path.join(paths.root, job.artifactPath);
      if (fs.existsSync(abs)) {
        const artifact = JSON.parse(fs.readFileSync(abs, "utf8"));
        const v = validateNormalizedSchema(artifact);
        provenanceWarnings = v.provenanceGaps?.length || 0;
      }
    } catch {
      provenanceWarnings = -1;
    }
    return {
      ...job,
      lifecycle,
      isStaged: stagedIds.has(job.jobId),
      provenanceWarningCount: provenanceWarnings,
    };
  });

  const extractionFailures = registry.sources.filter(
    (s) => s.extractionStatus === "extract_failed"
  );

  const lowConfidenceJobs = jobs.filter(
    (j) => j.lifecycle === "pending_review" || j.lifecycle === "needs_manual_review"
  );

  return {
    generatedAt: new Date().toISOString(),
    counts: {
      pendingReview: jobs.filter((j) => j.lifecycle === "pending_review").length,
      needsManualReview: jobs.filter((j) => j.lifecycle === "needs_manual_review").length,
      approved: jobs.filter((j) => j.status === "approved").length,
      rejected: jobs.filter((j) => j.status === "rejected").length,
      staged: jobs.filter((j) => j.isStaged).length,
      extractionFailures: extractionFailures.length,
      sourcesRegistered: registry.sources.length,
      rawExtracts: fs.existsSync(paths.extracted)
        ? fs.readdirSync(paths.extracted).filter((f) => f.endsWith(".raw.extract.json")).length
        : 0,
    },
    jobsByLifecycle: countBy(jobs, (j) => j.lifecycle),
    jobsByBrand: countBy(
      jobs,
      (j) => registry.sources.find((s) => s.sourceId === j.sourceId)?.brand || "unknown"
    ),
    extractionFailures,
    extractWarnings: scanExtractedWarnings(paths),
    recentJobs: jobs.slice(0, 20),
    manifestCount: listManifests(paths).length,
    sourcesSummary: {
      byExtractionStatus: countBy(registry.sources, (s) => s.extractionStatus || "registered"),
      byReviewStatus: countBy(registry.sources, (s) => s.reviewStatus || "pending_review"),
      needsAsset: registry.sources.filter(
        (s) => !s.localAssetPath && !s.sourceUrl
      ).length,
    },
  };
}

module.exports = { buildOverview };
