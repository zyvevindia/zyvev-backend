/**
 * Charging practicality — lifestyle confidence for Indian EV ownership.
 */

const { createFieldProvenance, SOURCE_TYPES, CONFIDENCE_LEVELS, VERIFICATION_STATUSES } = require("../catalog/intelligenceMetadata");

const META = createFieldProvenance({
  sourceType: SOURCE_TYPES.EDITORIAL_ESTIMATE,
  confidenceLevel: CONFIDENCE_LEVELS.MEDIUM,
  verificationStatus: VERIFICATION_STATUSES.PENDING_REVIEW,
  verificationMethod: "evsavari_charging_practicality_v1",
}).metadata;

function levelFromStress(stress) {
  if (stress === "low") return "strong";
  if (stress === "high") return "limited";
  return "moderate";
}

function buildChargingPracticality(variant) {
  const cr = variant.chargingReality || {};
  const c = variant.charging || {};
  const dcKw = c.dcKw ?? 0;
  const dcMin = c.dcTime10to80Minutes;
  const acKw = c.acKw ?? 0;

  const apartmentSuitability = cr.apartmentFriendly
    ? "strong"
    : acKw >= 3.3
      ? "moderate"
      : "limited";

  const officePracticality = cr.officeChargingFriendly ? "strong" : "moderate";
  const overnightFriendliness = cr.overnightFriendly ? "strong" : "limited";
  const fastChargePracticality =
    dcKw >= 100 && dcMin && dcMin <= 35
      ? "strong"
      : dcKw > 0 && dcMin
        ? "moderate"
        : dcKw === 0
          ? "not_applicable"
          : "limited";

  const cityChargingFriendliness =
    (variant.practicality?.cityUsabilityScore ?? 0) >= 80
      ? "strong"
      : "moderate";

  const chargingAnxietyLevel = cr.chargingStressLevel || "medium";
  const networkDependency =
    cr.roadTripConfidence === "high"
      ? "moderate"
      : cr.roadTripConfidence === "low"
        ? "high"
        : "moderate";

  const editorialNotes = [];

  if (overnightFriendliness === "strong") {
    editorialNotes.push("Works well for overnight home or dedicated parking charging.");
  }
  if (apartmentSuitability === "strong" || apartmentSuitability === "moderate") {
    editorialNotes.push(
      apartmentSuitability === "strong"
        ? "Reasonably suited for apartment owners with reliable parking access."
        : "Better suited for owners who can confirm society/workplace charging access before purchase."
    );
  } else {
    editorialNotes.push(
      "Home or society charging access is important — verify RWA permissions early."
    );
  }
  if (fastChargePracticality === "strong" || fastChargePracticality === "moderate") {
    editorialNotes.push(
      dcMin
        ? `Fast-charging sessions are practical for planned highway legs (~${dcMin} min 10–80% indicative).`
        : "DC fast charging helps planned highway use when chargers align with your route."
    );
  } else if (dcKw === 0) {
    editorialNotes.push(
      "No DC fast charging — daily refuelling is AC-only; highway touring is not the primary use case."
    );
  } else {
    editorialNotes.push(
      "Frequent highway charging may require extra planning versus long-range rivals."
    );
  }

  if (networkDependency === "high") {
    editorialNotes.push(
      "Charging-network dependency is higher — map CCS2 coverage on your regular routes."
    );
  }

  return {
    apartmentSuitability,
    officePracticality,
    overnightFriendliness,
    fastChargePracticality,
    cityChargingFriendliness,
    chargingAnxietyLevel,
    networkDependency,
    editorialNotes,
    metadata: {
      ...META,
      interpretation:
        "Editorial charging lifestyle guidance — not a guarantee of charger availability.",
    },
  };
}

module.exports = { buildChargingPracticality };
