/**
 * SEO page governance audits.
 */

const {
  buildAllSeoPages,
  getAllSeoSlugs,
} = require("../seo-pages");

const { getVehicleSlugDenylist } = require("../seo-pages/registry");

const { loadTier1Variants } = require("../seo-pages/loadCatalog");

const {
  findToneViolations,
  sanitizeEditorialText,
} = require("../editorial-intelligence/toneRules");

const BANNED_SUPERLATIVE = /\b(best ev in india|#1 ev|unbeatable|perfect ev)\b/i;

function auditSeoPages(options = {}) {
  const { manifest, variants } = loadTier1Variants(
    options.tier1Root
  );
  const pages = buildAllSeoPages(options);
  const seoSlugs = new Set(getAllSeoSlugs());
  const vehicleSlugs = new Set(manifest.slugs);

  const duplicateSlugs = [];
  const unsupportedClaims = [];
  const emptyRecommendationLogic = [];
  const overconfidentRankings = [];
  const invalidCanonicalUrls = [];
  const duplicateMetadata = [];
  const vehicleSlugCollisions = [];
  const emptyPages = [];

  const titleSet = new Map();
  const metaSet = new Map();

  for (const slug of seoSlugs) {
    if (vehicleSlugs.has(slug)) {
      vehicleSlugCollisions.push({
        slug,
        reason: "SEO slug collides with vehicle identity slug",
      });
    }
  }

  for (const deny of getVehicleSlugDenylist()) {
    if (vehicleSlugs.has(deny)) {
      if (
        !vehicleSlugCollisions.find((c) => c.slug === deny)
      ) {
        vehicleSlugCollisions.push({
          slug: deny,
          reason: "Reserved SEO slug matches vehicle",
        });
      }
    }
  }

  const slugCounts = {};
  for (const p of pages) {
    const s = p.seoPage.slug;
    slugCounts[s] = (slugCounts[s] || 0) + 1;
  }
  for (const [slug, count] of Object.entries(slugCounts)) {
    if (count > 1) duplicateSlugs.push({ slug, count });
  }

  for (const { seoPage } of pages) {
    if (!seoPage.recommendationLogic?.methodology) {
      emptyRecommendationLogic.push({
        slug: seoPage.slug,
      });
    }

    if (seoPage.rankedVehicles.length === 0) {
      emptyPages.push({ slug: seoPage.slug });
    }

    const canonical = seoPage.canonicalPath;
    if (
      !canonical ||
      !canonical.startsWith("/cars/") ||
      canonical !== `/cars/${seoPage.slug}`
    ) {
      invalidCanonicalUrls.push({
        slug: seoPage.slug,
        canonicalPath: canonical,
      });
    }

    if (titleSet.has(seoPage.title)) {
      duplicateMetadata.push({
        slug: seoPage.slug,
        field: "title",
        duplicateOf: titleSet.get(seoPage.title),
      });
    } else {
      titleSet.set(seoPage.title, seoPage.slug);
    }

    if (metaSet.has(seoPage.metaDescription)) {
      duplicateMetadata.push({
        slug: seoPage.slug,
        field: "metaDescription",
        duplicateOf: metaSet.get(seoPage.metaDescription),
      });
    } else {
      metaSet.set(seoPage.metaDescription, seoPage.slug);
    }

    const texts = [
      seoPage.title,
      seoPage.metaDescription,
      seoPage.intro,
      seoPage.tradeoffs?.summary,
      ...seoPage.faq.map((f) => f.question + " " + f.answer),
      ...seoPage.rankedVehicles.map((v) => v.explanation),
    ];

    for (const text of texts) {
      if (BANNED_SUPERLATIVE.test(text || "")) {
        unsupportedClaims.push({
          slug: seoPage.slug,
          excerpt: text.slice(0, 80),
        });
      }
      const toneHits = findToneViolations(text);
      if (toneHits.length) {
        unsupportedClaims.push({
          slug: seoPage.slug,
          toneHits,
          excerpt: text.slice(0, 80),
        });
      }
    }

    for (const v of seoPage.rankedVehicles) {
      if (
        v.confidence === "high" &&
        v.compositeScore < 80
      ) {
        overconfidentRankings.push({
          slug: seoPage.slug,
          vehicle: v.slug,
          score: v.compositeScore,
          confidence: v.confidence,
        });
      }
    }
  }

  const errors =
    duplicateSlugs.length +
    unsupportedClaims.length +
    emptyRecommendationLogic.length +
    invalidCanonicalUrls.length +
    vehicleSlugCollisions.length;

  const warnings =
    overconfidentRankings.length +
    duplicateMetadata.length +
    emptyPages.length;

  return {
    pageCount: pages.length,
    variantCount: variants.length,
    duplicateSlugs,
    unsupportedClaims,
    emptyRecommendationLogic,
    overconfidentRankings,
    invalidCanonicalUrls,
    duplicateMetadata,
    vehicleSlugCollisions,
    emptyPages,
    errors,
    warnings,
  };
}

module.exports = {
  auditSeoPages,
};
