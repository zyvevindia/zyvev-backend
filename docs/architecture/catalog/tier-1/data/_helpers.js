/** Shared builders for Tier-1 catalog records */

const CDN = "https://cdn.evsavari.com/catalog";

/**
 * Canonical media URLs per variant slug.
 * Until dedicated crops exist on CDN, listing/compare/og may alias hero —
 * see docs/architecture/catalog/tier-1/media-fallback-strategy.md
 */
function assetEntry(slug, file, meta) {
  const base = `${CDN}/${slug}`;
  return {
    key: meta.key,
    url: `${base}/${file}`,
    filename: file,
    role: meta.role,
    category: meta.category,
    angle: meta.angle || null,
    variant: meta.variant || "light",
    tags: meta.tags || [],
    attribution: {
      sourceType: meta.sourceType || "oem_press",
      usage: "editorial_marketplace",
      rightsNote:
        "OEM press / brochure — verify brand media terms before publish",
      capturedAt: null,
      ...meta.attribution,
    },
  };
}

/** Future-ready per-asset registry (optional in API/UI) */
export function mediaAssetRegistry(slug) {
  return [
    assetEntry(slug, "hero.jpg", {
      key: "hero",
      role: "hero",
      category: "exterior",
      angle: "front-three-quarter",
      tags: ["exterior", "hero"],
    }),
    assetEntry(slug, "listing-thumb.jpg", {
      key: "listing_thumb",
      role: "listing",
      category: "exterior",
      angle: "front-three-quarter",
      tags: ["listing", "exterior"],
    }),
    assetEntry(slug, "compare-thumb.jpg", {
      key: "compare_thumb",
      role: "compare",
      category: "exterior",
      angle: "side-profile",
      tags: ["compare", "exterior"],
    }),
    assetEntry(slug, "og.jpg", {
      key: "og",
      role: "social",
      category: "exterior",
      angle: "front-three-quarter",
      tags: ["og", "social"],
    }),
    assetEntry(slug, "exterior-1.jpg", {
      key: "exterior_1",
      role: "gallery",
      category: "exterior",
      angle: "front-three-quarter",
      tags: ["exterior", "gallery"],
    }),
    assetEntry(slug, "exterior-2.jpg", {
      key: "exterior_2",
      role: "gallery",
      category: "exterior",
      angle: "rear-three-quarter",
      tags: ["exterior", "gallery"],
    }),
    assetEntry(slug, "exterior-3.jpg", {
      key: "exterior_3",
      role: "gallery",
      category: "exterior",
      angle: "side-profile",
      tags: ["exterior", "gallery"],
    }),
    assetEntry(slug, "interior-1.jpg", {
      key: "interior_1",
      role: "gallery",
      category: "interior",
      angle: "dashboard",
      tags: ["interior", "gallery"],
    }),
    assetEntry(slug, "charging-port.jpg", {
      key: "charging_port",
      role: "gallery",
      category: "charging",
      angle: "charging-port",
      tags: ["charging", "ccs2", "gallery"],
    }),
  ];
}

export function mediaPaths(slug) {
  const base = `${CDN}/${slug}`;
  const hero = `${base}/hero.jpg`;
  return {
    heroImage: hero,
    listingThumbnail: `${base}/listing-thumb.jpg`,
    compareThumbnail: `${base}/compare-thumb.jpg`,
    ogImage: `${base}/og.jpg`,
    gallery: [
      `${base}/exterior-1.jpg`,
      `${base}/exterior-2.jpg`,
      `${base}/exterior-3.jpg`,
    ],
    interior: [`${base}/interior-1.jpg`],
    charging: [`${base}/charging-port.jpg`],
    videos: [],
    assets: mediaAssetRegistry(slug),
    resolveOrder: ["listingThumbnail", "heroImage", "compareThumbnail"],
  };
}

/** Brand-level placeholder when variant hero is missing (upload to CDN) */
export function brandFallbackImage(brandSlug, bodyType = "suv") {
  const brand = String(brandSlug || "generic").toLowerCase();
  const body = ["hatchback", "sedan", "suv", "micro-suv"].includes(bodyType)
    ? bodyType
    : "suv";
  return `${CDN}/_fallbacks/${brand}-${body}.jpg`;
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
