const mongoose = require("mongoose");

/* =========================================================
   EV MASTER VARIANT — aligns with Tier-1 JSON import shape
   ========================================================= */

const identitySchema = new mongoose.Schema(
  {
    brandSlug: { type: String, required: true, lowercase: true, trim: true },
    modelSlug: { type: String, required: true, lowercase: true, trim: true },
    variantName: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    bodyType: { type: String, required: true },
    segment: { type: String, required: true, index: true },
    launchStatus: {
      type: String,
      enum: ["on-sale", "upcoming", "discontinued"],
      default: "on-sale",
    },
    modelYear: Number,
    fuelType: { type: String, default: "electric" },
  },
  { _id: false }
);

const evMasterVariantSchema = new mongoose.Schema(
  {
    identity: {
      type: identitySchema,
      required: true,
    },

    pricing: { type: mongoose.Schema.Types.Mixed, default: {} },
    battery: { type: mongoose.Schema.Types.Mixed, default: {} },
    range: { type: mongoose.Schema.Types.Mixed, default: {} },
    charging: { type: mongoose.Schema.Types.Mixed, default: {} },
    performance: { type: mongoose.Schema.Types.Mixed, default: {} },
    practicality: { type: mongoose.Schema.Types.Mixed, default: {} },
    ownership: { type: mongoose.Schema.Types.Mixed, default: {} },
    psychology: { type: mongoose.Schema.Types.Mixed, default: {} },
    availability: { type: mongoose.Schema.Types.Mixed, default: {} },
    compare: { type: mongoose.Schema.Types.Mixed, default: {} },
    seo: { type: mongoose.Schema.Types.Mixed, default: {} },
    media: { type: mongoose.Schema.Types.Mixed, default: {} },

    /** Catalog intelligence sprint — optional structured blocks */
    safety: { type: mongoose.Schema.Types.Mixed, default: null },
    comfort: { type: mongoose.Schema.Types.Mixed, default: null },
    chargingEcosystem: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    ownershipIntelligence: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    psychologyExtended: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    decision: { type: mongoose.Schema.Types.Mixed, default: null },
    personaFit: { type: mongoose.Schema.Types.Mixed, default: null },
    commercial: { type: mongoose.Schema.Types.Mixed, default: null },
    scenarioFit: { type: mongoose.Schema.Types.Mixed, default: null },
    editorialNarratives: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    intelligenceGovernance: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    rangeReality: { type: mongoose.Schema.Types.Mixed, default: null },
    chargingReality: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    buyerAssurance: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    ownershipTradeoffs: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    scenarioCompare: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    governance: {
      status: {
        type: String,
        enum: ["draft", "review", "published", "archived"],
        default: "draft",
        index: true,
      },
      source: { type: String, default: "evsavari" },
      dataQualityScore: { type: Number, min: 0, max: 100 },
      version: { type: Number, default: 1 },
      publishedAt: Date,
      legacyCarId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Car",
        default: null,
      },
      confidence: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium",
      },
    },

    verification: {
      dataQualityScore: Number,
      confidence: String,
      flags: [
        {
          path: String,
          status: String,
          note: String,
          reviewBy: String,
        },
      ],
      lastReviewedAt: Date,
      sources: [mongoose.Schema.Types.Mixed],
    },
  },
  { timestamps: true }
);

evMasterVariantSchema.index(
  { "identity.slug": 1 },
  { unique: true }
);

evMasterVariantSchema.index({
  "governance.status": 1,
  "pricing.exShowroom": 1,
});

evMasterVariantSchema.index({
  "identity.brandSlug": 1,
  "identity.modelSlug": 1,
});

module.exports = mongoose.model(
  "EvMasterVariant",
  evMasterVariantSchema
);
