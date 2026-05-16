/**
 * Field-level editorial actions — human-reviewed edits with provenance.
 */

const fs = require("fs");
const path = require("path");
const { getDeep } = require("../spec-normalization");
const {
  wrapProvenancedValue,
  createFieldProvenance,
} = require("../spec-normalization/provenance");
const { loadJobById, loadJobArtifact } = require("./helpers");
const { recordRevision } = require("./versioningService");

function setDeep(obj, dotted, leaf) {
  const parts = dotted.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!cur[p] || typeof cur[p] !== "object") cur[p] = {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = leaf;
}

function updateField(jobId, fieldPath, value, options = {}) {
  const found = loadJobById(jobId);
  if (!found) throw new Error(`unknown jobId: ${jobId}`);
  const { job, paths } = found;
  const { artifact, abs, error } = loadJobArtifact(job, paths);
  if (!artifact) throw new Error(error || "artifact_missing");

  const action = options.action || "edit";
  const existing = getDeep(artifact, fieldPath);
  const baseMeta = existing?.metadata || {
    sourceType: "OEM_BROCHURE",
    extractionMethod: "MANUAL_ENTRY",
    confidenceLevel: "HIGH",
    reviewStatus: "pending_review",
    sourceId: artifact.sourceId || job.sourceId,
  };

  if (action === "reject") {
    setDeep(artifact, fieldPath, {
      ...existing,
      metadata: {
        ...baseMeta,
        reviewStatus: "rejected",
        rejectedAt: new Date().toISOString(),
        rejectReason: options.reason || "editor_rejected",
      },
    });
  } else if (action === "approve_field") {
    setDeep(artifact, fieldPath, {
      ...existing,
      metadata: {
        ...baseMeta,
        reviewStatus: "approved",
        reviewedAt: new Date().toISOString(),
      },
    });
  } else if (action === "needs_manual_review") {
    setDeep(artifact, fieldPath, {
      ...existing,
      metadata: {
        ...baseMeta,
        reviewStatus: "needs_manual_check",
      },
    });
  } else {
    const meta = createFieldProvenance({
      sourceType: baseMeta.sourceType || "OEM_BROCHURE",
      confidenceLevel: options.confidenceLevel || "HIGH",
      extractionMethod: "MANUAL_ENTRY",
      reviewStatus: "pending_review",
      sourceId: baseMeta.sourceId || job.sourceId,
      pageHint: options.pageHint || baseMeta.pageHint,
    });
    setDeep(artifact, fieldPath, wrapProvenancedValue(value, meta));
  }

  fs.writeFileSync(abs, JSON.stringify(artifact, null, 2));
  recordRevision(jobId, `field_${action}`, `${action}: ${fieldPath}`, options.editor);

  return { ok: true, fieldPath, action, jobId };
}

module.exports = { updateField };
