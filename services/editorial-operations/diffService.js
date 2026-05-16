/**
 * Diff review — Tier-1 published vs approved draft.
 */

const {
  detectVariantDiffs,
  loadTier1Variant,
} = require("../acquisition-diffs");
const { loadJobById, loadJobArtifact } = require("./helpers");

function buildJobDiff(jobId) {
  const found = loadJobById(jobId);
  if (!found) return null;
  const { job, paths } = found;
  const { artifact, error } = loadJobArtifact(job, paths);
  if (!artifact) {
    return {
      error: error || "artifact_missing",
      tier1VariantSlug: job.tier1VariantSlug,
    };
  }

  let published;
  try {
    published = loadTier1Variant(job.tier1VariantSlug);
  } catch (e) {
    return {
      error: "tier1_not_found",
      message: e.message,
      tier1VariantSlug: job.tier1VariantSlug,
    };
  }

  const diff = detectVariantDiffs(published, artifact, {
    draftUsesProvenance: true,
  });

  const enriched = diff.changes.map((c) => {
    const draftMeta = getProvenanceAtPath(artifact, c.field);
    return {
      ...c,
      provenance: draftMeta,
      display: {
        label: c.field,
        state:
          c.changeType === "draft_only"
            ? "added"
            : c.changeType === "published_only"
              ? "removed"
              : "changed",
      },
    };
  });

  return {
    generatedAt: diff.generatedAt,
    jobId,
    tier1VariantSlug: job.tier1VariantSlug,
    changeCount: diff.changeCount,
    changes: enriched,
    summary: {
      modified: enriched.filter((c) => c.changeType === "modified").length,
      draftOnly: enriched.filter((c) => c.changeType === "draft_only").length,
      publishedOnly: enriched.filter((c) => c.changeType === "published_only").length,
    },
  };
}

function getProvenanceAtPath(doc, dotted) {
  const parts = dotted.split(".");
  let cur = doc;
  for (const p of parts) {
    if (!cur) return null;
    cur = cur[p];
  }
  if (cur && typeof cur === "object" && cur.metadata) {
    return cur.metadata;
  }
  return null;
}

module.exports = { buildJobDiff };
