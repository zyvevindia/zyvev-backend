/**
 * Catalog intelligence blocks — safety, comfort, charging ecosystem,
 * ownership, psychology, decision helper, compare picks, commercial readiness.
 * Applied at build time; backward-compatible (all optional on read).
 */

/** @typedef {'oem_press'|'brochure'|'estimated'} IntelSource */

export function safetyBlock({
  bharatNcapStars = null,
  globalNcapStars = null,
  adultOccupantScore = null,
  childOccupantScore = null,
  airbags = 6,
  adasLevel = 0,
  adasFeatures = [],
  cameraSystems = [],
  parkingAssist = [],
  esc = true,
  hillHold = true,
} = {}) {
  return {
    bharatNcap: bharatNcapStars != null ? { stars: bharatNcapStars, year: null } : null,
    globalNcap: globalNcapStars != null ? { stars: globalNcapStars } : null,
    adultOccupantScore,
    childOccupantScore,
    airbags: { count: airbags, curtains: airbags >= 6 },
    adas: {
      level: adasLevel,
      features: adasFeatures,
    },
    cameraSystems,
    parkingAssist,
    stability: { esc, hillHold },
  };
}

export function comfortBlock({
  seatVentilation = false,
  seatHeating = false,
  rearSeatComfortScore = 70,
  bootPracticalityScore = 72,
  familySuitabilityScore = 74,
  cityManeuverabilityScore = 80,
  ingressEgressScore = 75,
  rearAcVents = true,
  panoramicRoof = false,
} = {}) {
  return {
    seatVentilation,
    seatHeating,
    rearSeatComfortScore,
    bootPracticalityScore,
    familySuitabilityScore,
    cityManeuverabilityScore,
    ingressEgressScore,
    rearAcVents,
    panoramicRoof,
  };
}

export function chargingEcosystemBlock({
  networkCompatibility = ["Tata Power", "ChargeZone", "Statiq", "Jio-bp pulse"],
  homeChargingKw = 7.2,
  homeChargingSupported = true,
  wallboxRecommended = true,
  fastChargeCurve = null,
  estimatedDcCostPerKwh = 18,
  estimatedAcCostPerKwh = 8,
} = {}) {
  return {
    networkCompatibility,
    homeCharging: {
      supported: homeChargingSupported,
      recommendedKw: homeChargingKw,
      wallboxRecommended,
    },
    fastChargeCurve: fastChargeCurve || {
      peakKw: null,
      time10to80Min: null,
      note: "Curve metadata pending OEM curve validation",
    },
    estimatedChargingCost: {
      dcPerKwhInr: estimatedDcCostPerKwh,
      acPerKwhInr: estimatedAcCostPerKwh,
      disclaimer: "Indicative India averages; varies by state DISCOM and CPO",
    },
  };
}

export function ownershipIntelligenceBlock({
  serviceCostPerKm = 0.45,
  annualServiceInr = null,
  batteryReplacementEstimateInr = null,
  insuranceAnnualRangeInr = { min: 28000, max: 52000 },
  resaleConfidenceScore = 78,
  resaleHorizonYears = 5,
} = {}) {
  return {
    estimatedServiceCostPerKm: serviceCostPerKm,
    annualServiceInr,
    batteryReplacementEstimateInr,
    insuranceAnnualRangeInr,
    resaleConfidenceScore,
    resaleHorizonYears,
  };
}

export function psychologyExtendedBlock(baseScores = {}, narrative = "") {
  const scores = {
    anxietyReduction: baseScores.anxietyReduction ?? 75,
    firstTimeEvFriendliness: baseScores.firstTimeEvFriendliness ?? baseScores.best_first_ev ?? 72,
    premiumPerception: baseScores.premiumPerception ?? baseScores.premium_feel ?? 65,
    enthusiastAppeal: baseScores.enthusiastAppeal ?? baseScores.tech_appeal ?? 68,
    chauffeurSuitability: baseScores.chauffeurSuitability ?? 60,
    womenDriverFriendliness: baseScores.womenDriverFriendliness ?? 78,
    seniorCitizenFriendliness: baseScores.seniorCitizenFriendliness ?? 74,
    ...baseScores,
  };
  return { scores, narrative };
}

