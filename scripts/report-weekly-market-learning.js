#!/usr/bin/env node
/**
 * Usage: node scripts/report-weekly-market-learning.js [--db] [days]
 */
require("dotenv").config();
const {
  buildWeeklyMarketLearningReport,
} = require("../services/market-learning/weeklyMarketLearningReport");

async function main() {
  const includeDb = process.argv.includes("--db");
  const daysArg = process.argv.find((a) => /^\d+$/.test(a));
  const sinceDays = daysArg ? Number(daysArg) : 7;

  const report = await buildWeeklyMarketLearningReport({
    sinceDays,
    includeDb,
  });
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
