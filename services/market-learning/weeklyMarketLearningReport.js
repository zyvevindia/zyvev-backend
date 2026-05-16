/**
 * Weekly market learning report — aggregated behavioral + lead signals, no PII.
 */

const { buildBehavioralTrends } = require("../behavioral-trends");
const {
  buildFleetLeadQualitySummary,
} = require("../lead-quality-intelligence");
const { buildObservationFleetSummary } = require("../real-world-observations");
const { getAllSeoSlugs } = require("../seo-pages/registry");

async function buildWeeklyMarketLearningReport(options = {}) {
  const sinceDays = options.sinceDays || 7;
  const seoSlugs = getAllSeoSlugs();

  let behavioral = null;
  let leads = null;
  let behavioralNote = null;

  if (options.includeDb && process.env.MONGO_URI) {
    const mongoose = require("mongoose");
    await mongoose.connect(process.env.MONGO_URI);
    try {
      behavioral = await buildBehavioralTrends(sinceDays);
      const Lead = require("../../models/Lead");
      const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
      const leadDocs = await Lead.find({ createdAt: { $gte: since } })
        .select(
          "sourcePage vehicleName createdAt buyerIntentContext anonymousSessionId"
        )
        .lean();
      leads = buildFleetLeadQualitySummary(leadDocs);
    } finally {
      await mongoose.disconnect();
    }
  } else {
    behavioralNote =
      "Pass --db with MONGO_URI for live behavioral and lead calibration data.";
  }

  const observations = buildObservationFleetSummary();

  const journeys = {
    compareHeavy: {
      compareStarted: behavioral?.trends?.compareStarted ?? null,
      compareCompleted: behavioral?.trends?.compareCompleted ?? null,
      abandonmentRate: behavioral?.trends?.compareAbandonmentRate ?? null,
      topPairs: behavioral?.trends?.topComparePairs ?? [],
    },
    chargingAnxiety: {
      chargingRealityExpanded:
        behavioral?.trends?.chargingRealityExpanded ?? null,
      leadChargingConcernRate: leads?.rates?.chargingConcern ?? null,
    },
    seoEntry: {
      seoToDetail: behavioral?.trends?.seoToDetailTransitions ?? null,
      topSeoPages: behavioral?.trends?.mostEngagingSeoPages ?? [],
      seoThenCompareSessions:
        behavioral?.conversionPatterns?.seoToCompareSessions ?? null,
    },
    trustEngagement: {
      ownershipPanelViews: behavioral?.trends?.ownershipPanelViews ?? null,
      leadTrustEngagedRate: leads?.rates?.trustEngaged ?? null,
    },
    leadFunnel: {
      leadEvents: behavioral?.trends?.leadSubmittedEvents ?? null,
      sessionsWithLead: behavioral?.conversionPatterns?.sessionsWithLead ?? null,
      leadRatePerSession:
        behavioral?.conversionPatterns?.leadRatePerSession ?? null,
    },
    firstTimeEv: {
      leadFirstTimeRate: leads?.rates?.firstTimeBuyer ?? null,
    },
  };

  const calibrationObservations = [];

  if (behavioral?.trends?.compareAbandonmentRate > 0.5) {
    calibrationObservations.push({
      type: "compare_friction",
      message:
        "Compare abandonment elevated — review mobile compare layout and CTA clarity.",
      severity: "medium",
    });
  }
  if (leads?.rates?.trustEngaged > 30) {
    calibrationObservations.push({
      type: "trust_signal",
      message:
        "Trust-panel engagement correlates with leads — continue flagship trust polish.",
      severity: "info",
    });
  }
  if (observations.variantsWithObservations < 10) {
    calibrationObservations.push({
      type: "observation_coverage",
      message:
        "Expand moderated observations beyond flagship set for calibration depth.",
      severity: "medium",
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    reportType: "weekly_market_learning",
    periodDays: sinceDays,
    seoGuideCount: seoSlugs.length,
    behavioralEnabled: process.env.BEHAVIORAL_INTELLIGENCE_ENABLED === "true",
    totalEvents: behavioral?.totalEvents ?? null,
    uniqueSessions: behavioral?.uniqueSessions ?? null,
    journeys,
    leadQuality: leads
      ? {
          total: leads.totalLeads,
          tiers: leads.tierDistribution,
          rates: leads.rates,
        }
      : null,
    observations: {
      total: observations.totalObservations,
      variantsCovered: observations.variantsWithObservations,
    },
    calibrationObservations,
    behavioralNote,
    nextWeekActions: [
      "Review top SEO pages → detail transitions in GSC + behavioral report",
      "Compare top pairs vs lead source pages",
      "Add 3–4 observations for one non-flagship variant",
      "Do not scale paid traffic until lead-rate-per-session stabilizes",
    ],
    _policy: { aggregatedOnly: true, noPii: true },
  };
}

module.exports = { buildWeeklyMarketLearningReport };
