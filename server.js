/* =========================================================
   ===================== CONFIG =============================
   ========================================================= */

require("dotenv").config();

const express = require("express");
const validateEnv = require(
  "./config/env"
);
validateEnv();

const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const hpp = require("hpp");
const compression = require("compression");
const morgan = require("morgan");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const Car = require("./models/Car");
const Lead = require("./models/Lead");
const Admin = require("./models/Admin");
const View = require("./models/View");
const Notification = require("./models/Notification");
const Dealer = require("./models/Dealer");
const DealerApplication = require("./models/DealerApplication");

const dealerApiRouter = require("./routes/dealerApi");

const createCatalogRouter = require("./routes/catalogRoutes");

const createSeoRouter = require("./routes/seoRoutes");

const createBehavioralRouter = require("./routes/behavioralRoutes");

const createEditorialRouter = require("./routes/editorialRoutes");

const dualReadService = require("./services/catalog/dualReadService");

const {
  resolveMarketplacePayload,
} = require("./services/catalog/mappers");

const { USE_EV_MASTER } = require("./config/catalog");

const {

  validateLead,

  validateInquiryLead,

  validateLogin,

  validateUser,

  validateCar,

  safeJsonParse,

  validateDealerCreate,
} = require(
  "./utils/validators"
);

const {
  storage,
} = require("./config/cloudinary");

const errorHandler = require(
  "./middlewares/errorHandler"
);

const notFound = require(
  "./middlewares/notFound"
);

const {
  apiLimiter,
  authLimiter,
} = require(
  "./middlewares/rateLimiter"
);

const app = express();

/* =========================================================
   ================= TRUST PROXY (RENDER / PROXIES) ========
   ========================================================= */

if (
  process.env.NODE_ENV ===
  "production"
) {

  app.set(
    "trust proxy",
    1
  );
}

/* =========================================================
   ================= UPLOAD MIDDLEWARE =====================
   ========================================================= */

const upload = multer({
  storage,
});

/* =========================================================
   ===================== MIDDLEWARE =========================
   ========================================================= */

/* =========================================================
   ===================== SECURITY ==========================
   ========================================================= */

app.use(helmet());



/* =========================================================
   ===================== LOGGING ===========================
   ========================================================= */

if (
  process.env.NODE_ENV !== "production"
) {

  app.use(
    morgan("dev")
  );
}

/* =========================================================
   ===================== RATE LIMIT ========================
   ========================================================= */

app.use(apiLimiter);

/* =========================================================
   ===================== CORS ==============================
   ========================================================= */

const defaultCorsOrigins = [

  "http://localhost:5173",

  "https://zyvev-frontend.vercel.app",

  "https://evsavari.com",

  "https://www.evsavari.com",
];

const corsOriginsFromEnv =
  (process.env.CORS_ORIGINS || "")

    .split(",")

    .map((s) =>
      s.trim()
    )

    .filter(Boolean);

const allowedOrigins = [

  ...new Set([

    ...defaultCorsOrigins,

    ...corsOriginsFromEnv,
  ]),
];

app.use(
  cors({

    origin: function (
      origin,
      callback
    ) {

      /* ---------- ALLOW NO ORIGIN ---------- */
      if (!origin) {

        return callback(null, true);
      }

      /* ---------- ALLOW VALID ORIGIN ---------- */
      if (
        allowedOrigins.includes(origin)
      ) {

        return callback(null, true);
      }

      /* ---------- BLOCK INVALID ---------- */

      if (
        process.env.NODE_ENV !==
        "production"
      ) {

        console.warn(
          "Blocked CORS origin:",

          origin
        );
      }

      return callback(null, false);
    },

    credentials: true,
  })
);

/* =========================================================
   ===================== BODY PARSER =======================
   ========================================================= */

app.use(
  express.json({

    limit: "1mb",
  })
);

app.use(
  express.urlencoded({

    extended: true,

    limit: "1mb",
  })
);

/* =========================================================
   ===================== TEST ROUTE =========================
   ========================================================= */

app.get("/", (req, res) => {
  res.send("EVSavari Backend Running 🚀");
});

/* TEMP: Tier-1 file catalog diagnostics — remove after Render path verified */
app.get("/debug/tier1-status", (req, res) => {
  const tier1File = require("./services/catalog/tier1FileCatalog");
  res.json(tier1File.getTier1DiagnosticStatus());
});

/* =========================================================
   ===================== DEALER API ========================
   ========================================================= */

app.use(
  "/api/dealer",
  dealerApiRouter
);

/* =========================================================
   ===================== SEED DATA ==========================
   ========================================================= */
/*
  This function inserts sample cars into DB.
  ⚠️ Currently runs EVERY TIME server starts (not ideal for prod)
*/
const seedCars = async () => {
  try {
    const count = await Car.countDocuments();

    // ⚠️ Currently forced TRUE (will duplicate data every restart)
    if (count === 0) {
      await Car.insertMany([
        {
          name: "Nexon EV",
          brand: "Tata",
          price: 1500000,
          range: 300,
          image:
            "https://images.unsplash.com/photo-1619767886558-efdc259cde1a",
        },
        {
          name: "Tiago EV",
          brand: "Tata",
          price: 900000,
          range: 250,
          image:
            "https://images.unsplash.com/photo-1580273916550-e323be2ae537",
        },
        {
          name: "MG ZS EV",
          brand: "MG",
          price: 2300000,
          range: 400,
          image:
            "https://images.unsplash.com/photo-1552519507-da3b142c6e3d",
        },
      ]);

      console.log("🚗 Sample cars inserted");
    }
  } catch (err) {
    console.log("Seed Error:", err.message);
  }
};

/* =========================================================
   ===================== DATABASE ===========================
   ========================================================= */

mongoose
  .connect(process.env.MONGO_URI, {
    dbName: "zyvevDB",
  })
  .then(async () => {
    console.log("MongoDB Connected ✅");

    // ---------- Seed Cars ----------
    if (process.env.SEED_DATA === "true") {
      await seedCars();
    }

    // ---------- Create Default Admin ----------
    const createAdmin = async () => {

      const existing = await Admin.findOne({
        email: "admin@evsavari.com"
      });

      if (!existing) {

        const hashed = await bcrypt.hash("123456", 10);

        await Admin.create({
          email: "admin@evsavari.com",
          password: hashed,
          role: "admin"
        });

        console.log("👤 Default admin created");
      }
    };

    await createAdmin();
  })
  .catch((err) => {
    console.log("DB Error:", err);
  });




  /* ================= CREATE ADMIN ================= */
  /*  const createAdmin = async () => {
      const existing = await Admin.findOne({ email: "admin@evsavari.com" });

      if (!existing) {
        const hashed = await bcrypt.hash("123456", 10);

        await Admin.create({
          email: "admin@evsavari.com",
          password: hashed
        });

        console.log("👤 Admin created");
      }
    };

    await createAdmin();*/


