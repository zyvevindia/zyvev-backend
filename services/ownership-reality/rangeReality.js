/**
 * Conservative real-world range estimates — never exceed ARAI claim.
 */

const { createFieldProvenance, SOURCE_TYPES, CONFIDENCE_LEVELS, VERIFICATION_STATUSES } = require("../catalog/intelligenceMetadata");

const DERIVED_META = createFieldProvenance({
  sourceType: SOURCE_TYPES.DERIVED_LOGIC,
  confidenceLevel: CONFIDENCE_LEVELS.MEDIUM,
  verificationStatus: VERIFICATION_STATUSES.PENDING_REVIEW,
  verificationMethod: "evsavari_range_reality_v1",
}).metadata;

function clampKm(value, claimed) {
  const v = Math.round(value);
  return Math.max(0, Math.min(v, claimed));
}

function band(min, max, note) {
  return {
    min: Math.min(min, max),
    max: Math.max(min, max),
    note,
    disclaimer:
      "Editorial estimate for planning — not ARAI certified. Actual range varies with driving style, traffic, and temperature.",
  };
}

/**
 * @param {object} variant
 */
function buildRangeReality(variant) {
  const claimed = variant.range?.claimedKm ?? 0;
  if (!claimed) {
    return null;
  }

  const existing = variant.range?.realWorldKm;
  const baseMin =
    existing?.min ?? Math.round(claimed * 0.68);
  const baseMax =
    existing?.max ?? Math.round(claimed * 0.82);

  const citySummer = band(
    clampKm(baseMin, claimed),
    clampKm(baseMax, claimed),
    "Mixed city traffic, moderate AC use"
  );

  const cityWinter = band(
    clampKm(baseMin * 0.88, claimed),
    clampKm(baseMax * 0.9, claimed),
    "Cooler ambient temperatures; conservative AC/heating impact"
  );

  const highway = band(
    clampKm(claimed * 0.52, claimed),
    clampKm(claimed * 0.68, claimed),
    "Steady highway speeds 80–100 km/h; fewer regenerative gains"
  );

  const withAC = band(
    clampKm(citySummer.min * 0.9, claimed),
    clampKm(citySummer.max * 0.92, claimed),
    "AC on throughout trip"
  );

  const fullLoad = band(
    clampKm(citySummer.min * 0.88, claimed),
    clampKm(citySummer.max * 0.9, claimed),
    "Passengers + luggage"
  );

  const ecoDriving = band(
    clampKm(baseMax * 0.95, claimed),
    clampKm(Math.min(claimed, baseMax * 1.02), claimed),
    "Gentle driving; still below certified claim"
  );

  return {
    citySummerKm: citySummer,
    cityWinterKm: cityWinter,
    highwayKm: highway,
    withACKm: withAC,
    fullLoadKm: fullLoad,
    ecoDrivingKm: ecoDriving,
    claimedKm: claimed,
    confidenceBand: {
      level: "medium",
      methodology: "evsavari_conservative_derived_v1",
      neverExceedsClaim: true,
    },
    metadata: {
      ...DERIVED_META,
      interpretation:
        "Planning bands derived from ARAI claim and mixed-use heuristics — verify with owner reports over time.",
    },
  };
}

module.exports = { buildRangeReality };
