/**
 * JSON-driven OEM / public dataset source registry — human-review first.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const {
  SOURCE_TYPES,
  EXTRACTION_STATUSES,
  REVIEW_STATUSES,
} = require("../data-acquisition");

const REGISTRY_DEFAULT = path.join(
  __dirname,
  "sources.json"
);

function loadRegistry(registryPath = REGISTRY_DEFAULT) {
  if (!fs.existsSync(registryPath)) {
    return { version: 1, updatedAt: null, sources: [] };
  }
  return JSON.parse(fs.readFileSync(registryPath, "utf8"));
}

function saveRegistry(data, registryPath = REGISTRY_DEFAULT) {
  const out = {
    ...data,
    updatedAt: new Date().toISOString(),
  };
  fs.mkdirSync(path.dirname(registryPath), { recursive: true });
  fs.writeFileSync(
    registryPath,
    `${JSON.stringify(out, null, 2)}\n`,
    "utf8"
  );
  return out;
}

function validateSourceEntry(entry) {
  const errors = [];
  if (!entry.sourceId?.trim())
    errors.push("sourceId required");
  if (!entry.brand?.trim()) errors.push("brand required");
  if (!SOURCE_TYPES.includes(entry.sourceType)) {
    errors.push(`invalid sourceType: ${entry.sourceType}`);
  }
  if (
    entry.extractionStatus &&
    !EXTRACTION_STATUSES.includes(entry.extractionStatus)
  ) {
    errors.push(`invalid extractionStatus: ${entry.extractionStatus}`);
  }
  if (
    entry.reviewStatus &&
    !REVIEW_STATUSES.includes(entry.reviewStatus)
  ) {
    errors.push(`invalid reviewStatus: ${entry.reviewStatus}`);
  }
  return errors;
}

function registerSource(raw, registryPath = REGISTRY_DEFAULT) {
  const data = loadRegistry(registryPath);
  const entry = {
    sourceId:
      raw.sourceId ||
      `src_${crypto.randomBytes(6).toString("hex")}`,
    brand: String(raw.brand || "").trim().toLowerCase(),
    model:
      raw.model != null ? String(raw.model).trim().toLowerCase() : "",
    tier1VariantSlug: raw.tier1VariantSlug
      ? String(raw.tier1VariantSlug).trim().toLowerCase()
      : null,
    sourceType: raw.sourceType,
    sourceUrl: raw.sourceUrl ?? "",
    localAssetPath: raw.localAssetPath ?? "",
    sourceFormat: raw.sourceFormat || "UNKNOWN",
    lastFetchedAt: raw.lastFetchedAt ?? null,
    lastVerifiedAt: raw.lastVerifiedAt ?? null,
    extractionStatus: raw.extractionStatus || "registered",
    reviewStatus:
      raw.reviewStatus ||
      (needsRegistryReview(raw)
        ? "needs_manual_check"
        : "pending_review"),
    notes: raw.notes || "",
    governanceTags: Array.isArray(raw.governanceTags)
      ? raw.governanceTags
      : [],
    createdAt: new Date().toISOString(),
  };

  const errs = validateSourceEntry(entry);
  if (errs.length) {
    throw new Error(errs.join("; "));
  }

  const idx = data.sources.findIndex((s) => s.sourceId === entry.sourceId);
  if (idx >= 0) {
    const prev = data.sources[idx];
    data.sources[idx] = {
      ...prev,
      ...entry,
      createdAt: prev.createdAt || entry.createdAt,
    };
  } else {
    data.sources.push(entry);
  }
  saveRegistry(data, registryPath);
  return entry;
}

function needsRegistryReview(raw) {
  return (
    !raw.sourceUrl &&
    !(raw.localAssetPath && String(raw.localAssetPath).trim())
  );
}

function getSource(sourceId, registryPath = REGISTRY_DEFAULT) {
  const data = loadRegistry(registryPath);
  return data.sources.find((s) => s.sourceId === sourceId) || null;
}

function updateSource(sourceId, patch, registryPath = REGISTRY_DEFAULT) {
  const data = loadRegistry(registryPath);
  const idx = data.sources.findIndex((s) => s.sourceId === sourceId);
  if (idx < 0) throw new Error(`unknown sourceId: ${sourceId}`);
  const merged = {
    ...data.sources[idx],
    ...patch,
  };
  const errs = validateSourceEntry(merged);
  if (errs.length) throw new Error(errs.join("; "));
  data.sources[idx] = merged;
  saveRegistry(data, registryPath);
  return merged;
}

function listSourcesByBrand(brand, registryPath = REGISTRY_DEFAULT) {
  const b = String(brand || "").toLowerCase();
  return loadRegistry(registryPath).sources.filter(
    (s) => s.brand === b
  );
}

module.exports = {
  REGISTRY_DEFAULT,
  loadRegistry,
  saveRegistry,
  validateSourceEntry,
  registerSource,
  getSource,
  updateSource,
  listSourcesByBrand,
};
