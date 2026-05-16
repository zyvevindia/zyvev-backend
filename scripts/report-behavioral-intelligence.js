#!/usr/bin/env node
/**
 * Internal behavioral intelligence report (requires MongoDB + BEHAVIORAL_INTELLIGENCE_ENABLED).
 * Usage: node scripts/report-behavioral-intelligence.js [days]
 */

require("dotenv").config();
const mongoose = require("mongoose");
const { buildInternalReport } = require("../services/buyer-intelligence");

const days = parseInt(process.argv[2] || "7", 10);

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI required");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const report = await buildInternalReport(days);
  console.log(JSON.stringify(report, null, 2));
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
