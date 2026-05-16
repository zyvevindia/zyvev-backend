/**
 * SEO operations report — no external Search Console API.
 */

const fs = require("fs");
const path = require("path");
const { generateSitemapBundle } = require("../sitemap-generation");
const { auditCanonicalSeo } = require("../canonical-seo-audits");
const { simulateCrawl } = require("../crawl-simulation");
const { getAllSeoSlugs } = require("../seo-pages/registry");
const { loadTier1Variants } = require("../seo-pages/loadCatalog");

function getSitemapFreshness(publicDir) {
  const manifestPath = path.join(publicDir, "sitemap-manifest.json");
  if (!fs.existsSync(manifestPath)) {
    return { status: "missing", ageHours: null };
  }
  const stat = fs.statSync(manifestPath);
  const ageMs = Date.now() - stat.mtimeMs;
  const ageHours = Math.round(ageMs / (1000 * 60 * 60) * 10) / 10;
  return {
    status: ageHours > 168 ? "stale" : "ok",
    generatedAt: JSON.parse(fs.readFileSync(manifestPath, "utf8"))
      .generatedAt,
    ageHours,
    thresholdStaleHours: 168,
  };
}

function buildSeoOperationsReport(options = {}) {
  const tier1Root =
    options.tier1Root ||
    path.join(
      __dirname,
      "../../docs/architecture/catalog/tier-1"
    );
  const publicDir =
    options.publicDir ||
    path.join(__dirname, "../../../zyvev-frontend/public");
  const siteOrigin = options.siteOrigin || "https://evsavari.com";

  const { manifest } = loadTier1Variants(tier1Root);
  const seoSlugs = getAllSeoSlugs();
  const sitemap = generateSitemapBundle({ tier1Root, siteOrigin });
  const canonical = auditCanonicalSeo({ tier1Root, siteOrigin });
  const crawl = simulateCrawl({ tier1Root });

  const freshness = getSitemapFreshness(publicDir);

  const indexedPageEstimate = {
    note: "Manual verification required in Search Console — not available via API in this sprint",
    crawlableUrlsInSitemap: sitemap.stats.totalUrls,
    vehiclePages: sitemap.stats.vehicleUrlCount,
    seoGuidePages: sitemap.stats.seoPageUrlCount,
    compareHub: sitemap.stats.compareUrlCount,
    staticPages: sitemap.stats.staticUrlCount,
  };

  return {
    generatedAt: new Date().toISOString(),
    siteOrigin,
    indexedPageEstimate,
    sitemapFreshness: freshness,
    canonicalConsistency: {
      errors: canonical.errors,
      warnings: canonical.warnings,
      duplicateCanonicals: canonical.duplicateCanonicals.length,
    },
    crawlableUrlCounts: sitemap.stats,
    orphanDetection: {
      crawlOrphans: crawl.orphans,
      orphanCount: crawl.orphans.length,
    },
    tier1VariantCount: manifest.slugs.length,
    programmaticSeoPageCount: seoSlugs.length,
    operationalActions: [
      "Submit sitemap.xml after each catalog/SEO registry change",
      "Run node scripts/build-sitemaps.mjs before deploy",
      "Run node scripts/audit-canonical-seo.js before publish",
    ],
    health:
      canonical.errors === 0 && freshness.status !== "missing"
        ? "ok"
        : "attention",
  };
}

module.exports = {
  buildSeoOperationsReport,
};
