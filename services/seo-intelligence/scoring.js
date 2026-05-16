/**
 * Internal recommendation scoring — explainable, weighted, not shown as public EV scores.
 */

function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function weightedAverage(pairs) {
  let sum = 0;
  let w = 0;
  for (const [value, weight] of pairs) {
    if (value == null || Number.isNaN(value)) continue;
    sum += value * weight;
    w += weight;
  }
  return w > 0 ? sum / w : null;
}

/**
 * @param {object} variant — Tier-1 variant record (post-governance)
 * @returns {import('./pageTypes').RecommendationScoreMap}
 */
function computeRecommendationScores(variant) {
  const persona = variant.personaFit || {};
  const comfort = variant.comfort || {};
  const psych =
    variant.psychologyExtended?.scores ||
    variant.psychology?.scores ||
    {};
  const ownership = variant.ownershipIntelligence || {};
  const charging = variant.chargingEcosystem || {};
  const p = variant.practicality || {};
  const exShowroom = variant.pricing?.exShowroom ?? 0;
  const realMax = variant.range?.realWorldKm?.max ?? variant.range?.claimedKm ?? 0;
  const realMin = variant.range?.realWorldKm?.min ?? 0;
  const servicePerKm = ownership.estimatedServiceCostPerKm ?? 0.5;
  const homeKw = charging.homeCharging?.recommendedKw ?? 0;
  const homeSupported = charging.homeCharging?.supported !== false;

  const cityDriving = clamp(
    weightedAverage([
      [persona.cityCommuter, 0.45],
      [comfort.cityManeuverabilityScore, 0.3],
      [p.cityUsabilityScore, 0.25],
    ]) ?? 0
  );

  const familyUsage = clamp(
    weightedAverage([
      [persona.familyEv, 0.4],
      [comfort.familySuitabilityScore, 0.35],
      [comfort.bootPracticalityScore, 0.25],
    ]) ?? 0
  );

  const cp = variant.chargingPracticality || {};
  const oc = variant.ownershipConfidence || {};
  const op = variant.ownershipPracticality || {};
  const rr = variant.rangeRealityExpanded || {};
  const cr = variant.chargingReality || {};

  const apartmentLevelScore =
    cp.apartmentSuitability === "strong"
      ? 88
      : cp.apartmentSuitability === "moderate"
        ? 72
        : cp.apartmentSuitability === "limited"
          ? 48
          : null;

  const apartmentCharging = clamp(
    weightedAverage([
      [apartmentLevelScore, 0.4],
      [op.apartmentChargingSuitability, 0.2],
      [homeSupported ? 82 : 45, 0.2],
      [psych.anxietyReduction, 0.15],
      [charging.homeCharging?.wallboxRecommended ? 78 : 65, 0.05],
    ]) ?? 0
  );

  const firstTimeLevelScore =
    oc.firstTimeEvFriendliness === "strong"
      ? 90
      : oc.firstTimeEvFriendliness === "moderate"
        ? 74
        : 55;

  const firstTimeBuyer = clamp(
    weightedAverage([
      [firstTimeLevelScore, 0.35],
      [persona.firstEv, 0.3],
      [psych.firstTimeEvFriendliness, 0.2],
      [psych.anxietyReduction, 0.15],
    ]) ?? 0
  );

  const budgetOwnership = clamp(
    exShowroom > 0
      ? 100 - Math.min(95, (exShowroom / 2500000) * 90)
      : persona.valueEv ?? 50
  );

  const officeCommute = clamp(
    weightedAverage([
      [persona.cityCommuter, 0.4],
      [realMax > 0 ? Math.min(100, (realMax / 500) * 100) : null, 0.25],
      [100 - servicePerKm * 80, 0.2],
      [comfort.ingressEgressScore, 0.15],
    ]) ?? 0
  );

  const homeCharging = clamp(
    weightedAverage([
      [homeSupported ? 75 + Math.min(15, homeKw) : 40, 0.5],
      [variant.charging?.acKw, 0.25],
      [psych.anxietyReduction, 0.25],
    ]) ?? 0
  );

  const dailyCommute = clamp(
    weightedAverage([
      [persona.cityCommuter, 0.35],
      [realMin > 0 ? Math.min(100, (realMin / 400) * 100) : null, 0.35],
      [persona.valueEv, 0.3],
    ]) ?? 0
  );

  const lowMaintenance = clamp(
    weightedAverage([
      [100 - servicePerKm * 100, 0.45],
      [ownership.resaleConfidenceScore, 0.25],
      [persona.valueEv, 0.3],
    ]) ?? 0
  );

  const compareValue = clamp(persona.valueEv ?? 70);

  const highwayBand = variant.scenarioCompare?.highwayConfidence?.alignmentScore;
  const highwayFromRange =
    rr?.confidenceBands?.highway === "strong"
      ? 88
      : rr?.confidenceBands?.highway === "moderate"
        ? 72
        : rr?.confidenceBands?.highway === "limited"
          ? 52
          : null;
  const highwayDriving = clamp(
    weightedAverage([
      [highwayBand, 0.45],
      [highwayFromRange, 0.3],
      [variant.practicality?.highwayComfortScore, 0.25],
    ]) ?? 0
  );

  const stressLevel = cp.chargingAnxietyLevel || cr.chargingStressLevel || "medium";
  const lowChargingStress = clamp(
    stressLevel === "low"
      ? 92
      : stressLevel === "medium"
        ? 68
        : stressLevel === "high"
          ? 42
          : weightedAverage([
              [psych.anxietyReduction, 0.5],
              [apartmentLevelScore, 0.3],
              [homeSupported ? 75 : 45, 0.2],
            ]) ?? 55
  );

  return {
    cityDriving,
    familyUsage,
    apartmentCharging,
    firstTimeBuyer,
    budgetOwnership,
    officeCommute,
    homeCharging,
    dailyCommute,
    lowMaintenance,
    compareValue,
    highwayDriving,
    lowChargingStress,
    _meta: {
      exShowroom,
      servicePerKm,
      homeChargingSupported: homeSupported,
    },
  };
}

module.exports = {
  computeRecommendationScores,
  clamp,
  weightedAverage,
};
