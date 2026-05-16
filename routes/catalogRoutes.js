const express = require("express");
const {
  USE_EV_MASTER,
  EV_MASTER_ADMIN_PREVIEW,
} = require("../config/catalog");
const catalogRepo = require("../services/catalog/catalogRepository");
const tier1File = require("../services/catalog/tier1FileCatalog");
const dualRead = require("../services/catalog/dualReadService");
const {
  toMasterVariantDto,
  toCompareBundle,
  isValidMarketplaceVehicle,
  resolveMarketplacePayload,
  labelBrand,
  labelModel,
} = require("../services/catalog/mappers");

/**
 * @param {{ auth: Function, adminOnly: Function }} deps
 */
function createCatalogRouter(deps) {
  const router = express.Router();
  const { auth, adminOnly } = deps;

  function resolvePreview(req) {
    const wantsPreview =
      req.query.preview === "true" ||
      req.query.preview === "1";

    if (!wantsPreview) return false;

    return (
      EV_MASTER_ADMIN_PREVIEW &&
      req.admin &&
      req.admin.role === "admin"
    );
  }

  /* ---------- feature status ---------- */

  router.get("/status", (req, res) => {
    res.json({
      useEvMaster: USE_EV_MASTER,
      adminPreviewEnabled: EV_MASTER_ADMIN_PREVIEW,
      message: USE_EV_MASTER
        ? "Dual-read catalog active when published master records exist"
        : "Legacy Car collection only (set USE_EV_MASTER=true to enable)",
    });
  });

  /* ---------- brands / models ---------- */

  router.get("/brands", async (req, res) => {
    try {
      const brands = await catalogRepo.listBrands();
      res.json({ brands, count: brands.length });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/models", async (req, res) => {
    try {
      const { brand } = req.query;
      const models = await catalogRepo.listModels(brand);
      res.json({ models, count: models.length });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  /* ---------- variants (read-only) ---------- */

  router.get(
    "/variants",

    async (req, res, next) => {
      if (req.query.preview === "true") {
        return auth(req, res, () =>
          adminOnly(req, res, next)
        );
      }
      next();
    },

    async (req, res) => {
      try {
        if (!USE_EV_MASTER) {
          return res.json({
            variants: [],
            count: 0,
            catalogMode: "legacy-only",
          });
        }

        const preview = resolvePreview(req);
        const { brand, segment, limit = 50 } = req.query;

        const filter = {};
        if (brand) {
          filter["identity.brandSlug"] = brand.toLowerCase();
        }
        if (segment) {
          filter["identity.segment"] = segment;
        }

        const docs = await catalogRepo.findPublishedVariants(
          filter,
          {
            preview,
            limit: Math.min(Number(limit), 100),
            sort: { "pricing.exShowroom": 1 },
          }
        );

        const variants = docs.map(toMasterVariantDto);

        res.json({
          variants,
          count: variants.length,
          preview,
          catalogMode: preview
            ? "master-preview"
            : "master-published",
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  router.get(
    "/variants/slug/:slug",

    async (req, res, next) => {
      if (req.query.preview === "true") {
        return auth(req, res, () =>
          adminOnly(req, res, next)
        );
      }
      next();
    },

    async (req, res) => {
      try {
        const preview = resolvePreview(req);
        const slug = req.params.slug.toLowerCase();

        if (USE_EV_MASTER) {
          const doc = await catalogRepo.findVariantBySlug(
            slug,
            preview
          );

          if (doc) {
            const dto = toMasterVariantDto(doc);
            if (isValidMarketplaceVehicle(dto?.marketplace)) {
              return res.json(dto);
            }
          }

          const fileDoc = tier1File.findVariantBySlugFromFiles(slug);
          if (fileDoc) {
            const dto = toMasterVariantDto(fileDoc);
            if (isValidMarketplaceVehicle(dto?.marketplace)) {
              return res.json(dto);
            }
          }
        }

        const fallback = await dualRead.getVehicleBySlug(
          slug,
          { preview }
        );

        const marketplace = resolveMarketplacePayload(fallback);

        if (!marketplace) {
          return res.status(404).json({ error: "Variant not found" });
        }

        res.json({
          id: marketplace._id,
          identity: {
            slug: marketplace.slug,
            brandSlug: (marketplace.brand || "").toLowerCase(),
            variantName: marketplace.name,
          },
          marketplace,
          catalogSource: fallback.source,
          governance: {
            status: "legacy",
          },
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  /* ---------- compare-ready ---------- */

  router.get("/compare", async (req, res) => {
    try {
      const raw = req.query.slugs || req.query.slug || "";
      const slugs = String(raw)
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 3);

      if (slugs.length === 0) {
        return res.status(400).json({
          error: "Provide slugs query param (comma-separated, max 3)",
        });
      }

      if (USE_EV_MASTER) {
        const docs = await catalogRepo.findVariantsBySlugs(
          slugs,
          false
        );

        if (docs.length > 0) {
          return res.json({
            ...toCompareBundle(docs),
            catalogMode: "master",
          });
        }
      }

      const cars = [];
      for (const slug of slugs) {
        const hit = await dualRead.getVehicleBySlug(slug);
        if (hit?.vehicle) cars.push(hit.vehicle);
      }

      res.json({
        cars,
        compareMeta: {
          count: cars.length,
          mode: "dual-read-fallback",
        },
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  /* ---------- marketplace-shaped list (optional direct use) ---------- */

  router.get("/marketplace", async (req, res) => {
    try {
      const result = await dualRead.listCatalogVehicles(
        req.query
      );
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = createCatalogRouter;