export function decisionHelperBlock({
  whoShouldBuy = [],
  whoShouldAvoid = [],
  bestAlternativeSlug = null,
  upgradePathSlug = null,
  downgradePathSlug = null,
} = {}) {
  return {
    whoShouldBuy,
    whoShouldAvoid,
    bestAlternativeSlug,
    upgradePathSlug,
    downgradePathSlug,
  };
}

export function comparePicksBlock({
  strongestAdvantageLabel = null,
  biggestWeaknessLabel = null,
  bestValuePick = false,
  bestLongTermOwnershipPick = false,
} = {}) {
  return {
    strongestAdvantageLabel,
    biggestWeaknessLabel,
    bestValuePick,
    bestLongTermOwnershipPick,
  };
}

export function commercialReadinessBlock({
  subscriptionReady = false,
  batteryLeasingReady = false,
  fleetSuitabilityScore = 55,
  taxiCommercialScore = 48,
  notes = "Future commercial modules — not active in marketplace UI",
} = {}) {
  return {
    subscription: { ready: subscriptionReady, notes: null },
    batteryLeasing: { ready: batteryLeasingReady, notes: null },
    fleet: { suitabilityScore: fleetSuitabilityScore },
    taxiCommercial: { suitabilityScore: taxiCommercialScore },
    notes,
  };
}

export function personaFitBlock(scores = {}) {
  return {
    cityCommuter: scores.cityCommuter ?? scores.best_for_city ?? 75,
    familyEv: scores.familyEv ?? scores.best_for_family ?? 72,
    highwayTourer: scores.highwayTourer ?? 68,
    firstEv: scores.firstEv ?? scores.best_first_ev ?? 70,
    premiumEv: scores.premiumEv ?? scores.premium_feel ?? 62,
    valueEv: scores.valueEv ?? 75,
  };
}

/**
 * Derive intelligence from existing Tier-1 variant shape (non-destructive).
 */
