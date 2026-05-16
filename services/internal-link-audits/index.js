/**
 * Internal link & route integrity audit.
 */

const fs = require("fs");
const path = require("path");
const { loadTier1Variants } = require("../seo-pages/loadCatalog");
const {
  getAllSeoSlugs,
  getRegistryEntry,
  getVehicleSlugDenylist,
} = require("../seo-pages/registry");
const { buildAllSeoPages } = require("../seo-pages");
const { generateSitemapBundle } = require("../sitemap-generation");

const SITE_ORIGIN = process.env.SITE_ORIGIN || "https://evsavari.com";

function auditInternalLinks(options = {}) {
  const siteOrigin = options.siteOrigin || SITE_ORIGIN;
  const tier1Root =
    options.tier1Root ||
    path.join(
      __dirname,
      "../../docs/architecture/catalog/tier-1"
    );
  const publicDir =
    options.publicDir ||
    path.join(__dirname, "../../../zyvev-frontend/public");

  const { manifest, variants } = loadTier1Variants(tier1Root);
  const knownSlugs = new Set(manifest.slugs);
  const seoSlugs = new Set(getAllSeoSlugs());
  const reserved = getVehicleSlugDenylist();

  const brokenVehicleRoutes = [];
  const invalidCompareLinks = [];
  const orphanSeoPages = [];
  const staleCanonicals = [];
  const redirectRisks = [];
  const sitemapIssues = [];

  for (const slug of seoSlugs) {
    if (!knownSlugs.has(slug) && reserved.has(slug)) {
      /* expected — seo only */
    }
  }

  for (const v of variants) {
    const slug = v.identity?.slug;
    if (reserved.has(slug)) {
      brokenVehicleRoutes.push({
        slug,
        reason: "vehicle slug reserved for SEO page",
      });
    }

    const canonical = v.seo?.canonicalPath;
    if (canonical && canonical !== `/cars/${slug}`) {
      staleCanonicals.push({ slug, canonical });
    }

    for (const rival of v.compare?.segmentRivalSlugs || []) {
      if (!knownSlugs.has(rival)) {
        invalidCompareLinks.push({
          from: slug,
          to: rival,
          type: "segment_rival",
        });
      }
    }

    for (const key of [
      "bestAlternativeSlug",
      "upgradePathSlug",
      "downgradePathSlug",
    ]) {
      const target = v.decision?.[key];
      if (target && !knownSlugs.has(target)) {
        invalidCompareLinks.push({
          from: slug,
          to: target,
          type: key,
        });
      }
    }
  }

  const seoPages = buildAllSeoPages({ tier1Root, siteOrigin: SITE_ORIGIN });
  const linkedFromSeo = new Set();

  for (const { seoPage } of seoPages) {
    let hasOutbound = false;
    for (const rv of seoPage.rankedVehicles || []) {
      const target = rv.slug;
      linkedFromSeo.add(seoPage.slug);
      if (!knownSlugs.has(target)) {
        brokenVehicleRoutes.push({
          slug: target,
          fromSeoPage: seoPage.slug,
          reason: "seo page links to unknown vehicle slug",
        });
      }
      hasOutbound = true;
    }
    if (!hasOutbound && seoPage.category !== "compare") {
      orphanSeoPages.push({
        slug: seoPage.slug,
        reason: "no ranked vehicles",
      });
    }

    if (seoPage.category === "compare") {
      const entry = getRegistryEntry(seoPage.slug);
      for (const cs of entry?.compareSlugs || []) {
        if (!knownSlugs.has(cs)) {
          invalidCompareLinks.push({
            from: seoPage.slug,
            to: cs,
            type: "head_to_head",
          });
        }
      }
    }
  }

  redirectRisks.push({
    path: "/car/:slug",
    note: "legacy prefix should redirect to /cars/:slug — verify LegacyCarRedirect",
  });

  const sitemapPath = path.join(publicDir, "sitemap.xml");
  if (!fs.existsSync(sitemapPath)) {
    sitemapIssues.push({
      message: "public/sitemap.xml missing — run build-sitemaps.mjs",
    });
  } else {
    const bundle = generateSitemapBundle({ tier1Root, siteOrigin: SITE_ORIGIN });
    const generatedLocs = new Set();
    for (const xml of Object.values(bundle.files)) {
      const matches = xml.match(/<loc>([^<]+)<\/loc>/g) || [];
      for (const m of matches) {
        generatedLocs.add(m.replace(/<\/?loc>/g, ""));
      }
    }
    if (generatedLocs.size !== bundle.stats.totalUrls + 4) {
      /* index has 4 child sitemaps not in url count */
    }
  }

  const seoDataDir = path.join(publicDir, "seo-data");
  if (fs.existsSync(seoDataDir)) {
    for (const slug of seoSlugs) {
      const fp = path.join(seoDataDir, `${slug}.json`);
      if (!fs.existsSync(fp)) {
        orphanSeoPages.push({
          slug,
          reason: "missing public/seo-data static fallback",
        });
      }
    }
  }

  const errors =
    brokenVehicleRoutes.length +
    invalidCompareLinks.length +
    staleCanonicals.length +
    sitemapIssues.length;

  const warnings = orphanSeoPages.length + redirectRisks.length;

  return {
    siteOrigin,
    vehicleSlugCount: manifest.slugs.length,
    seoPageCount: seoSlugs.size,
    brokenVehicleRoutes,
    invalidCompareLinks,
    orphanSeoPages,
    staleCanonicals,
    redirectRisks,
    sitemapIssues,
    errors,
    warnings,
  };
}

module.exports = {
  auditInternalLinks,
};