/* =========================================================
   ================= AUTH MIDDLEWARE ========================
   ========================================================= */

const auth = (req, res, next) => {

  try {

    const authHeader = req.headers.authorization;

    // ---------- Missing Token ----------
    if (!authHeader) {
      return res.status(401).json({
        error: "Unauthorized"
      });
    }

    // ---------- Remove Bearer ----------
    const token = authHeader.split(" ")[1];

    // ---------- Verify ----------
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (decoded.role === "dealer") {

      return res.status(403).json({
        error:
          "Dealer accounts must use /api/dealer routes"
      });
    }

    req.admin = decoded;

    next();

  } catch (err) {

    return res.status(401).json({
      error: "Invalid token"
    });
  }
};

/* =========================================================
   ================= NOTIFICATION HELPER ===================
   ========================================================= */

const createNotification = async ({
  user,
  title,
  message,
  type = "system",
  priority = "medium",
  lead = null
}) => {

  try {

    await Notification.create({

      user,

      title,

      message,

      type,

      priority,

      lead
    });

  } catch (err) {

    console.log(
      "NOTIFICATION ERROR:",
      err.message
    );
  }
};

/* =========================================================
   ================= CRM STATUS HELPERS ===================
   ========================================================= */

const CRM_PIPELINE_STATUSES = [

  "new",

  "contacted",

  "follow_up",

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

  if (s === "follow-up" || s === "followup") {

    return "follow_up";
  }

  return s;
};

const isWonStatus = (s) =>

  s === "won" ||
  s === "converted";

/* =========================================================
   ================= ADMIN ONLY MIDDLEWARE =================
   ========================================================= */

const adminOnly = (req, res, next) => {

  if (req.admin.role !== "admin") {

    return res.status(403).json({
      error: "Admin access required"
    });
  }

  next();
};

/* =========================================================
   ================= API ROUTES (after auth middleware) =====
   ========================================================= */

app.use(
  "/api/catalog",
  createCatalogRouter({ auth, adminOnly })
);

app.use("/api/seo", createSeoRouter());

app.use(
  "/api/behavioral",
  createBehavioralRouter({ auth, adminOnly })
);

app.use(
  "/api/editorial",
  createEditorialRouter({ auth, adminOnly })
);

/* =========================================================
   ===================== ADMIN LOGIN ========================
   ========================================================= */

/* =========================================================
   ===================== ADMIN LOGIN ========================
   ========================================================= */

app.post(
  "/api/admin/login",

  authLimiter,

  async (req, res) => {

    try {

      const {
        email,
        password
      } = req.body;

      /* ================= VALIDATION ================= */

      const validation =
        validateLogin({

          email,

          password,
        });

      if (
        !validation.isValid
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Validation failed",

          errors:
            validation.errors,
        });
      }

      /* ================= FIND ADMIN ================= */

      const admin =
        await Admin.findOne({

          email:
            email.toLowerCase()
        });

      if (!admin) {

        return res.status(400).json({

          success: false,

          message:
            "Invalid credentials",
        });
      }

      /* ================= VERIFY PASSWORD ================= */

      const isMatch =
        await bcrypt.compare(

          password,

          admin.password
        );

      if (!isMatch) {

        return res.status(400).json({

          success: false,

          message:
            "Invalid credentials",
        });
      }

      /* ================= CREATE TOKEN ================= */

      const token = jwt.sign(

        {
          id: admin._id,

          role: admin.role,
        },

        process.env.JWT_SECRET,

        {
          expiresIn: "1d",
        }
      );

      /* ================= RESPONSE ================= */

      res.json({

        success: true,

        token,

        role: admin.role,
      });

    } catch (err) {

      console.log(
        "LOGIN ERROR:",
        err
      );

      res.status(500).json({

        success: false,

        message:
          "Server error",
      });
    }
  }
);

/* =========================================================
   ================= GET SALES USERS ========================
   ========================================================= */

/* =========================================================
   ================= CREATE SALES USER ======================
   ========================================================= */

app.post(

  "/api/admin/users",

  auth,

  adminOnly,

  async (req, res) => {

    try {

      const {

        name,

        email,

        password,

        role,
      } = req.body;

      /* ================= VALIDATION ================= */

      const validation =
        validateUser({

          email,

          password,

          role,
        });

      if (
        !validation.isValid
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Validation failed",

          errors:
            validation.errors,
        });
      }

      /* ================= NORMALIZE ================= */

      const normalizedEmail =
        email
          .trim()
          .toLowerCase();

      /* ================= DUPLICATE CHECK ================= */

      const existing =
        await Admin.findOne({

          email:
            normalizedEmail,
        });

      if (existing) {

        return res.status(400).json({

          success: false,

          message:
            "User already exists",
        });
      }

      /* ================= HASH PASSWORD ================= */

      const hashed =
        await bcrypt.hash(
          password,
          10
        );

      /* ================= CREATE USER ================= */

      const user =
        await Admin.create({

          name:
            name || "",

          email:
            normalizedEmail,

          password:
            hashed,

          role:
            role || "sales",

          createdBy:
            req.admin.id,
        });

      /* ================= RESPONSE ================= */

      res.status(201).json({

        success: true,

        user: {

          _id:
            user._id,

          name:
            user.name,

          email:
            user.email,

          role:
            user.role,

          createdAt:
            user.createdAt,
        },
      });

    } catch (err) {

      console.log(
        "CREATE USER ERROR:",
        err
      );

      res.status(500).json({

        success: false,

        message:
          "Server error",
      });
    }
  }
);


/* =========================================================
   ===================== CAR ROUTES =========================
   ========================================================= */

/*
  POST /cars
  Create a new car
*/
/* =========================================================
   ================= CREATE CAR API ========================
   ========================================================= */

