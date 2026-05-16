/**
 * Transparent ownership tradeoffs — strengths and compromises stated openly.
 */

const { sanitizeEditorialText } = require("../editorial-intelligence/toneRules");
const { createFieldProvenance, SOURCE_TYPES, CONFIDENCE_LEVELS, VERIFICATION_STATUSES } = require("../catalog/intelligenceMetadata");

const DERIVED_META = createFieldProvenance({
  sourceType: SOURCE_TYPES.EDITORIAL_ESTIMATE,
  confidenceLevel: CONFIDENCE_LEVELS.MEDIUM,
  verificationStatus: VERIFICATION_STATUSES.PENDING_REVIEW,
  verificationMethod: "evsavari_tradeoff_v1",
}).metadata;

function buildOwnershipTradeoffs(variant) {
  const compare = variant.compare || {};
  const decision = variant.decision || {};
  const range = variant.rangeReality;
  const charging = variant.chargingReality || {};

  const primaryStrength = sanitizeEditorialText(
    compare.strongestAdvantages?.[0]?.label ||
      compare.picks?.strongestAdvantageLabel ||
      "Practical EV positioning for its price band"
  );

  const primaryCompromise = sanitizeEditorialText(
    compare.weakestAreas?.[0]?.label ||
      compare.picks?.biggestWeaknessLabel ||
      "Not ideal for every driving pattern — see less suitable uses below"
  );

  const idealParts = [];
  if ((variant.practicality?.cityUsabilityScore ?? 0) >= 78) {
    idealParts.push("daily city commuting with predictable home or office charging");
  }
  if ((variant.range?.claimedKm ?? 0) >= 400) {
    idealParts.push("planned highway use with mapped DC stops");
  }
  if ((variant.psychology?.scores?.best_first_ev ?? 0) >= 80) {
    idealParts.push("first EV purchase with warranty clarity");
  }
  const idealUsagePattern = sanitizeEditorialText(
    idealParts.length
      ? idealParts.join("; ")
      : "Buyers whose weekly driving fits this variant's real-world range bands"
  );

  const lessSuitableFor = [
    ...(decision.whoShouldAvoid || []),
  ];

  if (charging.roadTripConfidence === "low") {
    lessSuitableFor.push(
      "Frequent unplanned long highway travel without charging backup"
    );
  }
  if (charging.societyApprovalRisk === "high") {
    lessSuitableFor.push(
      "Apartment buyers without confirmed society charger approval"
    );
  }
  if (range?.highwayKm?.max && range.highwayKm.max < 220) {
    lessSuitableFor.push(
      "High-speed highway touring as a primary use case"
    );
  }

  const uniqueLess = [...new Set(lessSuitableFor.map(sanitizeEditorialText))].slice(
    0,
    4
  );

  return {
    primaryStrength,
    primaryCompromise,
    idealUsagePattern,
    lessSuitableFor: uniqueLess,
    metadata: {
      ...DERIVED_META,
      interpretation:
        "Transparent tradeoff summary — weaknesses are intentional for buyer trust.",
    },
  };
}

module.exports = { buildOwnershipTradeoffs };
