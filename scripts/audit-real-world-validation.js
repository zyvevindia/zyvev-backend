#!/usr/bin/env node
/**
 * Unified real-world validation audit.
 * Usage: node scripts/audit-real-world-validation.js [--db] [--live URL]
 */
require("dotenv").config();
const {
  auditRealWorldValidation,
} = require("../services/real-world-validation");

const args = process.argv.slice(2);
const liveIdx = args.indexOf("--live");

auditRealWorldValidation({
  includeDb: args.includes("--db"),
  liveUrl:
    liveIdx >= 0
      ? args[liveIdx + 1] || process.env.SITE_ORIGIN
      : undefined,
  sinceDays: parseInt(args.find((a) => /^\d+$/.test(a)) || "7", 10),
})
  .then((report) => {
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.ready ? 0 : 1);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
