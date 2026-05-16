/**
 * India-specific charging lifestyle practicality (deterministic).
 */

const { createFieldProvenance, SOURCE_TYPES, CONFIDENCE_LEVELS, VERIFICATION_STATUSES } = require("../catalog/intelligenceMetadata");

const DERIVED_META = createFieldProvenance({
  sourceType: SOURCE_TYPES.DERIVED_LOGIC,
  confidenceLevel: CONFIDENCE_LEVELS.MEDIUM,
  verificationStatus: VERIFICATION_STATUSES.PENDING_REVIEW,
  verificationMethod: "evsavari_charging_reality_v1",
}).metadata;

function stressLevel(dcMin, claimedKm, acKw) {
  if (claimedKm >= 400 && dcMin && dcMin <= 50) return "low";
  if (claimedKm >= 300 && acKw >= 7) return "medium";
  if (claimedKm < 280) return "high";
  return "medium";
}

function societyRisk(bodyType, segment) {
  if (segment === "micro-suv" || bodyType === "hatchback") {
    return "medium";
  }
  if (segment === "compact-suv") return "medium";
  return "low";
}

function buildChargingReality(variant) {
  const c = variant.charging || {};
  const claimed = variant.range?.claimedKm ?? 0;
  const acKw = c.acKw ?? 0;
  const dcMin = c.dcTime10to80Minutes;
  const body = variant.identity?.bodyType;
  const segment = variant.identity?.segment;

  const overnightFriendly = acKw >= 3.3;
  const apartmentFriendly =
    overnightFriendly &&
    acKw >= 7.2 &&
    !["micro-suv"].includes(segment) &&
    claimed >= 250;
  const officeChargingFriendly =
    (variant.practicality?.cityUsabilityScore ?? 0) >= 75;

  const roadTripConfidence =
    claimed >= 420 && dcMin && dcMin <= 55
      ? "high"
      : claimed >= 320 && dcMin
        ? "medium"
        : "low";

  return {
    overnightFriendly,
    apartmentFriendly,
    officeChargingFriendly,
    societyApprovalRisk: societyRisk(body, segment),
    chargingStressLevel: stressLevel(dcMin, claimed, acKw),
    roadTripConfidence,
    indiaNotes: [
      "RWAs may restrict home charger installation — confirm society bylaws before purchase.",
      "Office charging depends on employer policy; not assumed in range planning.",
      "Highway trips need pre-planned CCS2 stops on your route.",
    ],
    metadata: {
      ...DERIVED_META,
      interpretation:
        "Lifestyle practicality model for Indian ownership — not a guarantee of charger access.",
    },
  };
}

module.exports = { buildChargingReality };
