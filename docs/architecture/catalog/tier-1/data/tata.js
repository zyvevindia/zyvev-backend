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

const BRAND = "Tata";

export const tataVariants = [
  nexonCreativePlus(),
  nexonEmpoweredLR(),
  punchSmartPlus(),
  punchEmpoweredLR(),
  curvvEmpowered(),
  curvvEmpoweredLR(),
  tiagoXT(),
  tiagoXZPlus(),
];

function nexonCreativePlus() {
  const slug = "tata-nexon-ev-creative-plus";
  const claimedKm = 275;
  const exShowroom = 1449000;
  const flags = [
    flag("pricing.exShowroom", "estimated", "Verify against latest Tata India price list"),
    flag("range.realWorldKm", "verified", "Conservative planning band — observation pilot aligned"),
    flag("trustPresentation", "verified", "Flagship editorial hardening — Nexon Creative+"),
  ];
  return {
    identity: {
      brandSlug: "tata",
      modelSlug: "nexon-ev",
      variantName: "Creative+",
      slug,
      bodyType: "suv",
      segment: "compact-suv",
      launchStatus: "on-sale",
      modelYear: 2024,
      fuelType: "electric",
    },
    pricing: {
      exShowroom,
      onRoadByCity: { delhi: 1520000, mumbai: 1550000, bangalore: 1515000 },
      emi: {
        monthlyInr: 25400,
        tenureMonths: 60,
        downPaymentInr: 290000,
        interestRateApr: 8.5,
        disclaimer: "Indicative; subject to lender approval",
      },
      subsidy: {
        centralFameInr: 0,
        stateSubsidyInr: 0,
        notes: "State EV incentives vary; verify at booking",
      },
      ownershipCost5yr: {
        totalInr: 1620000,
        energyInr: 95000,
        serviceInr: 75000,
        insuranceInr: 320000,
        computedAt: "2026-05-15T00:00:00.000Z",
      },
      priceLastUpdated: "2026-05-15T00:00:00.000Z",
    },
    battery: { capacityKwh: 30.2, usableKwh: 28.5, chemistry: "LFP" },
    range: {
      claimedKm,
      claimedStandard: "ARAI",
      realWorldKm: realWorldBand(claimedKm, 0.7, 0.85),
    },
    charging: {
      acKw: 7.2,
      acTime0to100Hours: 5.5,
      dcKw: 50,
      dcTime10to80Minutes: 45,
      standards: ["CCS2", "Type2"],
      v2l: { supported: true, maxWatts: 3000 },
      v2v: { supported: false },
      regenLevels: ["low", "medium", "high"],
    },
    performance: {
      powerKw: 95,
      powerHp: 128,
      torqueNm: 215,
      acceleration0to100: 11.2,
      driveType: "FWD",
      driveModes: ["Eco", "City", "Sport"],
    },
    practicality: {
      bootSpaceL: 350,
      familyScore: 74,
      highwayComfortScore: 68,
      cityUsabilityScore: 86,
      groundClearanceMm: 205,
      turningRadiusM: 5.3,
      seatingCapacity: 5,
    },
    ownership: {
      warrantyVehicleYears: 3,
      warrantyVehicleKm: 125000,
      warrantyBatteryYears: 8,
      warrantyBatteryKm: 160000,
      serviceCostPerKm: 0.42,
      chargingNetworkScore: 72,
      resaleConfidenceScore: 84,
      softwareUpdatePolicy: "OTA infotainment; periodic service updates",
    },
    psychology: {
      tags: ["best_for_city", "best_first_ev"],
      scores: {
        best_for_family: 72,
        best_for_city: 86,
        best_first_ev: 88,
        premium_feel: 58,
        wow_factor: 50,
        silent_comfort: 78,
        tech_appeal: 65,
      },
      narrative:
        "The most approachable Nexon EV for city-first buyers who want Tata service reach without paying for the long-range pack.",
    },
    availability: {
      availableCities: ["delhi", "mumbai", "bangalore", "hyderabad", "pune", "chennai"],
      dealerCountNational: 450,
      waitingPeriodWeeks: 2,
      testDriveAvailable: true,
    },
    compare: compareBlock({
      rivalSlugs: [
        "tata-punch-ev-empowered-lr",
        "mahindra-xuv400-ec-pro",
        "mg-zs-ev-excite",
      ],
      valueScore: 86,
      advantages: [
        "Lowest entry price in Nexon EV lineup with proven Tata service density",
        "Easy to park and drive in dense city traffic",
        "LFP battery with long warranty for peace of mind",
      ],
      weaknesses: [
        "Shorter certified range than Long Range rivals in segment",
        "Highway touring requires more frequent DC stops",
      ],
      featureMatrix: {
        adasLevel2: false,
        connectedCar: true,
        heatPump: false,
        v2l: true,
      },
    }),
    seo: {
      ...seoBlock({
        slug,
        brand: BRAND,
        model: "Nexon EV",
        variant: "Creative+",
        exShowroom,
        claimedKm,
        rivals: ["Punch EV", "XUV400"],
      }),
      pros: [
        "Most affordable Nexon EV trim for urban buyers",
        "Wide Tata service and charging partner visibility in Tier 1–3 cities",
        "LFP pack focused on durability and warranty confidence",
      ],
      cons: [
        "Range and DC charging comfort trail Long Range variants and some rivals",
        "Not ideal as primary highway inter-city car",
      ],
      expertSummary:
        "Choose Creative+ if your daily use is overwhelmingly city driving and you want India's safest default EV brand experience without overspending on battery size. For weekly highway runs, step up to Empowered LR or cross-shop XUV400 and ZS EV.",
      faq: [
        {
          q: "Who should buy the Nexon EV Creative+?",
          a: "Daily city commuters under ~60 km/day who prioritize service network and value over maximum range.",
        },
        {
          q: "Can Creative+ support weekend highway trips?",
          a: "Yes with planning, but expect more charging stops than long-range competitors.",
        },
      ],
      chargingFaq: [
        {
          q: "What home charger do I need?",
          a: "A 7.2 kW Type 2 AC wall box is typical; full charge overnight on standard home supply.",
        },
      ],
    },
    media: mediaPaths(slug),
    governance: governance(88, flags),
    verification: verification(88, flags),
  };
}

