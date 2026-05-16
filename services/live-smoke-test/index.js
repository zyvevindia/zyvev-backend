/**
 * Live production smoke tests — HTTP probes, no browser automation.
 */

const { auditCanonicalSeo } = require("../canonical-seo-audits");

const DEFAULT_PATHS = [
  { id: "homepage", path: "/", type: "spa" },
  { id: "cars_listing", path: "/cars", type: "spa" },
  {
    id: "vehicle_detail",
    path: "/cars/tata-nexon-ev-creative-plus",
    type: "spa",
  },
  { id: "compare", path: "/compare", type: "spa" },
  {
    id: "seo_guide",
    path: "/cars/best-evs-for-apartment-living",
    type: "spa",
  },
  { id: "robots", path: "/robots.txt", type: "static" },
  { id: "sitemap", path: "/sitemap.xml", type: "static" },
];

async function probeUrl(base, { path, type }) {
  const url = `${base}${path}`;
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        Accept:
          type === "static"
            ? "*/*"
            : "text/html,application/xhtml+xml",
        "User-Agent": "EVSavari-SmokeTest/1.0",
      },
      signal: AbortSignal.timeout(20000),
    });
    const body = await res.text();
    const html = type === "spa" ? body : "";
    const hasCanonical =
      type === "spa" && html.includes('rel="canonical"');
    const hasTrustHint =
      type === "spa" &&
      path.includes("nexon") &&
      (html.includes("Can you live with this EV") ||
        html.includes("trust") ||
        html.includes("EVSavari"));
    const robotsOk = path === "/robots.txt" && body.includes("Sitemap:");
    const sitemapOk =
      path === "/sitemap.xml" &&
      (res.headers.get("content-type")?.includes("xml") ||
        body.includes("<urlset") ||
        body.includes("<sitemapindex"));

    return {
      path,
      url,
      status: res.status,
      ok: res.status >= 200 && res.status < 400,
      hasCanonical: type === "spa" ? hasCanonical : null,
      trustBlockHint: hasTrustHint,
      robotsHasSitemap: robotsOk,
      sitemapXml: sitemapOk,
      finalUrl: res.url,
    };
  } catch (err) {
    return { path, url, ok: false, error: err.message };
  }
}

async function runLiveSmokeTest(options = {}) {
  const origin = (options.origin || "https://evsavari.com").replace(/\/$/, "");
  const paths = options.paths || DEFAULT_PATHS;
  const results = [];

  for (const p of paths) {
    results.push(await probeUrl(origin, p));
  }

  const apiBase = options.apiOrigin || origin;
  const apiPaths = [
    "/api/catalog/vehicles",
    "/api/seo/pages",
    "/api/behavioral/events",
  ];
  const apiResults = [];
  for (const p of apiPaths) {
    try {
      const method = p.includes("behavioral") ? "OPTIONS" : "GET";
      const res = await fetch(`${apiBase}${p}`, {
        method,
        signal: AbortSignal.timeout(12000),
      });
      apiResults.push({
        path: p,
        status: res.status,
        ok: res.status < 500,
        corsHeaders: {
          acao: res.headers.get("access-control-allow-origin"),
        },
      });
    } catch (err) {
      apiResults.push({ path: p, ok: false, error: err.message });
    }
  }

  const canonical = auditCanonicalSeo({ siteOrigin: origin });
  const failed = results.filter((r) => !r.ok);
  const spaResults = results.filter((r) => r.path.startsWith("/cars") || r.path === "/" || r.path === "/compare");

  return {
    generatedAt: new Date().toISOString(),
    origin,
    smokePass: failed.length === 0,
    results,
    apiResults,
    canonicalAudit: { errors: canonical.errors, warnings: canonical.warnings },
    summary: {
      total: results.length,
      passed: results.length - failed.length,
      failed: failed.length,
      canonicalInHtml: spaResults.filter((r) => r.hasCanonical).length,
    },
    manualStillRequired: [
      "Lead form submit on live site",
      "Compare add/remove on mobile Android Chrome",
      "Trust block visible after JS hydration (verify in browser)",
    ],
  };
}

module.exports = { runLiveSmokeTest, DEFAULT_PATHS };
