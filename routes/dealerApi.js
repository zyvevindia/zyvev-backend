const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const multer = require("multer");

const Dealer = require("../models/Dealer");
const Lead = require("../models/Lead");
const Car = require("../models/Car");
const Admin = require("../models/Admin");
const Notification = require("../models/Notification");

const {
  validateLogin,
  validateCar,
  safeJsonParse,
} = require("../utils/validators");

const {
  storage,
} = require("../config/cloudinary");

const {
  authLimiter,
} = require("../middlewares/rateLimiter");

const router = express.Router();

const upload = multer({ storage });

const CRM_PIPELINE_STATUSES = [

  "new",

  "contacted",

  "interested",

  "test_drive",

  "negotiation",

  "won",

  "lost"
];

const normalizeIncomingLeadStatus = (status) => {

  if (!status || typeof status !== "string") {

    return null;
  }

  const s =
    status.trim().toLowerCase();

  if (s === "converted") {

    return "won";
  }

  return s;
};

const isWonStatus = (s) =>

  s === "won" ||
  s === "converted";

async function notifyAdminsLeadWon(lead) {

  try {

    const admins =
      await Admin.find({

        role: "admin"
      });

    for (const admin of admins) {

      await Notification.create({

        user: admin._id,

        title: "Lead won",

        message:
          `${lead.name} moved to Won (dealer)`,

        type: "lead_won",

        priority: "high",

        lead: lead._id
      });
    }
  } catch (err) {

    console.log(
      "DEALER WON NOTIFY:",
      err.message
    );
  }
}

/* =========================================================
   ===================== DEALER AUTH =======================
   ========================================================= */

const dealerAuth = async (

  req,

  res,

  next
) => {

  try {

    const authHeader =
      req.headers.authorization;

    if (!authHeader) {

      return res.status(401).json({
        error: "Unauthorized"
      });
    }

    const token =
      authHeader.split(" ")[1];

    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    if (decoded.role !== "dealer") {

      return res.status(403).json({
        error: "Dealer access required"
      });
    }

    const dealer =
      await Dealer.findById(
        decoded.id
      ).select(
        "-password"
      );

    if (!dealer) {

      return res.status(401).json({
        error: "Dealer not found"
      });
    }

    if (!dealer.isActive) {

      return res.status(403).json({
        error: "Account deactivated"
      });
    }

    req.dealer = dealer;

    next();

  } catch (err) {

    return res.status(401).json({
      error: "Invalid token"
    });
  }
};

/* =========================================================
   ===================== DEALER LOGIN ======================
   ========================================================= */

router.post(

  "/login",

  authLimiter,

  async (req, res) => {

    try {

      const {
        email,
        password
      } = req.body;

      const validation =
        validateLogin({
          email,
          password
        });

      if (!validation.isValid) {

        return res.status(400).json({

          success: false,

          message: "Validation failed",

          errors: validation.errors
        });
      }

      const dealer =
        await Dealer.findOne({

          email:
            String(email).toLowerCase().trim()
        });

      if (!dealer) {

        return res.status(400).json({

          success: false,

          message: "Invalid credentials"
        });
      }

      if (!dealer.isActive) {

        return res.status(403).json({

          success: false,

          message: "Account deactivated"
        });
      }

      const isMatch =
        await bcrypt.compare(
          password,
          dealer.password
        );

      if (!isMatch) {

        return res.status(400).json({

          success: false,

          message: "Invalid credentials"
        });
      }

      const token =
        jwt.sign(

          {
            id: dealer._id,

            role: "dealer",

            email: dealer.email
          },

          process.env.JWT_SECRET,

          {
            expiresIn: "1d"
          }
        );

      res.json({

        success: true,

        token,

        role: "dealer",

        dealer: {

          id: dealer._id,

          name: dealer.name,

          email: dealer.email,

          cities: dealer.cities,

          brands: dealer.brands
        }
      });

    } catch (err) {

      console.log(
        "DEALER LOGIN ERROR:",
        err
      );

      res.status(500).json({

        success: false,

        message: "Server error"
      });
    }
  }
);

/* =========================================================
   ==================== PROTECTED ROUTES ==================
   ========================================================= */

