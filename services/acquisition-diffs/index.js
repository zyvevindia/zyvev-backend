/**
 * Variant-level diff detection — Tier-1 published vs extracted/normalized drafts.
 */

const fs = require("fs");
const path = require("path");

const COMPARABLE_PATHS = [
  ["pricing", "exShowroom"],
  ["battery", "capacityKwh"],
  ["battery", "usableKwh"],
  ["range", "claimedKm"],
  ["charging", "dcKw"],
  ["charging", "dcTime10to80Minutes"],
  ["charging", "acKw"],
  ["charging", "acTime0to100Hours"],
  ["practicality", "bootSpaceL"],
  ["ownership", "warrantyVehicleYears"],
  ["ownership", "warrantyBatteryYears"],
  ["safety", "airbags", "count"],
  ["safety", "adas", "level"],
];

function getNested(obj, parts) {
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function unwrapProvenanceLeaf(val) {
  if (val && typeof val === "object" && "value" in val) {
    return val.value;
  }
  return val;
}

/** Plain Tier-1 catalog JSON layout (identity/pricing root keys). */
function flattenComparableTier1(doc) {
  const out = {};
  for (const parts of COMPARABLE_PATHS) {
    const key = parts.join(".");
    const v = getNested(doc, parts);
    if (v !== undefined) out[key] = v;
  }
  return out;
}

/** Draft with provenance-wrapped numeric leaves. */
function flattenComparableProvenanceDraft(doc) {
  const out = {};
  for (const parts of COMPARABLE_PATHS) {
    const key = parts.join(".");
    let cur = doc;
    for (const p of parts) cur = cur?.[p];
    const v = unwrapProvenanceLeaf(cur);
    if (v !== undefined && v !== null) out[key] = v;
  }
  return out;
}

function numericOrJsonEqual(a, b) {
  if (typeof a === "number" && typeof b === "number") {
    return Math.abs(a - b) <= 1e-6;
  }
  return JSON.stringify(a) === JSON.stringify(b);
}

function detectVariantDiffs(publishedDoc, draftDoc, options = {}) {
  const detectedAt = new Date().toISOString();
  const flatPub = flattenComparableTier1(publishedDoc);
  const flatDraft =
    options.draftUsesProvenance !== false &&
    draftDoc &&
    draftDoc._normalized
      ? flattenComparableProvenanceDraft(draftDoc)
      : flattenComparableTier1(draftDoc);

  const changes = [];
  const keys = new Set([...Object.keys(flatPub), ...Object.keys(flatDraft)]);

  for (const field of keys) {
    const oldValue = flatPub[field];
    const newValue = flatDraft[field];
    if (
      oldValue !== undefined &&
      newValue !== undefined &&
      numericOrJsonEqual(oldValue, newValue)
    ) {
      continue;
    }
    if (
      oldValue === undefined &&
      newValue === undefined
    ) {
      continue;
    }
    changes.push({
      field,
      oldValue,
      newValue,
      changeType:
        oldValue === undefined
          ? "draft_only"
          : newValue === undefined
            ? "published_only"
            : "modified",
      detectedAt,
    });
  }

  return {
    generatedAt: detectedAt,
    changeCount: changes.length,
    changes,
  };
}

function loadTier1Variant(variantSlug, tier1VariantsDir) {
  const base =
    tier1VariantsDir ||
    path.join(
      __dirname,
      "../../docs/architecture/catalog/tier-1/variants"
    );
  const fp = path.join(base, `${variantSlug}.json`);
  if (!fs.existsSync(fp)) throw new Error(`missing variant JSON: ${fp}`);
  return JSON.parse(fs.readFileSync(fp, "utf8"));
}

module.exports = {
  detectVariantDiffs,
  flattenComparableTier1,
  flattenComparableProvenanceDraft,
  loadTier1Variant,
};
