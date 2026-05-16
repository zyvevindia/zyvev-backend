/**
 * Weekly live intelligence ops — rolls up daily checks, learning, trust, and dealer signals.
 */

const { buildDailyLiveOpsReport } = require("../daily-live-ops");
const { buildObservationFleetSummary } = require("../real-world-observations");
const { buildSeoOperationsReport } = require("../seo-operations-report");
const {
  buildFleetTrustAnomalyReport,
  buildFleetCalibrationSummary,
} = require("../trust-calibration/trustCalibrationService");

async function buildWeeklyLiveOpsReport(options = {}) {
  const origin = options.origin || process.env.SITE_ORIGIN || "https://evsavari.com";
  const includeDb = options.includeDb === true;
  const sinceDays = options.sinceDays || 7;
  const runSmoke = options.runSmoke === true;

  const daily = await buildDailyLiveOpsReport({
    origin,
    includeDb,
    runSmoke,
  });

  const observations = buildObservationFleetSummary();
  const slugs = Object.keys(observations.bySlug || {});
  const trustAnomalies = buildFleetTrustAnomalyReport(slugs);
  const calibrationSummary = buildFleetCalibrationSummary(slugs).slice(0, 15);

  const seo = buildSeoOperationsReport({ siteOrigin: origin });

  let marketLearning = daily.marketLearning;
  let leadQuality = null;
  let behavioralHighlights = null;

  if (includeDb && process.env.MONGO_URI) {
    try {
      const {
        buildWeeklyMarketLearningReport,
      } = require("../market-learning/weeklyMarketLearningReport");
      marketLearning = await buildWeeklyMarketLearningReport({
        sinceDays,
        includeDb: true,
      });
      behavioralHighlights = {
        compareStarts: marketLearning.compareStarts,
        compareCompletions: marketLearning.compareCompletions,
        ownershipPanelViews: marketLearning.ownershipPanelViews,
        chargingRealityExpands: marketLearning.chargingRealityExpands,
        seoToDetail: marketLearning.seoToDetail,
        trustEngagement:
          (marketLearning.chargingRealityExpands || 0) +
          (marketLearning.ownershipPanelViews || 0),
      };
    } catch {
      marketLearning = { error: "market_learning_unavailable" };
    }

    try {
      const Lead = require("../../models/Lead");
      const mongoose = require("mongoose");
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGO_URI);
      }
      const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
      const leads = await Lead.find({ createdAt: { $gte: since } })
        .select("+buyerIntentContext sourcePage vehicleName createdAt")
        .lean();
      const {
        buildLeadQualityReport,
      } = require("../lead-quality-report");
      leadQuality = buildLeadQualityReport(leads, { sinceDays });
    } catch {
      leadQuality = { error: "lead_quality_unavailable" };
    }
  }

  const anomalyCount = trustAnomalies.filter(
    (a) => (a.anomalies?.length || 0) > 0
  ).length;

  const weeklyChecklist = [
    {
      id: "daily_ops_baseline",
      pass: daily.health?.status === "healthy" || daily.health?.status === "watch",
      detail: `health ${daily.health?.healthScore}/100`,
    },
    {
      id: "observation_governance",
      pass: (observations.pendingCount ?? 0) === 0,
      detail: `${observations.totalObservations} obs, ${observations.variantsWithObservations}/29 variants`,
    },
    {
      id: "trust_anomalies_reviewed",
      pass: anomalyCount <= 5,
      detail: `${anomalyCount} variants with anomalies (review in trust-anomaly-tracking.md)`,
    },
    {
      id: "seo_integrity",
      pass: (seo.canonicalConsistency?.errors ?? 0) === 0,
      detail: `${seo.crawlableUrlCounts?.totalUrls ?? 0} crawlable URLs`,
    },
    {
      id: "behavioral_cadence",
      pass: process.env.BEHAVIORAL_INTELLIGENCE_ENABLED === "true" || !includeDb,
      detail: includeDb
        ? process.env.BEHAVIORAL_INTELLIGENCE_ENABLED || "disabled"
        : "db not requested",
    },
  ];

  return {
    generatedAt: new Date().toISOString(),
    reportType: "weekly_live_ops",
    periodDays: sinceDays,
    origin,
    allChecksPass: weeklyChecklist.every((c) => c.pass),
    weeklyChecklist,
    dailySnapshot: {
      checklist: daily.checklist,
      healthScore: daily.health?.healthScore,
      observations: daily.observations,
    },
    observations: {
      total: observations.totalObservations,
      verified: observations.verifiedCount,
      variantsCovered: observations.variantsWithObservations,
      staleCount: observations.staleCount,
      targetObservations: 80,
      observationsMetTarget: observations.totalObservations >= 80,
    },
    trustOperations: {
      anomalyVariantCount: anomalyCount,
      topAnomalies: trustAnomalies
        .filter((a) => a.anomalies?.length)
        .slice(0, 8),
      calibrationSample: calibrationSummary.map((c) => ({
        slug: c.tier1VariantSlug,
        calibrationReady: c.calibrationReady,
        conflictCount: c.conflicts?.length || 0,
        suggestionCount: c.suggestions?.length || 0,
      })),
    },
    seo: {
      crawlableUrls: seo.crawlableUrlCounts?.totalUrls,
      canonicalErrors: seo.canonicalConsistency?.errors ?? 0,
      indexingNote:
        "Log GSC/Bing deltas manually in week-1-indexing-observations.md",
    },
    marketLearning,
    behavioralHighlights,
    leadQuality: leadQuality
      ? {
          totalLeads: leadQuality.totalLeads,
          compareAssisted: leadQuality.metrics?.compareAssistedLeads,
          seoOriginated: leadQuality.metrics?.seoOriginatedLeads,
          chargingConcernLeads: leadQuality.metrics?.chargingConcernLeads,
        }
      : null,
    cadence: {
      daily: "npm run ops:daily-live-ops -- --db",
      weekly: "npm run ops:weekly-live-ops -- --db",
      marketLearning: "npm run ops:market-learning -- --db 7",
      dealerPilot: "npm run ops:dealer-pilot 7 (requires MONGO_URI)",
    },
    operatorActions: [
      "Complete operational-learning-template.md for the week",
      "Review trust-anomaly-tracking.md top conflicts",
      "Update week-1-live-ops-summary.md with indexing + lead notes",
      "Do not expose internal scores to dealers",
    ],
  };
}

module.exports = { buildWeeklyLiveOpsReport };
