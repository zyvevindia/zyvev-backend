const mongoose = require("mongoose");

const evModelSchema = new mongoose.Schema(
  {
    brandSlug: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    bodyType: { type: String, default: "" },
    segment: { type: String, default: "", index: true },
    launchStatus: {
      type: String,
      enum: ["on-sale", "upcoming", "discontinued"],
      default: "on-sale",
    },
    defaultHeroImage: { type: String, default: "" },
  },
  { timestamps: true }
);

evModelSchema.index(
  { brandSlug: 1, slug: 1 },
  { unique: true }
);

module.exports = mongoose.model("EvModel", evModelSchema);
