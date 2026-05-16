#!/usr/bin/env node
/**
 * Audit Tier-1 slugs and canonical route consistency.
 * Usage: node scripts/audit-catalog-slugs.js
 */

const path = require("path");
const {
  auditTier1,
  formatReport,
} = require("../services/catalog-slug-audits");

const tier1Root = path.join(
  __dirname,
  "../docs/architecture/catalog/tier-1"
);

const report = auditTier1(tier1Root);

console.log(formatReport(report));

if (report.errors > 0) {
  process.exit(1);
}
process.exit(0);
