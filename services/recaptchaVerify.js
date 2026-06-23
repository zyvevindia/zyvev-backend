/**
 * Google reCAPTCHA v3 server-side verification.
 * Set RECAPTCHA_SECRET_KEY in backend env.
 * When unset, verification is skipped (local dev only).
 */

const VERIFY_URL =
  "https://www.google.com/recaptcha/api/siteverify";

const MIN_SCORE = Number(
  process.env.RECAPTCHA_MIN_SCORE || 0.5
);

/**
 * @param {string} token
 * @param {string} [expectedAction='lead_submit']
 * @returns {Promise<{ ok: boolean, skipped?: boolean, score?: number, error?: string }>}
 */
async function verifyRecaptchaV3(
  token,
  expectedAction = "lead_submit"
) {
  const secret = String(
    process.env.RECAPTCHA_SECRET_KEY || ""
  ).trim();

  if (!secret) {
    return { ok: true, skipped: true };
  }

  if (!token || typeof token !== "string") {
    return { ok: false, error: "missing_token" };
  }

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret,
        response: token.trim(),
      }),
    });

    const data = await res.json();

    if (!data?.success) {
      return {
        ok: false,
        error: "verification_failed",
      };
    }

    if (
      expectedAction &&
      data.action &&
      data.action !== expectedAction
    ) {
      return { ok: false, error: "action_mismatch" };
    }

    const score =
      typeof data.score === "number"
        ? data.score
        : 0;

    if (score < MIN_SCORE) {
      return {
        ok: false,
        error: "low_score",
        score,
      };
    }

    return { ok: true, score };
  } catch {
    return { ok: false, error: "verify_request_failed" };
  }
}

module.exports = {
  verifyRecaptchaV3,
};
