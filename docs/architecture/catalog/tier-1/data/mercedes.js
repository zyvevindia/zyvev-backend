import {
  mediaPaths,
  flag,
  governance,
  verification,
  realWorldBand,
  seoBlock,
  compareBlock,
  chargingBlock,
  chargingFaqFromSpecs,
} from "./_helpers.js";

const BRAND = "Mercedes-Benz";

export const mercedesVariants = [eqa250Plus(), eqb250Plus()];

function eqa250Plus() {
  const slug = "mercedes-eqa-250-plus";
  const claimedKm = 459;
  const exShowroom = 4990000;
  const flags = [
    flag("pricing.exShowroom", "needs_review", "Confirm EQA 250+ India pricing"),
    flag("range.claimedKm", "needs_review", "Verify ARAI certification"),
  ];
  return eqBase({
    slug,
    model: "EQA",
    variantName: "250+",
    exShowroom,
    claimedKm,
    capacityKwh: 70.5,
    powerKw: 140,
    bodyType: "suv",
    flags,
    score: 88,
    rivals: ["bmw-ix1-xdrive30", "volvo-ex40-single-motor", "kia-ev6-gt-line"],
    narrative:
      "Entry Mercedes EQ crossover for luxury-first buyers who want compact footprint with star badge assurance.",
  });
}

function eqb250Plus() {
  const slug = "mercedes-eqb-250-plus";
  const claimedKm = 423;
  const exShowroom = 5490000;
  const flags = [
    flag("pricing.exShowroom", "needs_review", "Confirm EQB 250+ pricing"),
    flag("range.claimedKm", "needs_review", "Verify ARAI range"),
  ];
  return eqBase({
    slug,
    model: "EQB",
    variantName: "250+",
    exShowroom,
    claimedKm,
    capacityKwh: 70.5,
    powerKw: 140,
    bodyType: "suv",
    flags,
    score: 89,
    rivals: ["bmw-ix1-xdrive30", "volvo-ex40-twin-motor", "mahindra-xev-9e-pack-two"],
    narrative:
      "Boxy EQB for families who want optional third-row flexibility in a luxury EV package.",
    seatingCapacity: 7,
    bootSpaceL: 495,
    familyScore: 86,
  });
}

function eqBase(opts) {
  const {
    slug,
    model,
    variantName,
    exShowroom,
    claimedKm,
    capacityKwh,
    powerKw,
    bodyType,
    flags,
    score,
    rivals,
    narrative,
    seatingCapacity = 5,
    bootSpaceL = 340,
    familyScore = 80,
  } = opts;
  const charging = chargingBlock({
    acKw: 11,
    acTime0to100Hours: 7.5,
    dcKw: 100,
    dcTime10to80Minutes: 32,
  });
  return {
    identity: {
      brandSlug: "mercedes",
      modelSlug: model.toLowerCase(),
      variantName,
      slug,
      bodyType,
      segment: "luxury-suv",
      launchStatus: "on-sale",
      modelYear: 2024,
      fuelType: "electric",
    },
    pricing: { exShowroom, priceLastUpdated: "2026-05-15T00:00:00.000Z" },
    battery: { capacityKwh, chemistry: "NMC" },
    range: {
      claimedKm,
      claimedStandard: "ARAI",
      realWorldKm: realWorldBand(claimedKm, 0.6, 0.74),
    },
    charging,
    performance: {
      powerKw,
      driveType: "FWD",
      acceleration0to100: 8.6,
    },
    practicality: {
      bootSpaceL,
      familyScore,
      highwayComfortScore: 86,
      cityUsabilityScore: 72,
      seatingCapacity,
    },
    ownership: {
      warrantyVehicleYears: 3,
      warrantyBatteryYears: 8,
      warrantyBatteryKm: 160000,
      chargingNetworkScore: 76,
      resaleConfidenceScore: 82,
      serviceCostPerKm: 0.65,
    },
    psychology: {
      tags: ["premium_feel"],
      scores: { premium_feel: 95, tech_appeal: 88, best_for_family: familyScore - 8 },
      narrative,
    },
    availability: {
      availableCities: ["delhi", "mumbai", "bangalore"],
      waitingPeriodWeeks: 5,
      testDriveAvailable: true,
    },
    compare: compareBlock({
      rivalSlugs: rivals,
      valueScore: 72,
      advantages: ["Mercedes ownership prestige", "Refined highway manners"],
      weaknesses: ["Running costs at luxury tier", "DC speeds below 800V rivals"],
    }),
    seo: {
      ...seoBlock({
        slug,
        brand: BRAND,
        model,
        variant: variantName,
        exShowroom,
        claimedKm,
      }),
      pros: ["Luxury cabin", "Strong brand-led resale narrative"],
      cons: ["Verify final on-road and charging equipment packages"],
      expertSummary: narrative,
      faq: [],
      chargingFaq: chargingFaqFromSpecs({
        acKw: charging.acKw,
        acTime: charging.acTime0to100Hours,
        dcKw: charging.dcKw,
        dcTime: charging.dcTime10to80Minutes,
        claimedKm,
      }),
    },
    media: mediaPaths(slug),
    governance: governance(score, flags),
    verification: verification(score, flags),
  };
}
