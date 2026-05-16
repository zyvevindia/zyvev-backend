/**
 * PROPOSED — Canonical EV variant (master catalog).
 * Sections A–K per docs/architecture/ev-master-data-architecture.md
 */

const mongoose = require("mongoose");

const faqItemSchema = new mongoose.Schema(
  {
    q: { type: String, required: true },
    a: { type: String, required: true },
  },
  { _id: false }
);

const advantageSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
  },
  { _id: false }
);

const videoSchema = new mongoose.Schema(
  {
    title: String,
    url: String,
    provider: {
      type: String,
      enum: ["youtube", "vimeo", "other"],
      default: "youtube",
    },
  },
  { _id: false }
);

const evMasterVariantSchema = new mongoose.Schema(
  {
    /* ========== A. Identity ========== */
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EvBrand",
      required: true,
      index: true,
    },

    modelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EvModel",
      required: true,
      index: true,
    },

    variantName: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    bodyType: {
      type: String,
      required: true,
      index: true,
    },

    segment: {
      type: String,
      required: true,
      index: true,
    },

    launchStatus: {
      type: String,
      enum: ["on-sale", "upcoming", "discontinued"],
      default: "on-sale",
      index: true,
    },

    modelYear: Number,

    fuelType: {
      type: String,
      default: "electric",
    },

    /* ========== B. Pricing ========== */
    pricing: {
      exShowroom: {
        type: Number,
        required: true,
        index: true,
      },

      onRoadByCity: {
        type: Map,
        of: Number,
      },

      emi: {
        monthlyInr: Number,
        tenureMonths: Number,
        downPaymentInr: Number,
        interestRateApr: Number,
        disclaimer: String,
      },

      subsidy: {
        centralFameInr: { type: Number, default: 0 },
        stateSubsidyInr: { type: Number, default: 0 },
        stateCode: String,
        notes: String,
      },

      ownershipCost5yr: {
        totalInr: Number,
        energyInr: Number,
        serviceInr: Number,
        insuranceInr: Number,
        computedAt: Date,
      },

      priceLastUpdated: {
        type: Date,
        default: Date.now,
      },
    },

    /* ========== C. Battery & charging ========== */
    battery: {
      capacityKwh: { type: Number, required: true },
      usableKwh: Number,
      chemistry: String,
    },

    range: {
      claimedKm: {
        type: Number,
        required: true,
        index: true,
      },
      claimedStandard: {
        type: String,
        default: "ARAI",
      },
      realWorldKm: {
        min: Number,
        max: Number,
        methodology: String,
      },
    },

    charging: {
      acKw: Number,
      acTime0to100Hours: Number,
      dcKw: Number,
      dcTime10to80Minutes: Number,
      standards: [String],
      v2l: {
        supported: { type: Boolean, default: false },
        maxWatts: Number,
      },
      v2v: {
        supported: { type: Boolean, default: false },
      },
      regenLevels: [String],
    },

    /* ========== D. Performance ========== */
    performance: {
      powerKw: { type: Number, index: true },
      powerHp: Number,
      torqueNm: Number,
      acceleration0to100: Number,
      driveType: String,
      driveModes: [String],
    },

    /* ========== E. Practicality ========== */
    practicality: {
      bootSpaceL: Number,
      familyScore: { type: Number, min: 0, max: 100 },
      highwayComfortScore: { type: Number, min: 0, max: 100 },
      cityUsabilityScore: { type: Number, min: 0, max: 100 },
      groundClearanceMm: Number,
      turningRadiusM: Number,
      seatingCapacity: { type: Number, default: 5 },
    },

    /* ========== F. Ownership confidence ========== */
    ownership: {
      warrantyVehicleYears: Number,
      warrantyVehicleKm: Number,
      warrantyBatteryYears: Number,
      warrantyBatteryKm: Number,
      serviceCostPerKm: Number,
      chargingNetworkScore: { type: Number, min: 0, max: 100 },
      resaleConfidenceScore: { type: Number, min: 0, max: 100 },
      softwareUpdatePolicy: String,
    },

    /* ========== G. Psychology / lifestyle ========== */
    psychology: {
      tags: {
        type: [String],
        index: true,
      },
      scores: {
        type: Map,
        of: Number,
      },
      narrative: String,
    },

    psychologyExtended: {
      scores: {
        anxietyReduction: Number,
        firstTimeEvFriendliness: Number,
        premiumPerception: Number,
        enthusiastAppeal: Number,
        chauffeurSuitability: Number,
        womenDriverFriendliness: Number,
        seniorCitizenFriendliness: Number,
      },
      narrative: String,
    },

    /* ========== G2. Safety ========== */
    safety: {
      bharatNcap: { stars: Number, year: Number },
      globalNcap: { stars: Number },
      airbags: { count: Number, curtains: Boolean },
      adas: { level: Number, features: [String] },
      cameraSystems: [String],
      parkingAssist: [String],
      stability: { esc: Boolean, hillHold: Boolean },
    },

    /* ========== G3. Comfort (extends practicality) ========== */
    comfort: {
      seatVentilation: Boolean,
      rearSeatComfortScore: Number,
      bootPracticalityScore: Number,
      familySuitabilityScore: Number,
      cityManeuverabilityScore: Number,
      ingressEgressScore: Number,
    },

    /* ========== C2. Charging ecosystem ========== */
    chargingEcosystem: {
      networkCompatibility: [String],
      homeCharging: mongoose.Schema.Types.Mixed,
      fastChargeCurve: mongoose.Schema.Types.Mixed,
      estimatedChargingCost: mongoose.Schema.Types.Mixed,
    },

    /* ========== F2. Ownership intelligence ========== */
    ownershipIntelligence: {
      estimatedServiceCostPerKm: Number,
      batteryReplacementEstimateInr: Number,
      insuranceAnnualRangeInr: { min: Number, max: Number },
      resaleConfidenceScore: Number,
    },

    /* ========== Decision helper ========== */
    decision: {
      whoShouldBuy: [String],
      whoShouldAvoid: [String],
      bestAlternativeSlug: String,
      upgradePathSlug: String,
      downgradePathSlug: String,
    },

    personaFit: {
      cityCommuter: Number,
      familyEv: Number,
      highwayTourer: Number,
      firstEv: Number,
      premiumEv: Number,
      valueEv: Number,
    },

    /* ========== Future commercial ========== */
    commercial: {
      subscription: { ready: Boolean },
      batteryLeasing: { ready: Boolean },
      fleet: { suitabilityScore: Number },
      taxiCommercial: { suitabilityScore: Number },
    },

    /* ========== H. Availability (master defaults) ========== */
    availability: {
      availableCities: [String],
      dealerCountNational: Number,
      waitingPeriodWeeks: Number,
      testDriveAvailable: { type: Boolean, default: true },
    },

    /* ========== I. Compare intelligence ========== */
    compare: {
      segmentRivalIds: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "EvMasterVariant",
        },
      ],
      strongestAdvantages: [advantageSchema],
      weakestAreas: [advantageSchema],
      valueScore: {
        type: Number,
        min: 0,
        max: 100,
        index: true,
      },
      picks: {
        strongestAdvantageLabel: String,
        biggestWeaknessLabel: String,
        bestValuePick: Boolean,
        bestLongTermOwnershipPick: Boolean,
      },
      featureMatrix: {
        type: Map,
        of: Boolean,
      },
    },

    /* ========== J. SEO intelligence ========== */
    seo: {
      metaTitle: { type: String, required: true },
      metaDescription: { type: String, required: true },
      pros: { type: [String], required: true },
      cons: { type: [String], required: true },
      expertSummary: { type: String, required: true },
      faq: [faqItemSchema],
      chargingFaq: [faqItemSchema],
      canonicalPath: { type: String, index: true },
    },

    /* ========== K. Media ========== */
    media: {
      heroImage: { type: String, required: true },
      listingThumbnail: { type: String },
      compareThumbnail: { type: String },
      ogImage: { type: String },
      gallery: [String],
      interior: [String],
      charging: [String],
      videos: [videoSchema],
    },

    /* ========== Governance ========== */
    status: {
      type: String,
      enum: ["draft", "review", "published", "archived"],
      default: "draft",
      index: true,
    },

    dataQualityScore: Number,

    source: {
      type: String,
      enum: ["oem", "evsavari", "import"],
      default: "evsavari",
    },

    legacyCarId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
      sparse: true,
    },

    publishedAt: Date,

    version: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

evMasterVariantSchema.index({ slug: 1 }, { unique: true });
evMasterVariantSchema.index({
  status: 1,
  "pricing.exShowroom": 1,
});
evMasterVariantSchema.index({
  segment: 1,
  launchStatus: 1,
});
evMasterVariantSchema.index({ "range.claimedKm": -1 });
evMasterVariantSchema.index({ "compare.valueScore": -1 });
evMasterVariantSchema.index({ "psychology.tags": 1 });
evMasterVariantSchema.index({ legacyCarId: 1 }, { sparse: true });

module.exports = mongoose.model(
  "EvMasterVariant",
  evMasterVariantSchema
);
