import {
  mediaPaths,
  flag,
  governance,
  verification,
  realWorldBand,
  seoBlock,
  compareBlock,
} from "./_helpers.js";

const BRAND = "MG";

export const mgVariants = [zsExcite(), zsExclusivePlus(), cometPlay(), cometPlushPlus()];

function zsExcite() {
  const slug = "mg-zs-ev-excite";
  const claimedKm = 461;
  const exShowroom = 1399000;
  const flags = [flag("pricing.exShowroom", "estimated", "Verify MG India ZS EV Excite pricing")];
  return zsBase({
    slug,
    variantName: "Excite",
    exShowroom,
    claimedKm,
    capacityKwh: 50.3,
    powerKw: 130,
    flags,
    score: 88,
    rivals: ["tata-nexon-ev-empowered-lr", "mahindra-xuv400-ec-pro"],
    valueScore: 85,
    narrative:
      "Value-oriented ZS EV for buyers who want a larger SUV footprint and MG feature packaging under the Nexon price ceiling.",
  });
}

function zsExclusivePlus() {
  const slug = "mg-zs-ev-exclusive-plus";
  const claimedKm = 461;
  const exShowroom = 1699000;
  const flags = [flag("pricing.exShowroom", "estimated", "Verify Exclusive Plus pricing")];
  return zsBase({
    slug,
    variantName: "Exclusive Plus",
    exShowroom,
    claimedKm,
    capacityKwh: 50.3,
    powerKw: 130,
    flags,
    score: 90,
    rivals: [
      "tata-nexon-ev-empowered-lr",
      "mahindra-xuv400-el-pro",
      "byd-atto-3-dynamic",
    ],
    valueScore: 83,
    narrative:
      "Fully featured ZS EV for family buyers cross-shopping Nexon LR and XUV400 who want ADAS-adjacent features and a spacious cabin.",
  });
}

function zsBase(opts) {
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
      brandSlug: "mg",
      modelSlug: "zs-ev",
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
      subsidy: { notes: "Verify state EV benefits" },
    },
    battery: { capacityKwh, chemistry: "NMC" },
    range: {
      claimedKm,
      claimedStandard: "ARAI",
      realWorldKm: realWorldBand(claimedKm, 0.66, 0.8),
    },
    charging: {
      acKw: 7.4,
      dcKw: 92,
      dcTime10to80Minutes: 50,
      standards: ["CCS2", "Type2"],
      v2l: { supported: false },
    },
    performance: {
      powerKw,
      torqueNm: 280,
      acceleration0to100: 8.5,
      driveType: "FWD",
    },
    practicality: {
      bootSpaceL: 448,
      familyScore: 82,
      highwayComfortScore: 78,
      cityUsabilityScore: 74,
      groundClearanceMm: 177,
      seatingCapacity: 5,
    },
    ownership: {
      warrantyVehicleYears: 5,
      warrantyBatteryYears: 8,
      warrantyBatteryKm: 150000,
      chargingNetworkScore: 65,
      resaleConfidenceScore: 76,
      serviceCostPerKm: 0.48,
    },
    psychology: {
      tags: ["best_for_family", "tech_appeal"],
      scores: {
        best_for_family: 82,
        best_for_city: 72,
        best_first_ev: 70,
        premium_feel: 70,
        tech_appeal: 75,
        silent_comfort: 78,
      },
      narrative,
    },
    availability: {
      availableCities: ["delhi", "mumbai", "bangalore", "hyderabad", "chennai"],
      waitingPeriodWeeks: 4,
      testDriveAvailable: true,
    },
    compare: compareBlock({
      rivalSlugs: rivals,
      valueScore,
      advantages: [
        "Larger boot and cabin vs Nexon-class rivals",
        "Faster DC charging than many LFP mass SUVs",
      ],
      weaknesses: [
        "MG service network thinner than Tata in Tier 2/3",
        "Real-world efficiency can trail ARAI in highway use",
      ],
      featureMatrix: { connectedCar: true, panoramicRoof: true },
    }),
    seo: {
      ...seoBlock({
        slug,
        brand: BRAND,
        model: "ZS EV",
        variant: variantName,
        exShowroom,
        claimedKm,
        rivals: ["Nexon EV", "XUV400"],
      }),
      pros: [
        "Spacious family SUV with competitive ARAI range",
        "Strong DC charging for highway flexibility",
        "Feature-rich trims vs price",
      ],
      cons: [
        "Service network not as deep as Tata",
        "Resale confidence still building vs Nexon",
      ],
      expertSummary: narrative,
      faq: [
        {
          q: "Is MG ZS EV good for families?",
          a: "Yes — cabin and boot space are strengths; verify service outlet in your city.",
        },
      ],
      chargingFaq: [
        {
          q: "What is the DC charging capability?",
          a: "Up to ~92 kW peak on CCS2; faster than many mass-market LFP rivals.",
        },
      ],
    },
    media: mediaPaths(slug),
    governance: governance(score, flags),
    verification: verification(score, flags),
  };
}

