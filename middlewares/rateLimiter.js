const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");
const logger = require("../utils/logger");
const runtimeMetrics = require("../services/ops/runtimeMetrics");

function buildLimiter({
  windowMs,
  max,
  name,
  message,
}) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message:
        message ||
        "Too many requests. Please try again later.",
    },
    handler: (req, res, _next, options) => {
      runtimeMetrics.recordRateLimitHit({
        limiter: name,
        path: req.path,
        method: req.method,
      });

      logger.warn({
        event: "rate_limit_hit",
        limiter: name,
        ip: req.ip,
        path: req.path,
        method: req.method,
      });
      res.status(options.statusCode).json(
        options.message
      );
    },
    keyGenerator: (req) => {
      const forwarded = req.headers["x-forwarded-for"];

      if (typeof forwarded === "string" && forwarded) {
        return ipKeyGenerator(forwarded.split(",")[0].trim());
      }

      return ipKeyGenerator(req.ip || "unknown");
    },
  });
}

const FIFTEEN_MIN = 15 * 60 * 1000;

/* Global API — generous; compare/catalog unaffected when using route-specific limiters */
const apiLimiter = buildLimiter({
  windowMs: FIFTEEN_MIN,
  max: 300,
  name: "api_global",
});

const authLimiter = buildLimiter({
  windowMs: FIFTEEN_MIN,
  max: 20,
  name: "auth",
  message:
    "Too many login attempts. Try later.",
});

/* Lead / contact — 5 per 15 min per IP */
const leadSubmitLimiter = buildLimiter({
  windowMs: FIFTEEN_MIN,
  max: Number(process.env.LEAD_RATE_LIMIT_MAX || 5),
  name: "lead_submit",
  message:
    "Too many enquiries from this network. Please wait before submitting again.",
});

const lowIntentFormLimiter = buildLimiter({
  windowMs: FIFTEEN_MIN,
  max: Number(
    process.env.LOW_INTENT_RATE_LIMIT_MAX || 5
  ),
  name: "low_intent_form",
  message:
    "Too many submissions. Please try again in a few minutes.",
});

module.exports = {
  apiLimiter,
  authLimiter,
  leadSubmitLimiter,
  lowIntentFormLimiter,
};
