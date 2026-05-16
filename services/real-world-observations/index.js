/**
 * Real-world observation foundation — internal only, moderation-ready.
 */

const fs = require("fs");
const path = require("path");
const {
  OBSERVATION_STATUSES,
  SOURCE_CLASSIFICATIONS,
  normalizeStatus,
  computeFreshness,
  findDuplicateCandidates,
  isActiveStatus,
} = require("./governance");

const OBS_ROOT = path.join(
  __dirname,
  "../../data-acquisition/real-world-observations"
);

const OBSERVATION_TYPES = Object.freeze([
  "range_real_world",
  "range_observation",
  "charging_experience",
  "charging_observation",
  "apartment_charging",
  "service_experience",
  "service_observation",
  "highway_practicality",
  "highway_observation",
  "ownership_comfort",
  "traffic_impact",
]);

/** @deprecated use OBSERVATION_STATUSES from governance */
const LEGACY_STATUSES = Object.freeze([
  "draft",
  "pending_review",
  "approved",
  "rejected",
  "archived",
]);

const CONFIDENCE_LEVELS = Object.freeze(["HIGH", "MEDIUM", "LOW", "UNKNOWN"]);

function ensureStore() {
  fs.mkdirSync(OBS_ROOT, { recursive: true });
  const indexPath = path.join(OBS_ROOT, "index.json");
  if (!fs.existsSync(indexPath)) {
    fs.writeFileSync(
      indexPath,
      JSON.stringify(
        {
          version: 3,
          items: [],
          updatedAt: null,
          _governance: {
            publicExposure: false,
            requiresEditorialReview: true,
            supportsProvenance: true,
            statuses: OBSERVATION_STATUSES,
          },
        },
        null,
        2
      )
    );
  }
  return indexPath;
}

function loadIndex() {
  ensureStore();
  return JSON.parse(
    fs.readFileSync(path.join(OBS_ROOT, "index.json"), "utf8")
  );
}

function saveIndex(index) {
  index.updatedAt = new Date().toISOString();
  fs.writeFileSync(
    path.join(OBS_ROOT, "index.json"),
    JSON.stringify(index, null, 2)
  );
}

