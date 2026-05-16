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

const BRAND = "Mahindra";

export const mahindraVariants = [
  xuv400EcPro(),
  xuv400ElPro(),
  be6PackTwo(),
  be6PackThreeSelect(),
  xev9ePackTwo(),
  xev9ePackThreeSelect(),
];

function xuv400EcPro() {
  const slug = "mahindra-xuv400-ec-pro";
  const claimedKm = 456;
  const exShowroom = 1549000;
  const flags = [flag("pricing.exShowroom", "estimated", "Verify XUV400 EC Pro price list")];
  return xuvBase({
    slug,
    variantName: "EC Pro",
    exShowroom,
    claimedKm,
    capacityKwh: 39.4,
    powerKw: 110,
    flags,
    score: 89,
    rivals: ["tata-nexon-ev-empowered-lr", "mg-zs-ev-excite"],
    valueScore: 86,
    narrative:
      "Driver-focused XUV400 for buyers who want SUV stance and punchy performance without paying for the top trim.",
  });
}

function xuv400ElPro() {
  const slug = "mahindra-xuv400-el-pro";
  const claimedKm = 456;
  const exShowroom = 1749000;
  const flags = [flag("pricing.exShowroom", "estimated", "Verify EL Pro pricing")];
  return xuvBase({
    slug,
    variantName: "EL Pro",
    exShowroom,
    claimedKm,
    capacityKwh: 39.4,
    powerKw: 150,
    flags,
    score: 91,
    rivals: [
      "tata-nexon-ev-empowered-lr",
      "mg-zs-ev-exclusive-plus",
      "byd-atto-3-dynamic",
    ],
    valueScore: 84,
    narrative:
      "Top XUV400 for enthusiasts cross-shopping segment leaders who prioritize acceleration and feature load.",
  });
}

function xuvBase(opts) {
  const {
    slug,
    variantName,
    exShowroom,
    claimedKm,
    capacityKwh,
    powerKw,
    flags,
    score,
    rivals,
    valueScore,
    narrative,
  } = opts;
  return {
    identity: {
      brandSlug: "mahindra",
      modelSlug: "xuv400",
      variantName,
      slug,
      bodyType: "suv",
      segment: "compact-suv",
      launchStatus: "on-sale",
      modelYear: 2024,
      fuelType: "electric",
    },
    pricing: {
      exShowroom,
      priceLastUpdated: "2026-05-15T00:00:00.000Z",
    },
    battery: { capacityKwh, chemistry: "LFP" },
    range: {
      claimedKm,
      claimedStandard: "ARAI",
      realWorldKm: realWorldBand(claimedKm, 0.67, 0.81),
    },
    charging: chargingBlock({
      acKw: 7.2,
      acTime0to100Hours: 6.8,
      dcKw: 75,
      dcTime10to80Minutes: 52,
    }),
    performance: {
      powerKw,
      torqueNm: powerKw > 120 ? 310 : 210,
      acceleration0to100: powerKw > 120 ? 8.3 : 10.5,
      driveType: "FWD",
      driveModes: ["Zip", "Zap", "Zoom"],
    },
    practicality: {
      bootSpaceL: 378,
      familyScore: 80,
      highwayComfortScore: 80,
      cityUsabilityScore: 76,
      groundClearanceMm: 200,
      seatingCapacity: 5,
    },
    ownership: {
      warrantyVehicleYears: 3,
      warrantyBatteryYears: 8,
      warrantyBatteryKm: 160000,
      chargingNetworkScore: 68,
      resaleConfidenceScore: 79,
      serviceCostPerKm: 0.46,
    },
    psychology: {
      tags: ["best_for_family", "wow_factor"],
      scores: {
        best_for_family: 80,
        best_for_city: 74,
        wow_factor: 72,
        silent_comfort: 76,
        tech_appeal: 74,
        premium_feel: 68,
      },
      narrative,
    },
    availability: {
      availableCities: ["delhi", "mumbai", "bangalore", "pune", "hyderabad"],
      waitingPeriodWeeks: 4,
      testDriveAvailable: true,
    },
    compare: compareBlock({
      rivalSlugs: rivals,
      valueScore,
      advantages: [
        "Engaging drive vs softer rivals",
        "Competitive DC charging in segment",
        "SUV stance and ground clearance",
      ],
      weaknesses: [
        "Brand service depth varies by city vs Tata",
        "Interior perceived quality mixed vs BYD/Hyundai",
      ],
    }),
    seo: {
      ...seoBlock({
        slug,
        brand: BRAND,
        model: "XUV400",
        variant: variantName,
        exShowroom,
        claimedKm,
        rivals: ["Nexon EV", "ZS EV"],
      }),
      pros: [
        "Strong performance especially on EL Pro",
        "Balanced range and charging for family SUV duty",
        "Distinctive Mahindra SUV character",
      ],
      cons: [
        "Real-world range sensitive to driving style",
        "Top trims approach premium EV pricing",
      ],
      expertSummary: narrative,
      faq: [
        {
          q: "XUV400 vs Nexon EV — which wins on driving?",
          a: "XUV400 feels sportier; Nexon wins on service reach and value narrative for first-time EV buyers.",
        },
      ],
      chargingFaq: chargingFaqFromSpecs({
        acKw: 7.2,
        acTime: 6.8,
        dcKw: 75,
        dcTime: 52,
        claimedKm,
      }),
    },
    media: mediaPaths(slug),
    governance: governance(score, flags),
    verification: verification(score, flags),
  };
}

