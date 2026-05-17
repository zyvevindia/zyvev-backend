/** Shared builders for Tier-1 catalog records */

import {
  getProductionFamilyMedia,
  mediaAssetRegistry,
  resolveFamilySlugFromVariantSlug,
  variantCatalogUrl,
} from "./_cloudinaryMedia.js";

export { mediaAssetRegistry } from "./_cloudinaryMedia.js";

/**
 * Cloudinary media URLs per variant slug.
 * Production families share family-level assets; others use variant paths.
 */
export function mediaPaths(slug) {
  const family = resolveFamilySlugFromVariantSlug(slug);
  const familyMedia = family ? getProductionFamilyMedia(family) : null;

  if (familyMedia) {
    return {
      ...familyMedia,
      videos: [],
      assets: mediaAssetRegistry(slug),
      resolveOrder: ["listingThumbnail", "heroImage", "compareThumbnail"],
    };
  }

  return {
    heroImage: variantCatalogUrl(slug, "hero.jpg"),
    listingThumbnail: variantCatalogUrl(slug, "listing-thumb.jpg"),
    compareThumbnail: variantCatalogUrl(slug, "compare-thumb.jpg"),
    ogImage: variantCatalogUrl(slug, "og.jpg"),
    gallery: [
      variantCatalogUrl(slug, "exterior-1.jpg"),
      variantCatalogUrl(slug, "exterior-2.jpg"),
      variantCatalogUrl(slug, "exterior-3.jpg"),
    ],
    interior: [variantCatalogUrl(slug, "interior-1.jpg")],
    charging: [variantCatalogUrl(slug, "charging-port.jpg")],
    videos: [],
    assets: mediaAssetRegistry(slug),
    resolveOrder: ["listingThumbnail", "heroImage", "compareThumbnail"],
  };
}

/** Brand-level placeholder — local frontend fallback preferred at runtime */
export function brandFallbackImage() {
  return null;
}

export function flag(path, status, note, reviewBy = "2026-06-15") {
  return { path, status, note, reviewBy };
}

export function governance(score, extraFlags = []) {
  return {
    status: "review",
    source: "evsavari",
    dataQualityScore: score,
    version: 1,
    publishedAt: null,
    legacyCarId: null,
    confidence: score >= 90 ? "high" : score >= 85 ? "medium" : "low",
  };
}

export function verification(score, flags) {
  return {
    dataQualityScore: score,
    confidence: score >= 90 ? "high" : "medium",
    flags,
    lastReviewedAt: null,
    sources: [
      {
        type: "oem_web",
        note: "Primary specs — verify URL at import",
        accessedAt: "2026-05-15",
      },
    ],
  };
}

export function realWorldBand(claimedKm, minPct = 0.68, maxPct = 0.82) {
  return {
    min: Math.round(claimedKm * minPct),
    max: Math.round(claimedKm * maxPct),
    methodology:
      "EVSavari mixed city-highway estimate; flag for owner-data refresh",
  };
}

export function seoBlock({
  slug,
  brand,
  model,
  variant,
  exShowroom,
  claimedKm,
  rivals = [],
}) {
  const rivalText =
    rivals.length > 0
      ? ` Compare with ${rivals.join(", ")}.`
      : "";
  return {
    metaTitle: `${brand} ${model} ${variant} Price, Range & Charging | EVSavari`,
    metaDescription: `${brand} ${model} ${variant} ex-showroom from ₹${formatLakh(exShowroom)} lakh, ${claimedKm} km ARAI range, charging, pros & cons on EVSavari.${rivalText}`,
    canonicalPath: `/cars/${slug}`,
  };
}

function formatLakh(inr) {
  return (inr / 100000).toFixed(2);
}

/** Standard charging block — omit times only when unknown (not guessed). */
export function chargingBlock({
  acKw = 7.2,
  acTime0to100Hours = null,
  dcKw = 50,
  dcTime10to80Minutes = null,
  standards = ["CCS2", "Type2"],
  v2l = { supported: true, maxWatts: 3000 },
  v2v = { supported: false },
  regenLevels = ["low", "medium", "high"],
} = {}) {
  const block = {
    acKw,
    dcKw,
    standards,
    v2l,
    v2v,
    regenLevels,
  };
  if (acTime0to100Hours != null) block.acTime0to100Hours = acTime0to100Hours;
  if (dcTime10to80Minutes != null) block.dcTime10to80Minutes = dcTime10to80Minutes;
  return block;
}

/** Editorial charging FAQ from verified charging fields only. */
export function chargingFaqFromSpecs({ acKw, acTime, dcKw, dcTime, claimedKm }) {
  const faq = [];
  if (acKw && acTime) {
    faq.push({
      q: `How long does AC charging take on a ${acKw} kW home/work charger?`,
      a: `Indicative full charge (0–100%) around ${acTime} hours at ${acKw} kW AC — actual time depends on SoC window, ambient temperature, and onboard charger limits.`,
    });
  }
  if (dcKw && dcTime) {
    faq.push({
      q: "What should I expect at a DC fast charger?",
      a: `Plan for roughly ${dcTime} minutes from 10–80% when the charger delivers near the vehicle's ${dcKw} kW peak — route and battery temperature affect real sessions.`,
    });
  }
  if (claimedKm) {
    faq.push({
      q: "Is this suitable for apartment buyers?",
      a: `With overnight AC charging, many city buyers cover daily use well below the ${claimedKm} km ARAI claim — confirm society charger permissions before purchase.`,
    });
  }
  return faq;
}

export function compareBlock({
  rivalSlugs,
  valueScore,
  advantages,
  weaknesses,
  featureMatrix = {},
}) {
  return {
    segmentRivalSlugs: rivalSlugs,
    strongestAdvantages: advantages.map((label, i) => ({
      key: `adv_${i + 1}`,
      label,
    })),
    weakestAreas: weaknesses.map((label, i) => ({
      key: `weak_${i + 1}`,
      label,
    })),
    valueScore,
    featureMatrix,
  };
}