function nexonEmpoweredLR() {
  const slug = "tata-nexon-ev-empowered-lr";
  const claimedKm = 465;
  const exShowroom = 1649000;
  const flags = [
    flag("pricing.exShowroom", "estimated", "Verify against latest Tata India price list"),
    flag("range.realWorldKm", "verified", "LR band editorially signed for top-traffic compare"),
    flag("charging.dcTime10to80Minutes", "verified", "OEM-class DC window for highway planning copy"),
  ];
  return {
    identity: {
      brandSlug: "tata",
      modelSlug: "nexon-ev",
      variantName: "Empowered LR",
      slug,
      bodyType: "suv",
      segment: "compact-suv",
      launchStatus: "on-sale",
      modelYear: 2024,
      fuelType: "electric",
    },
    pricing: {
      exShowroom,
      onRoadByCity: { delhi: 1720000, mumbai: 1755000, bangalore: 1718000 },
      emi: {
        monthlyInr: 28900,
        tenureMonths: 60,
        downPaymentInr: 330000,
        interestRateApr: 8.5,
        disclaimer: "Indicative",
      },
      subsidy: { centralFameInr: 0, stateSubsidyInr: 0, notes: "Verify state policy" },
      ownershipCost5yr: {
        totalInr: 1850000,
        energyInr: 120000,
        serviceInr: 80000,
        insuranceInr: 350000,
        computedAt: "2026-05-15T00:00:00.000Z",
      },
      priceLastUpdated: "2026-05-15T00:00:00.000Z",
    },
    battery: { capacityKwh: 40.5, usableKwh: 38.5, chemistry: "LFP" },
    range: {
      claimedKm,
      claimedStandard: "ARAI",
      realWorldKm: realWorldBand(claimedKm),
    },
    charging: {
      acKw: 7.2,
      acTime0to100Hours: 6.5,
      dcKw: 50,
      dcTime10to80Minutes: 56,
      standards: ["CCS2", "Type2"],
      v2l: { supported: true, maxWatts: 3000 },
      v2v: { supported: false },
      regenLevels: ["low", "medium", "high", "single-pedal"],
    },
    performance: {
      powerKw: 129,
      powerHp: 174,
      torqueNm: 215,
      acceleration0to100: 8.9,
      driveType: "FWD",
      driveModes: ["Eco", "City", "Sport"],
    },
    practicality: {
      bootSpaceL: 350,
      familyScore: 78,
      highwayComfortScore: 72,
      cityUsabilityScore: 88,
      groundClearanceMm: 205,
      turningRadiusM: 5.3,
      seatingCapacity: 5,
    },
    ownership: {
      warrantyVehicleYears: 3,
      warrantyVehicleKm: 125000,
      warrantyBatteryYears: 8,
      warrantyBatteryKm: 160000,
      serviceCostPerKm: 0.45,
      chargingNetworkScore: 72,
      resaleConfidenceScore: 85,
      softwareUpdatePolicy: "OTA infotainment",
    },
    psychology: {
      tags: ["best_for_city", "best_first_ev", "best_for_family"],
      scores: {
        best_for_family: 78,
        best_for_city: 88,
        best_first_ev: 85,
        premium_feel: 62,
        wow_factor: 55,
        silent_comfort: 80,
        tech_appeal: 70,
      },
      narrative:
        "India's benchmark mass-market electric SUV for buyers who want range confidence, service reach, and predictable ownership costs in one package.",
    },
    availability: {
      availableCities: ["delhi", "mumbai", "bangalore", "hyderabad", "pune", "chennai", "kolkata"],
      dealerCountNational: 450,
      waitingPeriodWeeks: 3,
      testDriveAvailable: true,
    },
    compare: compareBlock({
      rivalSlugs: [
        "mahindra-xuv400-el-pro",
        "mg-zs-ev-exclusive-plus",
        "byd-atto-3-dynamic",
      ],
      valueScore: 84,
      advantages: [
        "Best-in-class service footprint for mass-market EV SUVs",
        "Strong city efficiency and approachable driving manners",
        "Competitive ex-showroom vs range equation",
      ],
      weaknesses: [
        "50 kW DC peak is slower than several newer rivals",
        "Cabin perceived premium lags Atto 3 / Kona at similar price bands",
      ],
      featureMatrix: { adasLevel2: false, connectedCar: true, v2l: true },
    }),
    seo: {
      ...seoBlock({
        slug,
        brand: BRAND,
        model: "Nexon EV",
        variant: "Empowered LR",
        exShowroom,
        claimedKm,
        rivals: ["XUV400", "ZS EV", "Atto 3"],
      }),
      pros: [
        "Segment-leading service and resale confidence for mass EV SUVs",
        "465 km ARAI range suits mixed city-highway lifestyles",
        "LFP battery with 8-year warranty narrative buyers understand",
      ],
      cons: [
        "DC fast-charge speed not class-leading",
        "Interior and ADAS not as futuristic as BYD or Hyundai alternatives",
      ],
      expertSummary:
        "Empowered LR remains the default recommendation for first-time EV SUV buyers who trust service density over maximum tech wow. Cross-shop XUV400 for a sportier drive and Atto 3 for cabin tech if budget allows.",
      faq: [
        {
          q: "Nexon EV Empowered LR vs XUV400 — which is better?",
          a: "Nexon wins on service reach and value; XUV400 appeals to drivers wanting stronger performance and a different cabin character. Compare on EVSavari.",
        },
      ],
      chargingFaq: [
        {
          q: "How long does a DC fast charge take?",
          a: "Plan roughly 45–60 minutes for a useful 10–80% session on a typical 50 kW CCS2 charger.",
        },
      ],
    },
    media: mediaPaths(slug),
    governance: governance(91, flags),
    verification: verification(91, flags),
  };
}

