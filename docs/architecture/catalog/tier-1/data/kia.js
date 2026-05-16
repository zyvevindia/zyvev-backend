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

const BRAND = "Kia";

export const kiaVariants = [ev6GtLine()];

function ev6GtLine() {
  const slug = "kia-ev6-gt-line";
  const claimedKm = 708;
  const exShowroom = 6590000;
  const flags = [
    flag("pricing.exShowroom", "needs_review", "Confirm EV6 GT Line India pricing"),
    flag("range.claimedKm", "needs_review", "Verify ARAI certified range"),
    flag("battery.capacityKwh", "needs_review", "Confirm pack from OEM spec sheet"),
  ];
  const charging = chargingBlock({
    acKw: 11,
    acTime0to100Hours: 7.5,
    dcKw: 240,
    dcTime10to80Minutes: 18,
  });
  return {
    identity: {
      brandSlug: "kia",
      modelSlug: "ev6",
      variantName: "GT Line",
      slug,
      bodyType: "crossover",
      segment: "luxury-suv",
      launchStatus: "on-sale",
      modelYear: 2024,
      fuelType: "electric",
    },
    pricing: { exShowroom, priceLastUpdated: "2026-05-15T00:00:00.000Z" },
    battery: { capacityKwh: 77.4, chemistry: "NMC" },
    range: {
      claimedKm,
      claimedStandard: "ARAI",
      realWorldKm: realWorldBand(claimedKm, 0.6, 0.75),
    },
    charging,
    performance: {
      powerKw: 229,
      driveType: "AWD",
      acceleration0to100: 5.3,
    },
    practicality: {
      bootSpaceL: 520,
      familyScore: 84,
      highwayComfortScore: 90,
      cityUsabilityScore: 70,
      seatingCapacity: 5,
    },
    ownership: {
      warrantyVehicleYears: 3,
      warrantyBatteryYears: 8,
      warrantyBatteryKm: 160000,
      chargingNetworkScore: 75,
      resaleConfidenceScore: 78,
      serviceCostPerKm: 0.58,
    },
    psychology: {
      tags: ["premium_feel", "wow_factor", "tech_appeal"],
      scores: {
        premium_feel: 92,
        wow_factor: 90,
        tech_appeal: 88,
        best_for_family: 82,
      },
      narrative:
        "Premium E-GMP crossover for buyers cross-shopping German luxury EVs who want fast charging and long range.",
    },
    availability: {
      availableCities: ["delhi", "mumbai", "bangalore", "hyderabad"],
      waitingPeriodWeeks: 6,
      testDriveAvailable: true,
    },
    compare: compareBlock({
      rivalSlugs: [
        "bmw-ix1-xdrive30",
        "mercedes-eqb-250-plus",
        "volvo-ex40-twin-motor",
      ],
      valueScore: 76,
      advantages: ["800V-class fast charging", "Long ARAI range headline", "Strong feature load"],
      weaknesses: ["Luxury pricing", "Wide body for tight city parking"],
    }),
    seo: {
      ...seoBlock({
        slug,
        brand: BRAND,
        model: "EV6",
        variant: "GT Line",
        exShowroom,
        claimedKm,
      }),
      pros: ["Highway road-trip confidence", "Premium cabin and ADAS depth"],
      cons: ["Requires budget for luxury EV ownership"],
      expertSummary:
        "EV6 GT Line targets enthusiasts and premium family buyers who value charging speed and range over mass-market value.",
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
    governance: governance(90, flags),
    verification: verification(90, flags),
  };
}
