/**
 * Sitemap registry — delegates to production generator when available.
 */

const { generateSitemapBundle } = require("../sitemap-generation");
const { getAllSeoSlugs } = require("../seo-pages/registry");
const { loadTier1Variants } = require("../seo-pages/loadCatalog");

const STATIC_MARKETING_PATHS = [
  "/",
  "/cars",
  "/compare",
  "/about",
  "/contact",
  "/privacy",
];

/**
 * @param {object} [options]
 * @returns {{ entries: object[], generatedAt: string, sections: object }}
 */
function buildSitemapRegistry(options = {}) {
  const bundle = generateSitemapBundle(options);
  const entries = [];

  for (const [file, xml] of Object.entries(bundle.files)) {
    if (file === "sitemap.xml") continue;
    const urlMatches = xml.match(/<loc>([^<]+)<\/loc>/g) || [];
    for (const m of urlMatches) {
      const loc = m.replace(/<\/?loc>/g, "");
      entries.push({ loc, source: file });
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    siteOrigin: bundle.stats.siteOrigin,
    sections: bundle.stats,
    entries,
    deployNote:
      "Run node scripts/build-sitemaps.mjs before deploy to refresh public/*.xml",
  };
}

module.exports = {
  buildSitemapRegistry,
  STATIC_MARKETING_PATHS,
};