router.use(dealerAuth);

router.get(

  "/me",

  (req, res) => {

    res.json({

      dealer: req.dealer
    });
  }
);

router.get(

  "/leads",

  async (req, res) => {

    try {

      const leads =
        await Lead.find({

          dealer: req.dealer._id
        })
          .populate("carId")
          .populate(
            "assignedTo",
            "name email"
          )
          .populate(
            "notes.createdBy",
            "name email"
          )
          .populate(
            "notes.createdByDealer",
            "name email"
          )
          .populate(
            "statusHistory.changedBy",
            "name email"
          )
          .populate(
            "statusHistory.changedByDealer",
            "name email"
          )
          .sort({ createdAt: -1 });

      res.json({ leads });

    } catch (err) {

      console.log(
        "DEALER LEADS ERROR:",
        err
      );

      res.status(500).json({
        error: err.message
      });
    }
  }
);

router.put(

  "/leads/:id/status",

  async (req, res) => {

    try {

      const rawStatus =
        req.body.status;

      const status =
        normalizeIncomingLeadStatus(
          rawStatus
        );

      if (
        !status ||
        !CRM_PIPELINE_STATUSES.includes(
          status
        )
      ) {

        return res.status(400).json({
          error: "Invalid status"
        });
      }

      const lead =
        await Lead.findOne({

          _id: req.params.id,

          dealer: req.dealer._id
        });

      if (!lead) {

        return res.status(404).json({
          error: "Lead not found"
        });
      }

      const previousStatus =
        lead.status;

      if (previousStatus !== status) {

        lead.statusHistory.push({

          status,

          at: new Date(),

          changedByDealer: req.dealer._id
        });
      }

      lead.status = status;

      if (!lead.firstRespondedAt) {

        lead.firstRespondedAt = new Date();
      }

      if (
        !isWonStatus(previousStatus) &&
        isWonStatus(status)
      ) {

        await notifyAdminsLeadWon(lead);
      }

      await lead.save();

      const updated =
        await Lead.findById(
          lead._id
        )
          .populate("carId")
          .populate(
            "assignedTo",
            "name email"
          )
          .populate(
            "statusHistory.changedByDealer",
            "name email"
          )
          .populate(
            "notes.createdByDealer",
            "name email"
          );

      res.json(updated);

    } catch (err) {

      console.log(
        "DEALER STATUS ERROR:",
        err
      );

      res.status(500).json({
        error: err.message
      });
    }
  }
);

router.post(

  "/leads/:id/notes",

  async (req, res) => {

    try {

      const {
        text
      } = req.body;

      if (!text || !text.trim()) {

        return res.status(400).json({
          error: "Note text required"
        });
      }

      const lead =
        await Lead.findOne({

          _id: req.params.id,

          dealer: req.dealer._id
        });

      if (!lead) {

        return res.status(404).json({
          error: "Lead not found"
        });
      }

      lead.notes.push({

        text: text.trim(),

        createdByDealer: req.dealer._id
      });

      if (!lead.firstRespondedAt) {

        lead.firstRespondedAt = new Date();
      }

      await lead.save();

      const updatedLead =
        await Lead.findById(
          lead._id
        )
          .populate("carId")
          .populate(
            "notes.createdByDealer",
            "name email"
          )
          .populate(
            "statusHistory.changedByDealer",
            "name email"
          );

      res.json(updatedLead);

    } catch (err) {

      console.log(
        "DEALER NOTE ERROR:",
        err
      );

      res.status(500).json({
        error: err.message
      });
    }
  }
);

