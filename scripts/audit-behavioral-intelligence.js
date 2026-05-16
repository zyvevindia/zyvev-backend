#!/usr/bin/env node
/**
 * Behavioral intelligence governance audit.
 * Usage: node scripts/audit-behavioral-intelligence.js
 */

const {
  auditBehavioralIntelligence,
} = require("../services/behavioral-intelligence-audits");

const report = auditBehavioralIntelligence();

console.log(JSON.stringify(report, null, 2));

/** Expected failures in sample set — governance must reject these */
const EXPECTED_INVALID = new Set([
  "invalid_event_type",
  "lead_submitted",
]);

const unexpected = report.invalidEvents.filter(
  (e) => !EXPECTED_INVALID.has(e.eventType)
);

if (unexpected.length > 0 || report.missingSchemaFields.length > 0) {
  process.exit(1);
}

process.exit(0);
