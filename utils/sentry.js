/**
 * Optional Sentry — loads only when @sentry/node is installed.
 */

const logger = require("./logger");

let Sentry = null;
let initialized = false;

function isSentryConfigured() {
  return Boolean(String(process.env.SENTRY_DSN || "").trim());
}

function initSentry() {
  if (initialized || !isSentryConfigured()) {
    return null;
  }

  initialized = true;

  try {
    Sentry = require("@sentry/node");

    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment:
        process.env.SENTRY_ENVIRONMENT ||
        process.env.NODE_ENV ||
        "development",
      release: process.env.SENTRY_RELEASE || undefined,
      enabled:
        process.env.NODE_ENV === "production" ||
        process.env.SENTRY_ENABLED === "true",
      tracesSampleRate: Number(
        process.env.SENTRY_TRACES_SAMPLE_RATE || 0.05
      ),
    });

    logger.info({ event: "sentry_initialized" });
  } catch (err) {
    logger.warn({
      event: "sentry_init_skipped",
      message: err?.message,
      hint: "npm install @sentry/node for production error monitoring",
    });
    Sentry = null;
  }

  return Sentry;
}

function captureException(err, context = {}) {
  initSentry();

  if (!Sentry?.captureException) {
    return;
  }

  Sentry.captureException(err, { extra: context });
}

module.exports = {
  initSentry,
  captureException,
  isSentryConfigured,
};
