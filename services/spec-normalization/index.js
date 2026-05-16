/**
 * Tier-1 aligned spec normalization — deterministic, no hallucination.
 * Target shape mirrors docs/architecture/catalog/tier-1/variants/*.json sections.
 */

const {
  createFieldProvenance,
  wrapProvenancedValue,
} = require("./provenance");

/** Flat keys from PDF pipeline → nested paths (values only, no provenance) */
const KNOWN_FLAT_MAP = {
  batteryKwh: "battery.capacityKwh",
  usableBatteryKwh: "battery.usableKwh",
  batteryChemistry: "battery.chemistry",
  claimedRangeKm: "range.claimedKm",
  rangeStandard: "range.claimedStandard",
  acChargingKw: "charging.acKw",
  acChargingTimeHours: "charging.acTime0to100Hours",
  dcChargingKw: "charging.dcKw",
  dcCharge10to80Min: "charging.dcTime10to80Minutes",
  bootSpaceLitres: "practicality.bootSpaceL",
  warrantyVehicleYears: "ownership.warrantyVehicleYears",
  warrantyBatteryYears: "ownership.warrantyBatteryYears",
  airbagCount: "safety.airbags.count",
  airbagCurtains: "safety.airbags.curtains",
  adasLevel: "safety.adas.level",
  priceExShowroom: "pricing.exShowroom",
};

const NUMERIC_PATHS = new Set([
  "battery.capacityKwh",
  "battery.usableKwh",
  "range.claimedKm",
  "charging.acKw",
  "charging.acTime0to100Hours",
  "charging.dcKw",
  "charging.dcTime10to80Minutes",
  "practicality.bootSpaceL",
  "ownership.warrantyVehicleYears",
  "ownership.warrantyBatteryYears",
  "safety.airbags.count",
  "safety.adas.level",
  "pricing.exShowroom",
]);

const BOOLEAN_PATHS = new Set(["safety.airbags.curtains"]);

function setDeep(target, dotted, value) {
  const parts = dotted.split(".");
  let cur = target;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!cur[p] || typeof cur[p] !== "object") cur[p] = {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
}

function getDeep(obj, dotted) {
  const parts = dotted.split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

/**
 * @param {Record<string, unknown>} flatSpecs - raw numbers/strings from extractor
 * @param {object} baseMeta - passed to createFieldProvenance
 */
function normalizeFromFlat(flatSpecs, baseMeta) {
  const conflicts = [];
  const missing = [];
  const normalized = {
    _normalized: true,
    _governance: {
      noGuessedFields: true,
      normalizedAt: new Date().toISOString(),
    },
  };

  for (const [flatKey, rawVal] of Object.entries(flatSpecs)) {
    if (flatKey.startsWith("__")) continue;
    const path = KNOWN_FLAT_MAP[flatKey];
    if (!path) {
      conflicts.push({
        field: flatKey,
        reason: "unsupported_flat_key",
      });
      continue;
    }
    if (rawVal === null || rawVal === undefined || rawVal === "") {
      missing.push(flatKey);
      continue;
    }

    const existing = getDeep(normalized, path);
    if (existing?.value !== undefined) {
      conflicts.push({
        field: path,
        reason: "duplicate_source_path",
      });
      continue;
    }

    let coerced = rawVal;
    if (NUMERIC_PATHS.has(path)) {
      coerced = typeof rawVal === "number" ? rawVal : Number(rawVal);
      if (Number.isNaN(coerced)) {
        conflicts.push({ field: flatKey, reason: "invalid_numeric" });
        continue;
      }
      const unitIssue = validateNumericPlausibility(path, coerced);
      if (unitIssue) {
        conflicts.push({ field: path, reason: unitIssue });
        continue;
      }
    }
    if (BOOLEAN_PATHS.has(path)) {
      coerced = Boolean(rawVal);
    }

    const meta = createFieldProvenance({
      ...baseMeta,
      extractionMethod:
        baseMeta.extractionMethod || "TEXT_EXTRACTION",
    });
    setDeep(normalized, path, wrapProvenancedValue(coerced, meta));
  }

  return { normalized, conflicts, unsupportedKeys: [], missing };
}

function validateNumericPlausibility(path, n) {
  if (path.includes("capacityKwh") && (n <= 0 || n > 300)) {
    return "capacityKwh_out_of_plausible_range";
  }
  if (path.includes("claimedKm") && (n < 50 || n > 1200)) {
    return "claimedRange_out_of_plausible_range";
  }
  if (path === "pricing.exShowroom" && (n < 1e5 || n > 5e7)) {
    return "exShowroom_inr_plausibility";
  }
  return null;
}

function validateNormalizedSchema(norm) {
  const { assertProvenanceCoverage } = require("./provenance");
  const stripped = { ...norm };
  delete stripped._normalized;
  delete stripped._governance;
  delete stripped.sourceId;
  delete stripped.tier1VariantSlug;
  delete stripped._missingFlatKeys;
  delete stripped._normalizationWarnings;
  const gaps = assertProvenanceCoverage(stripped);
  return { ok: gaps.length === 0, provenanceGaps: gaps };
}

module.exports = {
  KNOWN_FLAT_MAP,
  normalizeFromFlat,
  validateNormalizedSchema,
  getDeep,
};
