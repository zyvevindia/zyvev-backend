#!/usr/bin/env node
/**
 * Search Console / indexing readiness checklist (automated checks).
 */
const fs = require("fs");
const path = require("path");
const { auditCanonicalSeo } = require("../services/canonical-seo-audits");
const { auditStructuredData } = require("../services/structured-data-audits");
const { generateSitemapBundle } = require("../services/sitemap-generation");
const { buildRobotsTxt } = require("../services/sitemap-generation/robots");

const publicDir = path.join(
  __dirname,
  "../../zyvev-frontend/public"
);
const siteOrigin = process.env.SITE_ORIGIN || "https://evsavari.com";

const checklist = [];

function check(id, label, pass, detail) {
  checklist.push({ id, label, pass, detail });
}

const robotsPath = path.join(publicDir, "robots.txt");
if (fs.existsSync(robotsPath)) {
  const robots = fs.readFileSync(robotsPath, "utf8");
  check(
    "robots_exists",
    "robots.txt present",
    true,
    robotsPath
  );
  check(
    "robots_sitemap",
    "Sitemap directive in robots.txt",
    robots.includes("Sitemap:"),
    robots.match(/Sitemap:.+/)?.[0]
  );
  check(
    "robots_query_trap",
    "Query-string crawl trap blocked",
    robots.includes("Disallow: /*?*"),
    null
  );
} else {
  check("robots_exists", "robots.txt present", false, "missing");
}

const indexPath = path.join(publicDir, "sitemap.xml");
check(
  "sitemap_index",
  "sitemap.xml index present",
  fs.existsSync(indexPath),
  indexPath
);

for (const sub of ["cars", "seo-pages", "compare", "static"]) {
  const p = path.join(publicDir, `sitemaps/${sub}.xml`);
  check(
    `sitemap_${sub}`,
    `sitemaps/${sub}.xml present`,
    fs.existsSync(p),
    p
  );
}

const canonical = auditCanonicalSeo({ siteOrigin });
check(
  "canonical_integrity",
  "Canonical integrity (0 errors)",
  canonical.errors === 0,
  `${canonical.errors} errors`
);

const structured = auditStructuredData();
check(
  "structured_data",
  "Structured data validation (0 errors)",
  structured.errors === 0,
  `${structured.errors} errors`
);

const bundle = generateSitemapBundle({ siteOrigin });
check(
  "sitemap_generation",
  "Sitemap bundle generates",
  bundle.stats.totalUrls > 0,
  `${bundle.stats.totalUrls} URLs`
);

const report = {
  siteOrigin,
  generatedAt: new Date().toISOString(),
  ready: checklist.every((c) => c.pass),
  checklist,
  manualSteps: [
    "Verify domain in Google Search Console",
    "Submit https://evsavari.com/sitemap.xml",
    "URL inspection: 1 vehicle, 1 SEO guide, /compare",
    "Monitor Coverage report after 48–72h",
  ],
};

console.log(JSON.stringify(report, null, 2));
process.exit(report.ready ? 0 : 1);
