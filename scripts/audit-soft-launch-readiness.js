#!/usr/bin/env node
/**
 * Unified soft-launch readiness audit.
 */
const { auditProductionReadiness } = require("../services/production-readiness-audits");
const { auditInternalLinks } = require("../services/internal-link-audits");
const { auditStructuredData } = require("../services/structured-data-audits");
const { simulateCrawl } = require("../services/crawl-simulation");
const { auditLeadPipeline } = require("../services/lead-pipeline-audits");
const {
  auditPerformanceSanity,
} = require("../services/performance-sanity-audits");

async function main() {
  const production = auditProductionReadiness();
  const links = auditInternalLinks();
  const structured = auditStructuredData();
  const crawl = simulateCrawl();
  const lead = await auditLeadPipeline({ includeDb: false });
  const perf = auditPerformanceSanity();

  const errors =
    production.errors +
    links.errors +
    structured.errors +
    crawl.errors +
    (lead.code?.allConnected === false ? 1 : 0) +
    perf.errors;

  const report = {
    generatedAt: new Date().toISOString(),
    launchReady:
      errors === 0 &&
      production.ready &&
      lead.code?.allConnected !== false,
    production,
    internalLinks: { errors: links.errors, warnings: links.warnings },
    structuredData: { errors: structured.errors, warnings: structured.warnings },
    crawlSimulation: { errors: crawl.errors, warnings: crawl.warnings },
    leadPipeline: lead,
    performance: perf,
    totalErrors: errors,
  };

  console.log(JSON.stringify(report, null, 2));
  process.exit(report.launchReady ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