function registerObservation(input) {
  ensureStore();
  const index = loadIndex();

  const type = input.observationType;
  if (!OBSERVATION_TYPES.includes(type)) {
    throw new Error(`invalid observationType: ${type}`);
  }

  const conf = input.confidenceLevel || "LOW";
  if (!CONFIDENCE_LEVELS.includes(conf)) {
    throw new Error(`invalid confidenceLevel: ${conf}`);
  }

  const sourceClass = input.sourceClassification || "EDITORIAL_FIELD_OPS";
  if (!SOURCE_CLASSIFICATIONS.includes(sourceClass)) {
    throw new Error(`invalid sourceClassification: ${sourceClass}`);
  }

  const id = `obs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  const item = {
    observationId: id,
    tier1VariantSlug: input.tier1VariantSlug,
    observationType: type,
    summary: input.summary,
    detail: input.detail || null,
    status: input.status || "pending_review",
    confidenceLevel: conf,
    editorialTone: input.editorialTone || null,
    observedAt: input.observedAt || now,
    sourceClassification: sourceClass,
    verificationNotes: input.verificationNotes || null,
    supersededBy: null,
    provenance: {
      sourceId: input.sourceId || null,
      extractionMethod: input.extractionMethod || "MANUAL_ENTRY",
      submittedBy: input.submittedBy || "editor",
      submittedAt: now,
      reviewStatus: "pending_review",
      pageHint: input.pageHint || null,
    },
    moderation: {
      publicExposure: false,
      editorialReviewRequired: true,
    },
    freshness: computeFreshness({ observedAt: input.observedAt || now }),
  };

  const dupes = findDuplicateCandidates(index.items, item);
  if (dupes.length > 0) {
    item.duplicateOf = dupes[0].observationId;
    item.duplicateWarning = true;
  }

  index.items.unshift(item);
  saveIndex(index);

  fs.writeFileSync(
    path.join(OBS_ROOT, `${id}.json`),
    JSON.stringify(item, null, 2)
  );

  return item;
}

function setObservationStatus(observationId, status, reviewerNotes = "") {
  const index = loadIndex();
  const ix = index.items.findIndex((i) => i.observationId === observationId);
  if (ix < 0) throw new Error(`unknown observation: ${observationId}`);

  const normalized = normalizeStatus(status);
  if (!OBSERVATION_STATUSES.includes(normalized) && normalized !== "rejected") {
    throw new Error(`invalid status: ${status}`);
  }

  index.items[ix].status = normalized;
  index.items[ix].reviewedAt = new Date().toISOString();
  if (reviewerNotes) index.items[ix].verificationNotes = reviewerNotes;
  index.items[ix].provenance.reviewStatus = normalized;
  index.items[ix].freshness = computeFreshness(index.items[ix]);

  saveIndex(index);
  const detailPath = path.join(OBS_ROOT, `${observationId}.json`);
  if (fs.existsSync(detailPath)) {
    fs.writeFileSync(detailPath, JSON.stringify(index.items[ix], null, 2));
  }
  return index.items[ix];
}

function supersedeObservation(observationId, replacementId, notes = "") {
  const item = setObservationStatus(observationId, "superseded", notes);
  item.supersededBy = replacementId;
  const index = loadIndex();
  const ix = index.items.findIndex((i) => i.observationId === observationId);
  if (ix >= 0) {
    index.items[ix] = item;
    saveIndex(index);
  }
  return item;
}

function listObservations(filters = {}) {
  const index = loadIndex();
  let items = index.items;
  if (filters.tier1VariantSlug) {
    items = items.filter(
      (i) => i.tier1VariantSlug === filters.tier1VariantSlug
    );
  }
  if (filters.status) {
    const want = normalizeStatus(filters.status);
    items = items.filter((i) => normalizeStatus(i.status) === want);
  }
  if (filters.observationType) {
    items = items.filter((i) => i.observationType === filters.observationType);
  }
  if (filters.activeOnly) {
    items = items.filter((i) => isActiveStatus(i.status));
  }
  return { count: items.length, items };
}

function observationSupportBySlug(tier1VariantSlug) {
  const { items } = listObservations({ tier1VariantSlug });
  const verified = items.filter(
    (i) => normalizeStatus(i.status) === "verified_editorial"
  );
  const stale = items.filter((i) => computeFreshness(i).tier === "stale");
  return {
    tier1VariantSlug,
    total: items.length,
    approved: verified.length,
    verifiedEditorial: verified.length,
    pending: items.filter(
      (i) => normalizeStatus(i.status) === "pending_review"
    ).length,
    lowConfidence: items.filter(
      (i) => normalizeStatus(i.status) === "low_confidence"
    ).length,
    stale: stale.length,
    hasSupport: verified.length >= 2,
    calibrationReady: verified.length >= 2,
  };
}

function buildObservationFleetSummary() {
  const index = loadIndex();
  const slugs = [...new Set(index.items.map((i) => i.tier1VariantSlug))];
  const bySlug = {};
  let staleCount = 0;
  let pendingCount = 0;
  let verifiedCount = 0;

  for (const item of index.items) {
    const fresh = computeFreshness(item);
    if (fresh.tier === "stale") staleCount += 1;
    if (normalizeStatus(item.status) === "pending_review") pendingCount += 1;
    if (normalizeStatus(item.status) === "verified_editorial") verifiedCount += 1;
  }

  for (const slug of slugs) {
    bySlug[slug] = observationSupportBySlug(slug);
  }

  return {
    totalObservations: index.items.length,
    variantsWithObservations: slugs.length,
    verifiedCount,
    pendingCount,
    staleCount,
    bySlug,
  };
}

module.exports = {
  OBSERVATION_TYPES,
  OBSERVATION_STATUSES,
  LEGACY_STATUSES,
  CONFIDENCE_LEVELS,
  SOURCE_CLASSIFICATIONS,
  OBS_ROOT,
  registerObservation,
  setObservationStatus,
  supersedeObservation,
  listObservations,
  observationSupportBySlug,
  buildObservationFleetSummary,
  normalizeStatus,
  computeFreshness,
  findDuplicateCandidates,
};
