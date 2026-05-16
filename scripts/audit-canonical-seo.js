#!/usr/bin/env node
/**
 * Canonical SEO validation CLI.
 * Usage: node scripts/audit-canonical-seo.js
 */

const {
  auditCanonicalSeo,
} = require("../services/canonical-seo-audits");

const report = auditCanonicalSeo();

console.log(JSON.stringify(report, null, 2));

if (report.errors > 0) {
  process.exit(1);
}

process.exit(0);
