#!/usr/bin/env node
/**
 * Usage: node scripts/report-behavioral-trends.js [days]
 */
require("dotenv").config();
const { buildBehavioralTrends } = require("../services/behavioral-trends");

const days = parseInt(process.argv[2] || "7", 10);

async function main() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI required");
    process.exit(1);
  }
  const mongoose = require("mongoose");
  await mongoose.connect(process.env.MONGO_URI);
  const report = await buildBehavioralTrends(days);
  await mongoose.disconnect();
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
