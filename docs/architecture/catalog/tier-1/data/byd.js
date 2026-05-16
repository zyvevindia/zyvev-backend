import {
  mediaPaths,
  flag,
  governance,
  verification,
  realWorldBand,
  seoBlock,
  compareBlock,
} from "./_helpers.js";

const BRAND = "BYD";

export const bydVariants = [atto3Dynamic(), atto3Superior()];

function atto3Dynamic() {
  const slug = "byd-atto-3-dynamic";
  const claimedKm = 468;
  const exShowroom = 2499000;
  const flags = [flag("pricing.exShowroom", "estimated", "Verify BYD India Atto 3 Dynamic pricing")];
  return attoBase({
    slug,
    variantName: "Dynamic",
    exShowroom,
    claimedKm,
    flags,
    score: 90,
    rivals: [
      "hyundai-kona-electric-premium",
      "mg-zs-ev-exclusive-plus",
      "mahindra-xuv400-el-pro",
    ],
    valueScore: 82,
    narrative:
      "Tech-forward Atto 3 for buyers who want Blade Battery narrative, strong efficiency, and modern cabin at a premium mass price.",
  });
}

function atto3Superior() {
  const slug = "byd-atto-3-superior";
  const claimedKm = 521;
  const exShowroom = 2999000;
  const flags = [
    flag("pricing.exShowroom", "estimated", "Verify Superior trim pricing"),
    flag("range.claimedKm", "needs_review", "Confirm longest-range Atto 3 trim ARAI"),
  ];
  return attoBase({
    slug,
    variantName: "Superior",
    exShowroom,
    claimedKm,
    flags,
    score: 91,
    rivals: [
      "hyundai-kona-electric-premium",
      "tata-curvv-ev-empowered-lr",
    ],
    valueScore: 80,
    narrative:
      "Top Atto 3 for range- and feature-focused buyers comparing Kona and upcoming coupe-SUV launches.",
  });
}

function attoBase(opts) {
  const {
    slug,
    variantName,
    exShowroom,
    claimedKm,
    flags,
    score,
    rivals,
    valueScore,
    narrative,
  } = opts;
  const capacityKwh = claimedKm > 500 ? 60.48 : 49.92;
  return {
    identity: {
      brandSlug: "byd",
      modelSlug: "atto-3",
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
    battery: { capacityKwh, chemistry: "LFP", usableKwh: capacityKwh * 0.95 },
    range: {
      claimedKm,
      claimedStandard: "ARAI",
      realWorldKm: realWorldBand(claimedKm, 0.72, 0.86),
    },
    charging: {
      acKw: 7,
      dcKw: 88,
      dcTime10to80Minutes: 45,
      standards: ["CCS2", "Type2"],
      v2l: { supported: true, maxWatts: 2200 },
    },
    performance: {
      powerKw: 150,
      torqueNm: 310,
      acceleration0to100: 7.3,
      driveType: "FWD",
    },
    practicality: {
      bootSpaceL: 400,
      familyScore: 84,
      highwayComfortScore: 82,
      cityUsabilityScore: 78,
      seatingCapacity: 5,
    },
    ownership: {
      warrantyVehicleYears: 5,
      warrantyBatteryYears: 8,
      warrantyBatteryKm: 150000,
      chargingNetworkScore: 62,
      resaleConfidenceScore: 74,
      serviceCostPerKm: 0.5,
    },
    psychology: {
      tags: ["tech_appeal", "wow_factor", "premium_feel"],
      scores: {
        tech_appeal: 90,
        wow_factor: 85,
        premium_feel: 80,
        best_for_family: 82,
        silent_comfort: 83,
        best_first_ev: 65,
      },
      narrative,
    },
    availability: {
      availableCities: ["delhi", "mumbai", "bangalore", "hyderabad", "chennai"],
      waitingPeriodWeeks: 6,
      testDriveAvailable: true,
    },
    compare: compareBlock({
      rivalSlugs: rivals,
      valueScore,
      advantages: [
        "Strong tech and efficiency story vs legacy OEM EVs",
        "Competitive DC charging and LFP durability messaging",
        "Spacious cabin for segment",
      ],
      weaknesses: [
        "Service network still maturing outside major metros",
        "Resale track record shorter than Tata/Mahindra",
      ],
      featureMatrix: {
        adasLevel2: true,
        connectedCar: true,
        v2l: true,
        heatPump: true,
      },
    }),
    seo: {
      ...seoBlock({
        slug,
        brand: BRAND,
        model: "Atto 3",
        variant: variantName,
        exShowroom,
        claimedKm,
        rivals: ["Kona Electric", "ZS EV"],
      }),
      pros: [
        "Standout infotainment and EV-native cabin design",
        "Blade Battery LFP positioning for safety-conscious buyers",
        "Strong performance and charging for the price band",
      ],
      cons: [
        "Premium pricing vs Nexon/XUV400 value set",
        "Dealer/service density still building in India",
      ],
      expertSummary: narrative,
      faq: [
        {
          q: "Is BYD Atto 3 good for first-time EV buyers?",
          a: "Better for tech-comfortable buyers in metros; first-timers on tight budget should compare Nexon and Punch.",
        },
      ],
      chargingFaq: [
        {
          q: "Does Atto 3 support V2L?",
          a: "Yes on supported trims — verify inverter limits in owner manual.",
        },
      ],
    },
    media: mediaPaths(slug),
    governance: governance(score, flags),
    verification: verification(score, flags),
  };
}
