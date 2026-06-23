/**
 * Cloudflare Turnstile server-side verification.
 * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

const logger = require("../utils/logger");

const VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

function getTurnstileSecret() {
  return String(
    process.env.TURNSTILE_SECRET_KEY || ""
  ).trim();
}

function isTurnstileConfigured() {
  return Boolean(getTurnstileSecret());
}

function isTurnstileEnforced() {
  if (isTurnstileConfigured()) {
    return true;
  }
  return (
    process.env.NODE_ENV === "production" &&
    process.env.TURNSTILE_REQUIRED !== "false"
  );
}

/**
 * @param {string} token
 * @param {string} [remoteip]
 * @returns {Promise<{ ok: boolean, skipped?: boolean, error?: string }>}
 */
async function verifyTurnstile(token, remoteip = "") {
  const secret = getTurnstileSecret();

  if (!secret) {
    if (isTurnstileEnforced()) {
      logger.error({
        event: "turnstile_misconfigured",
        message: "TURNSTILE_SECRET_KEY missing in production",
      });
      return { ok: false, error: "not_configured" };
    }
    return { ok: true, skipped: true };
  }

  if (!token || typeof token !== "string") {
    return { ok: false, error: "missing_token" };
  }

  try {
    const body = new URLSearchParams({
      secret,
      response: token.trim(),
    });

    if (remoteip) {
      body.set("remoteip", String(remoteip));
    }

    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
      body,
    });

    const data = await res.json();

    if (!data?.success) {
      logger.warn({
        event: "turnstile_failed",
        codes: data["error-codes"],
        remoteip: remoteip || undefined,
      });
      return {
        ok: false,
        error: "verification_failed",
      };
    }

    return { ok: true };
  } catch (err) {
    logger.error({
      event: "turnstile_verify_error",
      message: err?.message,
    });
    return { ok: false, error: "verify_request_failed" };
  }
}

module.exports = {
  verifyTurnstile,
  isTurnstileConfigured,
  isTurnstileEnforced,
};
