const mongoose = require("mongoose");

/* =========================================================
   ======================= COLOR SCHEMA ====================
   ========================================================= */

const colorSchema =
  new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
      },

      image: {
        type: String,
        required: true,
      },
    },
    { _id: false }
  );

/* =========================================================
   ====================== VARIANT SCHEMA ===================
   ========================================================= */

const variantSchema =
  new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
      },

      price: {
        type: Number,
        default: 0,
      },

      batteryPack: {
        type: String,
        default: "",
      },

      range: {
        type: Number,
        default: 0,
      },

      chargingTime: {
        type: String,
        default: "",
      },
    },
    { _id: false }
  );

/* =========================================================
   ======================== MAIN SCHEMA ====================
   ========================================================= */

const carSchema =
  new mongoose.Schema(
    {
      /* ================= BASIC ================= */

      name: {
        type: String,
        required: true,
      },

      brand: {
        type: String,
        required: true,
      },

      slug: {
        type: String,
        required: true,
        unique: true,
      },

      category: {
        type: String,
        default: "SUV",
      },

      status: {
        type: String,
        enum: [
          "active",
          "inactive",
        ],
        default: "active",
      },

      /* ================= PRICING ================= */

      startingPrice: {
        type: Number,
        required: true,
      },

      topVariantPrice: {
        type: Number,
        default: 0,
      },

      /* ================= IMAGES ================= */

      heroImage: {
        type: String,
        required: true,
      },

      image: {
        type: String,
        default: "",
      },

      galleryImages: [
        {
          type: String,
        },
      ],

      /* ================= COLORS ================= */

      colors: [colorSchema],

      /* ================= VARIANTS ================= */

      variants: [variantSchema],

      /* ================= SPECIFICATIONS ================= */

      specifications: {
        batteryPack: {
          type: String,
          default: "",
        },

        range: {
          type: Number,
          default: 0,
        },

        chargingTime: {
          type: String,
          default: "",
        },

        topSpeed: {
          type: String,
          default: "",
        },
      },

      /* ================= DIMENSIONS ================= */

      dimensions: {
        length: {
          type: String,
          default: "",
        },

        width: {
          type: String,
          default: "",
        },

        height: {
          type: String,
          default: "",
        },

        wheelbase: {
          type: String,
          default: "",
        },

        bootSpace: {
          type: String,
          default: "",
        },
      },

      /* ================= CONTENT ================= */

      overview: {
        type: String,
        default: "",
      },

      features: [
        {
          type: String,
        },
      ],

      safety: [
        {
          type: String,
        },
      ],

      /* ================= SEO ================= */

      seo: {
        metaTitle: {
          type: String,
          default: "",
        },

        metaDescription: {
          type: String,
          default: "",
        },
      },

      /* ================= FLAGS ================= */

      isFeatured: {
        type: Boolean,
        default: false,
      },
    },
    {
      timestamps: true,
    }
  );

/* =========================================================
   ====================== AUTO SLUG =========================
   ========================================================= */

carSchema.pre(
  "save",

  function (next) {

    if (
      !this.slug &&
      this.name
    ) {

      this.slug =
        this.name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
    }

    next();
  }
);  

module.exports =
  mongoose.model(
    "Car",
    carSchema
  );