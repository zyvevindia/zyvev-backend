#!/usr/bin/env node
/**
 * CLI: audit Tier-1 catalog intelligence governance.
 * Usage: node scripts/audit-catalog-intelligence.js [--verbose] [--strict]
 */

const path = require("path");
const { runTier1Audit } = require("../services/catalog-intelligence-audits");

const variantsDir = path.join(
  __dirname,
  "../docs/architecture/catalog/tier-1/variants"
);

const verbose = process.argv.includes("--verbose");
const strict = process.argv.includes("--strict");

const { results, report } = runTier1Audit(variantsDir, { verbose });

console.log(report.lines);

const failed = results.filter((r) => r.errors.length > 0);
if (strict && failed.length > 0) {
  process.exit(1);
}
process.exit(0);
