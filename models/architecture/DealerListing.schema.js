/**
 * PROPOSED — Dealer inventory layer (commercial overlay on master variant).
 * Separates specs (EvMasterVariant) from dealer-specific availability/pricing.
 */

const mongoose = require("mongoose");

const dealerListingSchema = new mongoose.Schema(
  {
    dealerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dealer",
      required: true,
      index: true,
    },

    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EvMasterVariant",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["active", "sold", "unavailable", "pending"],
      default: "active",
      index: true,
    },

    pricing: {
      onRoadQuote: Number,
      discountInr: Number,
      exchangeBonusInr: Number,
      quoteValidUntil: Date,
    },

    availability: {
      cities: [String],
      waitingPeriodWeeks: Number,
      testDriveAvailable: { type: Boolean, default: true },
      stockCount: { type: Number, default: 0 },
    },

    contact: {
      salesPhone: String,
      salesEmail: String,
    },

    notes: {
      type: String,
      default: "",
    },

    legacyCarId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
      sparse: true,
    },
  },
  { timestamps: true }
);

dealerListingSchema.index(
  { dealerId: 1, variantId: 1 },
  { unique: true }
);
dealerListingSchema.index({ dealerId: 1, status: 1 });
dealerListingSchema.index({ "availability.cities": 1 });
dealerListingSchema.index({ variantId: 1, status: 1 });

module.exports = mongoose.model(
  "DealerListing",
  dealerListingSchema
);
