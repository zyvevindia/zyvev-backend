#!/usr/bin/env node
/**
 * Unified production-readiness audit.
 * Usage: node scripts/audit-production-readiness.js
 */

const {
  auditProductionReadiness,
} = require("../services/production-readiness-audits");

const report = auditProductionReadiness();

console.log(JSON.stringify(report, null, 2));

if (!report.ready) {
  process.exit(1);
}

process.exit(0);
