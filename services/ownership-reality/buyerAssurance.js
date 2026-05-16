/**
 * Ownership confidence scores (interpretation layer).
 */

const { createFieldProvenance, SOURCE_TYPES, CONFIDENCE_LEVELS, VERIFICATION_STATUSES } = require("../catalog/intelligenceMetadata");

const DERIVED_META = createFieldProvenance({
  sourceType: SOURCE_TYPES.DERIVED_LOGIC,
  confidenceLevel: CONFIDENCE_LEVELS.MEDIUM,
  verificationStatus: VERIFICATION_STATUSES.PENDING_REVIEW,
  verificationMethod: "evsavari_buyer_assurance_v1",
}).metadata;

function scoreBlock(value, label) {
  return {
    score: Math.max(0, Math.min(100, Math.round(value))),
    label,
    disclaimer: "Editorial confidence score — not a warranty or guarantee.",
  };
}

function buildBuyerAssurance(variant) {
  const o = variant.ownership || {};
  const psych = variant.psychology?.scores || {};
  const pe = variant.psychologyExtended?.scores || {};
  const p = variant.practicality || {};
  const charging = variant.chargingReality || {};

  const firstEv =
    psych.best_first_ev ??
    pe.firstTimeEvFriendliness ??
    70;

  const servicePredictability = Math.round(
    ((o.resaleConfidenceScore ?? 75) +
      (variant.governance?.dataQualityScore ?? 85)) /
      2
  );

  const batteryConfidence = Math.round(
    ((o.warrantyBatteryYears ?? 8) / 8) * 40 +
      (o.resaleConfidenceScore ?? 75) * 0.4 +
      (pe.anxietyReduction ?? 70) * 0.2
  );

  const maintenanceStress = Math.round(
    100 - (o.serviceCostPerKm ?? 0.45) * 80
  );

  const familyConfidence = p.familyScore ?? psych.best_for_family ?? 72;

  const dailyUseConfidence = Math.round(
    ((p.cityUsabilityScore ?? 75) +
      (charging.chargingStressLevel === "low"
        ? 85
        : charging.chargingStressLevel === "medium"
          ? 70
          : 55)) /
      2
  );

  return {
    firstEVFriendly: scoreBlock(
      firstEv,
      "First-time EV readiness"
    ),
    servicePredictability: scoreBlock(
      servicePredictability,
      "Service & support predictability"
    ),
    batteryConfidence: scoreBlock(
      batteryConfidence,
      "Battery peace-of-mind"
    ),
    maintenanceStress: scoreBlock(
      maintenanceStress,
      "Maintenance stress (higher = lower stress)"
    ),
    familyConfidence: scoreBlock(
      familyConfidence,
      "Family daily-use confidence"
    ),
    dailyUseConfidence: scoreBlock(
      dailyUseConfidence,
      "Everyday usability confidence"
    ),
    metadata: {
      ...DERIVED_META,
      interpretation:
        "Psychological ownership confidence model — pair with specs and real-world range bands.",
    },
  };
}

module.exports = { buildBuyerAssurance };
