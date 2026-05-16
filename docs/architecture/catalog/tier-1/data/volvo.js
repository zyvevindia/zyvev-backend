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

const BRAND = "Volvo";

export const volvoVariants = [ex40SingleMotor(), ex40TwinMotor()];

function ex40SingleMotor() {
  const slug = "volvo-ex40-single-motor";
  const claimedKm = 530;
  const exShowroom = 4990000;
  const flags = [
    flag("pricing.exShowroom", "needs_review", "Confirm EX40 single-motor pricing"),
    flag("range.claimedKm", "needs_review", "Verify ARAI range"),
  ];
  return ex40Base({
    slug,
    variantName: "Single Motor Extended",
    exShowroom,
    claimedKm,
    capacityKwh: 69,
    powerKw: 175,
    driveType: "RWD",
    acceleration0to100: 7.3,
    flags,
    score: 88,
    rivals: ["bmw-ix1-xdrive30", "mercedes-eqa-250-plus", "kia-ev6-gt-line"],
    narrative:
      "Efficiency-focused EX40 for safety-conscious luxury buyers who want Scandinavian design and sensible range.",
  });
}

function ex40TwinMotor() {
  const slug = "volvo-ex40-twin-motor";
  const claimedKm = 510;
  const exShowroom = 5490000;
  const flags = [
    flag("pricing.exShowroom", "needs_review", "Confirm twin-motor pricing"),
  ];
  return ex40Base({
    slug,
    variantName: "Twin Motor",
    exShowroom,
    claimedKm,
    capacityKwh: 69,
    powerKw: 300,
    driveType: "AWD",
    acceleration0to100: 4.7,
    flags,
    score: 90,
    rivals: ["kia-ev6-gt-line", "bmw-ix1-xdrive30", "mercedes-eqb-250-plus"],
    narrative:
      "Performance EX40 for buyers who want Volvo safety positioning with strong acceleration.",
  });
}

function ex40Base(opts) {
  const {
    slug,
    variantName,
    exShowroom,
    claimedKm,
    capacityKwh,
    powerKw,
    driveType,
    acceleration0to100,
    flags,
    score,
    rivals,
    narrative,
  } = opts;
  const charging = chargingBlock({
    acKw: 11,
    acTime0to100Hours: 7,
    dcKw: 150,
    dcTime10to80Minutes: 28,
  });
  return {
    identity: {
      brandSlug: "volvo",
      modelSlug: "ex40",
      variantName,
      slug,
      bodyType: "suv",
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
      realWorldKm: realWorldBand(claimedKm, 0.61, 0.75),
    },
    charging,
    performance: { powerKw, driveType, acceleration0to100 },
    practicality: {
      bootSpaceL: 419,
      familyScore: 82,
      highwayComfortScore: 88,
      cityUsabilityScore: 74,
      seatingCapacity: 5,
    },
    ownership: {
      warrantyVehicleYears: 3,
      warrantyBatteryYears: 8,
      warrantyBatteryKm: 160000,
      chargingNetworkScore: 74,
      resaleConfidenceScore: 81,
      serviceCostPerKm: 0.6,
    },
    psychology: {
      tags: ["premium_feel", "best_for_family"],
      scores: {
        premium_feel: 90,
        best_for_family: 84,
        tech_appeal: 86,
      },
      narrative,
    },
    availability: {
      availableCities: ["delhi", "mumbai", "bangalore"],
      waitingPeriodWeeks: 5,
      testDriveAvailable: true,
    },
    compare: compareBlock({
      rivalSlugs: rivals,
      valueScore: 75,
      advantages: ["Safety brand equity", "Clean Scandinavian interior"],
      weaknesses: ["Premium pricing", "Boot space vs boxy EQB"],
    }),
    seo: {
      ...seoBlock({
        slug,
        brand: BRAND,
        model: "EX40",
        variant: variantName,
        exShowroom,
        claimedKm,
      }),
      pros: ["Strong safety narrative", "Comfortable highway cruiser"],
      cons: ["Luxury service costs"],
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
