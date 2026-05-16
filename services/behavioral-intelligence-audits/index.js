/**
 * Behavioral intelligence audits — schema, PII, governance.
 */

const {
  ALLOWED_EVENT_TYPES,
  validateEventPayload,
  EVENT_TYPES,
} = require("../behavioral-intelligence/eventSchema");
const {
  getGovernanceManifest,
  PROHIBITED_PRACTICES,
} = require("../behavioral-intelligence/governance");

const SAMPLE_EVENTS = [
  {
    eventType: EVENT_TYPES.DETAIL_PAGE_VIEWED,
    sessionId: "audit_sample_session_0001",
    timestamp: new Date().toISOString(),
    payload: {
      vehicleSlugs: ["tata-nexon-ev-empowered-lr"],
      sourcePage: "/cars/tata-nexon-ev-empowered-lr",
    },
  },
  {
    eventType: EVENT_TYPES.LEAD_CTA_INITIATED,
    sessionId: "audit_sample_session_0001",
    timestamp: new Date().toISOString(),
    payload: {
      sourcePage: "compare",
      vehicleSlugs: ["tata-nexon-ev-empowered-lr", "mg-zs-ev-excite"],
    },
  },
  {
    eventType: "invalid_event_type",
    sessionId: "audit_sample_session_0001",
    timestamp: new Date().toISOString(),
    payload: {},
  },
  {
    eventType: EVENT_TYPES.LEAD_SUBMITTED,
    sessionId: "audit_sample_session_pii_test",
    timestamp: new Date().toISOString(),
    payload: {
      email: "test@example.com",
      sourcePage: "detail",
    },
  },
];

function auditBehavioralIntelligence() {
  const invalidEvents = [];
  const missingSchemaFields = [];
  const unsupportedTracking = [];
  const accidentalPii = [];
  const duplicateRisk = [];

  for (const sample of SAMPLE_EVENTS) {
    const result = validateEventPayload(sample);
    if (!result.valid) {
      invalidEvents.push({
        eventType: sample.eventType,
        errors: result.errors,
      });
      if (
        result.errors.some((e) =>
          e.includes("email") || e.includes("phone")
        )
      ) {
        accidentalPii.push({
          eventType: sample.eventType,
          errors: result.errors,
        });
      }
      if (
        result.errors.some((e) =>
          e.includes("unsupported eventType")
        )
      ) {
        unsupportedTracking.push(sample.eventType);
      }
    }
  }

  const requiredTypes = [
    EVENT_TYPES.DETAIL_PAGE_VIEWED,
    EVENT_TYPES.COMPARE_STARTED,
    EVENT_TYPES.COMPARE_COMPLETED,
    EVENT_TYPES.OWNERSHIP_PANEL_VIEWED,
    EVENT_TYPES.CHARGING_REALITY_EXPANDED,
    EVENT_TYPES.SCENARIO_COMPARE_VIEWED,
    EVENT_TYPES.SEO_TO_DETAIL,
    EVENT_TYPES.LEAD_CTA_INITIATED,
    EVENT_TYPES.LEAD_SUBMITTED,
    EVENT_TYPES.BOOKMARK_SAVED,
  ];

  for (const t of requiredTypes) {
    if (!ALLOWED_EVENT_TYPES.has(t)) {
      missingSchemaFields.push({
        field: "eventType",
        value: t,
        reason: "not in allowlist",
      });
    }
  }

  duplicateRisk.push({
    note: "dedupeKey prevents identical session+type+minute duplicates",
    implementation: "event-tracking/sessionUtils.buildDedupeKey",
  });

  const governance = getGovernanceManifest();

  const negativeProbeTypes = new Set([
    "invalid_event_type",
    EVENT_TYPES.LEAD_SUBMITTED,
  ]);
  const errors =
    invalidEvents.filter((e) => !negativeProbeTypes.has(e.eventType))
      .length + missingSchemaFields.length;

  const warnings =
    accidentalPii.length +
    unsupportedTracking.length;

  return {
    allowedEventCount: ALLOWED_EVENT_TYPES.size,
    governance,
    prohibitedPractices: PROHIBITED_PRACTICES,
    invalidEvents,
    missingSchemaFields,
    unsupportedTracking,
    accidentalPii,
    duplicateRisk,
    sampleValidations: SAMPLE_EVENTS.map((s) => ({
      eventType: s.eventType,
      ...validateEventPayload(s),
    })),
    errors,
    warnings,
  };
}

module.exports = {
  auditBehavioralIntelligence,
};