router.get(

  "/analytics",

  async (req, res) => {

    try {

      const match = {
        dealer: req.dealer._id
      };

      const totalLeads =
        await Lead.countDocuments(match);

      const wonLeads =
        await Lead.countDocuments({

          ...match,

          status: {
            $in: ["won", "converted"]
          }
        });

      const responded =
        await Lead.countDocuments({

          ...match,

          $or: [
            {
              firstRespondedAt: {
                $ne: null
              }
            },

            {
              "notes.0": {
                $exists: true
              }
            },

            {
              status: {
                $nin: ["new", "assigned"]
              }
            }
          ]
        });

      const responseRate =
        totalLeads > 0

          ? Number(
              (
                (responded / totalLeads) *
                100
              ).toFixed(1)
            )

          : 0;

      const topVehicles =
        await Lead.aggregate([
          {
            $match: {
              ...match,

              vehicleName: {
                $exists: true,

                $nin: ["", null]
              }
            }
          },

          {
            $group: {
              _id: "$vehicleName",

              count: { $sum: 1 }
            }
          },

          { $sort: { count: -1 } },

          { $limit: 8 },

          {
            $project: {
              name: "$_id",

              count: 1,

              _id: 0
            }
          }
        ]);

      const cityDistribution =
        await Lead.aggregate([
          {
            $match: {
              ...match,

              city: {
                $exists: true,

                $nin: ["", null]
              }
            }
          },

          {
            $group: {
              _id: "$city",

              count: { $sum: 1 }
            }
          },

          { $sort: { count: -1 } },

          { $limit: 12 },

          {
            $project: {
              city: "$_id",

              count: 1,

              _id: 0
            }
          }
        ]);

      res.json({

        totalLeads,

        wonLeads,

        responseRate,

        topVehicles,

        cityDistribution
      });

    } catch (err) {

      console.log(
        "DEALER ANALYTICS ERROR:",
        err
      );

      res.status(500).json({
        error: err.message
      });
    }
  }
);

router.get(

  "/cars",

  async (req, res) => {

    try {

      const cars =
        await Car.find({

          dealer: req.dealer._id
        }).sort({
          createdAt: -1
        });

      res.json({ cars });

    } catch (err) {

      res.status(500).json({
        error: err.message
      });
    }
  }
);

router.post(

  "/cars",

  upload.single("heroImage"),

  async (req, res) => {

    try {

      const {

        name,

        brand,

        slug,

        category,

        startingPrice,

        topVariantPrice,

        specifications,

        dimensions,

        features,

        safety,

        overview,

        colors,

        variants,

        galleryImages,

        seo,

        isFeatured,

      } = req.body;

      const validation =
        validateCar({
          name,
          brand,
          slug,
          startingPrice,
        });

      if (!validation.isValid) {

        return res.status(400).json({

          success: false,

          message: "Validation failed",

          errors: validation.errors,
        });
      }

      const heroImage =
        req.file?.path || "";

      if (!heroImage) {

        return res.status(400).json({
          error: "Hero image required"
        });
      }

      let normalizedSlug =
        String(slug).trim().toLowerCase();

      let candidate = normalizedSlug;

      let n = 0;

      while (
        await Car.exists({ slug: candidate })
      ) {

        n += 1;

        candidate =
          `${normalizedSlug}-d${n}`;
      }

      normalizedSlug = candidate;

      const car =
        await Car.create({

          name: String(name).trim(),

          brand: String(brand).trim(),

          slug: normalizedSlug,

          category:
            category || "SUV",

          status: "active",

          startingPrice: Number(startingPrice),

          topVariantPrice:
            topVariantPrice
              ? Number(topVariantPrice)
              : 0,

          heroImage,

          image: heroImage,

          specifications:
            specifications
              ? safeJsonParse(
                  specifications,
                  {}
                )
              : {},

          dimensions:
            dimensions
              ? safeJsonParse(
                  dimensions,
                  {}
                )
              : {},

          features: Array.isArray(features)
            ? features
            : (() => {
                try {
                  return safeJsonParse(
                    features,
                    []
                  );
                } catch {
                  return String(features || "")
                    .split(",")
                    .map((f) => f.trim())
                    .filter(Boolean);
                }
              })(),

          safety: Array.isArray(safety)
            ? safety
            : (() => {
                try {
                  return safeJsonParse(
                    safety,
                    []
                  );
                } catch {
                  return String(safety || "")
                    .split(",")
                    .map((f) => f.trim())
                    .filter(Boolean);
                }
              })(),

          overview:
            overview || "",

          galleryImages:
            (() => {
              try {
                return safeJsonParse(
                  galleryImages,
                  []
                );
              } catch {
                return [];
              }
            })(),

          colors:
            (() => {
              try {
                return safeJsonParse(
                  colors,
                  []
                );
              } catch {
                return [];
              }
            })(),

          variants:
            (() => {
              try {
                return safeJsonParse(
                  variants,
                  []
                );
              } catch {
                return [];
              }
            })(),

          seo:
            seo
              ? safeJsonParse(
                  seo,
                  {}
                )
              : {},

          isFeatured:
            isFeatured === "true",

          dealer: req.dealer._id,

          dealerListingStatus: "active",
        });

      res.status(201).json({

        success: true,

        car
      });

    } catch (err) {

      console.log(
        "DEALER CAR CREATE:",
        err
      );

      res.status(500).json({
        error: err.message
      });
    }
  }
);

