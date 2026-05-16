/**
 * Tier-1 JSON file catalog — fallback when Mongo master variants are missing.
 * Source of truth: docs/architecture/catalog/tier-1/variants/*.json
 */

const fs = require("fs");
const path = require("path");
const { toMarketplaceVehicle } = require("./mappers");
const { normalizeVehicleSlug } = require("./slugUtils");

const LOG_PREFIX = "[tier1FileCatalog]";

const PUBLIC_FILE_STATUSES = new Set([
  "published",
  "review",
  "draft",
]);

let manifestCache = null;
let resolvedCatalogDir = null;
let bootDiagnosticsLogged = false;

function buildCatalogDirCandidates() {
  return [
    path.resolve(process.cwd(), "docs/architecture/catalog/tier-1"),
    path.resolve(__dirname, "../../docs/architecture/catalog/tier-1"),
    path.resolve(process.cwd(), "../docs/architecture/catalog/tier-1"),
  ];
}

function resolveCatalogDir() {
  if (resolvedCatalogDir) {
    return resolvedCatalogDir;
  }

  const candidates = buildCatalogDirCandidates();
  const tried = [];

  for (const catalogDir of candidates) {
    const manifestPath = path.join(catalogDir, "manifest.json");
    const exists = fs.existsSync(manifestPath);
    tried.push({ catalogDir, manifestPath, exists });

    if (exists) {
      resolvedCatalogDir = catalogDir;
      logBootDiagnostics(tried, catalogDir);
      return resolvedCatalogDir;
    }
  }

  resolvedCatalogDir = path.resolve(
    process.cwd(),
    "docs/architecture/catalog/tier-1"
  );
  logBootDiagnostics(tried, null);
  return resolvedCatalogDir;
}

function getManifestPath() {
  return path.join(resolveCatalogDir(), "manifest.json");
}

function logBootDiagnostics(tried, selectedDir) {
  if (bootDiagnosticsLogged) return;
  bootDiagnosticsLogged = true;

  console.log(LOG_PREFIX, "boot diagnostics", {
    processCwd: process.cwd(),
    moduleDirname: __dirname,
    selectedCatalogDir: selectedDir,
    manifestPath: selectedDir
      ? path.join(selectedDir, "manifest.json")
      : getManifestPath(),
    candidatesTried: tried,
  });

  if (!selectedDir) {
    console.error(
      LOG_PREFIX,
      "FATAL: manifest.json not found — Tier-1 file fallback disabled"
    );
    console.error(LOG_PREFIX, "cwd:", process.cwd());
    console.error(LOG_PREFIX, "__dirname:", __dirname);
    for (const row of tried) {
      console.error(
        LOG_PREFIX,
        "candidate:",
        row.manifestPath,
        "exists:",
        row.exists
      );
    }
  }
}

function loadManifest() {
  if (manifestCache) {
    return manifestCache;
  }

  const manifestPath = getManifestPath();
  const manifestExists = fs.existsSync(manifestPath);

  console.log(LOG_PREFIX, "loadManifest", {
    resolvedPath: manifestPath,
    manifestExists,
    processCwd: process.cwd(),
    catalogDir: resolveCatalogDir(),
  });

  if (!manifestExists) {
    console.error(
      LOG_PREFIX,
      "manifest.json MISSING at resolved path:",
      manifestPath
    );
    return { slugs: [] };
  }

  try {
    manifestCache = JSON.parse(
      fs.readFileSync(manifestPath, "utf8")
    );
    const slugs = manifestCache.slugs || [];
    console.log(LOG_PREFIX, "manifest loaded", {
      variantCount: slugs.length,
      firstFiveSlugs: slugs.slice(0, 5),
    });
    return manifestCache;
  } catch (err) {
    console.error(LOG_PREFIX, "manifest JSON read error:", {
      manifestPath,
      message: err.message,
    });
    return { slugs: [] };
  }
}

function readVariantRecord(slug) {
  const normalized = normalizeVehicleSlug(slug);
  if (!normalized) return null;

  const filePath = path.join(
    resolveCatalogDir(),
    "variants",
    `${normalized}.json`
  );

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    console.error(LOG_PREFIX, "variant JSON read error", {
      slug: normalized,
      filePath,
      message: err.message,
    });
    return null;
  }
}

function isPublicFileVariant(record) {
  if (!record?.identity?.slug) return false;
  const status = record.governance?.status;
  if (!status) return true;
  return PUBLIC_FILE_STATUSES.has(status);
}

function findVariantBySlugFromFiles(slug) {
  const record = readVariantRecord(slug);
  if (!record || !isPublicFileVariant(record)) {
    return null;
  }
  return record;
}

function listMarketplaceVehiclesFromFiles() {
  const manifest = loadManifest();
  const vehicles = [];

  for (const slug of manifest.slugs || []) {
    const record = findVariantBySlugFromFiles(slug);
    if (!record) continue;
    const vehicle = toMarketplaceVehicle(record);
    if (vehicle) {
      vehicles.push({
        ...vehicle,
        catalogSource: "tier-1-file",
      });
    }
  }

  return vehicles;
}

function getManifestSlugs() {
  return loadManifest().slugs || [];
}

function catalogFilesAvailable() {
  return fs.existsSync(getManifestPath());
}

function getTier1DiagnosticStatus() {
  const candidates = buildCatalogDirCandidates().map((catalogDir) => {
    const manifestPath = path.join(catalogDir, "manifest.json");
    return {
      catalogDir,
      manifestPath,
      manifestExists: fs.existsSync(manifestPath),
      variantsDirExists: fs.existsSync(
        path.join(catalogDir, "variants")
      ),
    };
  });

  const selectedDir = resolveCatalogDir();
  const manifestPath = getManifestPath();
  const manifestExists = fs.existsSync(manifestPath);

  let variantCount = 0;
  let firstFiveSlugs = [];
  let manifestReadError = null;

  if (manifestExists) {
    try {
      const raw = JSON.parse(
        fs.readFileSync(manifestPath, "utf8")
      );
      firstFiveSlugs = (raw.slugs || []).slice(0, 5);
      variantCount = (raw.slugs || []).length;
    } catch (err) {
      manifestReadError = err.message;
    }
  }

  const testSlug = "tata-punch-ev-empowered-lr";
  const testVariantPath = path.join(
    selectedDir,
    "variants",
    `${testSlug}.json`
  );

  return {
    manifestExists,
    variantCount,
    firstFiveSlugs,
    resolvedPath: manifestPath,
    resolvedCatalogDir: selectedDir,
    processCwd: process.cwd(),
    moduleDirname: __dirname,
    candidates,
    testSlug,
    testVariantFileExists: fs.existsSync(testVariantPath),
    testVariantPath,
    manifestReadError,
    catalogFilesAvailable: catalogFilesAvailable(),
  };
}

module.exports = {
  findVariantBySlugFromFiles,
  listMarketplaceVehiclesFromFiles,
  getManifestSlugs,
  catalogFilesAvailable,
  readVariantRecord,
  getTier1DiagnosticStatus,
  resolveCatalogDir,
};
