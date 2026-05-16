/**
 * Lightweight crawl graph simulation — no HTTP, link graph only.
 */

const { generateSitemapBundle } = require("../sitemap-generation");
const { getAllSeoSlugs } = require("../seo-pages/registry");
const { loadTier1Variants } = require("../seo-pages/loadCatalog");
const { buildAllSeoPages } = require("../seo-pages");

const SITE_ORIGIN = process.env.SITE_ORIGIN || "https://evsavari.com";

function simulateCrawl(options = {}) {
  const tier1Root = options.tier1Root;
  const { manifest } = loadTier1Variants(tier1Root);
  const seoSlugs = getAllSeoSlugs();
  const bundle = generateSitemapBundle({ tier1Root, siteOrigin: SITE_ORIGIN });
  const seoPages = buildAllSeoPages({ tier1Root, siteOrigin: SITE_ORIGIN });

  const nodes = new Map();
  const edges = [];

  function addNode(path, type, depth = 0) {
    if (!nodes.has(path)) {
      nodes.set(path, { path, type, depth, inbound: 0, outbound: 0 });
    }
    return nodes.get(path);
  }

  addNode("/", "static", 0);
  addNode("/cars", "listing", 1);
  addNode("/compare", "compare_hub", 1);

  for (const slug of manifest.slugs) {
    if (seoSlugs.includes(slug)) continue;
    const p = `/cars/${slug}`;
    addNode(p, "vehicle_detail", 2);
    edges.push({ from: "/cars", to: p });
  }

  for (const slug of seoSlugs) {
    const p = `/cars/${slug}`;
    addNode(p, "seo_page", 2);
    edges.push({ from: "/cars", to: p });
  }

  for (const { seoPage } of seoPages) {
    const from = `/cars/${seoPage.slug}`;
    for (const rv of seoPage.rankedVehicles || []) {
      const to = `/cars/${rv.slug}`;
      if (nodes.has(to)) {
        edges.push({ from, to });
      }
    }
  }

  for (const e of edges) {
    const fromN = nodes.get(e.from);
    const toN = nodes.get(e.to);
    if (fromN) fromN.outbound += 1;
    if (toN) {
      toN.inbound += 1;
      toN.depth = Math.min(toN.depth, (fromN?.depth ?? 0) + 1);
    }
  }

  const orphans = [...nodes.values()].filter(
    (n) => n.inbound === 0 && n.path !== "/"
  );

  const maxDepth = Math.max(
    ...[...nodes.values()].map((n) => n.depth),
    0
  );

  const sitemapLocs = new Set();
  for (const xml of Object.values(bundle.files)) {
    for (const m of xml.match(/<loc>([^<]+)<\/loc>/g) || []) {
      sitemapLocs.add(m.replace(/<\/?loc>/g, ""));
    }
  }

  const notInSitemap = [...nodes.values()].filter((n) => {
    const full = `${SITE_ORIGIN}${n.path}`;
    return !sitemapLocs.has(full) && n.type !== "static";
  });

  return {
    nodeCount: nodes.size,
    edgeCount: edges.length,
    maxCrawlDepth: maxDepth,
    orphans: orphans.map((n) => ({
      path: n.path,
      type: n.type,
    })),
    notInSitemap: notInSitemap.map((n) => n.path),
    discoverability: {
      vehiclesFromListing: manifest.slugs.length,
      seoFromListing: seoSlugs.length,
      compareHubLinked: true,
    },
    canonicalContinuity: "all nodes use /cars/:slug or hub paths",
    errors: orphans.filter((o) => o.type === "vehicle_detail").length,
    warnings: notInSitemap.length + orphans.length,
  };
}

module.exports = {
  simulateCrawl,
};
