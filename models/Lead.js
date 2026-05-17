const mongoose = require("mongoose");

/* =========================================================
   ====================== LEAD SCHEMA =======================
   ========================================================= */

const leadSchema = new mongoose.Schema(

  {

    /* =====================================================
       ======================== NAME ========================
       ===================================================== */

    name: {
      type: String,
      required: true,
      trim: true
    },

    /* =====================================================
       ======================= PHONE ========================
       ===================================================== */

    phone: {
      type: String,
      required: true,
      trim: true
    },

    /* =====================================================
       ======================= EMAIL ========================
       ===================================================== */

    email: {
      type: String,
      trim: true,
      default: ""
    },

    /* =====================================================
       ======================== CITY ==========================
       ===================================================== */

    city: {
      type: String,
      trim: true,
      default: ""
    },

    /* =====================================================
       ======================= MESSAGE ======================
       ===================================================== */

    message: {
      type: String,
      trim: true,
      default: ""
    },

    /* =====================================================
       ===================== SOURCE PAGE ====================
       ===================================================== */

    sourcePage: {
      type: String,
      trim: true,
      default: ""
    },

    leadSource: {
      type: String,
      trim: true,
      default: "form",
    },

    familySlug: {
      type: String,
      trim: true,
      default: "",
    },

    variantSlug: {
      type: String,
      trim: true,
      default: "",
    },

    leadMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    /* =====================================================
       ===================== VEHICLE NAME ===================
       ===================================================== */

    vehicleName: {
      type: String,
      trim: true,
      default: ""
    },

    /* =====================================================
       ===================== VEHICLE ID =====================
       ===================================================== */

    vehicleId: {
      type: String,
      trim: true,
      default: ""
    },

    /* =====================================================
       ======================== CAR =========================
       ===================================================== */

    carId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
      default: null
    },

    /* =====================================================
       ==================== ASSIGNED TO =====================
       ===================================================== */

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null
    },

    /* =====================================================
       ================== ASSIGNED DEALER ===================
       ===================================================== */

    assignedDealer: {
      type: String,
      trim: true,
      default: ""
    },

    /* =====================================================
       ==================== DEALER ACCOUNT ==================
       ===================================================== */

    dealer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dealer",
      default: null
    },

    /* =====================================================
       ==================== ASSIGNED AT =====================
       ===================================================== */

    assignedAt: {
      type: Date,
      default: null
    },

    /* =====================================================
       ================== FIRST RESPONSE AT =================
       ===================================================== */

    firstRespondedAt: {
      type: Date,
      default: null
    },

    /* =====================================================
       ======================== STATUS ======================
       ===================================================== */

    status: {
      type: String,

      enum: [
        "new",
        "assigned",
        "contacted",
        "follow_up",
        "interested",
        "test_drive",
        "negotiation",
        "won",
        "converted",
        "lost"
      ],

      default: "new"
    },

    /* =====================================================
       =================== STATUS HISTORY ===================
       ===================================================== */

    statusHistory: [
      {
        status: {
          type: String,
          trim: true
        },

        at: {
          type: Date,
          default: Date.now
        },

        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Admin",
          default: null
        },

        changedByDealer: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Dealer",
          default: null
        }
      }
    ],

    /* =====================================================
       ========================= READ =======================
       ===================================================== */

    readByAdmin: {
      type: Boolean,
      default: false
    },

    readByDealer: {
      type: Boolean,
      default: false
    },

    /* =====================================================
       ========================= NOTES ======================
       ===================================================== */

    notes: [
      {
        text: {
          type: String,
          trim: true
        },

        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Admin"
        },

        createdByDealer: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Dealer",
          default: null
        },

        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    /* =====================================================
       ==================== NEXT FOLLOW-UP ==================
       ===================================================== */

    nextFollowUp: {
      type: Date,
      default: null
    },

    /* =====================================================
       ================= FOLLOW-UP COMPLETED ================
       ===================================================== */

    followUpCompleted: {
      type: Boolean,
      default: false
    },

    /* =====================================================
       ======================== PRIORITY ====================
       ===================================================== */

    priority: {

      type: String,

      enum: [
        "low",
        "medium",
        "high",
        "urgent"
      ],

      default: "medium"
    },

    /* =====================================================
       ========= ANONYMOUS BUYER INTENT (INTERNAL) ===========
       Not exposed to dealer APIs — foundation for future use.
       ===================================================== */

    anonymousSessionId: {
      type: String,
      trim: true,
      default: "",
      select: false,
    },

    buyerIntentContext: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      select: false,
    },

  },

  /* =======================================================
     ======================== OPTIONS =======================
     ======================================================= */

  {
    timestamps: true
  }

);

/* =========================================================
   ========================= EXPORT =========================
   ========================================================= */

leadSchema.index({ status: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ dealer: 1 });
leadSchema.index({ sourcePage: 1 });
leadSchema.index({ leadSource: 1 });
leadSchema.index({ familySlug: 1 });
leadSchema.index({ city: 1 });
leadSchema.index({ vehicleName: 1 });
leadSchema.index({ dealer: 1, status: 1 });
leadSchema.index({ anonymousSessionId: 1, status: 1 });
leadSchema.index({ dealer: 1, readByDealer: 1 });

module.exports = mongoose.model(
  "Lead",
  leadSchema
);
