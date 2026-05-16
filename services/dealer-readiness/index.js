/**
 * Internal dealer-value signals — not exposed on public dealer APIs yet.
 */

const {
  buildFleetLeadQualitySummary,
} = require("../lead-quality-intelligence");
const { buildObservationFleetSummary } = require("../real-world-observations");
const { buildCoverageReport } = require("../editorial-operations/coverageService");

function buildDealerReadinessReport(leads = [], options = {}) {
  const leadQuality = buildFleetLeadQualitySummary(leads);
  const observations = buildObservationFleetSummary();
  const coverage = buildCoverageReport();

  return {
    generatedAt: new Date().toISOString(),
    status: "internal_pilot",
    publicDealerExposure: false,
    catalog: {
      variantCount: coverage.variantCount,
      trustComplete:
        (coverage.aggregate?.missingTrustPresentation ?? 0) === 0,
      calibrationReadyVariants: coverage.aggregate?.calibrationReady ?? 0,
    },
    leadSignals: {
      totalInPeriod: leadQuality.totalLeads,
      highQualityTier: leadQuality.tierDistribution?.high ?? 0,
      compareEngagedRate: leadQuality.rates?.compareEngaged ?? 0,
      trustEngagedRate: leadQuality.rates?.trustEngaged ?? 0,
      practicalInterestRate:
        (leadQuality.rates?.chargingConcern ?? 0) +
        (leadQuality.rates?.firstTimeBuyer ?? 0),
    },
    observations: {
      verifiedCount: observations.verifiedCount,
      variantsCovered: observations.variantsWithObservations,
    },
    dealerValueNarrative: [
      "Compare-assisted leads show higher decision intent in pilot tracking.",
      "Trust-panel engagement correlates with ownership questions — useful for consultative follow-up.",
      "Do not expose raw behavioral traces or quality scores to dealers until policy review.",
    ],
    readinessGates: [
      {
        id: "lead_quality_tracking",
        pass: leadQuality.totalLeads >= 0,
        note: "Operational once leads flow in production",
      },
      {
        id: "trust_intelligence_complete",
        pass: coverage.aggregate?.missingTrustPresentation === 0,
      },
      {
        id: "observation_pilot",
        pass: observations.verifiedCount >= 10,
      },
    ],
    _policy: options,
  };
}

module.exports = { buildDealerReadinessReport };