export function enrichVariantIntelligence(variant) {
  if (!variant) return variant;

  const slug = variant.identity?.slug;
  const p = variant.practicality || {};
  const o = variant.ownership || {};
  const c = variant.charging || {};
  const psych = variant.psychology || {};
  const scores = psych.scores || {};
  const compare = variant.compare || {};
  const exShowroom = variant.pricing?.exShowroom ?? 0;
  const claimedKm = variant.range?.claimedKm ?? 0;

  const adasLevel = compare.featureMatrix?.adasLevel2 ? 2 : compare.featureMatrix?.adasLevel1 ? 1 : 0;

  const safety =
    variant.safety ||
    safetyBlock({
      airbags: exShowroom > 2000000 ? 6 : 6,
      adasLevel,
      adasFeatures: adasLevel >= 2 ? ["AEB", "lane assist"] : [],
      cameraSystems: ["rear camera", "parking sensors"],
      parkingAssist: adasLevel >= 2 ? ["reverse assist"] : ["rear sensors"],
    });

  const comfort =
    variant.comfort ||
    comfortBlock({
      rearSeatComfortScore: p.familyScore ?? 72,
      bootPracticalityScore: Math.min(95, 50 + (p.bootSpaceL || 300) / 8),
      familySuitabilityScore: p.familyScore ?? 74,
      cityManeuverabilityScore: p.cityUsabilityScore ?? 80,
      ingressEgressScore: variant.identity?.bodyType === "hatchback" ? 82 : 74,
    });

  const chargingEcosystem =
    variant.chargingEcosystem ||
    chargingEcosystemBlock({
      homeChargingKw: c.acKw ?? 7.2,
      fastChargeCurve: {
        peakKw: c.dcKw ?? null,
        time10to80Min: c.dcTime10to80Minutes ?? null,
        note: "Indicative; real curve varies by charger and temperature",
      },
    });

  const ownershipIntel =
    variant.ownershipIntelligence ||
    ownershipIntelligenceBlock({
      serviceCostPerKm: o.serviceCostPerKm ?? 0.45,
      batteryReplacementEstimateInr: null,
      insuranceAnnualRangeInr: {
        min: Math.round(exShowroom * 0.018),
        max: Math.round(exShowroom * 0.032),
      },
      resaleConfidenceScore: o.resaleConfidenceScore ?? 78,
    });

  const psychologyExtended =
    variant.psychologyExtended ||
    psychologyExtendedBlock(
      {
        anxietyReduction: Math.round(
          ((o.chargingNetworkScore ?? 70) + (o.resaleConfidenceScore ?? 75)) / 2
        ),
        firstTimeEvFriendliness: scores.best_first_ev,
        premiumPerception: scores.premium_feel,
        enthusiastAppeal: scores.tech_appeal,
        womenDriverFriendliness: Math.round(
          ((p.cityUsabilityScore ?? 75) + (scores.silent_comfort ?? 75)) / 2
        ),
        seniorCitizenFriendliness: Math.round(
          ((scores.best_for_family ?? 70) + (comfort.ingressEgressScore ?? 74)) / 2
        ),
      },
      psych.narrative
    );

  const strongest =
    compare.strongestAdvantages?.[0]?.label || null;
  const weakest =
    compare.weakestAreas?.[0]?.label || null;

  const decision =
    variant.decision ||
    decisionHelperBlock({
      whoShouldBuy: deriveWhoShouldBuy(variant),
      whoShouldAvoid: deriveWhoShouldAvoid(variant),
      bestAlternativeSlug: compare.segmentRivalSlugs?.[0] || null,
      upgradePathSlug: deriveUpgradeSlug(slug, variant),
      downgradePathSlug: deriveDowngradeSlug(slug, variant),
    });

  const comparePicks =
    variant.compare?.picks ||
    comparePicksBlock({
      strongestAdvantageLabel: strongest,
      biggestWeaknessLabel: weakest,
      bestValuePick: (compare.valueScore ?? 0) >= 84,
      bestLongTermOwnershipPick:
        (o.resaleConfidenceScore ?? 0) >= 82 &&
        (o.warrantyBatteryYears ?? 0) >= 8,
    });

  const personaFit =
    variant.personaFit ||
    personaFitBlock({
      cityCommuter: scores.best_for_city ?? p.cityUsabilityScore,
      familyEv: scores.best_for_family ?? p.familyScore,
      highwayTourer: p.highwayComfortScore ?? Math.min(90, claimedKm / 5),
      firstEv: scores.best_first_ev,
      premiumEv: scores.premium_feel,
      valueEv: compare.valueScore,
    });

  const commercial =
    variant.commercial ||
    commercialReadinessBlock({
      fleetSuitabilityScore: p.familyScore ?? 55,
      taxiCommercialScore:
        variant.identity?.segment === "micro-suv" ? 42 : 50,
    });

  const ownershipPracticality = buildOwnershipPracticality(variant, c, p, claimedKm);

  const seo = enrichSeoChargingFaq(variant.seo, c, claimedKm);

  return {
    ...variant,
    safety,
    comfort,
    chargingEcosystem,
    ownershipIntelligence: ownershipIntel,
    ownershipPracticality,
    psychologyExtended,
    decision,
    personaFit,
    commercial,
    seo,
    compare: {
      ...compare,
      picks: comparePicks,
    },
    psychology: {
      ...psych,
      scores: {
        ...scores,
        ...psychologyExtended.scores,
      },
    },
  };
}

function buildOwnershipPracticality(variant, charging, practicality, claimedKm) {
  const acKw = charging.acKw ?? 0;
  const dcMin = charging.dcTime10to80Minutes;
  const segment = variant.identity?.segment;
  const body = variant.identity?.bodyType;

  const apartmentChargingSuitability =
    acKw >= 7.2 && claimedKm >= 250 && segment !== "luxury-suv"
      ? Math.min(92, 68 + acKw * 2)
      : acKw >= 3.3
        ? 72
        : 55;

  const highwayUsability =
    claimedKm >= 450 && dcMin && dcMin <= 55
      ? 85
      : claimedKm >= 350 && dcMin
        ? 72
        : claimedKm >= 280
          ? 62
          : 48;

  const familyPracticality = practicality.familyScore ?? 70;
  const luggagePracticality = Math.min(
    95,
    50 + (practicality.bootSpaceL || 300) / 7
  );
  const cityDrivingPracticality = practicality.cityUsabilityScore ?? 75;
  const ingressEgressPracticality =
    body === "hatchback" ? 84 : body === "micro-suv" ? 78 : 72;
  const rearSeatPracticality = Math.round(
    (familyPracticality + ingressEgressPracticality) / 2
  );

  return {
    apartmentChargingSuitability,
    highwayUsability,
    familyPracticality,
    luggagePracticality,
    cityDrivingPracticality,
    ingressEgressPracticality,
    rearSeatPracticality,
    ownershipConfidenceIndicator: Math.round(
      ((variant.ownership?.resaleConfidenceScore ?? 75) +
        (variant.ownership?.chargingNetworkScore ?? 70)) /
        2
    ),
    chargingAnxietyReductionNotes: [
      "Plan weekly top-ups on AC if daily driving stays under ~60 km.",
      dcMin
        ? `Use DC stops for planned highway legs — not as a daily fuel-station substitute.`
        : "No DC fast charging on this trim — home/workplace AC is the primary refuel path.",
    ],
    methodology:
      "EVSavari ownership practicality model — editorial scores, not OEM guarantees.",
  };
}

