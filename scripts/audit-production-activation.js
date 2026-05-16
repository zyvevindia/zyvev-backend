#!/usr/bin/env node
/**
 * Production activation audit for Week 1 live ops.
 * Usage: node scripts/audit-production-activation.js [--live https://evsavari.com] [profile]
 */
require("dotenv").config();
const {
  buildProductionActivationReport,
} = require("../services/production-activation");

const KNOWN_PROFILES = ["public-beta", "soft-launch", "staging", "intelligence-public"];

function parseArgs() {
  const liveIdx = process.argv.indexOf("--live");
  const liveOrigin =
    liveIdx >= 0
      ? process.argv[liveIdx + 1] || process.env.SITE_ORIGIN
      : null;
  const profile =
    KNOWN_PROFILES.find((p) => process.argv.includes(p)) || "public-beta";
  return {
    profile,
    liveOrigin: liveIdx >= 0 ? liveOrigin : null,
  };
}

async function main() {
  const { profile, liveOrigin } = parseArgs();
  const report = await buildProductionActivationReport({ profile, liveOrigin });
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.productionReady ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
