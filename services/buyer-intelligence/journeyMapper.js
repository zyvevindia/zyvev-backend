/**
 * Session journey reconstruction — anonymous, chronological.
 */

const JOURNEY_STEP_MAP = {
  detail_page_viewed: "detail",
  compare_started: "compare",
  compare_completed: "compare",
  ownership_panel_viewed: "ownership",
  charging_reality_expanded: "charging",
  scenario_compare_viewed: "scenario",
  seo_to_detail: "seo",
  lead_cta_initiated: "lead",
  lead_submitted: "convert",
  bookmark_saved: "save",
};

function mapEventToStep(eventType) {
  return JOURNEY_STEP_MAP[eventType] || "other";
}

/**
 * @param {object[]} events — sorted by timestamp asc
 */
function reconstructJourney(events) {
  const sorted = [...events].sort(
    (a, b) =>
      new Date(a.timestamp) - new Date(b.timestamp)
  );

  const steps = sorted.map((e) => ({
    eventType: e.eventType,
    step: mapEventToStep(e.eventType),
    timestamp: e.timestamp,
    sourcePage: e.payload?.sourcePage || null,
    vehicles: e.payload?.vehicleSlugs || e.payload?.vehicles || [],
  }));

  const path = steps.map((s) => s.step);
  const pathSignature = path.join("→");

  const hasSeoEntry = steps.some((s) => s.step === "seo");
  const reachedCompare = steps.some((s) => s.step === "compare");
  const reachedOwnership = steps.some(
    (s) => s.step === "ownership"
  );
  const reachedLead = steps.some((s) => s.step === "lead");
  const converted = steps.some((s) => s.step === "convert");

  const hesitationIndicators = [];
  if (reachedCompare && !converted) {
    hesitationIndicators.push("compare_without_lead");
  }
  if (reachedOwnership && reachedCompare && !converted) {
    hesitationIndicators.push("deep_research_no_conversion");
  }
  if (steps.filter((s) => s.step === "detail").length >= 3) {
    hesitationIndicators.push("multi_vehicle_browsing");
  }

  const confidenceBuilders = [];
  if (reachedOwnership) {
    confidenceBuilders.push("ownership_reality_engaged");
  }
  if (steps.some((s) => s.step === "charging")) {
    confidenceBuilders.push("charging_reality_engaged");
  }
  if (reachedCompare && converted) {
    confidenceBuilders.push("compare_to_lead");
  }
  if (hasSeoEntry && converted) {
    confidenceBuilders.push("seo_funnel_conversion");
  }

  return {
    sessionId: events[0]?.sessionId || null,
    stepCount: steps.length,
    pathSignature,
    steps,
    flags: {
      hasSeoEntry,
      reachedCompare,
      reachedOwnership,
      reachedLead,
      converted,
    },
    hesitationIndicators,
    confidenceBuilders,
  };
}

module.exports = {
  reconstructJourney,
  mapEventToStep,
  JOURNEY_STEP_MAP,
};
