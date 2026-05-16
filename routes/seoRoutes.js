const express = require("express");
const {
  SEO_PAGES_ENABLED,
  SEO_INTELLIGENCE_PUBLIC,
} = require("../config/seo");
const {
  listSeoPages,
  buildSeoPage,
  isSeoPageSlug,
  resolveRegistrySlug,
} = require("../services/seo-pages");

function createSeoRouter() {
  const router = express.Router();

  router.get("/status", (req, res) => {
    res.json({
      seoPagesEnabled: SEO_PAGES_ENABLED,
      seoIntelligencePublic: SEO_INTELLIGENCE_PUBLIC,
    });
  });

  router.get("/pages", (req, res) => {
    if (!SEO_PAGES_ENABLED) {
      return res.status(404).json({
        error: "SEO pages disabled",
        hint: "Set SEO_PAGES_ENABLED=true",
      });
    }
    res.json({
      pages: listSeoPages(),
      count: listSeoPages().length,
    });
  });

  router.get("/pages/:slug", (req, res) => {
    if (!SEO_PAGES_ENABLED) {
      return res.status(404).json({
        error: "SEO pages disabled",
      });
    }

    const resolved = resolveRegistrySlug(req.params.slug);
    if (!isSeoPageSlug(resolved)) {
      return res.status(404).json({
        error: "SEO page not found",
        slug: req.params.slug,
      });
    }

    const result = buildSeoPage(resolved, {
      includeInternalScores: SEO_INTELLIGENCE_PUBLIC,
    });

    if (!result?.seoPage) {
      return res.status(404).json({
        error: "Could not generate SEO page",
        slug: resolved,
      });
    }

    res.json(result);
  });

  router.get("/sitemap-registry", (req, res) => {
    const { buildSitemapRegistry } = require("../services/sitemap-registry");
    res.json(buildSitemapRegistry());
  });

  return router;
}

module.exports = createSeoRouter;
