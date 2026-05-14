const mongoose = require("mongoose");

/* =========================================================
   ===================== DEALER SCHEMA =====================
   ========================================================= */

const dealerSchema = new mongoose.Schema(

  {

    name: {
      type: String,
      trim: true,
      default: ""
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    phone: {
      type: String,
      trim: true,
      default: ""
    },

    cities: [
      {
        type: String,
        trim: true
      }
    ],

    brands: [
      {
        type: String,
        trim: true
      }
    ],

    isActive: {
      type: Boolean,
      default: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null
    }

  },

  {
    timestamps: true
  }

);

dealerSchema.index({ email: 1 });
dealerSchema.index({ isActive: 1 });

module.exports = mongoose.model(
  "Dealer",
  dealerSchema
);
