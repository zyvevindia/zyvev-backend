/**
 * Catalog slug governance audits — Tier-1 JSON + route consistency.
 */

const fs = require("fs");
const path = require("path");

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function loadTier1Variants(tier1Root) {
  const manifestPath = path.join(tier1Root, "manifest.json");
  const variantsDir = path.join(tier1Root, "variants");
  const manifest = JSON.parse(
    fs.readFileSync(manifestPath, "utf8")
  );

  const variants = manifest.slugs.map((slug) => {
    const filePath = path.join(variantsDir, `${slug}.json`);
    const record = JSON.parse(
      fs.readFileSync(filePath, "utf8")
    );
    return record;
  });

  return { manifest, variants };
}

function collectCompareSlugs(variants) {
  const slugs = new Set();
  for (const v of variants) {
    slugs.add(v.identity.slug);
    for (const rival of v.compare?.segmentRivalSlugs || []) {
      slugs.add(rival);
    }
    for (const pathKey of [
      "bestAlternativeSlug",
      "upgradePathSlug",
      "downgradePathSlug",
    ]) {
      if (v.decision?.[pathKey]) {
        slugs.add(v.decision[pathKey]);
      }
    }
  }
  return slugs;
}

function auditTier1(tier1Root) {
  const { manifest, variants } = loadTier1Variants(tier1Root);
  const duplicateSlugs = [];
  const invalidSlugs = [];
  const identityMismatches = [];
  const brokenCompareSlugs = [];
  const missingDetailPages = [];
  const routeCollisions = [];
  const brokenLinks = [];

  const slugSet = new Set();
  const allKnown = new Set(manifest.slugs);

  for (const v of variants) {
    const fileSlug = v.identity?.slug;
    if (!fileSlug) {
      invalidSlugs.push({ slug: "(missing)", reason: "no identity.slug" });
      continue;
    }

    if (slugSet.has(fileSlug)) {
      duplicateSlugs.push(fileSlug);
    }
    slugSet.add(fileSlug);

    if (!SLUG_PATTERN.test(fileSlug)) {
      invalidSlugs.push({
        slug: fileSlug,
        reason: "invalid characters or format",
      });
    }

    const base = path.basename(
      path.join(tier1Root, "variants", `${fileSlug}.json`)
    );
    if (base !== `${fileSlug}.json`) {
      identityMismatches.push(fileSlug);
    }
  }

  const compareRefs = collectCompareSlugs(variants);
  for (const ref of compareRefs) {
    if (!allKnown.has(ref)) {
      brokenCompareSlugs.push(ref);
    }
  }

  for (const v of variants) {
    const canonical = v.seo?.canonicalPath;
    if (canonical && !canonical.startsWith("/cars/")) {
      brokenLinks.push({
        slug: v.identity.slug,
        path: canonical,
        reason: "canonicalPath should use /cars/:slug",
      });
    }
    if (canonical) {
      const pathSlug = canonical.replace(/^\/cars\//, "");
      if (pathSlug !== v.identity.slug) {
        brokenLinks.push({
          slug: v.identity.slug,
          path: canonical,
          reason: "canonicalPath slug mismatch",
        });
      }
    }
  }

  routeCollisions.push({
    note:
      "Frontend /cars is listing index; /cars/:slug is detail — ensure router order defines :slug route",
    paths: ["/cars", "/cars/:slug", "/car/:slug (legacy redirect)"],
  });

  let seoSlugCollisions = [];
  try {
    const { getAllSeoSlugs } = require("../seo-pages/registry");
    for (const seoSlug of getAllSeoSlugs()) {
      if (allKnown.has(seoSlug)) {
        seoSlugCollisions.push({
          slug: seoSlug,
          reason: "SEO page slug collides with vehicle identity slug",
        });
      }
    }
    if (seoSlugCollisions.length) {
      routeCollisions.push({
        note: "Reserved SEO slugs must not match vehicle slugs",
        slugs: seoSlugCollisions,
      });
    }
  } catch {
    /* seo module optional in minimal installs */
  }

  return {
    variantCount: variants.length,
    duplicateSlugs: [...new Set(duplicateSlugs)],
    invalidSlugs,
    identityMismatches,
    brokenCompareSlugs: [...new Set(brokenCompareSlugs)],
    missingDetailPages,
    routeCollisions,
    brokenLinks,
    warnings:
      brokenCompareSlugs.length +
      brokenLinks.length +
      invalidSlugs.length,
    errors: duplicateSlugs.length + identityMismatches.length,
  };
}

function formatReport(report) {
  return JSON.stringify(report, null, 2);
}

module.exports = {
  auditTier1,
  formatReport,
  loadTier1Variants,
};
