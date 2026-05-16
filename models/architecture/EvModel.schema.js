/**
 * PROPOSED — Model-level grouping (one model, many variants).
 */

const mongoose = require("mongoose");

const evModelSchema = new mongoose.Schema(
  {
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EvBrand",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    bodyType: {
      type: String,
      enum: [
        "hatchback",
        "sedan",
        "suv",
        "coupe-suv",
        "mpv",
        "pickup",
        "other",
      ],
      required: true,
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

    defaultHeroImage: {
      type: String,
      default: "",
    },

    legacyCarIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Car",
      },
    ],
  },
  { timestamps: true }
);

evModelSchema.index(
  { brandId: 1, slug: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "EvModel",
  evModelSchema
);
