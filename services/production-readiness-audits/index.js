/**
 * Unified production-readiness audit orchestrator.
 */

const { generateSitemapBundle } = require("../sitemap-generation");
const { auditCanonicalSeo } = require("../canonical-seo-audits");
const { auditSeoPages } = require("../seo-page-audits");
const { auditTier1 } = require("../catalog-slug-audits");
const {
  auditBehavioralIntelligence,
} = require("../behavioral-intelligence-audits");
const path = require("path");

function auditLeadPipelineCodePaths() {
  const checks = [
    {
      name: "lead_post_accepts_anonymous_session",
      file: ["server.js"],
      pattern: "anonymousSessionId",
      ok: false,
    },
    {
      name: "lead_model_buyer_intent_context",
      file: ["models/Lead.js"],
      pattern: "buyerIntentContext",
      ok: false,
    },
    {
      name: "frontend_lead_submitted_event",
      file: [
        "..",
        "zyvev-frontend",
        "src",
        "components",
        "LeadInquiryModal.jsx",
      ],
      pattern: "LEAD_SUBMITTED",
      ok: false,
    },
    {
      name: "frontend_seo_to_detail_event",
      file: [
        "..",
        "zyvev-frontend",
        "src",
        "components",
        "seo",
        "SeoRecommendationList.jsx",
      ],
      pattern: "SEO_TO_DETAIL",
      ok: false,
    },
  ];

  const fs = require("fs");
  const root = path.join(__dirname, "../..");

  for (const c of checks) {
    const fp = Array.isArray(c.file)
      ? path.join(root, ...c.file)
      : path.join(root, c.file);
    try {
      const content = fs.readFileSync(fp, "utf8");
      c.ok = content.includes(c.pattern);
    } catch {
      c.ok = false;
    }
  }

  return {
    checks,
    allOk: checks.every((c) => c.ok),
  };
}

function auditCrawlabilityHints(options = {}) {
  const findings = [];
  const publicDir = path.join(
    __dirname,
    "../../../zyvev-frontend/public"
  );
  const fs = require("fs");

  const required = [
    "sitemap.xml",
    "robots.txt",
    "sitemaps/cars.xml",
    "sitemaps/seo-pages.xml",
    "sitemaps/compare.xml",
  ];

  for (const rel of required) {
    const fp = path.join(publicDir, rel);
    if (!fs.existsSync(fp)) {
      findings.push({
        severity: "error",
        message: `Missing ${rel} — run node scripts/build-sitemaps.mjs`,
      });
    } else {
      const size = fs.statSync(fp).size;
      findings.push({
        severity: "ok",
        message: `${rel} (${size} bytes)`,
      });
    }
  }

  const robots = fs.existsSync(path.join(publicDir, "robots.txt"))
    ? fs.readFileSync(path.join(publicDir, "robots.txt"), "utf8")
    : "";

  if (!robots.includes("Sitemap:")) {
    findings.push({
      severity: "error",
      message: "robots.txt missing Sitemap directive",
    });
  }

  if (!robots.includes("Disallow: /*?*")) {
    findings.push({
      severity: "warning",
      message: "robots.txt may not block query-string crawl traps",
    });
  }

  return { findings };
}

function auditProductionReadiness(options = {}) {
  const tier1Root =
    options.tier1Root ||
    path.join(
      __dirname,
      "../../docs/architecture/catalog/tier-1"
    );

  let sitemap;
  let sitemapError = null;
  try {
    sitemap = generateSitemapBundle({ tier1Root });
  } catch (err) {
    sitemapError = err.message;
  }

  const canonical = auditCanonicalSeo({ tier1Root });
  const seoPages = auditSeoPages({ tier1Root });
  const slugs = auditTier1(tier1Root);
  const behavioral = auditBehavioralIntelligence();
  const leadPipeline = auditLeadPipelineCodePaths();
  const crawlability = auditCrawlabilityHints();

  const crawlErrors = crawlability.findings.filter(
    (f) => f.severity === "error"
  ).length;

  const errors =
    (sitemapError ? 1 : 0) +
    canonical.errors +
    seoPages.errors +
    slugs.errors +
    crawlErrors +
    (leadPipeline.allOk ? 0 : 1);

  const warnings =
    canonical.warnings +
    seoPages.warnings +
    slugs.warnings +
    behavioral.warnings +
    crawlability.findings.filter((f) => f.severity === "warning")
      .length;

  return {
    generatedAt: new Date().toISOString(),
    ready: errors === 0,
    sitemap: sitemap
      ? sitemap.stats
      : { error: sitemapError },
    canonical: {
      errors: canonical.errors,
      warnings: canonical.warnings,
    },
    seoPages: {
      errors: seoPages.errors,
      warnings: seoPages.warnings,
    },
    slugGovernance: {
      errors: slugs.errors,
      warnings: slugs.warnings,
    },
    behavioral: {
      errors: behavioral.errors,
      warnings: behavioral.warnings,
    },
    leadPipeline,
    crawlability,
    errors,
    warnings,
  };
}

module.exports = {
  auditProductionReadiness,
};
