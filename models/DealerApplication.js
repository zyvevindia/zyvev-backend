const mongoose = require("mongoose");

const ONBOARDING_STATUSES = [
  "pending",
  "under_review",
  "approved",
  "rejected",
];

const dealerApplicationSchema = new mongoose.Schema(
  {
    dealershipName: {
      type: String,
      required: true,
      trim: true,
    },

    contactName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    citySlug: {
      type: String,
      required: true,
      trim: true,
    },

    brands: [
      {
        type: String,
        trim: true,
      },
    ],

    address: {
      type: String,
      trim: true,
      default: "",
    },

    gstin: {
      type: String,
      trim: true,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    onboardingStatus: {
      type: String,
      enum: ONBOARDING_STATUSES,
      default: "pending",
    },

    leadQueue: {
      type: String,
      trim: true,
      default: "dealer-onboarding",
    },

    assignedTo: {
      type: String,
      trim: true,
      default: "",
    },

    reviewNotes: {
      type: String,
      trim: true,
      default: "",
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    approvedDealer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dealer",
      default: null,
    },
  },
  { timestamps: true }
);

dealerApplicationSchema.index({ email: 1 });
dealerApplicationSchema.index({ onboardingStatus: 1, createdAt: -1 });
dealerApplicationSchema.index({ citySlug: 1 });

module.exports = mongoose.model(
  "DealerApplication",
  dealerApplicationSchema
);

module.exports.ONBOARDING_STATUSES = ONBOARDING_STATUSES;
