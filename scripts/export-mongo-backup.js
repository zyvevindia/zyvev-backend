#!/usr/bin/env node
/**
 * Export critical MongoDB collections to JSON for disaster recovery drills.
 * Usage: node scripts/export-mongo-backup.js [--out=./backups/2026-05-20]
 */

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const root = path.join(__dirname, "..");

const outArg = process.argv.find((a) => a.startsWith("--out="));
const outDir = outArg
  ? path.resolve(outArg.split("=")[1])
  : path.join(
      root,
      "backups",
      new Date().toISOString().slice(0, 10)
    );

async function main() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("MONGO_URI is required");
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });

  await mongoose.connect(uri);

  try {
    const db = mongoose.connection.db;
    const manifest = {
      exportedAt: new Date().toISOString(),
      database: db.databaseName,
      collections: [],
    };

    const collectionNames = [
      "leads",
      "cars",
      "opsaudits",
      "buyerbehaviorevents",
    ];

    for (const collName of collectionNames) {
      const exists = await db
        .listCollections({ name: collName })
        .hasNext();

      if (!exists) {
        console.log(`skip (missing): ${collName}`);
        continue;
      }

      const limit =
        collName === "buyerbehaviorevents" ? 5000 : 50000;

      const docs = await db
        .collection(collName)
        .find({})
        .limit(limit)
        .toArray();

      const filePath = path.join(outDir, `${collName}.json`);

      fs.writeFileSync(
        filePath,
        JSON.stringify(docs, null, 2),
        "utf8"
      );

      manifest.collections.push({
        name: collName,
        count: docs.length,
        file: `${collName}.json`,
      });

      console.log(`exported ${collName}: ${docs.length} docs`);
    }

    const seoManifest = path.join(
      root,
      "..",
      "zyvev-frontend",
      "public",
      "seo-data",
      "content-manifest.json"
    );

    if (fs.existsSync(seoManifest)) {
      const dest = path.join(outDir, "content-manifest.json");
      fs.copyFileSync(seoManifest, dest);
      manifest.collections.push({
        name: "content-manifest",
        file: "content-manifest.json",
        source: seoManifest,
      });
    }

    fs.writeFileSync(
      path.join(outDir, "manifest.json"),
      JSON.stringify(manifest, null, 2),
      "utf8"
    );

    console.log(`\nBackup written to ${outDir}`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
