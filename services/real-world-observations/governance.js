/**
 * Observation governance — duplicates, freshness, confidence decay.
 */

const OBSERVATION_STATUSES = Object.freeze([
  "draft",
  "pending_review",
  "verified_editorial",
  "low_confidence",
  "archived",
  "superseded",
  "rejected",
]);

const SOURCE_CLASSIFICATIONS = Object.freeze([
  "EDITORIAL_FIELD_OPS",
  "DEALER_PARTNER",
  "OEM_SUPPORTING",
  "INTERNAL_VALIDATION",
  "EDITORIAL_SYNTHESIS",
]);

const FRESHNESS_STALE_DAYS = 365;
const FRESHNESS_AGING_DAYS = 180;

function normalizeStatus(status) {
  if (status === "approved") return "verified_editorial";
  return status;
}

function daysSince(isoDate) {
  if (!isoDate) return null;
  const ms = Date.now() - new Date(isoDate).getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

function computeFreshness(item) {
  const anchor =
    item.observedAt ||
    item.provenance?.submittedAt ||
    item.reviewedAt ||
    null;
  const ageDays = daysSince(anchor);
  if (ageDays == null) {
    return { ageDays: null, tier: "unknown", weight: 0.5 };
  }
  if (ageDays > FRESHNESS_STALE_DAYS) {
    return { ageDays, tier: "stale", weight: 0.35 };
  }
  if (ageDays > FRESHNESS_AGING_DAYS) {
    return { ageDays, tier: "aging", weight: 0.65 };
  }
  return { ageDays, tier: "fresh", weight: 1 };
}

function observationFingerprint(item) {
  const slug = item.tier1VariantSlug || "";
  const type = item.observationType || "";
  const summary = (item.summary || "").toLowerCase().replace(/\s+/g, " ").trim();
  return `${slug}|${type}|${summary.slice(0, 80)}`;
}

function findDuplicateCandidates(items, candidate) {
  const fp = observationFingerprint(candidate);
  return items.filter((i) => {
    if (i.observationId === candidate.observationId) return false;
    if (i.status === "archived" || i.status === "superseded") return false;
    return observationFingerprint(i) === fp;
  });
}

function isActiveStatus(status) {
  const s = normalizeStatus(status);
  return ["verified_editorial", "pending_review", "low_confidence", "draft"].includes(
    s
  );
}

module.exports = {
  OBSERVATION_STATUSES,
  SOURCE_CLASSIFICATIONS,
  FRESHNESS_STALE_DAYS,
  FRESHNESS_AGING_DAYS,
  normalizeStatus,
  computeFreshness,
  observationFingerprint,
  findDuplicateCandidates,
  isActiveStatus,
  daysSince,
};