app.post(
  "/cars",

  auth,

  upload.single("heroImage"),

  async (req, res) => {

    try {

      /* ===================================================
         ==================== BODY ==========================
         =================================================== */

      const {

        name,

        brand,

        slug,

        category,

        status,

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

      /* ===================================================
         ================= VALIDATION =======================
         =================================================== */

        const validation =
          validateCar({

            name,

            brand,

            slug,

            startingPrice,
          });

        if (
          !validation.isValid
        ) {

          return res.status(400).json({

            success: false,

            message:
              "Validation failed",

            errors:
              validation.errors,
          });
        }

/* ===================================================
   ================= NORMALIZATION ====================
   =================================================== */

const normalizedSlug =
  slug
    .trim()
    .toLowerCase();



      /* ===================================================
         ================= IMAGE ============================
         =================================================== */

      const heroImage =
        req.file?.path || "";

      /* ===================================================
         ================= DUPLICATE ========================
         =================================================== */

      const existing =
        await Car.findOne({
          slug: normalizedSlug,
        });

      if (existing) {

        return res.status(400).json({
          error:
            "Car slug already exists",
        });
      }

      /* ===================================================
         ================= CREATE CAR =======================
         =================================================== */

      const car =
        await Car.create({

          name,

          brand,

          slug: normalizedSlug,

          category,

          status,

          startingPrice,

          topVariantPrice,

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
        });

      /* ===================================================
         ================= RESPONSE =========================
         =================================================== */

      res.status(201).json({

        success: true,

        message:
          "Car created successfully",

        car,
      });

    } catch (err) {

      console.log(
        "CREATE CAR ERROR:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    }
  }
);


/* =========================================================
   =============== GET CARS (ADVANCED FILTER) ===============
   ========================================================= */

app.get("/cars", async (req, res) => {

  try {

    const result =
      await dualReadService.listCatalogVehicles(
        req.query
      );

    if (USE_EV_MASTER) {
      res.setHeader(
        "X-Catalog-Mode",
        result.catalogMode || "dual-read"
      );
    }

    res.json(result);

  } catch (err) {

    console.error(
      "GET /cars error:",
      err
    );

    res.status(500).json({

      error: "Server error"
    });
  }
});

/* =========================================================
   ================= GET SINGLE CAR =========================
   ========================================================= */

app.get(
  "/cars/slug/:slug",

  async (req, res) => {

    try {

      const hit =
        await dualReadService.getVehicleBySlug(
          req.params.slug
        );

      const vehicle = resolveMarketplacePayload(hit);

      if (!vehicle) {

        return res
          .status(404)
          .json({
            error:
              "Car not found",
            slug: req.params.slug,
          });
      }

      if (hit?.source === "master") {
        res.setHeader("X-Catalog-Source", "master");
      } else if (hit?.source === "tier-1-file") {
        res.setHeader("X-Catalog-Source", "tier-1-file");
      } else if (hit?.source === "legacy") {
        res.setHeader("X-Catalog-Source", "legacy");
      }

      res.json(vehicle);

    } catch (err) {

      console.log(
        "GET CAR BY SLUG ERROR:",
        err
      );

      res.status(500).json({
        error:
          err.message,
      });
    }
  }
);

app.get("/cars/:id", async (req, res) => {

  try {

    const hit =
      await dualReadService.getVehicleById(
        req.params.id
      );

    const vehicle = resolveMarketplacePayload(hit);

    if (!vehicle) {

      return res.status(404).json({
        error: "Car not found",
      });
    }

    if (hit?.source === "master") {
      res.setHeader("X-Catalog-Source", "master");
    }

    res.json(vehicle);

  } catch (err) {

    console.log(
      "GET SINGLE CAR ERROR:",
      err
    );

    res.status(500).json({
      error: err.message,
    });
  }
});

/* =========================================================
   ===================== LEAD ROUTES ========================
   ========================================================= */

/*
  POST /leads
  Save user lead
*/
/* =========================================================
   ====================== CREATE LEAD =======================
   ========================================================= */

app.post(
  "/leads",

  async (req, res) => {

    try {

      const {

        name,

        phone,

        email,

        city,

        message,

        carId,

        vehicleName,

        vehicleId,

        sourcePage,

        anonymousSessionId,

        leadSource,

        leadMetadata,

        familySlug,

        variantSlug,
      } = req.body;

      const hasFullInquiry =

        email !== undefined &&
        email !== null &&
        String(email).trim() !== "";

      /* ================= VALIDATION ================= */

      let validation;

      if (hasFullInquiry) {

        validation =
          validateInquiryLead({

            name,

            phone,

            email,

            city,

            vehicleName,

            message,
          });
      } else {

        validation =
          validateLead({

            name,

            phone,
          });
      }

      if (
        !validation.isValid
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Validation failed",

          errors:
            validation.errors,
        });
      }

      /* ================= CAR REFERENCE ================= */

      let resolvedCarId = null;

      const candidateId =

        carId || vehicleId;

      if (

        candidateId &&
        mongoose.Types.ObjectId.isValid(
          String(candidateId)
        )
      ) {

        const exists =
          await Car.exists({
            _id: candidateId,
          });

        if (exists) {

          resolvedCarId =
            candidateId;
        }
      }

      /* ================= CREATE LEAD ================= */

      const leadPayload = {

        name:
          String(name).trim(),

        phone:
          String(phone).replace(
            /\D/g,
            ""
          ),

        carId:
          resolvedCarId,

        status: "new",

        readByAdmin: false,

        statusHistory: [
          {
            status: "new",

            at: new Date()
          }
        ]
      };

      if (hasFullInquiry) {

        Object.assign(
          leadPayload,
          {

            email:
              String(email)
                .trim()
                .toLowerCase(),

            city:
              String(city || "")
                .trim(),

            message:
              String(message || "")
                .trim(),

            vehicleName:
              String(vehicleName || "")
                .trim(),

            vehicleId:
              String(vehicleId || "")
                .trim(),

            sourcePage:
              String(sourcePage || "")
                .trim(),

            leadSource:
              String(leadSource || "form")
                .trim()
                .toLowerCase(),

            familySlug:
              String(
                familySlug ||
                  leadMetadata?.familySlug ||
                  ""
              ).trim(),

            variantSlug:
              String(
                variantSlug ||
                  leadMetadata?.variantSlug ||
                  ""
              ).trim(),

            leadMetadata:
              leadMetadata && typeof leadMetadata === "object"
                ? leadMetadata
                : null,
          }
        );

        if (!leadPayload.city && leadMetadata?.city) {
          leadPayload.city = String(leadMetadata.city).trim();
        }
      } else if (resolvedCarId) {

        leadPayload.carId =
          resolvedCarId;
      }

      if (
        anonymousSessionId &&
        /^[a-zA-Z0-9_-]{16,64}$/.test(
          String(anonymousSessionId)
        )
      ) {
        leadPayload.anonymousSessionId =
          String(anonymousSessionId).slice(
            0,
            64
          );

        try {
          const {
            BEHAVIORAL_INTELLIGENCE_ENABLED,
          } = require("./config/behavioral");

          if (BEHAVIORAL_INTELLIGENCE_ENABLED) {
            const {
              getSessionEvents,
              buildLeadContext,
            } = require("./services/buyer-intelligence");

            const sessionEvents =
              await getSessionEvents(
                leadPayload.anonymousSessionId
              );

            const ctx =
              buildLeadContext(sessionEvents);

            if (ctx?.leadContext) {
              leadPayload.buyerIntentContext =
                ctx;
            }
          }
        } catch {
          /* non-blocking — lead still saves */
        }
      }

      const lead =
        await Lead.create(
          leadPayload
        );

      let autoAssigned = false;
      try {
        const { onFormLeadCreated } = require("./services/lead/leadOperations");
        const routed = await onFormLeadCreated(lead);
        autoAssigned = routed.assigned;
      } catch (notifyErr) {
        console.log("LEAD OPS ERROR:", notifyErr.message);
      }

      /* ================= RESPONSE ================= */

      res.status(201).json({

        success: true,

        message:
          "Lead submitted successfully",

        leadId:
          lead._id,

        autoAssigned,
      });

    } catch (err) {

      console.log(
        "LEAD CREATE ERROR:",
        err
      );

      res.status(500).json({

        success: false,

        message:
          "Unable to submit inquiry",
      });
    }
  }
);

app.post("/api/leads/whatsapp-intent", async (req, res) => {
  try {
    const {
      sourcePage,
      familySlug,
      variantSlug,
      city,
      vehicleName,
      anonymousSessionId,
      intent,
      brand,
    } = req.body;

    const { createWhatsAppIntentLead } = require("./services/lead/leadOperations");

    const result = await createWhatsAppIntentLead({
      sourcePage,
      familySlug,
      variantSlug,
      city,
      vehicleName,
      anonymousSessionId,
      intent: intent || "inquiry",
      brand,
    });

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.log("WHATSAPP INTENT ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Unable to record WhatsApp intent",
    });
  }
});

