#!/usr/bin/env node
/**
 * Unified operational summary for launch operations.
 * Usage: node scripts/report-operational-dashboard.js [--db]
 */
require("dotenv").config();
const {
  buildOperationalDashboard,
} = require("../services/operational-dashboard");

buildOperationalDashboard({
  includeDb: process.argv.includes("--db"),
})
  .then((r) => {
    console.log(JSON.stringify(r, null, 2));
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
