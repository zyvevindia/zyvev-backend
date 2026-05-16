#!/usr/bin/env node
require("dotenv").config();
const {
  auditLeadSourceContinuity,
} = require("../services/lead-source-continuity-audits");

auditLeadSourceContinuity({
  includeDb: process.argv.includes("--db"),
  sinceDays: parseInt(process.argv[2] || "30", 10),
})
  .then((report) => {
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.errors > 0 ? 1 : 0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
