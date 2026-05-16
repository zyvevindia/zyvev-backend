const { USE_EV_MASTER } = require("../../config/catalog");
const catalogRepo = require("./catalogRepository");
const tier1File = require("./tier1FileCatalog");
const { resolveSlugCandidates } = require("./slugUtils");
const {
  toMarketplaceVehicle,
  legacyCarToMarketplace,
} = require("./mappers");

function normalizeSortBy(sortBy) {
  const map = {
    "price-low": "priceLow",
    "price-high": "priceHigh",
    "range-high": "rangeHigh",
    "range-low": "rangeLow",
  };
  return map[sortBy] || sortBy;
}

function applyListFilters(vehicles, query) {
  let list = [...vehicles];
  const { brand, priceRange, search } = query;

  if (brand) {
    const b = brand.toLowerCase();
    list = list.filter(
      (v) =>
        (v.brand || "").toLowerCase().includes(b) ||
        (v.catalogMeta?.segment || "").includes(b)
    );
  }

  if (search) {
    const s = search.toLowerCase();
    list = list.filter(
      (v) =>
        (v.name || "").toLowerCase().includes(s) ||
        (v.brand || "").toLowerCase().includes(s)
    );
  }

  if (priceRange) {
    if (priceRange === "low") {
      list = list.filter((v) => v.startingPrice < 1000000);
    } else if (priceRange === "mid") {
      list = list.filter(
        (v) =>
          v.startingPrice >= 1000000 &&
          v.startingPrice <= 2000000
      );
    } else if (priceRange === "high") {
      list = list.filter((v) => v.startingPrice > 2000000);
    }
  }

  return list;
}

function sortVehicles(list, sortBy) {
  const normalized = normalizeSortBy(sortBy);
  const sorted = [...list];

  if (normalized === "priceLow") {
    sorted.sort((a, b) => a.startingPrice - b.startingPrice);
  } else if (normalized === "priceHigh") {
    sorted.sort((a, b) => b.startingPrice - a.startingPrice);
  } else if (normalized === "rangeHigh") {
    sorted.sort(
      (a, b) =>
        (b.specifications?.range || 0) -
        (a.specifications?.range || 0)
    );
  } else if (normalized === "rangeLow") {
    sorted.sort(
      (a, b) =>
        (a.specifications?.range || 0) -
        (b.specifications?.range || 0)
    );
  } else {
    sorted.sort(
      (a, b) =>
        new Date(b.createdAt || 0) -
        new Date(a.createdAt || 0)
    );
  }

  return sorted;
}

async function loadMergedCatalog(preview = false) {
  const legacyCars = await catalogRepo.findLegacyCatalogCars();
  const legacyVehicles = legacyCars
    .map(legacyCarToMarketplace)
    .filter(Boolean);

  if (!USE_EV_MASTER) {
    const fileVehicles = tier1File.catalogFilesAvailable()
      ? tier1File.listMarketplaceVehiclesFromFiles()
      : [];
    const fileSlugs = new Set(fileVehicles.map((v) => v.slug));
    const legacyOnly = legacyVehicles.filter(
      (v) => v.slug && !fileSlugs.has(v.slug)
    );
    return {
      vehicles: [...fileVehicles, ...legacyOnly],
      mode: fileVehicles.length
        ? "legacy+tier1-files"
        : "legacy",
      masterCount: fileVehicles.length,
      legacyCount: legacyOnly.length,
      fileFallbackCount: fileVehicles.length,
    };
  }

  const masterDocs = await catalogRepo.findPublishedVariants(
    {},
    { preview, sort: { "pricing.exShowroom": 1 } }
  );

  const masterVehicles = masterDocs
    .map(toMarketplaceVehicle)
    .filter(Boolean);

  const masterSlugs = new Set(
    masterVehicles.map((v) => v.slug)
  );

  const fileVehicles = tier1File.catalogFilesAvailable()
    ? tier1File
        .listMarketplaceVehiclesFromFiles()
        .filter((v) => v.slug && !masterSlugs.has(v.slug))
    : [];

  for (const v of fileVehicles) {
    masterSlugs.add(v.slug);
  }

  const legacyOnly = legacyVehicles.filter(
    (v) => v.slug && !masterSlugs.has(v.slug)
  );

  const mergedMaster = [...masterVehicles, ...fileVehicles];

  return {
    vehicles: [...mergedMaster, ...legacyOnly],
    mode: fileVehicles.length ? "dual-read+tier1-files" : "dual-read",
    masterCount: mergedMaster.length,
    legacyCount: legacyOnly.length,
    fileFallbackCount: fileVehicles.length,
  };
}

async function listCatalogVehicles(query = {}, options = {}) {
  const preview = options.preview === true;
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 6);
  const skip = (page - 1) * limit;

  const { vehicles, mode, masterCount, legacyCount } =
    await loadMergedCatalog(preview);

  const filtered = applyListFilters(vehicles, query);
  const sorted = sortVehicles(
    filtered,
    query.sortBy
  );
  const total = sorted.length;
  const pageItems = sorted.slice(skip, skip + limit);

  return {
    cars: pageItems,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    catalogMode: mode,
    catalogStats:
      mode === "dual-read"
        ? { masterCount, legacyCount }
        : undefined,
  };
}

async function getVehicleBySlug(rawSlug, options = {}) {
  const preview = options.preview === true;
  const candidates = resolveSlugCandidates(rawSlug);

  for (const slug of candidates) {
    if (USE_EV_MASTER) {
      const master = await catalogRepo.findVariantBySlug(
        slug,
        preview
      );
      if (master) {
        return {
          vehicle: toMarketplaceVehicle(master),
          source: "master",
          masterDetail: master,
          resolvedSlug: slug,
        };
      }
    }

    const fileRecord = tier1File.findVariantBySlugFromFiles(slug);
    if (fileRecord) {
      return {
        vehicle: {
          ...toMarketplaceVehicle(fileRecord),
          catalogSource: "tier-1-file",
        },
        source: "tier-1-file",
        masterDetail: fileRecord,
        resolvedSlug: slug,
      };
    }

    const legacy = await catalogRepo.findLegacyCarBySlug(slug);
    if (legacy) {
      return {
        vehicle: legacyCarToMarketplace(legacy),
        source: "legacy",
        resolvedSlug: slug,
      };
    }
  }

  return null;
}

async function getVehicleById(id, options = {}) {
  const preview = options.preview === true;

  if (USE_EV_MASTER) {
    const master = await catalogRepo.findVariantById(
      id,
      preview
    );
    if (master) {
      return {
        vehicle: toMarketplaceVehicle(master),
        source: "master",
        masterDetail: master,
      };
    }
  }

  const legacy = await catalogRepo.findLegacyCarById(id);
  if (legacy) {
    return {
      vehicle: legacyCarToMarketplace(legacy),
      source: "legacy",
    };
  }

  return null;
}

async function getCompareBySlugs(slugs, preview = false) {
  if (!USE_EV_MASTER) {
    return { cars: [], compareMeta: { count: 0, mode: "legacy-only" } };
  }

  const masterDocs = await catalogRepo.findVariantsBySlugs(
    slugs,
    preview
  );

  const { toCompareBundle } = require("./mappers");
  const bundle = toCompareBundle(masterDocs);

  return {
    ...bundle,
    compareMeta: {
      ...bundle.compareMeta,
      mode: "master",
    },
  };
}

module.exports = {
  listCatalogVehicles,
  getVehicleBySlug,
  getVehicleById,
  getCompareBySlugs,
  loadMergedCatalog,
  USE_EV_MASTER,
};
