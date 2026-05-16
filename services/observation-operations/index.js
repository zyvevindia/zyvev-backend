/**
 * Editorial observation moderation — internal only.
 */

const {
  listObservations,
  setObservationStatus,
  supersedeObservation,
  registerObservation,
  findDuplicateCandidates,
  computeFreshness,
  OBSERVATION_STATUSES,
  SOURCE_CLASSIFICATIONS,
} = require("../real-world-observations");

function listForModeration(filters = {}) {
  const { items, count } = listObservations(filters);
  return {
    count,
    items: items.map(enrichForUi),
    statuses: OBSERVATION_STATUSES,
    sourceClassifications: SOURCE_CLASSIFICATIONS,
  };
}

function enrichForUi(item) {
  const { items } = listObservations({ tier1VariantSlug: item.tier1VariantSlug });
  const dupes = findDuplicateCandidates(items, item);
  return {
    ...item,
    freshness: computeFreshness(item),
    duplicateCandidates: dupes
      .filter((d) => d.observationId !== item.observationId)
      .map((d) => ({
        observationId: d.observationId,
        summary: d.summary,
        status: d.status,
      })),
  };
}

function moderateObservation(observationId, action, reviewerNotes = "") {
  const actions = {
    approve: "verified_editorial",
    verify: "verified_editorial",
    reject: "rejected",
    archive: "archived",
    low_confidence: "low_confidence",
    pending: "pending_review",
  };
  const status = actions[action] || action;
  return setObservationStatus(observationId, status, reviewerNotes);
}

function supersede(observationId, replacementId, notes) {
  return supersedeObservation(observationId, replacementId, notes);
}

module.exports = {
  listForModeration,
  moderateObservation,
  supersede,
  registerObservation,
};