function punchSmartPlus() {
  const slug = "tata-punch-ev-smart-plus";
  const claimedKm = 315;
  const exShowroom = 1099000;
  const flags = [
    flag("pricing.exShowroom", "estimated", "Verify Tata Punch EV price list"),
    flag("battery.capacityKwh", "needs_review", "Confirm pack size for Smart+ MY"),
  ];
  return baseCompactSuv({
    slug,
    modelSlug: "punch-ev",
    variantName: "Smart+",
    exShowroom,
    claimedKm,
    capacityKwh: 25,
    powerKw: 80,
    segment: "micro-suv",
    flags,
    score: 87,
    rivals: ["mg-comet-ev-play", "tata-tiago-ev-xt"],
    narrative:
      "Micro-SUV EV for young urban households who want elevated seating and Tata trust in a tight parking footprint.",
    tags: ["best_for_city", "best_first_ev"],
    valueScore: 88,
  });
}

function punchEmpoweredLR() {
  const slug = "tata-punch-ev-empowered-lr";
  const claimedKm = 421;
  const exShowroom = 1249000;
  const flags = [
    flag("pricing.exShowroom", "estimated", "Verify Tata price list"),
    flag("battery.usableKwh", "verified", "Curator-reviewed brochure cycle 1"),
    flag("charging.acTime0to100Hours", "verified", "Curator-reviewed brochure cycle 1"),
    flag("charging.dcTime10to80Minutes", "verified", "Curator-reviewed brochure cycle 1"),
    flag("trustPresentation", "verified", "Flagship observation pilot — Punch LR"),
  ];
  return baseCompactSuv({
    slug,
    modelSlug: "punch-ev",
    variantName: "Empowered LR",
    exShowroom,
    claimedKm,
    capacityKwh: 35,
    usableKwh: 33,
    powerKw: 105,
    segment: "micro-suv",
    acTime0to100Hours: 6.5,
    dcTime10to80Minutes: 56,
    flags,
    score: 90,
    rivals: [
      "tata-nexon-ev-creative-plus",
      "mg-comet-ev-plush-plus",
      "tata-tiago-ev-xz-plus",
    ],
    narrative:
      "Long-range Punch EV for buyers who want micro-SUV practicality without stepping up to Nexon pricing.",
    tags: ["best_for_city", "best_first_ev", "best_for_family"],
    valueScore: 87,
  });
}

