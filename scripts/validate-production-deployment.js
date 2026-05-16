#!/usr/bin/env node
/**
 * Post-deploy production validation.
 * Usage:
 *   node scripts/validate-production-deployment.js
 *   node scripts/validate-production-deployment.js --live https://evsavari.com
 *   node scripts/validate-production-deployment.js --db
 */
require("dotenv").config();
const {
  validateProductionDeployment,
} = require("../services/production-deployment-validation");

const args = process.argv.slice(2);
const liveIdx = args.indexOf("--live");
const liveUrl =
  liveIdx >= 0 ? args[liveIdx + 1] || process.env.SITE_ORIGIN : null;

validateProductionDeployment({
  liveUrl,
  includeContinuity: args.includes("--continuity"),
  includeDb: args.includes("--db"),
})
  .then((report) => {
    console.log(JSON.stringify(report, null, 2));
    const ok =
      report.ready &&
      (report.live ? report.live.pass : true);
    process.exit(ok ? 0 : 1);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
