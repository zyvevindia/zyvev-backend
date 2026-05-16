/**
 * Post-deploy production validation — static + optional live HTTP checks.
 */

const fs = require("fs");
const path = require("path");
const { auditCanonicalSeo } = require("../canonical-seo-audits");
const { auditStructuredData } = require("../structured-data-audits");
const { auditLeadPipelineCode } = require("../lead-pipeline-audits");
const { auditLeadSourceContinuity } = require("../lead-source-continuity-audits");
const { loadTier1Variants } = require("../seo-pages/loadCatalog");
const { getAllSeoSlugs } = require("../seo-pages/registry");

const DEFAULT_ORIGIN =
  process.env.SITE_ORIGIN || "https://evsavari.com";

function checklistItem(id, label, pass, detail = null) {
  return { id, label, pass, detail };
}

function runStaticChecks(options = {}) {
  const publicDir =
    options.publicDir ||
    path.join(__dirname, "../../../zyvev-frontend/public");
  const tier1Root =
    options.tier1Root ||
    path.join(
      __dirname,
      "../../docs/architecture/catalog/tier-1"
    );
  const siteOrigin = options.siteOrigin || DEFAULT_ORIGIN;

  const items = [];

  const robotsPath = path.join(publicDir, "robots.txt");
  const robotsExists = fs.existsSync(robotsPath);
  const robots = robotsExists
    ? fs.readFileSync(robotsPath, "utf8")
    : "";
  items.push(
    checklistItem(
      "robots_accessible",
      "robots.txt present in deploy artifact",
      robotsExists,
      robotsPath
    )
  );
  items.push(
    checklistItem(
      "robots_sitemap_directive",
      "robots.txt references sitemap",
      robots.includes("Sitemap:"),
      robots.match(/Sitemap:.+/)?.[0]
    )
  );

  const sitemapIndex = path.join(publicDir, "sitemap.xml");
  items.push(
    checklistItem(
      "sitemap_accessible",
      "sitemap.xml present",
      fs.existsSync(sitemapIndex),
      sitemapIndex
    )
  );

  for (const shard of ["static", "cars", "seo-pages", "compare"]) {
    const p = path.join(publicDir, `sitemaps/${shard}.xml`);
    items.push(
      checklistItem(
        `sitemap_shard_${shard}`,
        `sitemaps/${shard}.xml present`,
        fs.existsSync(p),
        p
      )
    );
  }

  const canonical = auditCanonicalSeo({ tier1Root, siteOrigin });
  items.push(
    checklistItem(
      "canonical_consistency",
      "Canonical audit — 0 errors",
      canonical.errors === 0,
      { errors: canonical.errors, warnings: canonical.warnings }
    )
  );

  const structured = auditStructuredData({ tier1Root, publicDir });
  items.push(
    checklistItem(
      "structured_data_static",
      "Structured data static audit — 0 errors",
      structured.errors === 0,
      { errors: structured.errors }
    )
  );

  const { manifest } = loadTier1Variants(tier1Root);
  const sampleVehicle = manifest.slugs[0];
  const seoSlugs = getAllSeoSlugs();
  const sampleSeo = seoSlugs[0];

  items.push(
    checklistItem(
      "seo_static_json",
      "SEO guide static JSON fallback",
      sampleSeo
        ? fs.existsSync(
            path.join(publicDir, `seo-data/${sampleSeo}.json`)
          )
        : false,
      sampleSeo ? `seo-data/${sampleSeo}.json` : "no seo slugs"
    )
  );

  items.push(
    checklistItem(
      "vehicle_catalog",
      "Tier-1 vehicles loaded",
      manifest.slugs.length > 0,
      `${manifest.slugs.length} variants`
    )
  );

  const leadCode = auditLeadPipelineCode();
  items.push(
    checklistItem(
      "lead_ingestion_code",
      "Lead pipeline code connected",
      leadCode.allConnected,
      leadCode.flow
    )
  );

  const behavioralRoute = path.join(
    __dirname,
    "../../routes/behavioralRoutes.js"
  );
  items.push(
    checklistItem(
      "behavioral_ingestion_route",
      "Behavioral ingestion route exists",
      fs.existsSync(behavioralRoute),
      "/api/behavioral/events"
    )
  );

  return {
    mode: "static",
    siteOrigin,
    items,
    samplePaths: {
      vehicle: sampleVehicle
        ? `/cars/${sampleVehicle}`
        : null,
      seo: sampleSeo ? `/cars/${sampleSeo}` : null,
      compare: "/compare",
    },
    pass: items.every((i) => i.pass),
  };
}

