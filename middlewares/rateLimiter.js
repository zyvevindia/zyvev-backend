const rateLimit = require("express-rate-limit");

/* =========================================================
   ================= GLOBAL API LIMITER ====================
   ========================================================= */

const apiLimiter = rateLimit({

  windowMs: 15 * 60 * 1000,

  max: 300,

  standardHeaders: true,

  legacyHeaders: false,

  message: {

    success: false,

    message:
      "Too many requests. Please try again later.",
  },
});

/* =========================================================
   ================= AUTH RATE LIMITER =====================
   ========================================================= */

const authLimiter = rateLimit({

  windowMs: 15 * 60 * 1000,

  max: 20,

  standardHeaders: true,

  legacyHeaders: false,

  message: {

    success: false,

    message:
      "Too many login attempts. Try later.",
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
};