function cometPlay() {
  const slug = "mg-comet-ev-play";
  const claimedKm = 230;
  const exShowroom = 798000;
  const flags = [
    flag("pricing.exShowroom", "estimated", "Verify Comet EV Play pricing"),
    flag("range.realWorldKm", "verified", "City-car conservative band — observation pilot aligned"),
    flag("trustPresentation", "verified", "Flagship editorial hardening — Comet Play"),
  ];
  return cometBase({
    slug,
    variantName: "Play",
    exShowroom,
    claimedKm,
    capacityKwh: 17.3,
    powerKw: 42,
    flags,
    score: 87,
    rivals: ["tata-tiago-ev-xt"],
    valueScore: 89,
    narrative:
      "City runabout EV for two-to-four seat urban trips where parking and U-turn ease matter more than highway range.",
  });
}

function cometPlushPlus() {
  const slug = "mg-comet-ev-plush-plus";
  const claimedKm = 230;
  const exShowroom = 998000;
  const flags = [flag("pricing.exShowroom", "estimated", "Verify Plush+ pricing")];
  return cometBase({
    slug,
    variantName: "Plush+",
    exShowroom,
    claimedKm,
    capacityKwh: 17.3,
    powerKw: 42,
    flags,
    score: 88,
    rivals: ["tata-tiago-ev-xz-plus", "tata-punch-ev-smart-plus"],
    valueScore: 86,
    narrative:
      "Top Comet trim for style-led city buyers who want connected features in the smallest footprint on this list.",
  });
}

function cometBase(opts) {
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
      brandSlug: "mg",
      modelSlug: "comet-ev",
      variantName,
      slug,
      bodyType: "hatchback",
      segment: "city-ev",
      launchStatus: "on-sale",
      modelYear: 2024,
      fuelType: "electric",
    },
    pricing: { exShowroom, priceLastUpdated: "2026-05-15T00:00:00.000Z" },
    battery: { capacityKwh, chemistry: "LFP" },
    range: {
      claimedKm,
      claimedStandard: "ARAI",
      realWorldKm: { min: 150, max: 195, methodology: "City-dominant use assumed" },
    },
    charging: { acKw: 3.3, dcKw: 0, standards: ["Type2"], v2l: { supported: false } },
    performance: { powerKw, driveType: "FWD", acceleration0to100: 12.8 },
    practicality: {
      bootSpaceL: 209,
      cityUsabilityScore: 95,
      familyScore: 55,
      highwayComfortScore: 50,
      seatingCapacity: 4,
    },
    ownership: {
      warrantyVehicleYears: 5,
      warrantyBatteryYears: 8,
      chargingNetworkScore: 60,
      resaleConfidenceScore: 70,
    },
    psychology: {
      tags: ["best_for_city", "wow_factor"],
      scores: {
        best_for_city: 95,
        best_first_ev: 80,
        wow_factor: 75,
        premium_feel: 60,
        tech_appeal: 72,
      },
      narrative,
    },
    availability: { waitingPeriodWeeks: 3, testDriveAvailable: true },
    compare: compareBlock({
      rivalSlugs: rivals,
      valueScore,
      advantages: ["Tiny footprint for urban parking", "Distinctive design"],
      weaknesses: ["Not highway-capable as primary car", "No DC fast charge"],
    }),
    seo: {
      ...seoBlock({
        slug,
        brand: BRAND,
        model: "Comet EV",
        variant: variantName,
        exShowroom,
        claimedKm,
      }),
      pros: ["Ideal second car or pure city commuter", "Easy ownership in metros"],
      cons: ["Four-seat limitation", "No DC charging for road trips"],
      expertSummary: narrative,
      faq: [
        {
          q: "Can Comet EV do highway trips?",
          a: "Occasional short highway legs only; choose Tiago or Punch for more range and DC charging.",
        },
      ],
      chargingFaq: [],
    },
    media: mediaPaths(slug),
    governance: governance(score, flags),
    verification: verification(score, flags),
  };
}
