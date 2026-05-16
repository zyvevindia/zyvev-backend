/**
 * Deterministic slug normalization (aligned with frontend vehicleRoutes).
 */

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const LEGACY_SLUG_ALIASES = {
  "tata-nexon-ev-long-range": "tata-nexon-ev-empowered-lr",
  "tata-nexon-ev-lr": "tata-nexon-ev-empowered-lr",
};

function normalizeVehicleSlug(slug) {
  if (slug == null || slug === "") return "";
  return String(slug)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function resolveSlugCandidates(rawSlug) {
  const normalized = normalizeVehicleSlug(rawSlug);
  const candidates = [];

  if (normalized) candidates.push(normalized);

  const rawLower = String(rawSlug || "")
    .trim()
    .toLowerCase();
  if (rawLower && rawLower !== normalized) {
    candidates.push(rawLower);
  }

  const alias = LEGACY_SLUG_ALIASES[normalized];
  if (alias) candidates.push(alias);

  return [...new Set(candidates.filter(Boolean))];
}

function isValidVehicleSlug(slug) {
  const n = normalizeVehicleSlug(slug);
  return n.length > 0 && SLUG_PATTERN.test(n);
}

module.exports = {
  normalizeVehicleSlug,
  resolveSlugCandidates,
  isValidVehicleSlug,
  LEGACY_SLUG_ALIASES,
};
