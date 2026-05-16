/* =========================================================
   Legacy Car DTO mapper — master variant → marketplace shape
   ========================================================= */

const {
  CATALOG_INTELLIGENCE_ENABLED,
} = require("../../config/catalog");

const BRAND_LABELS = {
  tata: "Tata",
  mg: "MG",
  mahindra: "Mahindra",
  hyundai: "Hyundai",
  byd: "BYD",
  kia: "Kia",
  bmw: "BMW",
  mercedes: "Mercedes-Benz",
  volvo: "Volvo",
};

function labelBrand(brandSlug) {
  if (!brandSlug) return "EV";
  return (
    BRAND_LABELS[brandSlug.toLowerCase()] ||
    brandSlug.charAt(0).toUpperCase() + brandSlug.slice(1)
  );
}

function labelModel(modelSlug) {
  if (!modelSlug) return "EV";
  return modelSlug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatCharging(charging) {
  if (!charging) return "N/A";
  const dc = charging.dcTime10to80Minutes;
  const ac = charging.acTime0to100Hours;
  if (dc) return `DC 10-80% ~${dc} min`;
  if (ac) return `AC full ~${ac} hrs`;
  return "N/A";
}

function mapBodyToCategory(bodyType) {
  const map = {
    suv: "SUV",
    "coupe-suv": "SUV",
    hatchback: "Hatchback",
    sedan: "Sedan",
    "micro-suv": "SUV",
    "city-ev": "Hatchback",
    mpv: "MPV",
  };
  return map[bodyType] || "SUV";
}

/**
 * Normalized API vehicle shape (legacy-compatible + catalog extensions).
 */
function toMarketplaceVehicle(masterDoc) {
  const v =
    masterDoc && masterDoc.toObject
      ? masterDoc.toObject()
      : masterDoc;

  if (!v || !v.identity) {
    return null;
  }

  const brand = labelBrand(v.identity.brandSlug);
  const modelLabel = labelModel(v.identity.modelSlug);
  const name = `${brand} ${modelLabel} ${v.identity.variantName}`.trim();

  const exShowroom =
    v.pricing?.exShowroom ?? 0;

  const batteryPack = [
    v.battery?.capacityKwh
      ? `${v.battery.capacityKwh} kWh`
      : "",
    v.battery?.chemistry || "",
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    _id: v._id,
    name,
    brand,
    slug: v.identity.slug,
    category: mapBodyToCategory(v.identity.bodyType),
    status: "active",
    startingPrice: exShowroom,
    topVariantPrice: exShowroom,
    heroImage: v.media?.heroImage || "",
    image:
      v.media?.listingThumbnail ||
      v.media?.heroImage ||
      "",
    listingThumbnail:
      v.media?.listingThumbnail ||
      v.media?.heroImage ||
      "",
    compareThumbnail:
      v.media?.compareThumbnail ||
      v.media?.listingThumbnail ||
      v.media?.heroImage ||
      "",
    ogImage:
      v.media?.ogImage ||
      v.media?.heroImage ||
      "",
    galleryImages: [
      ...(v.media?.gallery || []),
      ...(v.media?.interior || []),
      ...(v.media?.charging || []),
    ].filter(Boolean),
    colors: [],
    variants: [],
    specifications: {
      batteryPack: batteryPack || "EV Battery",
      range: v.range?.claimedKm ?? 0,
      chargingTime: formatCharging(v.charging),
      topSpeed:
        v.performance?.topSpeed ||
        (v.performance?.acceleration0to100
          ? `${v.performance.acceleration0to100}s (0-100)`
          : "N/A"),
    },
    dimensions: {
      bootSpace: v.practicality?.bootSpaceL
        ? `${v.practicality.bootSpaceL} L`
        : "",
      length: "",
      width: "",
      height: "",
      wheelbase: "",
    },
    overview: v.seo?.expertSummary || "",
    features: v.seo?.pros || [],
    safety: [],
    seo: {
      metaTitle: v.seo?.metaTitle || "",
      metaDescription: v.seo?.metaDescription || "",
    },
    isFeatured: false,
    dealer: null,
    dealerListingStatus: "active",
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
    catalogSource: "master",
    catalogMeta: buildCatalogMeta(v),
    masterRaw: undefined,
  };
}

function buildCatalogMeta(v) {
  const base = {
    dataQualityScore:
      v.governance?.dataQualityScore ??
      v.verification?.dataQualityScore ??
      null,
    governanceStatus: v.governance?.status ?? "draft",
    confidence:
      v.governance?.confidence ??
      v.verification?.confidence ??
      "medium",
    verificationFlags: v.verification?.flags || [],
    compareValueScore: v.compare?.valueScore ?? null,
    psychologyTags: v.psychology?.tags || [],
    psychologyScores: v.psychology?.scores || {},
    psychologyNarrative: v.psychology?.narrative || "",
    segment: v.identity?.segment,
    launchStatus: v.identity?.launchStatus,
    pros: v.seo?.pros || [],
    cons: v.seo?.cons || [],
    expertSummary: v.seo?.expertSummary || "",
    faq: v.seo?.faq || [],
    chargingFaq: v.seo?.chargingFaq || [],
    compareRivals: v.compare?.segmentRivalSlugs || [],
    strongestAdvantages:
      v.compare?.strongestAdvantages || [],
    weakestAreas: v.compare?.weakestAreas || [],
    claimedRangeKm: v.range?.claimedKm ?? null,
    realWorldRangeKm: v.range?.realWorldKm || null,
    chargingSummary: formatChargingSummary(v.charging),
    ownershipWarranty: {
      vehicleYears: v.ownership?.warrantyVehicleYears,
      batteryYears: v.ownership?.warrantyBatteryYears,
      batteryKm: v.ownership?.warrantyBatteryKm,
    },
    ownershipCost5yr: v.pricing?.ownershipCost5yr || null,
    priceLastUpdated: v.pricing?.priceLastUpdated || null,
    suitabilityScores: {
      family: v.practicality?.familyScore,
      city: v.practicality?.cityUsabilityScore,
      highway: v.practicality?.highwayComfortScore,
    },
    lastUpdatedAt: v.updatedAt || null,
    media: {
      heroImage: v.media?.heroImage || null,
      listingThumbnail: v.media?.listingThumbnail || null,
      compareThumbnail: v.media?.compareThumbnail || null,
      ogImage: v.media?.ogImage || null,
      assets: v.media?.assets || [],
    },
  };

  if (!CATALOG_INTELLIGENCE_ENABLED) {
    return base;
  }

  return {
    ...base,
    intelligenceEnabled: true,
    safety: v.safety || null,
    comfort: v.comfort || null,
    chargingEcosystem: v.chargingEcosystem || null,
    ownershipIntelligence: v.ownershipIntelligence || null,
    psychologyExtended: v.psychologyExtended || null,
    decision: v.decision || null,
    personaFit: v.personaFit || null,
    comparePicks: v.compare?.picks || null,
    compareNarrative: v.compare?.narrative || null,
    commercial: v.commercial || null,
    scenarioFit: v.scenarioFit || null,
    editorialNarratives: v.editorialNarratives || null,
    intelligenceGovernance: v.intelligenceGovernance || null,
    rangeReality: v.rangeReality || null,
    chargingReality: v.chargingReality || null,
    buyerAssurance: v.buyerAssurance || null,
    ownershipTradeoffs: v.ownershipTradeoffs || null,
    scenarioCompare: v.scenarioCompare || null,
    rangeRealityExpanded: v.rangeRealityExpanded || null,
    chargingPracticality: v.chargingPracticality || null,
    ownershipConfidence: v.ownershipConfidence || null,
    trustPresentation: v.trustPresentation || null,
    compareTrust: v.compareTrust || null,
    ownershipPracticality: v.ownershipPracticality || null,
  };
}

function formatChargingSummary(charging) {
  if (!charging) return "";
  const parts = [];
  if (charging.acKw) parts.push(`${charging.acKw} kW AC`);
  if (charging.dcKw) parts.push(`${charging.dcKw} kW DC peak`);
  if (charging.dcTime10to80Minutes) {
    parts.push(`~${charging.dcTime10to80Minutes} min (10–80%)`);
  }
  if (charging.standards?.length) {
    parts.push(charging.standards.join(", "));
  }
  return parts.join(" · ");
}

function legacyCarToMarketplace(carDoc) {
  const c =
    carDoc && carDoc.toObject
      ? carDoc.toObject()
      : carDoc;

  if (!c) return null;

  return {
    ...c,
    catalogSource: "legacy",
    catalogMeta: {
      dataQualityScore: null,
      governanceStatus: c.status || "active",
      confidence: "legacy",
      verificationFlags: [],
    },
  };
}

/**
 * SEO / compare-ready master payload (not legacy-trimmed).
 */
function toMasterVariantDto(masterDoc) {
  const v =
    masterDoc && masterDoc.toObject
      ? masterDoc.toObject()
      : masterDoc;

  if (!v) return null;

  return {
    id: v._id,
    identity: v.identity,
    pricing: v.pricing,
    battery: v.battery,
    range: v.range,
    charging: v.charging,
    performance: v.performance,
    practicality: v.practicality,
    ownership: v.ownership,
    psychology: v.psychology,
    availability: v.availability,
    compare: v.compare,
    seo: v.seo,
    media: v.media,
    safety: v.safety,
    comfort: v.comfort,
    chargingEcosystem: v.chargingEcosystem,
    ownershipIntelligence: v.ownershipIntelligence,
    psychologyExtended: v.psychologyExtended,
    decision: v.decision,
    personaFit: v.personaFit,
    commercial: v.commercial,
    scenarioFit: v.scenarioFit,
    editorialNarratives: v.editorialNarratives,
    intelligenceGovernance: v.intelligenceGovernance,
    rangeReality: v.rangeReality,
    chargingReality: v.chargingReality,
    buyerAssurance: v.buyerAssurance,
    ownershipTradeoffs: v.ownershipTradeoffs,
    scenarioCompare: v.scenarioCompare,
    rangeRealityExpanded: v.rangeRealityExpanded,
    chargingPracticality: v.chargingPracticality,
    ownershipConfidence: v.ownershipConfidence,
    trustPresentation: v.trustPresentation,
    compareTrust: v.compareTrust,
    ownershipPracticality: v.ownershipPracticality,
    governance: v.governance,
    verification: v.verification,
    marketplace: toMarketplaceVehicle(v),
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
  };
}

function toCompareBundle(masterDocs) {
  const vehicles = masterDocs
    .map((m) => toMarketplaceVehicle(m))
    .filter(Boolean);

  return {
    cars: vehicles,
    compareMeta: {
      count: vehicles.length,
      valueScores: vehicles.map((car) => ({
        slug: car.slug,
        valueScore:
          car.catalogMeta?.compareValueScore ?? null,
      })),
      segment: vehicles[0]?.catalogMeta?.segment || null,
    },
  };
}

module.exports = {
  toMarketplaceVehicle,
  legacyCarToMarketplace,
  toMasterVariantDto,
  toCompareBundle,
  labelBrand,
  labelModel,
};
