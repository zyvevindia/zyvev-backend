/**
 * Buyer intent / behavioral intelligence feature flags.
 */

const BEHAVIORAL_INTELLIGENCE_ENABLED =
  process.env.BEHAVIORAL_INTELLIGENCE_ENABLED === "true";

/** Days until events are purged (TTL index). */
const BEHAVIORAL_EVENT_RETENTION_DAYS = parseInt(
  process.env.BEHAVIORAL_EVENT_RETENTION_DAYS || "90",
  10
);

/** Max events accepted per session per hour (abuse guard). */
const BEHAVIORAL_SESSION_HOURLY_CAP = parseInt(
  process.env.BEHAVIORAL_SESSION_HOURLY_CAP || "120",
  10
);

module.exports = {
  BEHAVIORAL_INTELLIGENCE_ENABLED,
  BEHAVIORAL_EVENT_RETENTION_DAYS,
  BEHAVIORAL_SESSION_HOURLY_CAP,
};