/* =========================================================
   ===================== VIEWS API ==========================
   ========================================================= */

app.post("/views", async (req, res) => {
  try {
    const { carId } = req.body;

    const view = new View({ carId });
    await view.save();

    res.json(view);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*
  GET /leads
  Fetch all leads (with car details)
*/
app.get("/leads", async (req, res) => {
  try {
    const leads = await Lead.find().populate("carId");
    res.json({
      leads
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* =========================================================
   ================= EXPORT LEADS ===========================
   ========================================================= */

app.get("/api/admin/export-leads", auth, async (req, res) => {
  try {
    const { days, carId } = req.query;

    let filter = {};

    /* ---------- DATE FILTER ---------- */
    if (days && Number(days) > 0) {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - Number(days));

      filter.createdAt = { $gte: fromDate };
    }

    /* ---------- CAR FILTER ---------- */
    if (carId) {
      filter.carId = carId;
    }

    const leads = await Lead.find(filter).populate("carId");

    let csv = "Name,Phone,Car,Date\n";

    leads.forEach((lead) => {
      csv += `${lead.name},${lead.phone},${lead.carId?.name || ""},${new Date(lead.createdAt).toLocaleDateString()}\n`;
    });

    res.header("Content-Type", "text/csv");
    res.attachment("filtered-leads.csv");
    return res.send(csv);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   ========== EXPORT PERFORMANCE REPORT =====================
   ========================================================= */

app.get("/api/admin/export-performance", auth, async (req, res) => {
  try {
    const LEAD_VALUE = 500;

    // ---------- LEADS PER CAR ----------
    const leadsPerCar = await Lead.aggregate([
      {
        $group: {
          _id: "$carId",
          leads: { $sum: 1 }
        }
      }
    ]);

    // ---------- VIEWS PER CAR ----------
    const viewsPerCar = await View.aggregate([
      {
        $group: {
          _id: "$carId",
          views: { $sum: 1 }
        }
      }
    ]);

    // ---------- MERGE ----------
    const data = leadsPerCar.map((lead) => {
      const view = viewsPerCar.find(
        (v) => v._id.toString() === lead._id.toString()
      );

      const views = view ? view.views : 0;
      const leads = lead.leads;

      const conversion = views
        ? ((leads / views) * 100).toFixed(2)
        : 0;

      const revenue = leads * LEAD_VALUE;

      return {
        carId: lead._id,
        views,
        leads,
        conversion,
        revenue
      };
    });

    // ---------- GET CAR NAMES ----------
    const cars = await Car.find().sort({ createdAt: -1 });

    let csv = "Car,Views,Leads,Conversion %,Revenue\n";

    data.forEach((item) => {
      const car = cars.find(
        (c) => c._id.toString() === item.carId.toString()
      );

      csv += `${car?.name || ""},${item.views},${item.leads},${item.conversion},${item.revenue}\n`;
    });

    res.header("Content-Type", "text/csv");
    res.attachment("performance-report.csv");
    return res.send(csv);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   ================= ADMIN - LEADS ==========================
   ========================================================= */

app.get("/api/admin/leads", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const total = await Lead.countDocuments();

    const leads = await Lead.find()
    .populate("carId")
    .populate(
      "assignedTo",
      "name email role"
    )
    .populate(
      "dealer",
      "name email cities brands isActive"
    )
    .sort({ createdAt: -1 })
    .skip(Number(skip))
    .limit(Number(limit));

    res.json({
      leads,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit)
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   ========= ADMIN - VALIDATION SUMMARY (INTERNAL) ==========
   ========================================================= */

app.get(
  "/api/admin/ops/validation-summary",
  auth,
  adminOnly,
  async (req, res) => {
    try {
      const {
        buildValidationDashboard,
      } = require("./services/validation-dashboard");

      const sinceDays = Math.min(
        parseInt(req.query.days, 10) || 7,
        90
      );

      const report = await buildValidationDashboard({
        includeDb: true,
        sinceDays,
      });

      res.json({
        ...report,
        _policy: {
          adminOnly: true,
          aggregatedOnly: true,
          noPii: true,
          notForPublicDealers: true,
        },
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/* =========================================================
   ========= ADMIN - LEAD INTENT SUMMARY (INTERNAL) =========
   ========================================================= */

app.get(
  "/api/admin/leads/:id/intent-summary",
  auth,
  adminOnly,
  async (req, res) => {
    try {
      const lead = await Lead.findById(req.params.id)
        .select("+buyerIntentContext +anonymousSessionId")
        .lean();

      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }

      const {
        buildDealerSafeLeadSummary,
      } = require("./services/buyer-intelligence/dealerSafeSummary");
      const {
        buildLeadQualityIndicators,
      } = require("./services/lead-quality-intelligence");

      res.json({
        ...buildDealerSafeLeadSummary(lead),
        leadQuality: buildLeadQualityIndicators(lead),
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/* =========================================================
   ================= MARK LEAD AS READ ======================
   ========================================================= */

app.put(
  "/api/admin/leads/:id/read",
  auth,
  adminOnly,
  async (req, res) => {

    try {

      await Lead.findByIdAndUpdate(

        req.params.id,

        {
          readByAdmin: true,
        }
      );

      res.json({
        success: true,
      });
    } catch (err) {

      res.status(500).json({
        error: err.message,
      });
    }
  }
);

/* =========================================================
   ================= ASSIGN LEAD ============================
   ========================================================= */

app.put(
  "/api/admin/leads/:id/assign",
  auth,
  adminOnly,
  async (req, res) => {

    try {

      const {
        assignedTo,

        assignedDealer,

        dealerId
      } = req.body;

      /* ---------- VALIDATION ---------- */
      if (
        !assignedTo &&
        !dealerId
      ) {

        return res.status(400).json({
          error:
            "Sales user or dealer account required"
        });
      }

      const update = {

        readByAdmin: true,

        assignedAt: new Date()
      };

      if (assignedTo) {

        const salesUser =
          await Admin.findById(
            assignedTo
          );

        if (!salesUser) {

          return res.status(404).json({
            error: "Sales user not found"
          });
        }

        update.assignedTo = assignedTo;
      }

      if (
        Object.prototype.hasOwnProperty.call(
          req.body,
          "dealerId"
        )
      ) {

        if (
          !dealerId ||
          dealerId === ""
        ) {

          update.dealer = null;
        } else {

          const dealerDoc =
            await Dealer.findById(
              dealerId
            );

          if (!dealerDoc) {

            return res.status(404).json({
              error: "Dealer not found"
            });
          }

          update.dealer = dealerId;
        }
      }

      if (assignedDealer != null) {

        update.assignedDealer =
          String(assignedDealer).trim();
      }

      /* ---------- UPDATE LEAD ---------- */
      const lead = await Lead.findByIdAndUpdate(

        req.params.id,

        update,

        {
          new: true
        }

      )
        .populate("carId")
        .populate(
          "assignedTo",
          "name email role"
        )
        .populate(
          "dealer",
          "name email cities brands"
        );

      if (!lead) {

        return res.status(404).json({
          error: "Lead not found"
        });
      }

      /* ---------- CREATE NOTIFICATION ---------- */
      if (assignedTo) {

        await createNotification({

          user: assignedTo,

          title: "New Lead Assigned",

          message:
            `${lead.name} has been assigned to you`,

          type: "lead_assigned",

          priority: "high",

          lead: lead._id
        });
      }

      if (lead.dealer) {
        try {
          const { notifyLeadAssigned } = require("./services/notifications/opsNotify");
          const dealerDoc =
            lead.dealer?.email
              ? lead.dealer
              : await Dealer.findById(lead.dealer).select("name email");
          if (dealerDoc) {
            await notifyLeadAssigned(lead, dealerDoc);
          }
        } catch (notifyErr) {
          console.log("DEALER ASSIGN NOTIFY:", notifyErr.message);
        }
      }

      res.json(lead);

    } catch (err) {

      console.log(
        "ASSIGN LEAD ERROR:",
        err
      );

      res.status(500).json({
        error: err.message
      });
    }
  }
);

/* =========================================================
   =================== ADMIN DEALERS =======================
   ========================================================= */

app.post(
  "/api/admin/dealers",
  auth,
  adminOnly,
  async (req, res) => {

    try {

      const {
        name,
        email,
        password,
        phone,
        cities,
        brands,
        isActive
      } = req.body;

      const validation =
        validateDealerCreate({
          name,
          email,
          password
        });

      if (!validation.isValid) {

        return res.status(400).json({
          errors: validation.errors
        });
      }

      const emailNorm =
        String(email).toLowerCase().trim();

      const exists =
        await Dealer.findOne({
          email: emailNorm
        });

      if (exists) {

        return res.status(400).json({
          error: "Email already registered"
        });
      }

      const hash =
        await bcrypt.hash(
          password,
          10
        );

      const cityArr =
        Array.isArray(cities)
          ? cities.map((c) =>
              String(c).trim()
            ).filter(Boolean)
          : String(cities || "")
              .split(",")
              .map((c) => c.trim())
              .filter(Boolean);

      const brandArr =
        Array.isArray(brands)
          ? brands.map((b) =>
              String(b).trim()
            ).filter(Boolean)
          : String(brands || "")
              .split(",")
              .map((b) => b.trim())
              .filter(Boolean);

      const dealer =
        await Dealer.create({

          name:
            String(name || "").trim(),

          email: emailNorm,

          password: hash,

          phone:
            String(phone || "").trim(),

          cities: cityArr,

          brands: brandArr,

          isActive:
            isActive !== false,

          createdBy: req.admin.id
        });

      res.status(201).json({

        dealer: {

          id: dealer._id,

          name: dealer.name,

          email: dealer.email,

          cities: dealer.cities,

          brands: dealer.brands,

          isActive: dealer.isActive
        }
      });

    } catch (err) {

      console.log(
        "CREATE DEALER ERROR:",
        err
      );

      res.status(500).json({
        error: err.message
      });
    }
  }
);

app.get(
  "/api/admin/dealers",
  auth,
  adminOnly,
  async (req, res) => {

    try {

      const dealers =
        await Dealer.find()
          .select("-password")
          .sort({ createdAt: -1 });

      res.json(dealers);

    } catch (err) {

      res.status(500).json({
        error: err.message
      });
    }
  }
);

/* =========================================================
   ============== DEALER APPLICATION REVIEW ===============
   ========================================================= */

app.get(
  "/api/admin/dealer-applications",
  auth,
  adminOnly,
  async (req, res) => {
    try {
      const { status } = req.query;
      const filter = {};

      if (status) {
        filter.onboardingStatus = String(status).trim();
      }

      const applications = await DealerApplication.find(filter)
        .populate("reviewedBy", "name email")
        .populate("approvedDealer", "name email")
        .sort({ createdAt: -1 });

      res.json({ applications });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

app.patch(
  "/api/admin/dealer-applications/:id",
  auth,
  adminOnly,
  async (req, res) => {
    try {
      const {
        onboardingStatus,
        reviewNotes,
        assignedTo,
        approvePassword,
      } = req.body;

      const application = await DealerApplication.findById(req.params.id);

      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      if (onboardingStatus) {
        application.onboardingStatus = onboardingStatus;
      }

      if (reviewNotes != null) {
        application.reviewNotes = String(reviewNotes).trim();
      }

      if (assignedTo != null) {
        application.assignedTo = String(assignedTo).trim();
      }

      application.reviewedAt = new Date();
      application.reviewedBy = req.admin.id;

      if (onboardingStatus === "approved") {
        const emailNorm = application.email;

        let dealer = await Dealer.findOne({ email: emailNorm });

        if (!dealer) {
          if (!approvePassword || String(approvePassword).length < 6) {
            return res.status(400).json({
              error: "approvePassword required (min 6 chars) to create dealer account",
            });
          }

          const hash = await bcrypt.hash(String(approvePassword), 10);

          dealer = await Dealer.create({
            name: application.dealershipName,
            email: emailNorm,
            password: hash,
            phone: application.phone,
            cities: [application.citySlug],
            brands: application.brands,
            isActive: true,
            createdBy: req.admin.id,
          });
        }

        application.approvedDealer = dealer._id;
        application.onboardingStatus = "approved";
      }

      await application.save();

      const updated = await DealerApplication.findById(application._id)
        .populate("reviewedBy", "name email")
        .populate("approvedDealer", "name email");

      res.json({ application: updated });
    } catch (err) {
      console.log("DEALER APPLICATION REVIEW:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

app.put(
  "/api/admin/dealers/:id",
  auth,
  adminOnly,
  async (req, res) => {

    try {

      const {
        name,
        phone,
        cities,
        brands,
        isActive,
        password
      } = req.body;

      const dealer =
        await Dealer.findById(
          req.params.id
        );

      if (!dealer) {

        return res.status(404).json({
          error: "Dealer not found"
        });
      }

      if (name != null) {

        dealer.name =
          String(name).trim();
      }

      if (phone != null) {

        dealer.phone =
          String(phone).trim();
      }

      if (cities != null) {

        dealer.cities =
          Array.isArray(cities)
            ? cities.map((c) =>
                String(c).trim()
              ).filter(Boolean)
            : String(cities)
                .split(",")
                .map((c) => c.trim())
                .filter(Boolean);
      }

      if (brands != null) {

        dealer.brands =
          Array.isArray(brands)
            ? brands.map((b) =>
                String(b).trim()
              ).filter(Boolean)
            : String(brands)
                .split(",")
                .map((b) => b.trim())
                .filter(Boolean);
      }

      if (typeof isActive === "boolean") {

        dealer.isActive = isActive;
      }

      if (
        password &&
        String(password).length >= 6
      ) {

        dealer.password =
          await bcrypt.hash(
            password,
            10
          );
      }

      await dealer.save();

      const out =
        await Dealer.findById(
          dealer._id
        ).select("-password");

      res.json(out);

    } catch (err) {

      res.status(500).json({
        error: err.message
      });
    }
  }
);

/* =========================================================
   ================= SALES USER LEADS =======================
   ========================================================= */

app.get(
  "/api/sales/leads",
  auth,
  async (req, res) => {

    try {

      /* ---------- SALES ONLY ---------- */
      if (
        req.admin.role !== "sales" &&
        req.admin.role !== "admin"
      ) {

        return res.status(403).json({
          error: "Sales access required"
        });
      }

      /* ---------- FETCH ASSIGNED LEADS ---------- */
      const leads = await Lead.find({

        assignedTo: req.admin.id

      })
        .populate("carId")
        .populate(
          "assignedTo",
          "name email"
        )
        .populate(
          "dealer",
          "name email cities brands isActive"
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

      res.json({
        leads
      });

    } catch (err) {

      console.log(
        "SALES LEADS ERROR:",
        err
      );

      res.status(500).json({
        error: err.message
      });
    }
  }
);

/* =========================================================
   ================ SALES CRM DASHBOARD ====================
   ========================================================= */

app.get(
  "/api/sales/crm-dashboard",
  auth,
  async (req, res) => {

    try {

      if (
        req.admin.role !== "sales" &&
        req.admin.role !== "admin"
      ) {

        return res.status(403).json({
          error: "Sales access required"
        });
      }

      const match =
        req.admin.role === "admin"
          ? {}
          : {
              assignedTo:
                new mongoose.Types.ObjectId(
                  String(req.admin.id)
                )
            };

      const totalLeads =
        await Lead.countDocuments(match);

      const newLeads =
        await Lead.countDocuments({

          ...match,

          $or: [
            { status: "new" },
            { status: "assigned" }
          ]
        });

      const wonLeads =
        await Lead.countDocuments({

          ...match,

          status: {
            $in: ["won", "converted"]
          }
        });

      const conversionRate =
        totalLeads > 0

          ? Number(
              (
                (wonLeads / totalLeads) *
                100
              ).toFixed(2)
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

      const topCities =
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

          { $limit: 8 },

          {
            $project: {
              name: "$_id",

              count: 1,

              _id: 0
            }
          }
        ]);

      const leadSources =
        await Lead.aggregate([
          { $match: match },

          {
            $project: {
              src: {
                $cond: [
                  {
                    $or: [
                      {
                        $eq: [
                          "$sourcePage",
                          ""
                        ]
                      },

                      {
                        $not: ["$sourcePage"]
                      }
                    ]
                  },

                  "(not set)",

                  "$sourcePage"
                ]
              }
            }
          },

          {
            $group: {
              _id: "$src",

              count: { $sum: 1 }
            }
          },

          { $sort: { count: -1 } },

          { $limit: 12 },

          {
            $project: {
              source: "$_id",

              count: 1,

              _id: 0
            }
          }
        ]);

      res.json({

        totalLeads,

        newLeads,

        wonLeads,

        conversionRate,

        topVehicles,

        topCities,

        leadSources
      });

    } catch (err) {

      console.log(
        "CRM DASHBOARD ERROR:",
        err
      );

      res.status(500).json({
        error: err.message
      });
    }
  }
);

/* =========================================================
   ============== SALES UPDATE LEAD STATUS =================
   ========================================================= */

app.put(
  "/api/sales/leads/:id/status",
  auth,
  async (req, res) => {

    try {

      /* ---------- SALES ONLY ---------- */
      if (
        req.admin.role !== "sales" &&
        req.admin.role !== "admin"
      ) {

        return res.status(403).json({
          error: "Sales access required"
        });
      }

      const {
        status: rawStatus
      } = req.body;

      const status =
        normalizeIncomingLeadStatus(
          rawStatus
        );

      /* ---------- VALID STATUS ---------- */
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

      /* ---------- FIND LEAD ---------- */
      const lead = await Lead.findOne({

        _id: req.params.id,

        assignedTo: req.admin.id

      });

      if (!lead) {

        return res.status(404).json({
          error:
            "Lead not found or not assigned"
        });
      }

      const previousStatus =
        lead.status;

      /* ---------- STATUS HISTORY ---------- */
      if (previousStatus !== status) {

        lead.statusHistory.push({

          status,

          at: new Date(),

          changedBy: req.admin.id
        });
      }

      /* ---------- FIRST RESPONSE ---------- */
      if (!lead.firstRespondedAt) {

        lead.firstRespondedAt = new Date();
      }

      /* ---------- UPDATE STATUS ---------- */
      lead.status = status;

      /* ---------- NOTIFY ADMINS ON WON ---------- */
      if (
        !isWonStatus(previousStatus) &&
        isWonStatus(status)
      ) {

        const admins = await Admin.find({
          role: "admin"
        });

        for (const admin of admins) {

          await createNotification({

            user: admin._id,

            title: "Lead won",

            message:
              `${lead.name} moved to Won`,

            type: "lead_won",

            priority: "high",

            lead: lead._id
          });
        }
      }

      await lead.save();

      /* ---------- RESPONSE ---------- */
      const updatedLead = await Lead.findById(
        lead._id
      )
        .populate("carId")
        .populate(
          "assignedTo",
          "name email role"
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
        );

      res.json(updatedLead);

    } catch (err) {

      console.log(
        "UPDATE STATUS ERROR:",
        err
      );

      res.status(500).json({
        error: err.message
      });
    }
  }
);

/* =========================================================
   ================= ADD LEAD NOTE ==========================
   ========================================================= */

app.post(
  "/api/sales/leads/:id/notes",
  auth,
  async (req, res) => {

    try {

      /* ---------- SALES ONLY ---------- */
      if (
        req.admin.role !== "sales" &&
        req.admin.role !== "admin"
      ) {

        return res.status(403).json({
          error: "Sales access required"
        });
      }

      const {
        text
      } = req.body;

      /* ---------- VALIDATION ---------- */
      if (!text || !text.trim()) {

        return res.status(400).json({
          error: "Note text required"
        });
      }

      /* ---------- FIND LEAD ---------- */
      const lead = await Lead.findOne({

        _id: req.params.id,

        assignedTo: req.admin.id

      });

      if (!lead) {

        return res.status(404).json({
          error:
            "Lead not found or not assigned"
        });
      }

      /* ---------- ADD NOTE ---------- */
      lead.notes.push({

        text,

        createdBy: req.admin.id

      });

      if (!lead.firstRespondedAt) {

        lead.firstRespondedAt = new Date();
      }

      await lead.save();

      /* ---------- FETCH UPDATED LEAD ---------- */
      const updatedLead = await Lead.findById(
        lead._id
      )
        .populate("carId")
        .populate(
          "assignedTo",
          "name email role"
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
        );

      res.json(updatedLead);

    } catch (err) {

      console.log(
        "ADD NOTE ERROR:",
        err
      );

      res.status(500).json({
        error: err.message
      });
    }
  }
);

/* =========================================================
   ============== UPDATE FOLLOW-UP DETAILS =================
   ========================================================= */

app.put(
  "/api/sales/leads/:id/followup",
  auth,
  async (req, res) => {

    try {

      /* ---------- SALES ONLY ---------- */
      if (
        req.admin.role !== "sales" &&
        req.admin.role !== "admin"
      ) {

        return res.status(403).json({
          error: "Sales access required"
        });
      }

      const {
        nextFollowUp,
        priority,
        followUpCompleted
      } = req.body;

      /* ---------- FIND LEAD ---------- */
      const lead = await Lead.findOne({

        _id: req.params.id,

        assignedTo: req.admin.id

      });

      if (!lead) {

        return res.status(404).json({
          error:
            "Lead not found or not assigned"
        });
      }

      /* ---------- UPDATE FOLLOW-UP ---------- */

      if (nextFollowUp !== undefined) {

        lead.nextFollowUp =
          nextFollowUp || null;
      }

      if (priority) {

        const validPriorities = [

          "low",

          "medium",

          "high",

          "urgent"
        ];

        if (
          !validPriorities.includes(
            priority
          )
        ) {

          return res.status(400).json({
            error: "Invalid priority"
          });
        }

        lead.priority = priority;
      }

      if (
        typeof followUpCompleted ===
        "boolean"
      ) {

        lead.followUpCompleted =
          followUpCompleted;
      }

      await lead.save();

      /* ---------- FETCH UPDATED ---------- */

      const updatedLead =
        await Lead.findById(lead._id)

          .populate("carId")

          .populate(
            "assignedTo",
            "name email role"
          )

          .populate(
            "notes.createdBy",
            "name email"
          );

      res.json(updatedLead);

    } catch (err) {

      console.log(
        "FOLLOWUP UPDATE ERROR:",
        err
      );

      res.status(500).json({
        error: err.message
      });
    }
  }
);

/* =========================================================
   ================= FOLLOW-UP SUMMARY ======================
   ========================================================= */

app.get(
  "/api/sales/followups",
  auth,
  async (req, res) => {

    try {

      if (
        req.admin.role !== "sales" &&
        req.admin.role !== "admin"
      ) {

        return res.status(403).json({
          error: "Sales access required"
        });
      }

      const now = new Date();

      /* ---------- TODAY ---------- */

      const todayStart = new Date();

      todayStart.setHours(
        0, 0, 0, 0
      );

      const todayEnd = new Date();

      todayEnd.setHours(
        23, 59, 59, 999
      );

      /* ---------- OVERDUE ---------- */

      const overdue = await Lead.find({

        assignedTo: req.admin.id,

        nextFollowUp: {
          $lt: now
        },

        followUpCompleted: false

      });

      /* ---------- TODAY ---------- */

      const today = await Lead.find({

        assignedTo: req.admin.id,

        nextFollowUp: {
          $gte: todayStart,
          $lte: todayEnd
        },

        followUpCompleted: false

      });

      res.json({

        overdueCount:
          overdue.length,

        todayCount:
          today.length,

        overdue,

        today
      });

    } catch (err) {

      console.log(
        "FOLLOWUP SUMMARY ERROR:",
        err
      );

      res.status(500).json({
        error: err.message
      });
    }
  }
);

/* =========================================================
   ============ SALES PERFORMANCE ANALYTICS ================
   ========================================================= */

app.get(
  "/api/admin/sales-performance",
  auth,
  adminOnly,
  async (req, res) => {

    try {

      const LEAD_VALUE = 500;

      /* ---------- GET SALES USERS ---------- */

      const salesUsers = await Admin.find({

        role: "sales"

      }).select("name email");

      /* ---------- BUILD ANALYTICS ---------- */

      const analytics = await Promise.all(

        salesUsers.map(async (user) => {

          /* ---------- TOTAL ASSIGNED ---------- */

          const totalAssigned =
            await Lead.countDocuments({

              assignedTo: user._id
            });

          /* ---------- CONTACTED ---------- */

          const contacted =
            await Lead.countDocuments({

              assignedTo: user._id,

              status: "contacted"
            });

          /* ---------- INTERESTED ---------- */

          const interested =
            await Lead.countDocuments({

              assignedTo: user._id,

              status: "interested"
            });

          /* ---------- NEGOTIATION ---------- */

          const negotiation =
            await Lead.countDocuments({

              assignedTo: user._id,

              status: "negotiation"
            });

          /* ---------- WON (INCL. LEGACY CONVERTED) ---------- */

          const converted =
            await Lead.countDocuments({

              assignedTo: user._id,

              status: {
                $in: ["won", "converted"]
              }
            });

          /* ---------- LOST ---------- */

          const lost =
            await Lead.countDocuments({

              assignedTo: user._id,

              status: "lost"
            });

          /* ---------- REVENUE ---------- */

          const revenue =
            converted * LEAD_VALUE;

          /* ---------- CONVERSION ---------- */

          const conversionRate =
            totalAssigned > 0

              ? (
                  (converted /
                    totalAssigned) *
                  100
                ).toFixed(2)

              : 0;

          /* ---------- OVERDUE ---------- */

          const overdue =
            await Lead.countDocuments({

              assignedTo: user._id,

              nextFollowUp: {
                $lt: new Date()
              },

              followUpCompleted: false
            });

          /* ---------- RETURN ---------- */

          return {

            salesUserId: user._id,

            name:
              user.name ||
              "Sales User",

            email: user.email,

            totalAssigned,

            contacted,

            interested,

            negotiation,

            converted,

            lost,

            overdue,

            revenue,

            conversionRate
          };
        })
      );

      /* ---------- SORT BY CONVERSION ---------- */

      analytics.sort(

        (a, b) =>
          b.converted - a.converted
      );

      res.json(analytics);

    } catch (err) {

      console.log(
        "SALES ANALYTICS ERROR:",
        err
      );

      res.status(500).json({
        error: err.message
      });
    }
  }
);

/* =========================================================
   ================= GET NOTIFICATIONS =====================
   ========================================================= */

app.get(
  "/api/notifications",
  auth,
  async (req, res) => {

    try {

      const notifications =
        await Notification.find({

          user: req.admin.id

        })
          .populate("lead")

          .sort({
            createdAt: -1
          })

          .limit(20);

      res.json(notifications);

    } catch (err) {

      console.log(
        "GET NOTIFICATIONS ERROR:",
        err
      );

      res.status(500).json({
        error: err.message
      });
    }
  }
);

/* =========================================================
   ============== MARK NOTIFICATION READ ===================
   ========================================================= */

app.put(
  "/api/notifications/:id/read",
  auth,
  async (req, res) => {

    try {

      const notification =
        await Notification.findOneAndUpdate(

          {
            _id: req.params.id,

            user: req.admin.id
          },

          {
            isRead: true
          },

          {
            new: true
          }
        );

      if (!notification) {

        return res.status(404).json({
          error: "Notification not found"
        });
      }

      res.json(notification);

    } catch (err) {

      console.log(
        "READ NOTIFICATION ERROR:",
        err
      );

      res.status(500).json({
        error: err.message
      });
    }
  }
);

/* =========================================================
   ================= ANALYTICS ==============================
   ========================================================= */

app.get("/api/admin/ops-summary", auth, adminOnly, async (req, res) => {
  try {
    const { buildOpsSummary } = require("./services/operations/opsSummary");
    const summary = await buildOpsSummary();
    res.json(summary);
  } catch (err) {
    console.log("OPS SUMMARY ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/traffic-ops", auth, adminOnly, async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days || "7", 10), 1), 90);
    const { buildTrafficOpsReport } = require("./services/operations/trafficOpsReport");
    const report = await buildTrafficOpsReport(days);
    res.json(report);
  } catch (err) {
    console.log("TRAFFIC OPS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/analytics", auth, async (req, res) => {
  try {
    /* ---------- DATE FILTER ---------- */
    const { days } = req.query;

    // ---------- REVENUE CONFIG ----------
    const LEAD_VALUE = 500; // ₹ per lead (you can change later)

    let dateFilter = {};

    if (days && Number(days) > 0) {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - Number(days));

      dateFilter = {
        createdAt: { $gte: fromDate }
      };
    }

    /* ---------- TOTAL LEADS ---------- */
    const totalLeads = await Lead.countDocuments(dateFilter);
    const totalRevenue = totalLeads * LEAD_VALUE;
    // ---------- FUNNEL (MVP SIMULATION) ----------
    const totalViews = await View.countDocuments(dateFilter);
    const conversionRate = totalViews
      ? ((totalLeads / totalViews) * 100).toFixed(2)
      : 0;

    /* ---------- LEADS PER CAR ---------- */
    const leadsPerCar = await Lead.aggregate([
      {
        $group: {
          _id: "$carId",
          count: { $sum: 1 }
        }
      },

      {
        $lookup: {
          from: "cars",
          localField: "_id",
          foreignField: "_id",
          as: "car"
        }
      },

      {
        $unwind: {
          path: "$car",
          preserveNullAndEmptyArrays: true
        }
      },

      {
        $project: {
          carName: "$car.name",
          count: 1,
          revenue: { $multiply: ["$count", LEAD_VALUE] }
        }
      }
    ]);

    // ---------- VIEWS PER CAR ----------
    const viewsPerCar = await View.aggregate([
      {
        $group: {
          _id: "$carId",
          views: { $sum: 1 }
        }
      }
    ]);

    // ---------- MERGE VIEWS + LEADS ----------
    const performance = leadsPerCar.map((lead) => {
      const view = viewsPerCar.find(
        (v) => v._id.toString() === lead._id.toString()
      );

      const views = view ? view.views : 0;
      const leads = lead.count;

      return {
        carName: lead.carName,
        views,
        leads,
        conversion: views
          ? ((leads / views) * 100).toFixed(2)
          : 0
      };
    });

    /* ---------- LEADS OVER TIME ---------- */
    const leadsOverTime = await Lead.aggregate([
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          },
          count: { $sum: 1 },
          revenue: { $sum: LEAD_VALUE }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      totalLeads,
      totalViews,
      totalRevenue,
      conversionRate,
      leadsPerCar,
      leadsOverTime,
      performance   // 👈 NEW
    });

  } catch (err) {
    console.log("🔥 ANALYTICS ERROR:", err); // 🔥 IMPORTANT
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   ====================== SITEMAP.XML =======================
   ========================================================= */

app.get(
  "/sitemap.xml",

  async (req, res) => {

    try {

      const cars =
        await Car.find(
          {},
          "slug updatedAt"
        );

      /* ================= STATIC PAGES ================= */

      const staticPages = [

        "",

        "/cars",

        "/bikes",

        "/scooters",

        "/compare",

        "/popular",

        "/latest",

        "/upcoming",
      ];

      /* ================= XML START ================= */

      let xml = `<?xml version="1.0" encoding="UTF-8"?>

<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
>

`;

      /* ================= STATIC URLS ================= */

      staticPages.forEach((page) => {

        xml += `
  <url>

    <loc>
      https://evsavari.com${page}
    </loc>

    <changefreq>
      daily
    </changefreq>

    <priority>
      ${
        page === ""
          ? "1.0"
          : "0.8"
      }
    </priority>

  </url>
`;
      });

      /* ================= DYNAMIC CAR URLS ================= */

      cars.forEach((car) => {

        xml += `
  <url>

    <loc>
      https://evsavari.com/car/${car.slug}
    </loc>

    <lastmod>
      ${new Date(
        car.updatedAt
      ).toISOString()}
    </lastmod>

    <changefreq>
      weekly
    </changefreq>

    <priority>
      0.9
    </priority>

  </url>
`;
      });

      /* ================= XML END ================= */

      xml += `
</urlset>
`;

      res.header(
        "Content-Type",
        "application/xml"
      );

      res.send(xml);

    } catch (err) {

      console.log(
        "SITEMAP ERROR:",
        err
      );

      res.status(500).send(
        "Sitemap generation failed"
      );
    }
  }
);

/* =========================================================
   ====================== ROBOTS.TXT ========================
   ========================================================= */

app.get(
  "/robots.txt",

  (req, res) => {

    const robots = `
User-agent: *

Allow: /

Sitemap: https://evsavari.com/sitemap.xml
`;

    res.header(
      "Content-Type",
      "text/plain"
    );

    res.send(robots);
  }
);

/* =========================================================
   ================= ERROR HANDLING ========================
   ========================================================= */

app.use(notFound);

app.use(errorHandler);

/* =========================================================
   ===================== SERVER START =======================
   ========================================================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});