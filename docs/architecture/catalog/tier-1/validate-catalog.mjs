/**
 * Validates Tier-1 variant JSON files.
 * Run: node docs/architecture/catalog/tier-1/validate-catalog.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const variantsDir = path.join(__dirname, "variants");
const manifestPath = path.join(__dirname, "manifest.json");

const REQUIRED_PATHS = [
  "identity.slug",
  "identity.brandSlug",
  "identity.modelSlug",
  "identity.variantName",
  "identity.segment",
  "identity.launchStatus",
  "pricing.exShowroom",
  "battery.capacityKwh",
  "range.claimedKm",
  "media.heroImage",
  "seo.metaTitle",
  "seo.metaDescription",
  "seo.pros",
  "seo.cons",
  "seo.expertSummary",
  "verification.flags",
  "governance.dataQualityScore",
];

function get(obj, dotPath) {
  return dotPath.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const slugSet = new Set(manifest.slugs);
let errors = 0;

for (const slug of manifest.slugs) {
  const filePath = path.join(variantsDir, `${slug}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`MISSING FILE: ${slug}.json`);
    errors++;
    continue;
  }

  const record = JSON.parse(fs.readFileSync(filePath, "utf8"));

  for (const p of REQUIRED_PATHS) {
    const val = get(record, p);
    if (
      val === undefined ||
      val === null ||
      (Array.isArray(val) && val.length === 0 && p.startsWith("seo."))
    ) {
      console.error(`${slug}: missing ${p}`);
      errors++;
    }
  }

  if (record.identity.slug !== slug) {
    console.error(`${slug}: identity.slug mismatch`);
    errors++;
  }

  const rivals = record.compare?.segmentRivalSlugs || [];
  for (const rival of rivals) {
    if (!slugSet.has(rival)) {
      console.error(`${slug}: unknown rival slug "${rival}"`);
      errors++;
    }
  }

  if ((record.governance?.dataQualityScore ?? 0) < 85) {
    console.warn(`${slug}: quality score below 85 (${record.governance.dataQualityScore})`);
  }
}

if (errors === 0) {
  console.log(`OK — ${manifest.slugs.length} variants validated.`);
  process.exit(0);
} else {
  console.error(`FAILED — ${errors} error(s).`);
  process.exit(1);
}
