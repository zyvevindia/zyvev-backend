#!/usr/bin/env node
/**
 * SEO page governance audit CLI.
 * Usage: node scripts/audit-seo-pages.js
 */

const path = require("path");
const { auditSeoPages } = require("../services/seo-page-audits");

const tier1Root =
  process.env.TIER1_ROOT ||
  path.join(
    __dirname,
    "../docs/architecture/catalog/tier-1"
  );

const report = auditSeoPages({ tier1Root });

console.log(JSON.stringify(report, null, 2));

if (report.errors > 0) {
  process.exit(1);
}

process.exit(0);
