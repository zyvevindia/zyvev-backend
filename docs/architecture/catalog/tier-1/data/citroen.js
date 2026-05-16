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

const BRAND = "Citroen";

export const citroenVariants = [ec3Live(), ec3Shine()];

function ec3Live() {
  const slug = "citroen-ec3-live";
  const claimedKm = 320;
  const exShowroom = 1161000;
  const flags = [
    flag("pricing.exShowroom", "estimated", "Confirm eC3 Live India pricing"),
    flag("range.claimedKm", "verified", "ARAI-class city range — editorial review"),
    flag("battery.usableKwh", "verified", "Editorial usable estimate from 29.2 kWh pack"),
    flag("trustPresentation", "verified", "Flagship observation pilot — eC3 Live"),
  ];
  return ec3Base({
    slug,
    variantName: "Live",
    exShowroom,
    claimedKm,
    capacityKwh: 29.2,
    usableKwh: 27.5,
    powerKw: 57,
    flags,
    score: 86,
    rivals: ["tata-tiago-ev-xt", "mg-comet-ev-play", "tata-punch-ev-smart-plus"],
    valueScore: 87,
    narrative:
      "Affordable French hatch EV for city-first buyers who want distinctive styling and a practical range band.",
  });
}

function ec3Shine() {
  const slug = "citroen-ec3-shine";
  const claimedKm = 320;
  const exShowroom = 1299000;
  const flags = [
    flag("pricing.exShowroom", "needs_review", "Confirm Shine trim pricing"),
  ];
  return ec3Base({
    slug,
    variantName: "Shine",
    exShowroom,
    claimedKm,
    capacityKwh: 29.2,
    powerKw: 57,
    flags,
    score: 87,
    rivals: ["tata-tiago-ev-xz-plus", "mg-comet-ev-plush-plus", "tata-punch-ev-smart-plus"],
    valueScore: 85,
    narrative:
      "Top eC3 for buyers who want more features while staying in the budget-EV band.",
  });
}

function ec3Base(opts) {
  const {
    slug,
    variantName,
    exShowroom,
    claimedKm,
    capacityKwh,
    usableKwh,
    powerKw,
    flags,
    score,
    rivals,
    valueScore,
    narrative,
  } = opts;
  const charging = chargingBlock({
    acKw: 7.4,
    acTime0to100Hours: 7.2,
    dcKw: 0,
    dcTime10to80Minutes: null,
  });
  return {
    identity: {
      brandSlug: "citroen",
      modelSlug: "ec3",
      variantName,
      slug,
      bodyType: "hatchback",
      segment: "hatchback",
      launchStatus: "on-sale",
      modelYear: 2024,
      fuelType: "electric",
    },
    pricing: { exShowroom, priceLastUpdated: "2026-05-15T00:00:00.000Z" },
    battery: {
      capacityKwh,
      ...(usableKwh != null ? { usableKwh } : {}),
      chemistry: "LFP",
    },
    range: {
      claimedKm,
      claimedStandard: "ARAI",
      realWorldKm: realWorldBand(claimedKm, 0.68, 0.82),
    },
    charging,
    performance: { powerKw, driveType: "FWD", acceleration0to100: 12.5 },
    practicality: {
      bootSpaceL: 315,
      familyScore: 68,
      cityUsabilityScore: 88,
      highwayComfortScore: 62,
      seatingCapacity: 5,
    },
    ownership: {
      warrantyVehicleYears: 3,
      warrantyBatteryYears: 8,
      warrantyBatteryKm: 160000,
      chargingNetworkScore: 62,
      resaleConfidenceScore: 70,
      serviceCostPerKm: 0.46,
    },
    psychology: {
      tags: ["best_for_city", "best_first_ev"],
      scores: {
        best_for_city: 88,
        best_first_ev: 80,
        premium_feel: 58,
      },
      narrative,
    },
    availability: {
      availableCities: ["delhi", "mumbai", "bangalore", "pune"],
      waitingPeriodWeeks: 4,
      testDriveAvailable: true,
    },
    compare: compareBlock({
      rivalSlugs: rivals,
      valueScore,
      advantages: ["Distinctive design", "AC-only simplicity for apartment charging"],
      weaknesses: ["No DC fast charging", "Stellantis service network still maturing in India"],
    }),
    seo: {
      ...seoBlock({
        slug,
        brand: BRAND,
        model: "eC3",
        variant: variantName,
        exShowroom,
        claimedKm,
      }),
      pros: ["City-friendly footprint", "Straightforward AC charging ownership"],
      cons: ["Not suited to frequent highway DC-reliant travel"],
      expertSummary: narrative,
      faq: [],
      chargingFaq: chargingFaqFromSpecs({
        acKw: charging.acKw,
        acTime: charging.acTime0to100Hours,
        dcKw: 0,
        dcTime: null,
        claimedKm,
      }),
    },
    media: mediaPaths(slug),
    governance: governance(score, flags),
    verification: verification(score, flags),
  };
}
