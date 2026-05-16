/**
 * Provenance wrapper for every extracted/normalized field — trust governance.
 */

const EXTRACTION_METHODS = Object.freeze([
  "TABLE_EXTRACTION",
  "TEXT_EXTRACTION",
  "MANUAL_ENTRY",
  "OCR_EXTRACTION",
]);

const CONFIDENCE_LEVELS = Object.freeze(["HIGH", "MEDIUM", "LOW", "UNKNOWN"]);

const REVIEW_FOR_FIELD = Object.freeze([
  "pending_review",
  "approved",
  "rejected",
  "needs_manual_check",
]);

function createFieldProvenance({
  sourceType,
  confidenceLevel = "UNKNOWN",
  extractionMethod,
  reviewStatus = "pending_review",
  extractedAt = null,
  sourceId = null,
  pageHint = null,
}) {
  const em = extractionMethod;
  if (!EXTRACTION_METHODS.includes(em)) {
    throw new Error(`invalid extractionMethod: ${em}`);
  }
  if (!CONFIDENCE_LEVELS.includes(confidenceLevel)) {
    throw new Error(`invalid confidenceLevel: ${confidenceLevel}`);
  }
  if (!REVIEW_FOR_FIELD.includes(reviewStatus)) {
    throw new Error(`invalid reviewStatus: ${reviewStatus}`);
  }

  return {
    sourceType: sourceType || "OEM_PDF",
    confidenceLevel,
    extractionMethod: em,
    reviewStatus,
    extractedAt: extractedAt || new Date().toISOString(),
    sourceId,
    pageHint: pageHint ?? null,
  };
}

function wrapProvenancedValue(value, metadata) {
  if (value === undefined) {
    throw new Error(
      "omit field instead of wrapping undefined — never guess values"
    );
  }
  return { value, metadata };
}

function assertProvenanceCoverage(obj, path = "") {
  const gaps = [];
  if (obj === null || typeof obj !== "object") {
    return gaps;
  }
  if ("value" in obj && "metadata" in obj) {
    const { metadata } = obj;
    if (!metadata || typeof metadata !== "object") {
      gaps.push(`${path || "<root>"}.metadata missing`);
      return gaps;
    }
    const required = [
      "sourceType",
      "confidenceLevel",
      "extractionMethod",
      "reviewStatus",
      "extractedAt",
    ];
    for (const k of required) {
      if (metadata[k] == null || metadata[k] === "") {
        gaps.push(`${path || "<field>"}.metadata.${k}`);
      }
    }
    return gaps;
  }
  for (const [k, v] of Object.entries(obj)) {
    const p = path ? `${path}.${k}` : k;
    gaps.push(...assertProvenanceCoverage(v, p));
  }
  return gaps;
}

module.exports = {
  EXTRACTION_METHODS,
  CONFIDENCE_LEVELS,
  createFieldProvenance,
  wrapProvenancedValue,
  assertProvenanceCoverage,
};
