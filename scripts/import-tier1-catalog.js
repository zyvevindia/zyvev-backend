#!/usr/bin/env node
/**
 * Import Tier-1 master catalog JSON into EvMasterVariant (non-destructive upsert).
 *
 * Usage:
 *   node scripts/import-tier1-catalog.js --dry-run
 *   node scripts/import-tier1-catalog.js
 *   node scripts/import-tier1-catalog.js --publish
 *
 * Does NOT modify legacy `cars` collection.
 */

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const validateEnv = require("../config/env");
validateEnv();

const EvMasterVariant = require("../models/EvMasterVariant");
const catalogRepo = require("../services/catalog/catalogRepository");
const { validateVariantRecord } = require("../services/catalog/validateVariantRecord");
const { labelBrand, labelModel } = require("../services/catalog/mappers");

const CATALOG_DIR = path.join(
  __dirname,
  "../docs/architecture/catalog/tier-1"
);

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const PUBLISH = args.includes("--publish");

async function main() {
  const manifestPath = path.join(CATALOG_DIR, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    console.error("manifest.json not found. Run build-catalog.mjs first.");
    process.exit(1);
  }

  const manifest = JSON.parse(
    fs.readFileSync(manifestPath, "utf8")
  );

  await mongoose.connect(process.env.MONGO_URI);

  const seenSlugs = new Set();
  let ok = 0;
  let fail = 0;

  console.log(
    `\nTier-1 import — ${manifest.slugs.length} variants — dry-run=${DRY_RUN} publish=${PUBLISH}\n`
  );

  for (const slug of manifest.slugs) {
    const filePath = path.join(
      CATALOG_DIR,
      "variants",
      `${slug}.json`
    );

    if (!fs.existsSync(filePath)) {
      console.error(`MISSING: ${slug}.json`);
      fail++;
      continue;
    }

    if (seenSlugs.has(slug)) {
      console.error(`DUPLICATE in manifest: ${slug}`);
      fail++;
      continue;
    }
    seenSlugs.add(slug);

    const record = JSON.parse(
      fs.readFileSync(filePath, "utf8")
    );

    if (record.identity?.slug !== slug) {
      console.error(`${slug}: identity.slug mismatch`);
      fail++;
      continue;
    }

    const validation = validateVariantRecord(record);
    if (!validation.valid) {
      console.error(`${slug}: validation failed`);
      validation.errors.forEach((e) => console.error(`  - ${e}`));
      fail++;
      continue;
    }

    const exists = await catalogRepo.slugExists(slug);
    if (exists && DRY_RUN) {
      console.log(`[dry-run] would UPDATE ${slug}`);
    } else if (!exists && DRY_RUN) {
      console.log(`[dry-run] would INSERT ${slug}`);
    }

    validation.warnings.forEach((w) =>
      console.warn(`  warn ${slug}: ${w}`)
    );

    if (DRY_RUN) {
      ok++;
      continue;
    }

    const brandSlug = record.identity.brandSlug;
    const modelSlug = record.identity.modelSlug;

    await catalogRepo.upsertBrand({
      slug: brandSlug,
      name: labelBrand(brandSlug),
    });

    await catalogRepo.upsertModel({
      brandSlug,
      slug: modelSlug,
      name: labelModel(modelSlug),
      bodyType: record.identity.bodyType,
      segment: record.identity.segment,
      launchStatus: record.identity.launchStatus,
      defaultHeroImage: record.media?.heroImage || "",
    });

    const governance = {
      ...record.governance,
      status: PUBLISH
        ? "published"
        : record.governance?.status || "review",
      publishedAt: PUBLISH
        ? new Date()
        : record.governance?.publishedAt || null,
    };

    await EvMasterVariant.findOneAndUpdate(
      { "identity.slug": slug },
      {
        $set: {
          identity: record.identity,
          pricing: record.pricing,
          battery: record.battery,
          range: record.range,
          charging: record.charging,
          performance: record.performance,
          practicality: record.practicality,
          ownership: record.ownership,
          psychology: record.psychology,
          availability: record.availability,
          compare: record.compare,
          seo: record.seo,
          media: record.media,
          governance,
          verification: record.verification,
        },
        $setOnInsert: {
          "governance.version": 1,
        },
      },
      { upsert: true, new: true }
    );

    console.log(`OK ${slug} (${exists ? "updated" : "inserted"})`);
    ok++;
  }

  await mongoose.disconnect();

  console.log(`\nDone: ${ok} ok, ${fail} failed\n`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