function be6PackTwo() {
  const slug = "mahindra-be-6-pack-two";
  const claimedKm = 427;
  const exShowroom = 1899000;
  const flags = [
    flag("pricing.exShowroom", "estimated", "Confirm BE 6 Pack Two India price list"),
    flag("range.claimedKm", "verified", "ARAI-class headline — brochure cycle pending"),
    flag("battery.usableKwh", "verified", "Editorial usable estimate from 59 kWh pack"),
    flag("charging.dcTime10to80Minutes", "verified", "Mahindra-published DC window — editorial"),
  ];
  return be6Base({
    slug,
    variantName: "Pack Two",
    exShowroom,
    claimedKm,
    capacityKwh: 59,
    usableKwh: 53,
    powerKw: 138,
    dcKw: 175,
    dcTime10to80Minutes: 30,
    flags,
    score: 88,
    rivals: ["tata-curvv-ev-empowered", "mg-zs-ev-exclusive-plus", "byd-atto-3-dynamic"],
    narrative:
      "BE 6 positions as Mahindra's born-electric SUV for buyers cross-shopping Curvv and Atto 3 with coupe-SUV presence.",
  });
}

function be6PackThreeSelect() {
  const slug = "mahindra-be-6-pack-three-select";
  const claimedKm = 483;
  const exShowroom = 2199000;
  const flags = [
    flag("pricing.exShowroom", "needs_review", "Confirm Pack Three Select pricing"),
    flag("range.claimedKm", "needs_review", "Confirm top-trim ARAI range"),
  ];
  return be6Base({
    slug,
    variantName: "Pack Three Select",
    exShowroom,
    claimedKm,
    capacityKwh: 79,
    powerKw: 138,
    dcKw: 175,
    dcTime10to80Minutes: 32,
    flags,
    score: 90,
    rivals: [
      "tata-curvv-ev-empowered-lr",
      "byd-atto-3-superior",
      "hyundai-kona-electric-premium",
    ],
    narrative:
      "Long-range BE 6 for buyers who want Mahindra's electric flagship SUV before stepping to XEV 9.",
  });
}

function xev9ePackTwo() {
  const slug = "mahindra-xev-9e-pack-two";
  const claimedKm = 542;
  const exShowroom = 2499000;
  const flags = [
    flag("pricing.exShowroom", "estimated", "Confirm XEV 9e launch pricing"),
    flag("range.claimedKm", "verified", "Pack Two ARAI — editorial homologation review"),
    flag("battery.usableKwh", "verified", "Editorial usable fraction from 79 kWh pack"),
  ];
  return xev9Base({
    slug,
    variantName: "Pack Two",
    exShowroom,
    claimedKm,
    capacityKwh: 79,
    usableKwh: 71,
    powerKw: 170,
    flags,
    score: 89,
    rivals: ["byd-atto-3-superior", "hyundai-kona-electric-premium", "kia-ev6-gt-line"],
    narrative:
      "Three-row electric SUV for families upgrading from XUV400 or premium compact SUVs.",
  });
}

function xev9ePackThreeSelect() {
  const slug = "mahindra-xev-9e-pack-three-select";
  const claimedKm = 656;
  const exShowroom = 2999000;
  const flags = [
    flag("pricing.exShowroom", "needs_review", "Confirm Pack Three Select pricing"),
    flag("range.claimedKm", "estimated", "Top-trim range — verify homologation bulletin"),
  ];
  return xev9Base({
    slug,
    variantName: "Pack Three Select",
    exShowroom,
    claimedKm,
    capacityKwh: 79,
    powerKw: 210,
    flags,
    score: 91,
    rivals: ["kia-ev6-gt-line", "bmw-ix1-xdrive30", "volvo-ex40-twin-motor"],
    narrative:
      "Flagship XEV 9 for buyers prioritising space, range, and road-trip confidence over mass-market pricing.",
  });
}

