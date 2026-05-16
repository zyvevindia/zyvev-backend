/**
 * Unified operational dashboard summary — CLI-oriented, no heavy BI.
 */

const { buildSeoOperationsReport } = require("../seo-operations-report");
const { generateSitemapBundle } = require("../sitemap-generation");
const { getAllSeoSlugs } = require("../seo-pages/registry");
const { loadTier1Variants } = require("../seo-pages/loadCatalog");
const path = require("path");

async function buildOperationalDashboard(options = {}) {
  const tier1Root =
    options.tier1Root ||
    path.join(
      __dirname,
      "../../docs/architecture/catalog/tier-1"
    );

  const seo = buildSeoOperationsReport(options);
  const { manifest } = loadTier1Variants(tier1Root);
  const sitemap = generateSitemapBundle(options);

  const dashboard = {
    generatedAt: new Date().toISOString(),
    launchPhase: "controlled-launch-operations",
    crawlableUrls: sitemap.stats.totalUrls,
    vehicleCount: manifest.slugs.length,
    seoGuideCount: getAllSeoSlugs().length,
    sitemapFreshness: seo.sitemapFreshness,
    canonicalHealth: seo.canonicalConsistency.errors === 0 ? "ok" : "warn",
    orphanPages: seo.orphanDetection.orphanCount,
    leads: {
      totalLast7d: null,
      sourceDistribution: null,
    },
    compare: {
      topPairs: null,
    },
    behavioral: {
      enabled: process.env.BEHAVIORAL_INTELLIGENCE_ENABLED === "true",
      eventsLast7d: null,
    },
    leadSourceDistribution: null,
  };

  if (options.includeDb && process.env.MONGO_URI) {
    const mongoose = require("mongoose");
    await mongoose.connect(process.env.MONGO_URI);

    try {
      const {
        buildLeadQualityReportFromDb,
      } = require("../lead-quality-report");
      const { buildBehavioralTrends } = require("../behavioral-trends");

      const leadReport = await buildLeadQualityReportFromDb(7);
      dashboard.leads.totalLast7d = leadReport.totalLeads;
      dashboard.leadSourceDistribution =
        leadReport.sourceDistribution;

      const trends = await buildBehavioralTrends(7);
      dashboard.compare.topPairs = trends.trends.topComparePairs;
      dashboard.behavioral.eventsLast7d = trends.totalEvents;
    } finally {
      await mongoose.disconnect();
    }
  }

  return dashboard;
}

module.exports = {
  buildOperationalDashboard,
};
