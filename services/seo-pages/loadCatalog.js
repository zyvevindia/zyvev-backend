/**
 * Load Tier-1 catalog variants for SEO generation (build-time / API).
 */

const fs = require("fs");
const path = require("path");

const DEFAULT_TIER1_ROOT = path.join(
  __dirname,
  "../../docs/architecture/catalog/tier-1"
);

function loadTier1Variants(tier1Root = DEFAULT_TIER1_ROOT) {
  const manifestPath = path.join(tier1Root, "manifest.json");
  const variantsDir = path.join(tier1Root, "variants");

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Tier-1 manifest not found: ${manifestPath}`);
  }

  const manifest = JSON.parse(
    fs.readFileSync(manifestPath, "utf8")
  );

  const variants = manifest.slugs.map((slug) => {
    const filePath = path.join(variantsDir, `${slug}.json`);
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  });

  return { manifest, variants };
}

function variantToSummary(variant) {
  const id = variant.identity || {};
  return {
    slug: id.slug,
    brandSlug: id.brandSlug,
    modelSlug: id.modelSlug,
    variantName: id.variantName,
    displayName: `${id.brandSlug || ""} ${id.variantName || id.slug}`
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim(),
    exShowroom: variant.pricing?.exShowroom ?? null,
    claimedRangeKm: variant.range?.claimedKm ?? null,
    bodyType: id.bodyType,
    segment: id.segment,
  };
}

module.exports = {
  loadTier1Variants,
  variantToSummary,
  DEFAULT_TIER1_ROOT,
};
