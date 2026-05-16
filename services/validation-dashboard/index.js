/**
 * Minimal read-only validation dashboard — not a BI platform.
 */

const { buildCrawlObservations } = require("../crawl-observations");
const { buildSeoOperationsReport } = require("../seo-operations-report");
const { summarizeDealerFeedback } = require("../dealer-feedback");

async function buildValidationDashboard(options = {}) {
  const sinceDays = options.sinceDays || 7;
  const crawl = buildCrawlObservations(options);
  const seo = buildSeoOperationsReport(options);

  const dashboard = {
    generatedAt: new Date().toISOString(),
    phase: "real-world-validation",
    indexedUrls: {
      crawlable: crawl.indexedVsCrawlable.crawlableUrls,
      searchConsoleIndexed: null,
      note: crawl.indexedVsCrawlable.note,
    },
    crawlableUrls: crawl.indexedVsCrawlable.crawlableUrls,
    sitemapFreshness: crawl.sitemapFreshness,
    canonicalHealth:
      crawl.canonicalObservations.errors === 0 ? "ok" : "warn",
    seoPageCount: seo.programmaticSeoPageCount,
    topCrawlableSections: crawl.topCrawlableSections,
    topSeoGuides: null,
    compareEngagement: null,
    leads: {
      total: null,
      sourceMix: null,
      compareAssisted: null,
      seoOriginated: null,
    },
    dealerFeedback: summarizeDealerFeedback(),
    aggregatedOnly: true,
  };

  if (options.includeDb && process.env.MONGO_URI) {
    const mongoose = require("mongoose");
    await mongoose.connect(process.env.MONGO_URI);

    try {
      const {
        buildLeadQualityValidationFromDb,
      } = require("../lead-quality-validation");
      const { buildBehavioralQualityReport } = require("../behavioral-quality");

      const leadVal = await buildLeadQualityValidationFromDb(sinceDays);
      dashboard.leads.total = leadVal.totalLeads;
      dashboard.leads.sourceMix = leadVal.sourceDistribution;
      dashboard.leads.compareAssisted =
        leadVal.metrics.compareAssistedLeads;
      dashboard.leads.seoOriginated =
        leadVal.metrics.seoOriginatedLeads;
      dashboard.leads.meaningfulTraffic =
        leadVal.validation?.meaningfulTrafficSignal;

      const behavior = await buildBehavioralQualityReport(sinceDays);
      dashboard.compareEngagement = {
        topPairs: behavior.compare.topPairs,
        completionRatePercent:
          behavior.quality.compareCompletionRatePercent,
        compareToLeadRatePercent:
          behavior.progression.compareToLeadRatePercent,
      };

      const { buildBehavioralTrends } = require("../behavioral-trends");
      const bt = await buildBehavioralTrends(sinceDays);
      dashboard.topSeoGuides = bt.trends.mostEngagingSeoPages;
    } finally {
      await mongoose.disconnect();
    }
  }

  return dashboard;
}

module.exports = {
  buildValidationDashboard,
};
