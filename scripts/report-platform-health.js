#!/usr/bin/env node
/**
 * Platform health report — operational visibility for soft launch.
 * Usage: node scripts/report-platform-health.js [--db]
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { loadTier1Variants } = require("../services/seo-pages/loadCatalog");
const { getAllSeoSlugs } = require("../seo-pages/registry");
const { generateSitemapBundle } = require("../services/sitemap-generation");
const { USE_EV_MASTER, CATALOG_INTELLIGENCE_ENABLED } = require("../config/catalog");
const { SEO_PAGES_ENABLED } = require("../config/seo");
const { BEHAVIORAL_INTELLIGENCE_ENABLED } = require("../config/behavioral");
const { listLaunchProfiles } = require("../config/launchProfiles");

async function main() {
  const tier1Root = path.join(
    __dirname,
    "../docs/architecture/catalog/tier-1"
  );
  const publicDir = path.join(
    __dirname,
    "../../zyvev-frontend/public"
  );

  const { manifest } = loadTier1Variants(tier1Root);
  const seoSlugs = getAllSeoSlugs();
  const sitemap = generateSitemapBundle({ tier1Root });

  const sitemapManifestPath = path.join(
    publicDir,
    "sitemap-manifest.json"
  );
  let sitemapFreshness = null;
  if (fs.existsSync(sitemapManifestPath)) {
    try {
      sitemapFreshness = JSON.parse(
        fs.readFileSync(sitemapManifestPath, "utf8")
      );
    } catch {
      sitemapFreshness = { error: "invalid manifest" };
    }
  }

  const routeCounts = {
    staticMarketing: 5,
    vehicleDetail: manifest.slugs.length,
    seoDecisionPages: seoSlugs.length,
    compareHub: 1,
    legacyRedirect: 1,
  };

  const report = {
    generatedAt: new Date().toISOString(),
    launchProfiles: listLaunchProfiles(),
    api: {
      status: "unknown",
      mongoConnected: false,
    },
    routes: routeCounts,
    crawlableUrls: {
      sitemapTotal: sitemap.stats.totalUrls,
      vehicles: sitemap.stats.vehicleUrlCount,
      seoPages: sitemap.stats.seoPageUrlCount,
      compare: sitemap.stats.compareUrlCount,
    },
    sitemap: {
      freshness: sitemapFreshness,
      filesPresent: {
        index: fs.existsSync(path.join(publicDir, "sitemap.xml")),
        robots: fs.existsSync(path.join(publicDir, "robots.txt")),
        cars: fs.existsSync(
          path.join(publicDir, "sitemaps/cars.xml")
        ),
        seo: fs.existsSync(
          path.join(publicDir, "sitemaps/seo-pages.xml")
        ),
      },
    },
    catalog: {
      tier1VariantCount: manifest.slugs.length,
      useEvMaster: USE_EV_MASTER,
      catalogIntelligenceEnabled: CATALOG_INTELLIGENCE_ENABLED,
    },
    seo: {
      seoPagesEnabled: SEO_PAGES_ENABLED,
      programmaticPageCount: seoSlugs.length,
      staticSeoJsonCount: fs.existsSync(
        path.join(publicDir, "seo-data")
      )
        ? fs
            .readdirSync(path.join(publicDir, "seo-data"))
            .filter((f) => f.endsWith(".json")).length
        : 0,
    },
    compare: {
      hubPath: "/compare",
      headToHeadSeoPages: seoSlugs.filter((s) =>
        s.includes("-vs-")
      ).length,
    },
    behavioral: {
      enabled: BEHAVIORAL_INTELLIGENCE_ENABLED,
      eventCountLast7d: null,
      eventCountLast24h: null,
    },
    leads: {
      countLast7d: null,
      countLast24h: null,
      withIntentContextLast7d: null,
      withSourcePageLast7d: null,
    },
  };

  const uri = process.env.MONGO_URI;
  if (uri && process.argv.includes("--db")) {
    try {
      await mongoose.connect(uri);
      report.api.mongoConnected = true;
      report.api.status = "ok";

      const BuyerBehaviorEvent = require("../models/BuyerBehaviorEvent");
      const Lead = require("../models/Lead");

      const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const since24 = new Date(Date.now() - 24 * 60 * 60 * 1000);

      report.behavioral.eventCountLast7d =
        await BuyerBehaviorEvent.countDocuments({
          createdAt: { $gte: since7 },
        });
      report.behavioral.eventCountLast24h =
        await BuyerBehaviorEvent.countDocuments({
          createdAt: { $gte: since24 },
        });

      report.leads.countLast7d = await Lead.countDocuments({
        createdAt: { $gte: since7 },
      });
      report.leads.countLast24h = await Lead.countDocuments({
        createdAt: { $gte: since24 },
      });
      report.leads.withIntentContextLast7d =
        await Lead.countDocuments({
          createdAt: { $gte: since7 },
          buyerIntentContext: { $ne: null },
        });
      report.leads.withSourcePageLast7d =
        await Lead.countDocuments({
          createdAt: { $gte: since7 },
          sourcePage: { $nin: ["", null] },
        });

      const compareEvents = await BuyerBehaviorEvent.countDocuments({
        eventType: "compare_started",
        createdAt: { $gte: since7 },
      });
      report.compare.compareStartsLast7d = compareEvents;

      await mongoose.disconnect();
    } catch (err) {
      report.api.status = "degraded";
      report.api.error = err.message;
    }
  } else if (!uri) {
    report.api.status = "skipped_no_mongo_uri";
  } else {
    report.api.status = "skipped_pass_--db_for_metrics";
  }

  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
