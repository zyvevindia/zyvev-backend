/**
 * Governed Tier-1 data acquisition — coordination, paths, lifecycle.
 * Does not modify published catalog automatically.
 */

const path = require("path");

/** @readonly */
const LIFECYCLE = Object.freeze([
  "registered",
  "extracted",
  "normalized",
  "pending_review",
  "approved",
  "published",
]);

const SOURCE_TYPES = Object.freeze([
  "OEM_WEBSITE",
  "OEM_BROCHURE",
  "OEM_PDF",
  "GOVERNMENT_DATASET",
  "PUBLIC_CHARGING_DATA",
]);

const EXTRACTION_STATUSES = Object.freeze([
  "registered",
  "queued",
  "extracting",
  "extract_ok",
  "extract_failed",
  "normalized",
]);

const REVIEW_STATUSES = Object.freeze([
  "pending_review",
  "approved",
  "rejected",
  "needs_manual_check",
]);

const ACQUISITION_ROOT = path.join(__dirname, "../..", "data-acquisition");

function getStagingPaths(root = ACQUISITION_ROOT) {
  return {
    root,
    extracted: path.join(root, "staging", "extracted"),
    normalized: path.join(root, "staging", "normalized"),
    pendingReview: path.join(root, "staging", "pending_review"),
    approved: path.join(root, "staging", "approved"),
    logs: path.join(root, "logs"),
    rejects: path.join(root, "staging", "rejected"),
  };
}

function isValidLifecycleTransition(from, to) {
  const i = LIFECYCLE.indexOf(from);
  const j = LIFECYCLE.indexOf(to);
  if (i < 0 || j < 0) return false;
  return j === i || j === i + 1;
}

module.exports = {
  LIFECYCLE,
  SOURCE_TYPES,
  EXTRACTION_STATUSES,
  REVIEW_STATUSES,
  ACQUISITION_ROOT,
  getStagingPaths,
  isValidLifecycleTransition,
};
