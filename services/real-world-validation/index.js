/**
 * Unified real-world validation audit orchestrator.
 */

const { validateProductionDeployment } = require("../production-deployment-validation");
const { buildCrawlObservations } = require("../crawl-observations");
const { auditCanonicalSeo } = require("../canonical-seo-audits");
const { auditStructuredData } = require("../structured-data-audits");
const { auditLeadSourceContinuity } = require("../lead-source-continuity-audits");
const { auditLeadPipelineCode } = require("../lead-pipeline-audits");
const { simulateCrawl } = require("../crawl-simulation");
const path = require("path");

async function auditRealWorldValidation(options = {}) {
  const deployment = await validateProductionDeployment({
    ...options,
    includeContinuity: false,
  });

  const crawl = buildCrawlObservations(options);
  const canonical = auditCanonicalSeo(options);
  const structured = auditStructuredData(options);
  const leadCode = auditLeadPipelineCode();
  const continuity = await auditLeadSourceContinuity({
    includeDb: options.includeDb && !!process.env.MONGO_URI,
    sinceDays: options.sinceDays || 30,
  });
  const crawlSim = simulateCrawl(options);

  let behavioralContinuity = { skipped: true };
  if (options.includeDb && process.env.MONGO_URI) {
    const mongoose = require("mongoose");
    await mongoose.connect(process.env.MONGO_URI);
    try {
      const BuyerBehaviorEvent = require("../../models/BuyerBehaviorEvent");
      const since = new Date(
        Date.now() - (options.sinceDays || 7) * 24 * 60 * 60 * 1000
      );
      const eventCount = await BuyerBehaviorEvent.countDocuments({
        createdAt: { $gte: since },
      });
      behavioralContinuity = {
        eventsInPeriod: eventCount,
        ingestionExpected:
          process.env.BEHAVIORAL_INTELLIGENCE_ENABLED === "true",
        ok:
          process.env.BEHAVIORAL_INTELLIGENCE_ENABLED !== "true" ||
          eventCount >= 0,
      };
    } finally {
      await mongoose.disconnect();
    }
  }

  const checks = [
    {
      id: "production_static",
      pass: deployment.static.pass,
      label: "Production static deployment checks",
    },
    {
      id: "canonical_consistency",
      pass: canonical.errors === 0,
      label: "Canonical consistency",
    },
    {
      id: "structured_data",
      pass: structured.errors === 0,
      label: "Structured data presence (static audit)",
    },
    {
      id: "sitemap_validity",
      pass: crawl.sitemapFreshness.status !== "missing",
      label: "Sitemap validity / freshness",
    },
    {
      id: "lead_flow_code",
      pass: leadCode.allConnected,
      label: "Lead-flow code continuity",
    },
    {
      id: "lead_attribution_code",
      pass: continuity.code?.allConnected !== false,
      label: "Lead attribution code paths",
    },
    {
      id: "compare_code",
      pass: leadCode.steps?.some((s) => s.step === "compare_started" && s.ok),
      label: "Compare event wiring",
    },
  ];

  if (deployment.live) {
    checks.push({
      id: "production_live",
      pass: deployment.live.pass,
      label: "Live HTTP production checks",
    });
  }

  if (options.includeDb && continuity.db && !continuity.db.skipped) {
    checks.push({
      id: "lead_attribution_db",
      pass: !continuity.db.gaps?.some((g) =>
        g.issue.includes("pii")
      ),
      label: "Lead DB attribution (no PII in intent)",
    });
  }

  const errors = checks.filter((c) => !c.pass).length;

  return {
    generatedAt: new Date().toISOString(),
    launchPhase: "real-world-validation",
    ready: errors === 0,
    checks,
    deployment: {
      staticPass: deployment.static.pass,
      livePass: deployment.live?.pass ?? null,
    },
    crawlObservations: {
      crawlableUrls: crawl.indexedVsCrawlable.crawlableUrls,
      orphanCount: crawl.orphanRoutes.count,
      sitemapFreshness: crawl.sitemapFreshness,
    },
    canonical: { errors: canonical.errors, warnings: canonical.warnings },
    structuredData: { errors: structured.errors },
    leadContinuity: continuity,
    behavioralContinuity,
    crawlSimulation: {
      orphanCount: crawl.orphanRoutes.count,
      unreachable: crawlSim.unreachable?.length ?? 0,
    },
    errors,
    nextSteps: [
      "node scripts/validate-production-deployment.js --live",
      "node scripts/report-crawl-observations.js",
      "node scripts/report-validation-dashboard.js --db",
    ],
  };
}

module.exports = {
  auditRealWorldValidation,
};
