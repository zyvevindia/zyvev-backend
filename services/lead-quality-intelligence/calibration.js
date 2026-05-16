/**
 * Lead quality calibration observations — internal learning notes, not dealer scores.
 */

function buildCalibrationObservations(fleetSummary, behavioralTrends = null) {
  const observations = [];
  const total = fleetSummary?.totalLeads ?? 0;
  const rates = fleetSummary?.rates || {};

  if (total === 0) {
    observations.push({
      id: "no_leads",
      message:
        "No leads in period — validate forms on staging/production before scaling traffic.",
      priority: "high",
    });
    return observations;
  }

  if (rates.trustEngaged >= 25) {
    observations.push({
      id: "trust_correlation",
      message: `${rates.trustEngaged}% of leads show trust-panel engagement — prioritize trust copy on top vehicles.`,
      priority: "medium",
    });
  }

  if (rates.compareEngaged >= 35) {
    observations.push({
      id: "compare_value",
      message: `${rates.compareEngaged}% compare-assisted — dealer summaries should reference compared models.`,
      priority: "medium",
    });
  }

  if (rates.chargingConcern >= 20) {
    observations.push({
      id: "charging_focus",
      message: `${rates.chargingConcern}% charging-concern signal — ensure charging practicality visible above fold on detail.`,
      priority: "medium",
    });
  }

  if (rates.firstTimeBuyer >= 25) {
    observations.push({
      id: "first_ev_cohort",
      message: `${rates.firstTimeBuyer}% first-time EV pattern — first-time buyer SEO guides merit weekly GSC review.`,
      priority: "low",
    });
  }

  const highTier = fleetSummary?.tierDistribution?.high ?? 0;
  if (total > 5 && highTier / total < 0.2) {
    observations.push({
      id: "intent_attach",
      message:
        "Low high-tier lead share — enable behavioral intent attach on lead submit if not already on.",
      priority: "high",
    });
  }

  if (behavioralTrends?.conversionPatterns?.leadRatePerSession < 2) {
    observations.push({
      id: "session_conversion",
      message:
        "Lead rate per session below 2% — review CTA visibility on compare and SEO guides.",
      priority: "medium",
    });
  }

  return observations;
}

function buildLeadCalibrationReport(leads, behavioralTrends = null) {
  const { buildFleetLeadQualitySummary } = require("./index");
  const fleet = buildFleetLeadQualitySummary(leads);
  return {
    ...fleet,
    calibrationObservations: buildCalibrationObservations(fleet, behavioralTrends),
  };
}

module.exports = {
  buildCalibrationObservations,
  buildLeadCalibrationReport,
};
