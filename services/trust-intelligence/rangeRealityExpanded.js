/**
 * Editorial range realism — practical language, no fabricated numeric claims.
 */

const { createFieldProvenance, SOURCE_TYPES, CONFIDENCE_LEVELS, VERIFICATION_STATUSES } = require("../catalog/intelligenceMetadata");

const META = createFieldProvenance({
  sourceType: SOURCE_TYPES.EDITORIAL_ESTIMATE,
  confidenceLevel: CONFIDENCE_LEVELS.MEDIUM,
  verificationStatus: VERIFICATION_STATUSES.PENDING_REVIEW,
  verificationMethod: "evsavari_range_reality_expanded_v1",
}).metadata;

function bandLevel(score) {
  if (score >= 78) return "strong";
  if (score >= 58) return "moderate";
  return "limited";
}

function buildRangeRealityExpanded(variant) {
  const rr = variant.rangeReality;
  const claimed = variant.range?.claimedKm ?? rr?.claimedKm ?? 0;
  const cityScore = variant.practicality?.cityUsabilityScore ?? 75;
  const highwayScore = variant.practicality?.highwayComfortScore ?? 65;
  const segment = variant.identity?.segment;

  const cityDriving = bandLevel(cityScore);
  const highway = bandLevel(
    highwayScore + (claimed >= 420 ? 8 : claimed >= 320 ? 0 : -12)
  );
  const acImpact =
    claimed >= 400 ? "moderate" : claimed >= 280 ? "moderate" : "noticeable";
  const traffic =
    segment === "hatchback" || segment === "micro-suv"
      ? "strong"
      : "moderate";
  const drivingStyle = "moderate";
  const seasonal = "moderate";

  const summaries = [];

  if (cityDriving === "strong") {
    summaries.push(
      "Excellent for dense city commuting when daily distance stays within conservative planning bands."
    );
  } else if (cityDriving === "moderate") {
    summaries.push(
      "Works for city commuting with mindful daily distance planning — not a long-commute specialist."
    );
  } else {
    summaries.push(
      "City use is workable for short hops; frequent long urban days need charging discipline."
    );
  }

  if (highway === "strong") {
    summaries.push(
      "Highway range confidence is relatively strong for planned inter-city legs with DC stops."
    );
  } else if (highway === "moderate") {
    summaries.push(
      "Highway range confidence reduces above steady 90–100 km/h cruising — plan stops on longer routes."
    );
  } else {
    summaries.push(
      "Highway touring needs careful route planning — treat ARAI claim as an upper planning ceiling only."
    );
  }

  if (acImpact === "moderate") {
    summaries.push("AC usage has moderate range impact in Indian summers.");
  } else {
    summaries.push("AC usage can noticeably reduce usable range in peak summer heat.");
  }

  return {
    confidenceBands: {
      cityDriving,
      highway,
      acImpact,
      traffic,
      drivingStyle,
      seasonal,
    },
    editorialSummaries: summaries,
    planningNote:
      rr?.confidenceBand?.neverExceedsClaim !== false
        ? "Use EVSavari planning bands below ARAI claim — not certified real-world guarantees."
        : "Verify range bands against owner reports over time.",
    referencesExistingBands: Boolean(rr?.citySummerKm),
    metadata: {
      ...META,
      interpretation:
        "Editorial confidence language derived from existing range bands and practicality scores — no new km figures invented here.",
    },
  };
}

module.exports = { buildRangeRealityExpanded };
