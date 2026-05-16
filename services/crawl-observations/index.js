/**
 * Lightweight crawl observations — no external crawler.
 */

const { buildSeoOperationsReport } = require("../seo-operations-report");
const { simulateCrawl } = require("../crawl-simulation");
const { generateSitemapBundle } = require("../sitemap-generation");
const { auditCanonicalSeo } = require("../canonical-seo-audits");

function buildCrawlObservations(options = {}) {
  const seo = buildSeoOperationsReport(options);
  const crawl = simulateCrawl(options);
  const canonical = auditCanonicalSeo(options);
  const sitemap = generateSitemapBundle(options);

  const sections = {
    static: sitemap.stats.staticUrlCount,
    vehicles: sitemap.stats.vehicleUrlCount,
    seoGuides: sitemap.stats.seoPageUrlCount,
    compare: sitemap.stats.compareUrlCount,
  };

  const topSections = Object.entries(sections)
    .sort((a, b) => b[1] - a[1])
    .map(([name, urlCount]) => ({ name, urlCount }));

  return {
    generatedAt: new Date().toISOString(),
    indexedVsCrawlable: {
      crawlableUrls: seo.indexedPageEstimate.crawlableUrlsInSitemap,
      indexedInSearchConsole: null,
      note: seo.indexedPageEstimate.note,
      gap:
        "Record GSC indexed count weekly in ops/traffic-observations.jsonl",
    },
    sitemapFreshness: seo.sitemapFreshness,
    canonicalObservations: {
      errors: canonical.errors,
      warnings: canonical.warnings,
      duplicateCanonicals: canonical.duplicateCanonicals?.length || 0,
      mismatchSamples: (canonical.issues || [])
        .filter((i) => i.severity === "error")
        .slice(0, 5),
    },
    orphanRoutes: {
      count: seo.orphanDetection.orphanCount,
      routes: seo.orphanDetection.crawlOrphans,
      hubOrphansExpected: ["/cars", "/compare"],
    },
    topCrawlableSections: topSections,
    crawlSimulation: {
      reachableFromHub: crawl.reachable?.length ?? crawl.stats?.reachable,
      unreachable: crawl.unreachable?.length ?? 0,
    },
    health:
      canonical.errors === 0 && seo.sitemapFreshness.status !== "missing"
        ? "ok"
        : "attention",
  };
}

module.exports = {
  buildCrawlObservations,
};
