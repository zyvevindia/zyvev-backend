#!/usr/bin/env node
/**
 * Usage: node scripts/report-market-health.js [--db]
 */
require("dotenv").config();
const {
  buildMarketHealthReport,
} = require("../services/market-health-monitoring");

async function main() {
  const report = await buildMarketHealthReport({
    includeDb: process.argv.includes("--db"),
  });
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
