/**
 * Canonical SEO validation — vehicles, SEO pages, compare hub.
 */

const path = require("path");
const { loadTier1Variants } = require("../seo-pages/loadCatalog");
const {
  getAllSeoSlugs,
  getRegistryEntry,
} = require("../seo-pages/registry");
const { buildAllSeoPages } = require("../seo-pages");

const SITE_ORIGIN = process.env.SITE_ORIGIN || "https://evsavari.com";

function auditCanonicalSeo(options = {}) {
  const tier1Root =
    options.tier1Root ||
    path.join(
      __dirname,
      "../../docs/architecture/catalog/tier-1"
    );
  const siteOrigin = options.siteOrigin || SITE_ORIGIN;

  const { manifest, variants } = loadTier1Variants(tier1Root);
  const seoSlugs = new Set(getAllSeoSlugs());

  const duplicateCanonicals = [];
  const missingCanonicals = [];
  const routeMismatches = [];
  const canonicalLoops = [];
  const incorrectSlugRefs = [];
  const seenCanonicals = new Map();

  for (const v of variants) {
    const slug = v.identity?.slug;
    const expected = `${siteOrigin}/cars/${slug}`;
    const canonicalPath = v.seo?.canonicalPath;
    const canonicalUrl = canonicalPath
      ? `${siteOrigin}${canonicalPath}`
      : null;

    if (!canonicalPath) {
      missingCanonicals.push({
        slug,
        reason: "missing seo.canonicalPath in tier-1",
      });
    } else if (canonicalPath !== `/cars/${slug}`) {
      routeMismatches.push({
        slug,
        canonicalPath,
        expected: `/cars/${slug}`,
      });
    }

    if (canonicalUrl) {
      if (seenCanonicals.has(canonicalUrl)) {
        duplicateCanonicals.push({
          slug,
          duplicateOf: seenCanonicals.get(canonicalUrl),
          canonicalUrl,
        });
      } else {
        seenCanonicals.set(canonicalUrl, slug);
      }
    }

    if (seoSlugs.has(slug)) {
      incorrectSlugRefs.push({
        slug,
        reason: "vehicle slug collides with reserved SEO page slug",
      });
    }
  }

  const seoPages = buildAllSeoPages({ siteOrigin, tier1Root });
  for (const { seoPage } of seoPages) {
    const expectedPath = `/cars/${seoPage.slug}`;
    if (seoPage.canonicalPath !== expectedPath) {
      routeMismatches.push({
        slug: seoPage.slug,
        type: "seo_page",
        canonicalPath: seoPage.canonicalPath,
        expected: expectedPath,
      });
    }

    const url = seoPage.canonicalUrl;
    if (seenCanonicals.has(url)) {
      duplicateCanonicals.push({
        slug: seoPage.slug,
        type: "seo_page",
        duplicateOf: seenCanonicals.get(url),
        canonicalUrl: url,
      });
    } else {
      seenCanonicals.set(url, seoPage.slug);
    }

    for (const rv of seoPage.rankedVehicles || []) {
      if (rv.detailPath && !rv.detailPath.startsWith("/cars/")) {
        incorrectSlugRefs.push({
          seoSlug: seoPage.slug,
          detailPath: rv.detailPath,
          reason: "detail path must use /cars/:slug",
        });
      }
    }
  }

  const compareCanonical = `${siteOrigin}/compare`;
  if (seenCanonicals.has(compareCanonical)) {
    canonicalLoops.push({
      note: "compare hub shares canonical with another entry",
      loc: compareCanonical,
    });
  }

  for (const entry of getAllSeoSlugs().map((s) => getRegistryEntry(s))) {
    if (entry?.compareSlugs) {
      for (const cs of entry.compareSlugs) {
        if (!manifest.slugs.includes(cs)) {
          incorrectSlugRefs.push({
            seoSlug: entry.slug,
            compareSlug: cs,
            reason: "compare slug not in tier-1 manifest",
          });
        }
      }
    }
  }

  const errors =
    duplicateCanonicals.length +
    routeMismatches.length +
    incorrectSlugRefs.filter((r) =>
      r.reason?.includes("collides")
    ).length;

  const warnings =
    missingCanonicals.length +
    incorrectSlugRefs.filter((r) => !r.reason?.includes("collides"))
      .length;

  return {
    siteOrigin,
    vehicleCount: manifest.slugs.length,
    seoPageCount: seoPages.length,
    duplicateCanonicals,
    missingCanonicals,
    routeMismatches,
    canonicalLoops,
    incorrectSlugRefs,
    compareHubCanonical: compareCanonical,
    errors,
    warnings,
  };
}

module.exports = {
  auditCanonicalSeo,
};
