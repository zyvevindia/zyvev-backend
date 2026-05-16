#!/usr/bin/env node
/**
 * Daily live ops rollup.
 * Usage: node scripts/report-daily-live-ops.js [--db] [--no-smoke]
 */
require("dotenv").config();
const { buildDailyLiveOpsReport } = require("../services/daily-live-ops");

async function main() {
  const report = await buildDailyLiveOpsReport({
    includeDb: process.argv.includes("--db"),
    runSmoke: !process.argv.includes("--no-smoke"),
    origin: process.argv.find((a) => a.startsWith("http")) || process.env.SITE_ORIGIN,
  });
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
