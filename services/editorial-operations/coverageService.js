/**
 * Tier-1 intelligence coverage — operational gap analysis across variants.
 */

const fs = require("fs");
const path = require("path");
const { loadTier1Variant } = require("../acquisition-diffs");
const { observationSupportBySlug, buildObservationFleetSummary } = require("../real-world-observations");
const { validateTrustConsistency } = require("../trust-calibration");

const VARIANTS_DIR = path.join(
  __dirname,
  "../../docs/architecture/catalog/tier-1/variants"
);

const FLAGSHIP_SLUGS = new Set([
  "tata-nexon-ev-creative-plus",
  "tata-nexon-ev-empowered-lr",
  "tata-punch-ev-empowered-lr",
  "mg-comet-ev-play",
  "mahindra-be-6-pack-two",
  "mahindra-xev-9e-pack-two",
  "citroen-ec3-live",
]);

function hasValue(v) {
  return v !== undefined && v !== null && v !== "";
}

function needsReviewCount(doc) {
  return (doc.verification?.flags || []).filter(
    (f) => f.status === "needs_review"
  ).length;
}

function analyzeVariant(slug) {
  let doc;
  try {
    doc = loadTier1Variant(slug, VARIANTS_DIR);
  } catch {
    return { slug, error: "missing_file" };
  }

  const gaps = [];
  const needsReview = needsReviewCount(doc);
  const obs = observationSupportBySlug(slug);
  const trustCheck = validateTrustConsistency(doc);

  const checks = {
    missingNcap: !hasValue(doc.safety?.bharatNcap?.rating) && doc.safety?.bharatNcap == null,
    missingChargingFaq:
      !doc.seo?.chargingFaq?.length && !doc.chargingEcosystem?.faq?.length,
    missingWarrantyVehicleYears: !hasValue(doc.ownership?.warrantyVehicleYears),
    missingWarrantyBatteryYears: !hasValue(doc.ownership?.warrantyBatteryYears),
    missingWarrantyBatteryKm: !hasValue(doc.ownership?.warrantyBatteryKm),
    missingServiceCost: !hasValue(doc.ownership?.serviceCostPerKm),
    missingAcChargeTime: !hasValue(doc.charging?.acTime0to100Hours),
    missingDcChargeTime: !hasValue(doc.charging?.dcTime10to80Minutes),
    missingUsableKwh: !hasValue(doc.battery?.usableKwh),
    missingAdasFeatures: !doc.safety?.adas?.features?.length,
    adasLevelNull: doc.safety?.adas?.level == null,
    incompleteChargingPracticality:
      !hasValue(doc.charging?.acTime0to100Hours) ||
      !hasValue(doc.charging?.dcTime10to80Minutes),
    missingOwnershipPracticality: !doc.ownershipPracticality,
    missingRangeRealityExpanded: !doc.rangeRealityExpanded,
    missingChargingPracticality: !doc.chargingPracticality,
    missingOwnershipConfidence: !doc.ownershipConfidence,
    missingTrustPresentation:
      !doc.trustPresentation?.indicators?.length,
    lowTrustIndicatorCount:
      (doc.trustPresentation?.indicators?.length || 0) < 3,
    needsReviewFlags: needsReview > 0,
    lowObservationCoverage: obs.verifiedEditorial < 2,
    staleObservations: obs.stale > 0,
    trustConsistencyIssues: !trustCheck.consistent,
    brochureVerificationGap:
      needsReview > 0 &&
      (!hasValue(doc.battery?.usableKwh) ||
        !hasValue(doc.charging?.acTime0to100Hours)),
  };

  for (const [key, failed] of Object.entries(checks)) {
    if (failed) gaps.push(key);
  }

  return {
    slug,
    brand: doc.identity?.brandSlug,
    model: doc.identity?.modelSlug,
    variantName: doc.identity?.variantName,
    gapCount: gaps.length,
    gaps,
    needsReviewCount: needsReview,
    observationSupport: obs,
    trustConsistency: {
      consistent: trustCheck.consistent,
      issueCount: trustCheck.issues?.length || 0,
    },
    calibrationReady: obs.calibrationReady && trustCheck.consistent,
    isFlagship: FLAGSHIP_SLUGS.has(slug),
    chargingStandards: doc.charging?.standards || [],
  };
}

function buildCoverageReport() {
  const files = fs
    .readdirSync(VARIANTS_DIR)
    .filter((f) => f.endsWith(".json"));

  const variants = files.map((f) => analyzeVariant(f.replace(".json", "")));
  const observationFleet = buildObservationFleetSummary();

  const aggregate = {
    missingNcap: 0,
    missingChargingFaq: 0,
    missingWarrantyBatteryKm: 0,
    missingServiceCost: 0,
    incompleteChargingPracticality: 0,
    missingAcChargeTime: 0,
    missingDcChargeTime: 0,
    missingUsableKwh: 0,
    missingOwnershipPracticality: 0,
    missingRangeRealityExpanded: 0,
    missingChargingPracticality: 0,
    missingOwnershipConfidence: 0,
    missingTrustPresentation: 0,
    lowTrustIndicatorCount: 0,
    variantsWithNeedsReview: 0,
    lowObservationCoverage: 0,
    staleObservations: 0,
    trustConsistencyIssues: 0,
    brochureVerificationGap: 0,
    calibrationReady: 0,
  };

  for (const v of variants) {
    if (v.error) continue;
    if (v.needsReviewCount > 0) aggregate.variantsWithNeedsReview += 1;
    if (v.calibrationReady) aggregate.calibrationReady += 1;
    for (const g of v.gaps) {
      if (aggregate[g] !== undefined) {
        aggregate[g] += 1;
      }
    }
  }

  const prioritized = [...variants]
    .filter((v) => !v.error)
    .sort((a, b) => b.gapCount - a.gapCount);

  const flagships = prioritized.filter((v) => v.isFlagship);

  return {
    generatedAt: new Date().toISOString(),
    variantCount: variants.length,
    aggregate,
    observationFleet,
    flagships,
    variants: prioritized,
    enrichmentPriorities: [
      "verified editorial observations for flagship variants",
      "charging practicality (AC/DC times, usable kWh)",
      "trust calibration review where observations conflict with catalog",
      "Bharat NCAP when licensed",
      "brochure verification for expansion trims (BE 6, XEV 9e, eC3)",
    ],
  };
}

module.exports = { buildCoverageReport, analyzeVariant, FLAGSHIP_SLUGS };