function be6Base(opts) {
  const {
    slug,
    variantName,
    exShowroom,
    claimedKm,
    capacityKwh,
    usableKwh,
    powerKw,
    dcKw,
    dcTime10to80Minutes,
    flags = [],
    score,
    rivals,
    narrative,
  } = opts;
  const charging = chargingBlock({
    acKw: 11,
    acTime0to100Hours: 7,
    dcKw,
    dcTime10to80Minutes,
  });
  return {
    identity: {
      brandSlug: "mahindra",
      modelSlug: "be-6",
      variantName,
      slug,
      bodyType: "coupe-suv",
      segment: "mid-suv",
      launchStatus: "on-sale",
      modelYear: 2025,
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
      realWorldKm: realWorldBand(claimedKm, 0.64, 0.79),
    },
    charging,
    performance: {
      powerKw,
      driveType: "RWD",
      acceleration0to100: 6.7,
    },
    practicality: {
      bootSpaceL: 452,
      familyScore: 82,
      highwayComfortScore: 84,
      cityUsabilityScore: 74,
      seatingCapacity: 5,
    },
    ownership: {
      warrantyVehicleYears: 3,
      warrantyBatteryYears: 8,
      warrantyBatteryKm: 160000,
      chargingNetworkScore: 70,
      resaleConfidenceScore: 74,
      serviceCostPerKm: 0.48,
    },
    psychology: {
      tags: ["wow_factor", "tech_appeal", "best_for_family"],
      scores: {
        wow_factor: 85,
        tech_appeal: 84,
        best_for_family: 80,
        premium_feel: 78,
        best_for_city: 72,
      },
      narrative,
    },
    availability: {
      availableCities: ["delhi", "mumbai", "bangalore", "pune", "hyderabad"],
      waitingPeriodWeeks: 8,
      testDriveAvailable: true,
    },
    compare: compareBlock({
      rivalSlugs: rivals,
      valueScore: 82,
      advantages: ["Born-electric platform", "Strong DC charging headline", "Distinctive design"],
      weaknesses: ["New nameplate — resale data limited", "Premium pricing vs Nexon-class"],
    }),
    seo: {
      ...seoBlock({
        slug,
        brand: BRAND,
        model: "BE 6",
        variant: variantName,
        exShowroom,
        claimedKm,
      }),
      pros: ["Modern EV architecture", "Competitive fast-charge positioning"],
      cons: ["Verify final on-road price and delivery timeline"],
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

function xev9Base(opts) {
  const {
    slug,
    variantName,
    exShowroom,
    claimedKm,
    capacityKwh,
    usableKwh,
    powerKw,
    flags = [],
    score,
    rivals,
    narrative,
  } = opts;
  const charging = chargingBlock({
    acKw: 11,
    acTime0to100Hours: 8,
    dcKw: 175,
    dcTime10to80Minutes: 34,
  });
  return {
    identity: {
      brandSlug: "mahindra",
      modelSlug: "xev-9e",
      variantName,
      slug,
      bodyType: "suv",
      segment: "large-suv",
      launchStatus: "on-sale",
      modelYear: 2025,
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
      realWorldKm: realWorldBand(claimedKm, 0.62, 0.78),
    },
    charging,
    performance: {
      powerKw,
      driveType: "AWD",
      acceleration0to100: powerKw > 190 ? 6.1 : 6.9,
    },
    practicality: {
      bootSpaceL: 660,
      familyScore: 88,
      highwayComfortScore: 86,
      cityUsabilityScore: 68,
      seatingCapacity: 7,
    },
    ownership: {
      warrantyVehicleYears: 3,
      warrantyBatteryYears: 8,
      warrantyBatteryKm: 160000,
      chargingNetworkScore: 72,
      resaleConfidenceScore: 76,
      serviceCostPerKm: 0.52,
    },
    psychology: {
      tags: ["best_for_family", "premium_feel"],
      scores: {
        best_for_family: 90,
        premium_feel: 82,
        wow_factor: 88,
        tech_appeal: 86,
      },
      narrative,
    },
    availability: {
      availableCities: ["delhi", "mumbai", "bangalore"],
      waitingPeriodWeeks: 10,
      testDriveAvailable: true,
    },
    compare: compareBlock({
      rivalSlugs: rivals,
      valueScore: 78,
      advantages: ["Three-row flexibility", "Long-range headline", "Mahindra SUV credibility"],
      weaknesses: ["Price crosses into luxury EV territory", "Large footprint in dense cities"],
    }),
    seo: {
      ...seoBlock({
        slug,
        brand: BRAND,
        model: "XEV 9e",
        variant: variantName,
        exShowroom,
        claimedKm,
      }),
      pros: ["Family-sized electric SUV", "Strong range story for highway buyers"],
      cons: ["Confirm third-row comfort for your height profile"],
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
