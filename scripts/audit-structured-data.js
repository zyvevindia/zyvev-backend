#!/usr/bin/env node
const { auditStructuredData } = require("../services/structured-data-audits");
const report = auditStructuredData();
console.log(JSON.stringify(report, null, 2));
process.exit(report.errors > 0 ? 1 : 0);
