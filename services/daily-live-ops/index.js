/**
 * Daily live ops rollup — single command for operators.
 */

const { buildMarketHealthReport } = require("../market-health-monitoring");
const { buildProductionActivationReport } = require("../production-activation");
const { buildSeoOperationsReport } = require("../seo-operations-report");
const { buildObservationFleetSummary } = require("../real-world-observations");
const { runLiveSmokeTest } = require("../live-smoke-test");

async function buildDailyLiveOpsReport(options = {}) {
  const origin = options.origin || process.env.SITE_ORIGIN || "https://evsavari.com";
  const includeDb = options.includeDb === true;
  const runSmoke = options.runSmoke !== false;

  const [health, activation, seo, observations, smoke] = await Promise.all([
    buildMarketHealthReport({ includeDb, siteOrigin: origin }),
    buildProductionActivationReport({
      profile: "public-beta",
      siteOrigin: origin,
      liveOrigin: runSmoke ? origin : null,
    }),
    Promise.resolve(buildSeoOperationsReport({ siteOrigin: origin })),
    Promise.resolve(buildObservationFleetSummary()),
    runSmoke ? runLiveSmokeTest({ origin }) : { skipped: true },
  ]);

  let marketLearning = null;
  if (includeDb && process.env.MONGO_URI) {
    try {
      const {
        buildWeeklyMarketLearningReport,
      } = require("../market-learning/weeklyMarketLearningReport");
      marketLearning = await buildWeeklyMarketLearningReport({
        sinceDays: 7,
        includeDb: true,
      });
    } catch {
      marketLearning = { error: "market_learning_unavailable" };
    }
  }

  const checklist = [
    {
      id: "market_health",
      pass: health.status === "healthy" || health.status === "watch",
      detail: `${health.healthScore}/100 ${health.status}`,
    },
    {
      id: "seo_canonical",
      pass: (seo.canonicalConsistency?.errors ?? 0) === 0,
      detail: `${seo.canonicalConsistency?.errors ?? 0} errors`,
    },
    {
      id: "observation_freshness",
      pass: (observations.staleCount ?? 0) === 0,
      detail: `${observations.staleCount} stale`,
    },
    {
      id: "live_smoke",
      pass: smoke.skipped || smoke.smokePass === true,
      detail: smoke.skipped ? "skipped" : `${smoke.summary?.passed}/${smoke.summary?.total}`,
    },
    {
      id: "behavioral_ingestion",
      pass: process.env.BEHAVIORAL_INTELLIGENCE_ENABLED === "true",
      detail: process.env.BEHAVIORAL_INTELLIGENCE_ENABLED || "not enabled locally",
    },
  ];

  return {
    generatedAt: new Date().toISOString(),
    reportType: "daily_live_ops",
    origin,
    allChecksPass: checklist.every((c) => c.pass),
    checklist,
    health,
    activation: {
      productionReady: activation.productionReady,
      envReady: activation.envReady,
    },
    seo: {
      crawlableUrls: seo.crawlableUrlCounts?.totalUrls,
      sitemapFreshness: seo.sitemapFreshness?.status,
    },
    observations: {
      total: observations.totalObservations,
      variantsCovered: observations.variantsWithObservations,
      variantCount: 29,
      coveragePct: Math.round(
        (observations.variantsWithObservations / 29) * 100
      ),
    },
    smoke: smoke.skipped
      ? null
      : { smokePass: smoke.smokePass, summary: smoke.summary },
    marketLearning: marketLearning
      ? {
          totalEvents: marketLearning.totalEvents,
          leadQuality: marketLearning.leadQuality,
          calibrationNotes: marketLearning.calibrationObservations,
        }
      : null,
    operatorActions: [
      "Log GSC indexing deltas in week-1-indexing-observations.md",
      "Review observation moderation queue if pending > 0",
      "Do not scale paid traffic",
    ],
  };
}

module.exports = { buildDailyLiveOpsReport };
