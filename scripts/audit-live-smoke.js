#!/usr/bin/env node
/**
 * Live smoke test against production origin.
 * Usage: node scripts/audit-live-smoke.js [https://evsavari.com]
 */
const { runLiveSmokeTest } = require("../services/live-smoke-test");

async function main() {
  const origin = process.argv[2] || process.env.SITE_ORIGIN || "https://evsavari.com";
  const report = await runLiveSmokeTest({ origin });
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.smokePass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
