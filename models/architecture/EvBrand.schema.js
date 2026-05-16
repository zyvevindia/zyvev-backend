/**
 * PROPOSED — Master catalog (not wired to production API yet).
 * Do not drop or alter existing `Car` collection.
 */

const mongoose = require("mongoose");

const evBrandSchema = new mongoose.Schema(
  {
    name: {
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

    country: {
      type: String,
      default: "IN",
    },

    logoUrl: {
      type: String,
      default: "",
    },

    websiteUrl: {
      type: String,
      default: "",
    },

    evPortfolioNotes: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

evBrandSchema.index({ slug: 1 }, { unique: true });
evBrandSchema.index({ status: 1 });

module.exports = mongoose.model(
  "EvBrand",
  evBrandSchema
);