function curvvEmpowered() {
  const slug = "tata-curvv-ev-empowered";
  const claimedKm = 502;
  const exShowroom = 1749000;
  const flags = [
    flag("pricing.exShowroom", "estimated", "New model — verify launch pricing"),
    flag("range.claimedKm", "needs_review", "Confirm ARAI figure for Empowered trim"),
    flag("launchStatus", "needs_review", "Confirm on-sale date by city"),
  ];
  return baseCoupeSuv({
    slug,
    variantName: "Empowered",
    exShowroom,
    claimedKm,
    capacityKwh: 45,
    powerKw: 120,
    flags,
    score: 86,
    rivals: ["tata-nexon-ev-empowered-lr", "mg-zs-ev-exclusive-plus"],
    lr: false,
  });
}

function curvvEmpoweredLR() {
  const slug = "tata-curvv-ev-empowered-lr";
  const claimedKm = 585;
  const exShowroom = 1899000;
  const flags = [
    flag("pricing.exShowroom", "estimated", "Launch pricing placeholder"),
    flag("range.claimedKm", "estimated", "Top-trim ARAI subject to homologation"),
  ];
  return baseCoupeSuv({
    slug,
    variantName: "Empowered LR",
    exShowroom,
    claimedKm,
    capacityKwh: 55,
    powerKw: 150,
    flags,
    score: 85,
    rivals: [
      "byd-atto-3-superior",
      "hyundai-kona-electric-premium",
      "mahindra-xuv400-el-pro",
    ],
    lr: true,
  });
}

function tiagoXT() {
  const slug = "tata-tiago-ev-xt";
  const claimedKm = 250;
  const exShowroom = 799000;
  const flags = [
    flag("pricing.exShowroom", "estimated", "Entry Tiago EV trim pricing"),
  ];
  return baseHatch({
    slug,
    variantName: "XT",
    exShowroom,
    claimedKm,
    capacityKwh: 19.2,
    powerKw: 55,
    flags,
    score: 86,
    rivals: ["mg-comet-ev-play"],
    valueScore: 90,
  });
}