router.put(

  "/cars/:id",

  upload.single("heroImage"),

  async (req, res) => {

    try {

      const car =
        await Car.findOne({

          _id: req.params.id,

          dealer: req.dealer._id
        });

      if (!car) {

        return res.status(404).json({
          error: "Listing not found"
        });
      }

      const b = req.body;

      if (b.name) {

        car.name = String(b.name).trim();
      }

      if (b.brand) {

        car.brand = String(b.brand).trim();
      }

      if (b.slug) {

        let normalizedSlug =
          String(b.slug).trim().toLowerCase();

        const conflict =
          await Car.findOne({

            slug: normalizedSlug,

            _id: {
              $ne: car._id
            }
          });

        if (conflict) {

          return res.status(400).json({
            error: "Slug already in use"
          });
        }

        car.slug = normalizedSlug;
      }

      if (b.category) {

        car.category = b.category;
      }

      if (b.startingPrice != null) {

        car.startingPrice =
          Number(b.startingPrice);
      }

      if (b.topVariantPrice != null) {

        car.topVariantPrice =
          Number(b.topVariantPrice);
      }

      if (b.overview != null) {

        car.overview = b.overview;
      }

      if (b.specifications) {

        car.specifications =
          safeJsonParse(
            b.specifications,
            car.specifications
          );
      }

      if (b.dimensions) {

        car.dimensions =
          safeJsonParse(
            b.dimensions,
            car.dimensions
          );
      }

      if (b.features) {

        car.features = Array.isArray(b.features)
          ? b.features
          : safeJsonParse(
              b.features,
              []
            );
      }

      if (b.safety) {

        car.safety = Array.isArray(b.safety)
          ? b.safety
          : safeJsonParse(
              b.safety,
              []
            );
      }

      if (b.galleryImages) {

        car.galleryImages =
          safeJsonParse(
            b.galleryImages,
            []
          );
      }

      if (b.colors) {

        car.colors =
          safeJsonParse(
            b.colors,
            []
          );
      }

      if (b.variants) {

        car.variants =
          safeJsonParse(
            b.variants,
            []
          );
      }

      if (b.seo) {

        car.seo =
          safeJsonParse(
            b.seo,
            {}
          );
      }

      if (b.isFeatured != null) {

        car.isFeatured =
          b.isFeatured === "true" ||
          b.isFeatured === true;
      }

      if (req.file?.path) {

        car.heroImage = req.file.path;

        car.image = req.file.path;
      }

      await car.save();

      res.json(car);

    } catch (err) {

      console.log(
        "DEALER CAR UPDATE:",
        err
      );

      res.status(500).json({
        error: err.message
      });
    }
  }
);

router.patch(

  "/cars/:id/listing",

  async (req, res) => {

    try {

      const {
        dealerListingStatus
      } = req.body;

      const allowed = [

        "active",

        "sold",

        "unavailable"
      ];

      if (
        !dealerListingStatus ||
        !allowed.includes(
          dealerListingStatus
        )
      ) {

        return res.status(400).json({
          error: "Invalid listing status"
        });
      }

      const car =
        await Car.findOneAndUpdate(

          {

            _id: req.params.id,

            dealer: req.dealer._id
          },

          {
            dealerListingStatus
          },

          {
            new: true
          }
        );

      if (!car) {

        return res.status(404).json({
          error: "Listing not found"
        });
      }

      res.json(car);

    } catch (err) {

      res.status(500).json({
        error: err.message
      });
    }
  }
);

module.exports = router;
