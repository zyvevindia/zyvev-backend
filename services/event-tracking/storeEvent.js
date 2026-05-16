const BuyerBehaviorEvent = require("../../models/BuyerBehaviorEvent");
const {
  validateEventPayload,
} = require("../behavioral-intelligence/eventSchema");
const {
  assertGovernanceCompliance,
} = require("../behavioral-intelligence/governance");
const { buildDedupeKey } = require("./sessionUtils");
const {
  BEHAVIORAL_SESSION_HOURLY_CAP,
} = require("../../config/behavioral");
const { logProduction } = require("../production-logging/logger");

async function countRecentSessionEvents(sessionId) {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  return BuyerBehaviorEvent.countDocuments({
    sessionId,
    createdAt: { $gte: since },
  });
}

/**
 * @param {object} rawEvent — client event
 * @returns {Promise<{ ok: boolean, stored?: boolean, errors?: string[] }>}
 */
async function storeBuyerEvent(rawEvent) {
  const validation = validateEventPayload(rawEvent);
  if (!validation.valid) {
    logProduction(
      "behavioral",
      "ingestion_rejected",
      { errors: validation.errors, eventType: rawEvent?.eventType },
      "warn"
    );
    return { ok: false, errors: validation.errors };
  }

  const event = validation.sanitized;
  const governanceViolations = assertGovernanceCompliance(event);
  if (governanceViolations.length) {
    return {
      ok: false,
      errors: governanceViolations.map((v) => v.message),
    };
  }

  const recentCount = await countRecentSessionEvents(
    event.sessionId
  );
  if (recentCount >= BEHAVIORAL_SESSION_HOURLY_CAP) {
    logProduction(
      "behavioral",
      "session_rate_limited",
      { sessionId: event.sessionId },
      "warn"
    );
    return {
      ok: false,
      errors: ["session_rate_limit"],
      rateLimited: true,
    };
  }

  const dedupeKey = buildDedupeKey(event);

  const existing = await BuyerBehaviorEvent.findOne({
    dedupeKey,
  }).lean();

  if (existing) {
    return { ok: true, stored: false, duplicate: true };
  }

  await BuyerBehaviorEvent.create({
    eventType: event.eventType,
    sessionId: event.sessionId,
    timestamp: new Date(event.timestamp),
    payload: event.payload,
    dedupeKey,
  });

  return { ok: true, stored: true };
}

async function storeBuyerEventsBatch(events = []) {
  const results = [];
  for (const ev of events) {
    results.push(await storeBuyerEvent(ev));
  }
  return results;
}

module.exports = {
  storeBuyerEvent,
  storeBuyerEventsBatch,
};
