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

const {

  validateLead,
  validateLogin,
  validateUser,
  validateCar,
  safeJsonParse,
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

const allowedOrigins = [

  "http://localhost:5173",

  "https://evsavari.com",

  "https://evsavari.com",

  "https://www.evsavari.com",
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

      console.log(
        "Blocked CORS Origin:",
        origin
      );

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
          email: "admin@zyvev.com",
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
      const existing = await Admin.findOne({ email: "admin@zyvev.com" });

      if (!existing) {
        const hashed = await bcrypt.hash("123456", 10);

        await Admin.create({
          email: "admin@zyvev.com",
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

    const {
      brand,
      priceRange,
      sortBy,
      search,
      page = 1,
      limit = 6
    } = req.query;

    let filter = {};

    /* ---------- SEARCH ---------- */

    if (search) {

      filter.$or = [

        {
          name: {
            $regex: search,
            $options: "i"
          }
        },

        {
          brand: {
            $regex: search,
            $options: "i"
          }
        }
      ];
    }

    /* ---------- BRAND FILTER ---------- */

    if (brand) {

      filter.brand = brand;
    }

    /* ---------- PRICE RANGE ---------- */

    if (priceRange) {

      if (priceRange === "low") {

        filter.startingPrice = {
          $lt: 1000000
        };
      }

      else if (priceRange === "mid") {

        filter.startingPrice = {
          $gte: 1000000,
          $lte: 2000000
        };
      }

      else if (priceRange === "high") {

        filter.startingPrice = {
          $gt: 2000000
        };
      }
    }

    /* ---------- PAGINATION ---------- */

    const pageNumber = Number(page);

    const pageSize = Number(limit);

    const skip =
      (pageNumber - 1) * pageSize;

    /* ---------- SORTING ---------- */

    let sort = {

      createdAt: -1
    };

    if (sortBy === "priceLow") {

      sort = {
        startingPrice: 1
      };
    }

    if (sortBy === "priceHigh") {

      sort = {
        startingPrice: -1
      };
    }

    if (sortBy === "rangeLow") {

      sort = {
        "specifications.range": 1
      };
    }

    if (sortBy === "rangeHigh") {

      sort = {
        "specifications.range": -1
      };
    }

    /* ---------- TOTAL ---------- */

    const total =
      await Car.countDocuments(filter);

    /* ---------- FETCH CARS ---------- */

    const cars =
      await Car.find(filter)

        .sort(sort)

        .skip(skip)

        .limit(pageSize);

    /* ---------- RESPONSE ---------- */

    res.json({

      cars,

      total,

      page: pageNumber,

      totalPages: Math.ceil(
        total / pageSize
      )
    });

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

      const car =
        await Car.findOne({
          slug:
            req.params.slug,
        });

      if (!car) {

        return res
          .status(404)
          .json({
            error:
              "Car not found",
          });
      }

      res.json(car);

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

    const car = await Car.findById(
      req.params.id
    );

    if (!car) {

      return res.status(404).json({
        error: "Car not found"
      });
    }

    res.json(car);

  } catch (err) {

    console.log(
      "GET SINGLE CAR ERROR:",
      err
    );

    res.status(500).json({
      error: err.message
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

        carId,
      } = req.body;

      /* ================= VALIDATION ================= */

      const validation =
        validateLead({

          name,

          phone,
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

      /* ================= CREATE LEAD ================= */

      const lead =
        await Lead.create({

          name:
            name.trim(),

          phone:
            phone.trim(),

          carId:
            carId || null,
        });

      /* ================= RESPONSE ================= */

      res.status(201).json({

        success: true,

        message:
          "Lead submitted successfully",

        leadId:
          lead._id,
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
   ================= ASSIGN LEAD ============================
   ========================================================= */

app.put(
  "/api/admin/leads/:id/assign",
  auth,
  adminOnly,
  async (req, res) => {

    try {

      const { assignedTo } = req.body;

      /* ---------- VALIDATION ---------- */
      if (!assignedTo) {

        return res.status(400).json({
          error: "Sales user required"
        });
      }

      /* ---------- VERIFY SALES USER ---------- */
      const salesUser = await Admin.findById(
        assignedTo
      );

      if (!salesUser) {

        return res.status(404).json({
          error: "Sales user not found"
        });
      }

      /* ---------- UPDATE LEAD ---------- */
      const lead = await Lead.findByIdAndUpdate(

        req.params.id,

        {
          assignedTo,
          status: "assigned"
        },

        {
          new: true
        }

      )
        .populate("carId")
        .populate(
          "assignedTo",
          "name email role"
        );

      if (!lead) {

        return res.status(404).json({
          error: "Lead not found"
        });
      }

      /* ---------- CREATE NOTIFICATION ---------- */

      await createNotification({

        user: assignedTo,

        title: "New Lead Assigned",

        message:
          `${lead.name} has been assigned to you`,

        type: "lead_assigned",

        priority: "high",

        lead: lead._id
      });

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
        status
      } = req.body;

      /* ---------- VALID STATUS ---------- */
      const validStatuses = [

        "new",

        "assigned",

        "contacted",

        "interested",

        "negotiation",

        "converted",

        "lost"
      ];

      if (
        !status ||
        !validStatuses.includes(status)
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

      /* ---------- UPDATE STATUS ---------- */
      lead.status = status;

      /* ---------- NOTIFY ADMINS ON CONVERSION ---------- */

      if (status === "converted") {

        const admins = await Admin.find({
          role: "admin"
        });

        for (const admin of admins) {

          await createNotification({

            user: admin._id,

            title: "Lead Converted",

            message:
              `${lead.name} was converted successfully`,

            type: "lead_converted",

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

          /* ---------- CONVERTED ---------- */

          const converted =
            await Lead.countDocuments({

              assignedTo: user._id,

              status: "converted"
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