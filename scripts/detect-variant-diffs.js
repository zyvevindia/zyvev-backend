#!/usr/bin/env node
/**
 * Compare Tier-1 published variant vs drafted normalized artifact.
 *
 * Usage:
 *   node scripts/detect-variant-diffs.js <tier1Slug> --draft ./path/to/draft-normalized.json
 */

const path = require("path");
const fs = require("fs");
const {
  detectVariantDiffs,
  loadTier1Variant,
} = require("../services/acquisition-diffs");

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

const slug = process.argv[2];
const draftPath = arg("--draft") || arg("-d");

if (!slug || !draftPath) {
  console.error(
    "Usage: node scripts/detect-variant-diffs.js <tier1Slug> --draft ./draft.json"
  );
  process.exit(2);
}

const published = loadTier1Variant(slug);
const draft = JSON.parse(fs.readFileSync(path.resolve(draftPath), "utf8"));
const provenanceDraft = draft._normalized === true;

const report = detectVariantDiffs(published, draft, {
  draftUsesProvenance: provenanceDraft,
});

console.log(JSON.stringify(report, null, 2));
process.exit(0);
