/**
 * Market health monitoring — ongoing trust, SEO, lead, and observation quality.
 */

const { buildCoverageReport } = require("../editorial-operations/coverageService");
const { buildObservationFleetSummary } = require("../real-world-observations");
const { buildSeoOperationsReport } = require("../seo-operations-report");
const { buildPublicBetaChecklist } = require("../public-beta-readiness/publicBetaChecklist");

async function buildMarketHealthReport(options = {}) {
  const coverage = buildCoverageReport();
  const observations = buildObservationFleetSummary();
  const seo = buildSeoOperationsReport(options);
  const beta = buildPublicBetaChecklist(options);

  let leadQuality = null;
  if (options.includeDb && process.env.MONGO_URI) {
    try {
      const {
        buildLeadQualitySummaryFromDb,
      } = require("../lead-quality-intelligence");
      const mongoose = require("mongoose");
      await mongoose.connect(process.env.MONGO_URI);
      try {
        leadQuality = await buildLeadQualitySummaryFromDb(7);
      } finally {
        await mongoose.disconnect();
      }
    } catch {
      leadQuality = { error: "db_unavailable" };
    }
  }

  const alerts = [];

  if (observations.staleCount > 0) {
    alerts.push({
      code: "stale_observations",
      count: observations.staleCount,
      severity: "medium",
    });
  }
  if (coverage.aggregate?.lowObservationCoverage > 20) {
    alerts.push({
      code: "low_observation_coverage",
      count: coverage.aggregate.lowObservationCoverage,
      severity: "low",
    });
  }
  if (coverage.aggregate?.trustConsistencyIssues > 0) {
    alerts.push({
      code: "trust_consistency",
      count: coverage.aggregate.trustConsistencyIssues,
      severity: "high",
    });
  }
  if (seo.canonicalConsistency?.errors > 0) {
    alerts.push({
      code: "canonical_errors",
      count: seo.canonicalConsistency.errors,
      severity: "high",
    });
  }
  if (seo.sitemapFreshness?.status !== "ok") {
    alerts.push({
      code: "sitemap_stale",
      detail: seo.sitemapFreshness,
      severity: "medium",
    });
  }
  if (coverage.aggregate?.brochureVerificationGap > 10) {
    alerts.push({
      code: "brochure_gaps",
      count: coverage.aggregate.brochureVerificationGap,
      severity: "medium",
    });
  }

  let behavioralWeek1 = null;
  if (options.includeDb && process.env.MONGO_URI) {
    try {
      const { buildBehavioralTrends } = require("../behavioral-trends");
      const mongoose = require("mongoose");
      await mongoose.connect(process.env.MONGO_URI);
      try {
        behavioralWeek1 = await buildBehavioralTrends(7);
      } finally {
        await mongoose.disconnect();
      }
    } catch {
      behavioralWeek1 = null;
    }
  }

  if (behavioralWeek1?.trends?.compareAbandonmentRate > 0.55) {
    alerts.push({
      code: "compare_friction",
      detail: behavioralWeek1.trends.compareAbandonmentRate,
      severity: "medium",
    });
  }

  const healthScore = Math.max(
    0,
    100 -
      alerts.filter((a) => a.severity === "high").length * 15 -
      alerts.filter((a) => a.severity === "medium").length * 8
  );

  const variantCoveragePct =
    coverage.variantCount > 0
      ? Math.round(
          (observations.variantsWithObservations / coverage.variantCount) * 100
        )
      : 0;

  return {
    generatedAt: new Date().toISOString(),
    healthScore,
    status: healthScore >= 80 ? "healthy" : healthScore >= 60 ? "watch" : "attention",
    week1Ops: {
      observationCoveragePct: variantCoveragePct,
      behavioralEnabled: process.env.BEHAVIORAL_INTELLIGENCE_ENABLED === "true",
      eventsLast7d: behavioralWeek1?.totalEvents ?? null,
      compareAbandonment: behavioralWeek1?.trends?.compareAbandonmentRate ?? null,
      leadRatePerSession:
        behavioralWeek1?.conversionPatterns?.leadRatePerSession ?? null,
    },
    alerts,
    trust: {
      missingTrustPresentation: coverage.aggregate?.missingTrustPresentation ?? 0,
      trustConsistencyIssues: coverage.aggregate?.trustConsistencyIssues ?? 0,
      calibrationReady: coverage.aggregate?.calibrationReady ?? 0,
    },
    observations: {
      total: observations.totalObservations,
      verified: observations.verifiedCount,
      stale: observations.staleCount,
      variantsCovered: observations.variantsWithObservations,
    },
    seo: {
      crawlableUrls: seo.crawlableUrlCounts?.totalUrls,
      canonicalErrors: seo.canonicalConsistency?.errors,
      sitemapFreshness: seo.sitemapFreshness?.status,
      programmaticPages: seo.programmaticSeoPageCount,
    },
    leads: leadQuality
      ? {
          total7d: leadQuality.totalLeads,
          tierDistribution: leadQuality.tierDistribution,
          compareEngagedRate: leadQuality.rates?.compareEngaged,
          trustEngagedRate: leadQuality.rates?.trustEngaged,
        }
      : null,
    betaReady: beta.betaReady,
    variantCount: coverage.variantCount,
  };
}

module.exports = { buildMarketHealthReport };