function enrichSeoChargingFaq(seo, charging, claimedKm) {
  if (!seo) return seo;
  if (seo.chargingFaq?.length) return seo;

  const faq = [];
  if (charging.acKw && charging.acTime0to100Hours) {
    faq.push({
      q: `How long does AC charging take?`,
      a: `Around ${charging.acTime0to100Hours} hours (0–100%) at ${charging.acKw} kW AC — depends on SoC window and temperature.`,
    });
  }
  if (charging.dcKw && charging.dcTime10to80Minutes) {
    faq.push({
      q: "DC fast charging time?",
      a: `Indicative ${charging.dcTime10to80Minutes} minutes (10–80%) when the charger delivers near ${charging.dcKw} kW peak.`,
    });
  }
  if (claimedKm) {
    faq.push({
      q: "First-time EV buyer — is home charging enough?",
      a: `For typical city use below ${claimedKm} km ARAI, overnight AC works for many buyers — confirm society/workplace access first.`,
    });
  }
  return { ...seo, chargingFaq: faq };
}

function deriveWhoShouldBuy(v) {
  const lines = [];
  const km = v.range?.claimedKm ?? 0;
  const city = v.practicality?.cityUsabilityScore ?? 0;
  if (city >= 80) {
    lines.push("Daily city commuters who want low running cost and easy parking");
  }
  if (km >= 400) {
    lines.push("Buyers with regular highway use who plan DC fast-charging on routes");
  }
  if ((v.psychology?.scores?.best_first_ev ?? 0) >= 82) {
    lines.push("First-time EV buyers who value warranty clarity and service reach");
  }
  if ((v.practicality?.familyScore ?? 0) >= 78) {
    lines.push("Small families needing rear space and predictable ownership costs");
  }
  if (lines.length === 0) {
    lines.push("Buyers whose driving mix matches this variant's certified range band");
  }
  return lines.slice(0, 4);
}

function deriveWhoShouldAvoid(v) {
  const lines = [];
  const km = v.range?.claimedKm ?? 0;
  if (km < 350) {
    lines.push("Frequent inter-city drivers without home or workplace charging access");
  }
  if ((v.practicality?.highwayComfortScore ?? 100) < 70) {
    lines.push("High-speed highway specialists who prioritize long-range touring comfort");
  }
  if ((v.psychology?.scores?.premium_feel ?? 0) < 65) {
    lines.push("Luxury-first buyers expecting top-tier cabin refinement and ADAS");
  }
  if (lines.length === 0) {
    lines.push("Buyers who need maximum third-row space or heavy towing");
  }
  return lines.slice(0, 3);
}

const UPGRADE_MAP = {
  "tata-nexon-ev-creative-plus": "tata-nexon-ev-empowered-lr",
  "tata-punch-ev-smart-plus": "tata-punch-ev-empowered-lr",
  "tata-tiago-ev-xt": "tata-tiago-ev-xz-plus",
  "tata-curvv-ev-empowered": "tata-curvv-ev-empowered-lr",
  "mg-zs-ev-excite": "mg-zs-ev-exclusive-plus",
  "mg-comet-ev-play": "mg-comet-ev-plush-plus",
  "mahindra-xuv400-ec-pro": "mahindra-xuv400-el-pro",
  "byd-atto-3-dynamic": "byd-atto-3-superior",
};

const DOWNGRADE_MAP = Object.fromEntries(
  Object.entries(UPGRADE_MAP).map(([k, v]) => [v, k])
);

function deriveUpgradeSlug(slug, v) {
  if (UPGRADE_MAP[slug]) return UPGRADE_MAP[slug];
  const rival = v.compare?.segmentRivalSlugs?.find((s) => s !== slug);
  return rival || null;
}

function deriveDowngradeSlug(slug) {
  return DOWNGRADE_MAP[slug] || null;
}
