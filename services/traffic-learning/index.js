/**
 * Traffic-learning foundation — manual observations storage shape only.
 * No automated optimization engines.
 */

/**
 * Record shape for future GSC/Bing manual imports.
 */
function createTrafficObservation({
  source = "manual_gsc",
  pagePath,
  impressions = null,
  clicks = null,
  ctr = null,
  avgPosition = null,
  periodStart,
  periodEnd,
  notes = "",
}) {
  return {
    source,
    pagePath,
    impressions,
    clicks,
    ctr,
    avgPosition,
    periodStart,
    periodEnd,
    notes,
    recordedAt: new Date().toISOString(),
    _purpose: "future_ranking_and_ctr_calibration",
  };
}

/**
 * Landing-page effectiveness snapshot (aggregated).
 */
function createLandingEffectivenessRecord({
  pagePath,
  pageType,
  sessions = 0,
  leads = 0,
  compareStarts = 0,
  periodDays = 7,
}) {
  return {
    pagePath,
    pageType,
    sessions,
    leads,
    compareStarts,
    leadRate: sessions > 0 ? leads / sessions : 0,
    compareRate: sessions > 0 ? compareStarts / sessions : 0,
    periodDays,
    recordedAt: new Date().toISOString(),
  };
}

const TRAFFIC_LEARNING_SCHEMA = {
  version: 1,
  observationTypes: [
    "search_console_ctr",
    "search_console_position",
    "landing_lead_rate",
    "compare_effectiveness",
  ],
  storageRecommendation:
    "Append to ops/traffic-observations.jsonl or external sheet until BI layer exists",
};

module.exports = {
  createTrafficObservation,
  createLandingEffectivenessRecord,
  TRAFFIC_LEARNING_SCHEMA,
};
