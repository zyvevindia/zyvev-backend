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

const BRAND = "BMW";

export const bmwVariants = [ix1Xdrive30()];

function ix1Xdrive30() {
  const slug = "bmw-ix1-xdrive30";
  const claimedKm = 490;
  const exShowroom = 5490000;
  const flags = [
    flag("pricing.exShowroom", "needs_review", "Confirm BMW iX1 India pricing"),
    flag("range.claimedKm", "needs_review", "Verify ARAI range for xDrive30"),
  ];
  const charging = chargingBlock({
    acKw: 11,
    acTime0to100Hours: 7,
    dcKw: 130,
    dcTime10to80Minutes: 29,
  });
  return {
    identity: {
      brandSlug: "bmw",
      modelSlug: "ix1",
      variantName: "xDrive30",
      slug,
      bodyType: "suv",
      segment: "luxury-suv",
      launchStatus: "on-sale",
      modelYear: 2024,
      fuelType: "electric",
    },
    pricing: { exShowroom, priceLastUpdated: "2026-05-15T00:00:00.000Z" },
    battery: { capacityKwh: 64.7, chemistry: "NMC" },
    range: {
      claimedKm,
      claimedStandard: "ARAI",
      realWorldKm: realWorldBand(claimedKm, 0.62, 0.76),
    },
    charging,
    performance: {
      powerKw: 230,
      driveType: "AWD",
      acceleration0to100: 5.6,
    },
    practicality: {
      bootSpaceL: 490,
      familyScore: 80,
      highwayComfortScore: 88,
      cityUsabilityScore: 72,
      seatingCapacity: 5,
    },
    ownership: {
      warrantyVehicleYears: 3,
      warrantyBatteryYears: 8,
      warrantyBatteryKm: 160000,
      chargingNetworkScore: 74,
      resaleConfidenceScore: 80,
      serviceCostPerKm: 0.62,
    },
    psychology: {
      tags: ["premium_feel", "tech_appeal"],
      scores: { premium_feel: 94, tech_appeal: 90, best_for_family: 78 },
      narrative:
        "Compact luxury BMW EV for urban professionals who want badge value with usable range.",
    },
    availability: {
      availableCities: ["delhi", "mumbai", "bangalore"],
      waitingPeriodWeeks: 4,
      testDriveAvailable: true,
    },
    compare: compareBlock({
      rivalSlugs: [
        "mercedes-eqa-250-plus",
        "volvo-ex40-single-motor",
        "kia-ev6-gt-line",
      ],
      valueScore: 74,
      advantages: ["BMW driving dynamics", "Premium brand residual appeal"],
      weaknesses: ["Price premium vs Korean rivals", "Service costs at luxury rates"],
    }),
    seo: {
      ...seoBlock({
        slug,
        brand: BRAND,
        model: "iX1",
        variant: "xDrive30",
        exShowroom,
        claimedKm,
      }),
      pros: ["Premium ownership experience", "Balanced city + highway use"],
      cons: ["High acquisition and insurance cost"],
      expertSummary:
        "iX1 xDrive30 suits buyers who want a compact luxury EV with strong brand cachet.",
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
    governance: governance(89, flags),
    verification: verification(89, flags),
  };
}
