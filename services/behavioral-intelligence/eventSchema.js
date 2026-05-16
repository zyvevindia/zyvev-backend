/**
 * Allowed buyer behavior events — deterministic naming, structured payloads.
 */

const EVENT_TYPES = Object.freeze({
  DETAIL_PAGE_VIEWED: "detail_page_viewed",
  COMPARE_STARTED: "compare_started",
  COMPARE_COMPLETED: "compare_completed",
  OWNERSHIP_PANEL_VIEWED: "ownership_panel_viewed",
  CHARGING_REALITY_EXPANDED: "charging_reality_expanded",
  SCENARIO_COMPARE_VIEWED: "scenario_compare_viewed",
  SEO_TO_DETAIL: "seo_to_detail",
  LEAD_CTA_INITIATED: "lead_cta_initiated",
  LEAD_SUBMITTED: "lead_submitted",
  BOOKMARK_SAVED: "bookmark_saved",
});

const ALLOWED_EVENT_TYPES = new Set(Object.values(EVENT_TYPES));

const REQUIRED_BASE_FIELDS = ["eventType", "sessionId", "timestamp"];

const OPTIONAL_PAYLOAD_FIELDS = new Set([
  "vehicles",
  "vehicleSlugs",
  "sourcePage",
  "sessionIntent",
  "compareDepth",
  "seoPageSlug",
  "targetSlug",
  "panel",
  "scenarioKey",
  "journeyStep",
  "metadata",
]);

const PROHIBITED_PAYLOAD_KEYS = new Set([
  "name",
  "phone",
  "email",
  "address",
  "ip",
  "fingerprint",
  "userId",
  "userAgent",
  "deviceId",
  "cookie",
  "password",
  "token",
]);

function isAllowedEventType(eventType) {
  return ALLOWED_EVENT_TYPES.has(eventType);
}

function validateEventPayload(event) {
  const errors = [];
  const warnings = [];

  if (!event || typeof event !== "object") {
    return { valid: false, errors: ["event must be an object"], warnings };
  }

  for (const field of REQUIRED_BASE_FIELDS) {
    if (event[field] == null || event[field] === "") {
      errors.push(`missing required field: ${field}`);
    }
  }

  if (event.eventType && !isAllowedEventType(event.eventType)) {
    errors.push(`unsupported eventType: ${event.eventType}`);
  }

  if (event.sessionId) {
    const sid = String(event.sessionId);
    if (sid.length < 16 || sid.length > 64) {
      errors.push("sessionId length invalid");
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(sid)) {
      errors.push("sessionId format invalid");
    }
  }

  const payload = event.payload || {};
  if (typeof payload !== "object" || Array.isArray(payload)) {
    errors.push("payload must be a plain object");
  } else {
    for (const key of Object.keys(payload)) {
      if (PROHIBITED_PAYLOAD_KEYS.has(key.toLowerCase())) {
        errors.push(`prohibited payload key: ${key}`);
      }
    }
    scanForPii(payload, "", errors);
  }

  if (event.timestamp) {
    const t = Date.parse(event.timestamp);
    if (Number.isNaN(t)) {
      errors.push("timestamp not parseable");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sanitized: sanitizeEvent(event),
  };
}

function scanForPii(obj, path, errors) {
  if (!obj || typeof obj !== "object") return;

  for (const [key, val] of Object.entries(obj)) {
    const fullKey = path ? `${path}.${key}` : key;
    if (PROHIBITED_PAYLOAD_KEYS.has(key.toLowerCase())) {
      errors.push(`prohibited nested key: ${fullKey}`);
    }
    if (typeof val === "string") {
      if (/@/.test(val) && /\.[a-z]{2,}$/i.test(val)) {
        errors.push(`possible email in payload: ${fullKey}`);
      }
      if (/^\+?[\d\s-]{10,}$/.test(val.replace(/\s/g, ""))) {
        errors.push(`possible phone in payload: ${fullKey}`);
      }
    } else if (val && typeof val === "object") {
      scanForPii(val, fullKey, errors);
    }
  }
}

function sanitizeEvent(event) {
  const payload = { ...(event.payload || {}) };
  for (const key of Object.keys(payload)) {
    if (PROHIBITED_PAYLOAD_KEYS.has(key.toLowerCase())) {
      delete payload[key];
    }
  }

  return {
    eventType: event.eventType,
    sessionId: String(event.sessionId).slice(0, 64),
    timestamp: new Date(event.timestamp).toISOString(),
    payload: pickAllowedPayload(payload),
  };
}

function pickAllowedPayload(payload) {
  const out = {};
  for (const key of Object.keys(payload)) {
    if (
      OPTIONAL_PAYLOAD_FIELDS.has(key) ||
      key.startsWith("meta_")
    ) {
      out[key] = payload[key];
    }
  }
  return out;
}

module.exports = {
  EVENT_TYPES,
  ALLOWED_EVENT_TYPES,
  REQUIRED_BASE_FIELDS,
  PROHIBITED_PAYLOAD_KEYS,
  isAllowedEventType,
  validateEventPayload,
};