function tiagoXZPlus() {
  const slug = "tata-tiago-ev-xz-plus";
  const claimedKm = 315;
  const exShowroom = 1199000;
  const flags = [flag("pricing.exShowroom", "estimated", "Verify top Tiago EV trim")];
  return baseHatch({
    slug,
    variantName: "XZ+",
    exShowroom,
    claimedKm,
    capacityKwh: 24,
    powerKw: 75,
    flags,
    score: 88,
    rivals: ["mg-comet-ev-plush-plus", "tata-punch-ev-smart-plus"],
    valueScore: 86,
  });
}

function baseCompactSuv(opts) {
  const {
    slug,
    modelSlug,
    variantName,
    exShowroom,
    claimedKm,
    capacityKwh,
    usableKwh = null,
    powerKw,
    segment,
    acTime0to100Hours = null,
    dcTime10to80Minutes = null,
    flags,
    score,
    rivals,
    narrative,
    tags,
    valueScore,
  } = opts;
  const charging = chargingBlock({
    acKw: 7.2,
    acTime0to100Hours,
    dcKw: 50,
    dcTime10to80Minutes,
  });
  return {
    identity: {
      brandSlug: "tata",
      modelSlug,
      variantName,
      slug,
      bodyType: "suv",
      segment,
      launchStatus: "on-sale",
      modelYear: 2024,
      fuelType: "electric",
    },
    pricing: {
      exShowroom,
      priceLastUpdated: "2026-05-15T00:00:00.000Z",
      subsidy: { notes: "Verify state incentives" },
    },
    battery: {
      capacityKwh,
      ...(usableKwh != null ? { usableKwh } : {}),
      chemistry: "LFP",
    },
    range: {
      claimedKm,
      claimedStandard: "ARAI",
      realWorldKm: realWorldBand(claimedKm),
    },
    charging,
    performance: {
      powerKw,
      driveType: "FWD",
      acceleration0to100: powerKw > 100 ? 9.5 : 11.5,
    },
    practicality: {
      bootSpaceL: 315,
      familyScore: 70,
      cityUsabilityScore: 90,
      highwayComfortScore: 65,
      seatingCapacity: 5,
    },
    ownership: {
      warrantyVehicleYears: 3,
      warrantyBatteryYears: 8,
      warrantyBatteryKm: 160000,
      chargingNetworkScore: 70,
      resaleConfidenceScore: 80,
      serviceCostPerKm: 0.44,
    },
    psychology: {
      tags: tags || ["best_for_city"],
      scores: {
        best_for_city: 90,
        best_first_ev: 82,
        best_for_family: 68,
        premium_feel: 55,
        tech_appeal: 62,
      },
      narrative,
    },
    availability: {
      availableCities: ["delhi", "mumbai", "bangalore", "pune"],
      waitingPeriodWeeks: 3,
      testDriveAvailable: true,
    },
    compare: compareBlock({
      rivalSlugs: rivals,
      valueScore,
      advantages: ["Compact footprint for Indian cities", "Tata service density"],
      weaknesses: ["Highway refinement below larger SUVs"],
    }),
    seo: {
      ...seoBlock({
        slug,
        brand: BRAND,
        model: modelSlug === "punch-ev" ? "Punch EV" : "Tiago EV",
        variant: variantName,
        exShowroom,
        claimedKm,
      }),
      pros: ["Easy urban ownership", "Strong Tata after-sales reach"],
      cons: ["Not a primary highway tourer"],
      expertSummary: narrative,
      faq: [{ q: "Is this good for first EV?", a: "Yes for city-first buyers with home charging." }],
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

function baseCoupeSuv(opts) {
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
    lr,
  } = opts;
  return {
    identity: {
      brandSlug: "tata",
      modelSlug: "curvv-ev",
      variantName,
      slug,
      bodyType: "coupe-suv",
      segment: "mid-suv",
      launchStatus: "on-sale",
      modelYear: 2025,
      fuelType: "electric",
    },
    pricing: { exShowroom, priceLastUpdated: "2026-05-15T00:00:00.000Z" },
    battery: { capacityKwh, chemistry: "LFP" },
    range: {
      claimedKm,
      claimedStandard: "ARAI",
      realWorldKm: realWorldBand(claimedKm, 0.65, 0.8),
    },
    charging: { acKw: 7.2, dcKw: lr ? 70 : 50, standards: ["CCS2", "Type2"] },
    performance: { powerKw, driveType: "FWD", acceleration0to100: lr ? 8.5 : 9.8 },
    practicality: {
      bootSpaceL: 500,
      familyScore: 80,
      highwayComfortScore: 78,
      cityUsabilityScore: 75,
      seatingCapacity: 5,
    },
    ownership: {
      warrantyVehicleYears: 3,
      warrantyBatteryYears: 8,
      chargingNetworkScore: 70,
      resaleConfidenceScore: 72,
    },
    psychology: {
      tags: ["premium_feel", "wow_factor", "tech_appeal"],
      scores: {
        premium_feel: 78,
        wow_factor: 82,
        tech_appeal: 80,
        best_for_family: 76,
      },
      narrative:
        "Style-forward coupe-SUV EV for buyers stepping up from Nexon who want design presence and longer-range touring.",
    },
    availability: {
      availableCities: ["delhi", "mumbai", "bangalore"],
      waitingPeriodWeeks: 6,
      testDriveAvailable: true,
    },
    compare: compareBlock({
      rivalSlugs: rivals,
      valueScore: lr ? 80 : 82,
      advantages: ["Distinctive design", "Long-range option in Tata lineup"],
      weaknesses: ["New model — resale data still forming", "Price premium over Nexon"],
    }),
    seo: {
      ...seoBlock({
        slug,
        brand: BRAND,
        model: "Curvv EV",
        variant: variantName,
        exShowroom,
        claimedKm,
      }),
      pros: ["Standout design", "Strong range on LR trim"],
      cons: ["Premium over proven Nexon", "Verify real-world efficiency after launch"],
      expertSummary:
        "Curvv EV targets design-conscious upgraders. Validate pricing and delivery in your city before committing.",
      faq: [],
      chargingFaq: [],
    },
    media: mediaPaths(slug),
    governance: governance(score, flags),
    verification: verification(score, flags),
  };
}

function baseHatch(opts) {
  const { slug, variantName, exShowroom, claimedKm, capacityKwh, powerKw, flags, score, rivals, valueScore } =
    opts;
  return {
    identity: {
      brandSlug: "tata",
      modelSlug: "tiago-ev",
      variantName,
      slug,
      bodyType: "hatchback",
      segment: "hatchback-ev",
      launchStatus: "on-sale",
      modelYear: 2024,
      fuelType: "electric",
    },
    pricing: { exShowroom, priceLastUpdated: "2026-05-15T00:00:00.000Z" },
    battery: { capacityKwh, chemistry: "LFP" },
    range: {
      claimedKm,
      claimedStandard: "ARAI",
      realWorldKm: realWorldBand(claimedKm, 0.72, 0.88),
    },
    charging: { acKw: 7.2, dcKw: 25, standards: ["CCS2", "Type2"] },
    performance: { powerKw, driveType: "FWD" },
    practicality: {
      bootSpaceL: 240,
      cityUsabilityScore: 92,
      familyScore: 62,
      seatingCapacity: 5,
    },
    ownership: {
      warrantyVehicleYears: 3,
      warrantyBatteryYears: 8,
      resaleConfidenceScore: 78,
    },
    psychology: {
      tags: ["best_for_city", "best_first_ev"],
      scores: { best_for_city: 92, best_first_ev: 86, premium_feel: 48 },
      narrative: "India's value hatchback EV for tight budgets and city commutes.",
    },
    availability: { waitingPeriodWeeks: 2, testDriveAvailable: true },
    compare: compareBlock({
      rivalSlugs: rivals,
      valueScore: valueScore || 88,
      advantages: ["Lowest Tata EV entry", "Easy city parking"],
      weaknesses: ["Small boot", "Limited highway DC performance on base trims"],
    }),
    seo: {
      ...seoBlock({
        slug,
        brand: BRAND,
        model: "Tiago EV",
        variant: variantName,
        exShowroom,
        claimedKm,
      }),
      pros: ["Affordable EV entry", "City-friendly size"],
      cons: ["Not for long highway legs"],
      expertSummary: "Tiago EV suits budget-first city buyers; compare Comet and Punch for space.",
      faq: [],
      chargingFaq: [],
    },
    media: mediaPaths(slug),
    governance: governance(score, flags),
    verification: verification(score, flags),
  };
}
