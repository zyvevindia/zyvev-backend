const {
  verifyTurnstile,
} = require("../services/turnstileVerify");
const logger = require("../utils/logger");
const runtimeMetrics = require("../services/ops/runtimeMetrics");

/**
 * Require valid Cloudflare Turnstile token on low-intent public forms.
 * Accepts `turnstileToken` or legacy `captchaToken` field names.
 */
async function requireTurnstile(req, res, next) {
  const token =
    req.body?.turnstileToken ||
    req.body?.captchaToken ||
    "";

  const result = await verifyTurnstile(
    token,
    req.ip
  );

  if (!result.ok) {
    runtimeMetrics.recordTurnstileFailure({
      path: req.path,
      reason: result.error,
    });

    logger.warn({
      event: "turnstile_rejected",
      path: req.path,
      ip: req.ip,
      reason: result.error,
    });

    return res.status(400).json({
      success: false,
      message:
        "Security verification failed. Please refresh and try again.",
      errors: {
        turnstile:
          "Invalid or expired security check",
      },
    });
  }

  return next();
}

module.exports = {
  requireTurnstile,
};