async function fetchCheck(url, options = {}) {
  const timeout = options.timeoutMs || 12000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "*/*", "User-Agent": "EVSavari-DeployValidator/1.0" },
      redirect: "follow",
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, url, body: text, headers: res.headers };
  } catch (err) {
    return { ok: false, status: 0, url, error: err.message };
  } finally {
    clearTimeout(timer);
  }
}

async function runLiveChecks(baseUrl, staticResult) {
  const origin = baseUrl.replace(/\/$/, "");
  const items = [];

  const robots = await fetchCheck(`${origin}/robots.txt`);
  items.push(
    checklistItem(
      "live_robots",
      "Live robots.txt HTTP 200",
      robots.ok && robots.status === 200,
      { status: robots.status, error: robots.error }
    )
  );

  const sitemap = await fetchCheck(`${origin}/sitemap.xml`);
  const sitemapXml =
    sitemap.ok && sitemap.body?.includes("<sitemapindex");
  items.push(
    checklistItem(
      "live_sitemap",
      "Live sitemap.xml HTTP 200 + index",
      sitemap.ok && sitemapXml,
      { status: sitemap.status }
    )
  );

  const paths = staticResult.samplePaths || {};
  for (const [key, p] of Object.entries(paths)) {
    if (!p) continue;
    const r = await fetchCheck(`${origin}${p}`);
    items.push(
      checklistItem(
        `live_${key}_page`,
        `Live ${key} route responds (${p})`,
        r.ok && r.status === 200,
        {
          status: r.status,
          note: "SPA shell OK — canonical/JSON-LD verified via static audit",
        }
      )
    );
  }

  const apiBase =
    process.env.API_BASE_URL ||
    process.env.VALIDATION_API_URL ||
    origin.replace("evsavari.com", "api.evsavari.com");

  const behavioralStatus = await fetchCheck(
    `${apiBase.replace(/\/$/, "")}/api/behavioral/status`
  );
  let behavioralDetail = { status: behavioralStatus.status };
  if (behavioralStatus.ok) {
    try {
      behavioralDetail = JSON.parse(behavioralStatus.body);
    } catch {
      behavioralDetail.parseError = true;
    }
  }
  items.push(
    checklistItem(
      "live_behavioral_status",
      "Behavioral API status reachable",
      behavioralStatus.ok,
      behavioralDetail
    )
  );

  return {
    mode: "live",
    baseUrl: origin,
    apiBase,
    items,
    spaNote:
      "HTML responses are SPA shells; rely on static structured-data and canonical audits for on-page SEO signals.",
    pass: items.every((i) => i.pass),
  };
}

async function validateProductionDeployment(options = {}) {
  const staticResult = runStaticChecks(options);
  let liveResult = null;

  if (options.liveUrl || options.baseUrl) {
    liveResult = await runLiveChecks(
      options.liveUrl || options.baseUrl,
      staticResult
    );
  }

  let continuity = null;
  if (options.includeContinuity) {
    continuity = await auditLeadSourceContinuity({
      includeDb: options.includeDb && !!process.env.MONGO_URI,
      sinceDays: options.sinceDays || 30,
    });
  }

  const allItems = [
    ...staticResult.items,
    ...(liveResult?.items || []),
  ];

  return {
    generatedAt: new Date().toISOString(),
    siteOrigin: options.siteOrigin || DEFAULT_ORIGIN,
    ready: allItems.every((i) => i.pass) && (continuity?.errors ?? 0) === 0,
    static: staticResult,
    live: liveResult,
    leadContinuity: continuity,
    manualFollowUp: [
      "GSC URL inspection on 1 vehicle + 1 SEO guide after deploy",
      "Submit sitemap if catalog/SEO registry changed",
      "Confirm launch profile via validate-launch-profile.js",
    ],
  };
}

module.exports = {
  validateProductionDeployment,
  runStaticChecks,
  runLiveChecks,
};
