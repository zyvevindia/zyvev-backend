#!/usr/bin/env node
/**
 * Weekly live intelligence ops report.
 * Usage: node scripts/report-weekly-live-ops.js [--db] [--smoke] [days]
 */
require("dotenv").config();
const { buildWeeklyLiveOpsReport } = require("../services/weekly-live-ops");

const args = process.argv.slice(2);
const includeDb = args.includes("--db");
const runSmoke = args.includes("--smoke");
const daysArg = args.find((a) => /^\d+$/.test(a));
const sinceDays = daysArg ? parseInt(daysArg, 10) : 7;

async function main() {
  if (includeDb && process.env.MONGO_URI) {
    const mongoose = require("mongoose");
    await mongoose.connect(process.env.MONGO_URI);
  }

  const report = await buildWeeklyLiveOpsReport({
    includeDb,
    runSmoke,
    sinceDays,
  });

  if (includeDb && process.env.MONGO_URI) {
    const mongoose = require("mongoose");
    await mongoose.disconnect();
  }

  console.log(JSON.stringify(report, null, 2));
  process.exit(report.allChecksPass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
