/**
 * Production sitemap generation — canonical URLs, slug-governance aware.
 */

const path = require("path");
const { loadTier1Variants } = require("../seo-pages/loadCatalog");
const { getAllSeoSlugs } = require("../seo-pages/registry");
const { getVehicleSlugDenylist } = require("../seo-pages/registry");
const {
  buildUrlSetXml,
  buildSitemapIndexXml,
} = require("./xml");

const STATIC_PATHS = [
  { path: "/", changefreq: "daily", priority: 1.0 },
  { path: "/cars", changefreq: "daily", priority: 0.9 },
  { path: "/about", changefreq: "monthly", priority: 0.6 },
  { path: "/contact", changefreq: "monthly", priority: 0.6 },
  { path: "/privacy", changefreq: "yearly", priority: 0.4 },
];

const COMPARE_HUB_PATHS = [
  { path: "/compare", changefreq: "weekly", priority: 0.85 },
];

function toUrlEntry(siteOrigin, pathname, opts = {}) {
  return {
    loc: `${siteOrigin}${pathname}`,
    lastmod: opts.lastmod || new Date().toISOString().slice(0, 10),
    changefreq: opts.changefreq || "weekly",
    priority: opts.priority ?? 0.7,
  };
}

function dedupeByLoc(entries) {
  const seen = new Set();
  const out = [];
  for (const e of entries) {
    if (seen.has(e.loc)) continue;
    seen.add(e.loc);
    out.push(e);
  }
  return out;
}

/**
 * @param {object} [options]
 * @returns {{ files: Record<string, string>, stats: object }}
 */
function generateSitemapBundle(options = {}) {
  const siteOrigin =
    options.siteOrigin || "https://evsavari.com";
  const tier1Root = options.tier1Root;
  const { manifest, variants } = loadTier1Variants(tier1Root);
  const seoSlugs = new Set(getAllSeoSlugs());
  const reservedSlugs = getVehicleSlugDenylist();
  const today = new Date().toISOString().slice(0, 10);

  const vehicleSlugs = manifest.slugs.filter(
    (s) => !reservedSlugs.has(s)
  );

  const staticUrls = dedupeByLoc(
    STATIC_PATHS.map((p) =>
      toUrlEntry(siteOrigin, p.path, {
        changefreq: p.changefreq,
        priority: p.priority,
        lastmod: today,
      })
    )
  );

  const carUrls = dedupeByLoc(
    vehicleSlugs.map((slug) => {
      const variant = variants.find(
        (v) => v.identity?.slug === slug
      );
      const lastmod =
        variant?.pricing?.priceLastUpdated?.slice(0, 10) ||
        today;
      return toUrlEntry(siteOrigin, `/cars/${slug}`, {
        changefreq: "weekly",
        priority: 0.8,
        lastmod,
      });
    })
  );

  const seoUrls = dedupeByLoc(
    [...seoSlugs].map((slug) =>
      toUrlEntry(siteOrigin, `/cars/${slug}`, {
        changefreq: "weekly",
        priority: 0.75,
        lastmod: today,
      })
    )
  );

  const compareUrls = dedupeByLoc(
    COMPARE_HUB_PATHS.map((p) =>
      toUrlEntry(siteOrigin, p.path, {
        changefreq: p.changefreq,
        priority: p.priority,
        lastmod: today,
      })
    )
  );

  const subSitemapLocs = [
    {
      key: "sitemaps/static.xml",
      loc: `${siteOrigin}/sitemaps/static.xml`,
    },
    {
      key: "sitemaps/cars.xml",
      loc: `${siteOrigin}/sitemaps/cars.xml`,
    },
    {
      key: "sitemaps/seo-pages.xml",
      loc: `${siteOrigin}/sitemaps/seo-pages.xml`,
    },
    {
      key: "sitemaps/compare.xml",
      loc: `${siteOrigin}/sitemaps/compare.xml`,
    },
  ];

  const indexXml = buildSitemapIndexXml(
    subSitemapLocs.map((s) => ({
      loc: s.loc,
      lastmod: today,
    }))
  );

  const files = {
    "sitemap.xml": indexXml,
    "sitemaps/static.xml": buildUrlSetXml(staticUrls),
    "sitemaps/cars.xml": buildUrlSetXml(carUrls),
    "sitemaps/seo-pages.xml": buildUrlSetXml(seoUrls),
    "sitemaps/compare.xml": buildUrlSetXml(compareUrls),
  };

  const collisions = manifest.slugs.filter((s) =>
    reservedSlugs.has(s)
  );

  return {
    files,
    stats: {
      siteOrigin,
      generatedAt: new Date().toISOString(),
      staticUrlCount: staticUrls.length,
      vehicleUrlCount: carUrls.length,
      seoPageUrlCount: seoUrls.length,
      compareUrlCount: compareUrls.length,
      totalUrls:
        staticUrls.length +
        carUrls.length +
        seoUrls.length +
        compareUrls.length,
      tier1VariantCount: manifest.slugs.length,
      slugCollisionsExcluded: collisions,
    },
  };
}

module.exports = {
  generateSitemapBundle,
  STATIC_PATHS,
};
