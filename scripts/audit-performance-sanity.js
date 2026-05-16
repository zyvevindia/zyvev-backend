#!/usr/bin/env node
const {
  auditPerformanceSanity,
} = require("../services/performance-sanity-audits");
const report = auditPerformanceSanity();
console.log(JSON.stringify(report, null, 2));
process.exit(report.errors > 0 ? 1 : 0);
