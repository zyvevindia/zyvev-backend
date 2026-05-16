#!/usr/bin/env node
/**
 * Acquisition governance audits.
 */

require("dotenv").config();
const { auditDataAcquisition } = require("../services/data-acquisition/audit");

const report = auditDataAcquisition();
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
