#!/usr/bin/env node
require("dotenv").config();
const { auditLeadPipeline } = require("../services/lead-pipeline-audits");

auditLeadPipeline({ includeDb: process.argv.includes("--db") })
  .then((report) => {
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.errors > 0 ? 1 : 0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
