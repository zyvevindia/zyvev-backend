import {
  mediaPaths,
  flag,
  governance,
  verification,
  realWorldBand,
  seoBlock,
  compareBlock,
} from "./_helpers.js";

const BRAND = "Hyundai";

export const hyundaiVariants = [konaPremium()];

function konaPremium() {
  const slug = "hyundai-kona-electric-premium";
  const claimedKm = 484;
  const exShowroom = 2499000;
  const flags = [
    flag("pricing.exShowroom", "estimated", "Verify Hyundai India Kona Electric pricing"),
    flag("range.realWorldKm", "estimated", "Editorial band pending long-term India fleet data"),
  ];
  return {
    identity: {
      brandSlug: "hyundai",
      modelSlug: "kona-electric",
      variantName: "Premium",
      slug,
      bodyType: "suv",
      segment: "compact-suv",
      launchStatus: "on-sale",
      modelYear: 2024,
      fuelType: "electric",
    },
    pricing: {
      exShowroom,
      onRoadByCity: { delhi: 2620000, mumbai: 2680000, bangalore: 2610000 },
      emi: {
        monthlyInr: 43800,
        tenureMonths: 60,
        downPaymentInr: 500000,
        interestRateApr: 8.75,
        disclaimer: "Indicative",
      },
      priceLastUpdated: "2026-05-15T00:00:00.000Z",
    },
    battery: { capacityKwh: 64.8, usableKwh: 62, chemistry: "NMC" },
    range: {
      claimedKm,
      claimedStandard: "ARAI",
      realWorldKm: realWorldBand(claimedKm, 0.7, 0.84),
    },
    charging: {
      acKw: 11,
      dcKw: 100,
      dcTime10to80Minutes: 42,
      standards: ["CCS2", "Type2"],
      v2l: { supported: false },
    },
    performance: {
      powerKw: 150,
      torqueNm: 395,
      acceleration0to100: 7.8,
      driveType: "FWD",
      driveModes: ["Eco", "Normal", "Sport"],
    },
    practicality: {
      bootSpaceL: 332,
      familyScore: 78,
      highwayComfortScore: 85,
      cityUsabilityScore: 80,
      groundClearanceMm: 178,
      seatingCapacity: 5,
    },
    ownership: {
      warrantyVehicleYears: 5,
      warrantyBatteryYears: 8,
      warrantyBatteryKm: 160000,
      chargingNetworkScore: 70,
      resaleConfidenceScore: 81,
      serviceCostPerKm: 0.52,
    },
    psychology: {
      tags: ["premium_feel", "tech_appeal", "silent_comfort"],
      scores: {
        premium_feel: 82,
        tech_appeal: 85,
        silent_comfort: 84,
        highwayComfortScore: 85,
        best_for_family: 76,
        wow_factor: 70,
      },
      narrative:
        "Refined compact electric SUV for upgraders from mass-market EVs who want Hyundai polish, highway stability, and faster DC charging.",
    },
    availability: {
      availableCities: ["delhi", "mumbai", "bangalore", "chennai", "hyderabad"],
      waitingPeriodWeeks: 5,
      testDriveAvailable: true,
    },
    compare: compareBlock({
      rivalSlugs: [
        "byd-atto-3-superior",
        "mg-zs-ev-exclusive-plus",
        "tata-curvv-ev-empowered-lr",
      ],
      valueScore: 78,
      advantages: [
        "Mature Hyundai ownership experience in metros",
        "Strong highway manners and DC charging",
        "Perceived cabin quality vs mass LFP SUVs",
      ],
      weaknesses: [
        "Price premium over Nexon/XUV400/ZS value plays",
        "Boot space not class-leading",
      ],
      featureMatrix: { adasLevel2: true, connectedCar: true, ventilatedSeats: true },
    }),
    seo: {
      ...seoBlock({
        slug,
        brand: BRAND,
        model: "Kona Electric",
        variant: "Premium",
        exShowroom,
        claimedKm,
        rivals: ["Atto 3", "ZS EV"],
      }),
      pros: [
        "Upscale driving refinement for highway-heavy users",
        "Competitive DC charging vs older mass-market rivals",
        "Hyundai brand trust in premium metros",
      ],
      cons: [
        "Higher price than Nexon/XUV400 core compare set",
        "Value score weaker if budget is primary filter",
      ],
      expertSummary:
        "Kona Electric suits buyers graduating from first EV who want quieter highway travel and brand polish. If budget-led, stay in Nexon/XUV400; if tech-led, cross-shop Atto 3 Superior.",
      faq: [
        {
          q: "Is Kona Electric worth the premium over Nexon EV?",
          a: "Worth it if you drive highways often and value refinement; Nexon wins on value and service breadth.",
        },
      ],
      chargingFaq: [
        {
          q: "Can I use 100 kW DC chargers?",
          a: "Yes on CCS2; peak depends on charger and battery conditions.",
        },
      ],
    },
    media: mediaPaths(slug),
    governance: governance(90, flags),
    verification: verification(90, flags),
  };
}
