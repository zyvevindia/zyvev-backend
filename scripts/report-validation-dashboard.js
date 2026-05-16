#!/usr/bin/env node
/**
 * Minimal validation dashboard — CLI.
 * Usage: node scripts/report-validation-dashboard.js [--db] [days]
 */
require("dotenv").config();
const {
  buildValidationDashboard,
} = require("../services/validation-dashboard");

const args = process.argv.slice(2);
const includeDb = args.includes("--db");
const daysArg = args.find((a) => /^\d+$/.test(a));
const sinceDays = parseInt(daysArg || "7", 10);

buildValidationDashboard({ includeDb, sinceDays })
  .then((r) => console.log(JSON.stringify(r, null, 2)))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
