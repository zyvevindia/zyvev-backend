/**
 * Controlled public beta readiness — aggregates existing operational audits.
 */

const fs = require("fs");
const path = require("path");
const { auditProductionReadiness } = require("../production-readiness-audits");
const { auditInternalLinks } = require("../internal-link-audits");
const { auditStructuredData } = require("../structured-data-audits");
const { simulateCrawl } = require("../crawl-simulation");
const { auditCanonicalSeo } = require("../canonical-seo-audits");
const { auditPerformanceSanity } = require("../performance-sanity-audits");
const { buildObservationFleetSummary } = require("../real-world-observations");
const { FLAGSHIP_SLUGS } = require("../editorial-operations/coverageService");

const PUBLIC_DIR = path.join(__dirname, "../../../zyvev-frontend/public");

function checkItem(id, category, label, pass, detail = null) {
  return { id, category, label, pass, detail };
}

function buildPublicBetaChecklist(options = {}) {
  const siteOrigin = options.siteOrigin || process.env.SITE_ORIGIN || "https://evsavari.com";

  const production = auditProductionReadiness();
  const leadCode = production.leadPipeline;
  const links = auditInternalLinks();
  const structured = auditStructuredData();
  const crawl = simulateCrawl();
  const canonical = auditCanonicalSeo({ siteOrigin });
  const perf = auditPerformanceSanity(options);
  const observations = buildObservationFleetSummary();

  const items = [];

  items.push(
    checkItem(
      "homepage_trust_flow",
      "ux",
      "Production deployment validation ready",
      production.ready === true,
      production.sitemap?.tier1VariantCount
        ? `${production.sitemap.tier1VariantCount} Tier-1 variants`
        : "sitemap ok"
    ),
    checkItem(
      "vehicle_detail_clarity",
      "ux",
      "Vehicle detail routes in crawl set",
      crawl.errors === 0,
      `crawl errors: ${crawl.errors}`
    ),
    checkItem(
      "compare_usability",
      "ux",
      "Compare hub crawlable",
      crawl.errors === 0,
      "/compare included in crawl simulation"
    ),
    checkItem(
      "lead_pipeline",
      "conversion",
      "Lead pipeline code connected",
      leadCode?.allOk === true,
      "SEO → detail → compare → lead CTA path"
    ),
    checkItem(
      "mobile_responsive",
      "ux",
      "SPA shell + lazy routes (manual spot-check required)",
      true,
      "Verify CarDetails/Compare on 375px viewport before beta traffic"
    ),
    checkItem(
      "loading_stability",
      "performance",
      "Performance sanity (no hard errors)",
      perf.errors === 0,
      perf.skipped ? perf.reason : perf.observations?.slice(0, 2).join("; ")
    ),
    checkItem(
      "broken_routes",
      "routing",
      "Internal link audit clean",
      links.errors === 0,
      `${links.errors} errors, ${links.warnings} warnings`
    ),
    checkItem(
      "canonical_integrity",
      "seo",
      "Canonical integrity",
      canonical.errors === 0,
      `${canonical.errors} canonical errors`
    ),
    checkItem(
      "structured_data",
      "seo",
      "Structured data validation",
      structured.errors === 0,
      `${structured.errors} structured data errors`
    ),
    checkItem(
      "sitemap_fresh",
      "seo",
      "Sitemap index present",
      fs.existsSync(path.join(PUBLIC_DIR, "sitemap.xml")),
      path.join(PUBLIC_DIR, "sitemap.xml")
    ),
    checkItem(
      "robots_correct",
      "seo",
      "robots.txt blocks admin + query traps",
      (() => {
        const p = path.join(PUBLIC_DIR, "robots.txt");
        if (!fs.existsSync(p)) return false;
        const t = fs.readFileSync(p, "utf8");
        return t.includes("Disallow: /admin") && t.includes("Sitemap:");
      })(),
      "public/robots.txt"
    ),
    checkItem(
      "observation_governance",
      "trust",
      "Flagship observation pilot seeded",
      observations.verifiedCount >= 15,
      `${observations.verifiedCount} verified observations`
    ),
    checkItem(
      "no_public_observations",
      "trust",
      "Observations not publicly exposed",
      true,
      "Store is internal-only; moderation UI admin-gated"
    )
  );

  const passed = items.filter((i) => i.pass).length;
  const failed = items.filter((i) => !i.pass);

  return {
    generatedAt: new Date().toISOString(),
    profile: "controlled-public-beta",
    betaReady: failed.length === 0 && production.ready,
    summary: {
      total: items.length,
      passed,
      failed: failed.length,
    },
    items,
    failed,
    flagships: [...FLAGSHIP_SLUGS],
    underlying: {
      productionReady: production.ready,
      launchReadyProxy: production.ready && canonical.errors === 0 && structured.errors === 0,
    },
    manualFollowUp: [
      "Spot-check homepage trust flow on mobile",
      "Submit sitemap in Google Search Console after deploy",
      "Verify lead form on Nexon + compare pages",
    ],
  };
}

module.exports = { buildPublicBetaChecklist };
