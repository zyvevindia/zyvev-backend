const logger = require("../utils/logger");

const REQUIRED_ALWAYS = [
  "MONGO_URI",
  "JWT_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

const REQUIRED_PRODUCTION = [
  "TURNSTILE_SECRET_KEY",
  "TURNSTILE_SITE_KEY",
];

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function validateEnv() {
  const missing = [];
  const warnings = [];

  [...REQUIRED_ALWAYS, ...(isProduction() ? REQUIRED_PRODUCTION : [])].forEach(
    (key) => {
      const value = String(process.env[key] || "").trim();

      if (!value) {
        missing.push(key);
      }
    }
  );

  if (isProduction()) {
    if (
      !process.env.CORS_ORIGINS ||
      !String(process.env.CORS_ORIGINS).trim()
    ) {
      warnings.push(
        "CORS_ORIGINS is empty — browser clients may be blocked in production"
      );
    }
  } else if (
    !process.env.TURNSTILE_SECRET_KEY ||
    !process.env.TURNSTILE_SITE_KEY
  ) {
    warnings.push(
      "TURNSTILE_SECRET_KEY / TURNSTILE_SITE_KEY not set — low-intent forms skip CAPTCHA in development"
    );
  }

  if (missing.length > 0) {
    logger.error({
      event: "env_validation_failed",
      missing,
    });

    console.error(
      "\n❌ Missing or empty environment variables:\n"
    );

    missing.forEach((item) => {
      console.error(`  - ${item}`);
    });

    console.error(
      "\nCopy .env.example → .env and set values before starting the server.\n"
    );

    process.exit(1);
  }

  if (warnings.length > 0) {
    warnings.forEach((message) => {
      logger.warn({ event: "env_validation_warning", message });
    });
  }

  logger.info({ event: "env_validated" });
}

module.exports = validateEnv;
