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

function syntheticVehicleId(slug) {
  if (!slug) return undefined;
  return `tier1:${slug}`;
}

function isMetadataOnlyPayload(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return false;
  }
  const keys = Object.keys(obj);
  return keys.length === 1 && keys[0] === "metadata";
}

function isValidMarketplaceVehicle(vehicle) {
  if (!vehicle || typeof vehicle !== "object" || isMetadataOnlyPayload(vehicle)) {
    return false;
  }
  return Boolean(
    String(vehicle.slug || "").trim() &&
      String(vehicle.name || "").trim()
  );
}

function finalizeMarketplaceVehicle(vehicle) {
  if (!isValidMarketplaceVehicle(vehicle)) {
    return null;
  }

  const slug = String(vehicle.slug).trim().toLowerCase();

  return {
    ...vehicle,
    _id: vehicle._id || syntheticVehicleId(slug),
    slug,
    name: vehicle.name,
    brand: vehicle.brand || labelBrand(slug.split("-")[0]),
    heroImage: vehicle.heroImage || vehicle.image || "",
    image:
      vehicle.image ||
      vehicle.listingThumbnail ||
      vehicle.heroImage ||
      "",
    variants: Array.isArray(vehicle.variants) ? vehicle.variants : [],
    specifications: vehicle.specifications || {
      batteryPack: "EV Battery",
      range: 0,
      chargingTime: "N/A",
      topSpeed: "N/A",
    },
    catalogMeta: vehicle.catalogMeta || null,
    masterRaw: undefined,
  };
}

/**
 * Resolve a dual-read hit to a legacy-compatible marketplace vehicle DTO.
 */
function resolveMarketplacePayload(hit) {
  if (!hit) return null;

  if (isValidMarketplaceVehicle(hit.vehicle)) {
    return finalizeMarketplaceVehicle(hit.vehicle);
  }

  if (hit.masterDetail) {
    const remapped = toMarketplaceVehicle(hit.masterDetail);
    if (isValidMarketplaceVehicle(remapped)) {
      return finalizeMarketplaceVehicle({
        ...remapped,
        catalogSource: hit.source || remapped.catalogSource,
      });
    }
  }

  return null;
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

  const slug = String(v.identity.slug || "").trim().toLowerCase();

  return {
    _id: v._id || syntheticVehicleId(slug),
    name,
    brand,
    slug,
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

  if (!c || isMetadataOnlyPayload(c)) return null;

  const slug = String(c.slug || c.identity?.slug || "")
    .trim()
    .toLowerCase();
  const name = String(c.name || "").trim();

  if (!slug || !name) return null;

  return finalizeMarketplaceVehicle({
    ...c,
    slug,
    name,
    catalogSource: "legacy",
    catalogMeta: {
      ...(c.catalogMeta || {}),
      dataQualityScore: null,
      governanceStatus: c.status || "active",
      confidence: "legacy",
      verificationFlags: [],
    },
  });
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

  const marketplace = finalizeMarketplaceVehicle(
    toMarketplaceVehicle(v)
  );

  return {
    id: v._id || marketplace?._id,
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
    marketplace,
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
  resolveMarketplacePayload,
  finalizeMarketplaceVehicle,
  isValidMarketplaceVehicle,
  isMetadataOnlyPayload,
  labelBrand,
  labelModel,
};
