#!/usr/bin/env node
/**
 * Run governed brochure PDF extraction (Python bridge).
 *
 * Usage:
 *   node scripts/extract-oem-pdf.js --source-id <id> [--pdf /abs/path/to.pdf]
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { getSource, updateSource } = require("../services/source-registry");
const { extractPdfToJson } = require("../services/pdf-extraction");
const { getStagingPaths } = require("../services/data-acquisition");

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

function main() {
  const sourceId = arg("--source-id") || arg("-s");
  if (!sourceId) {
    console.error("Missing --source-id");
    process.exit(2);
  }

  const src = getSource(sourceId);
  if (!src) {
    console.error(`Unknown source ${sourceId}`);
    process.exit(2);
  }

  const pdfPath =
    arg("--pdf") ||
    (src.localAssetPath && src.localAssetPath.trim()
      ? path.resolve(src.localAssetPath)
      : null);

  if (!pdfPath || !fs.existsSync(pdfPath)) {
    console.error(
      "Provide --pdf /absolute/path/to/brochure.pdf or set source.localAssetPath in registry."
    );
    process.exit(2);
  }

  const staging = getStagingPaths();
  fs.mkdirSync(staging.extracted, { recursive: true });
  const outJson = path.join(staging.extracted, `${sourceId}.raw.extract.json`);

  updateSource(sourceId, { extractionStatus: "extracting" });

  let method = arg("--method") || "AUTO";

  try {
    const result = extractPdfToJson(pdfPath, outJson, {
      sourceId,
      tier1VariantSlug:
        src.tier1VariantSlug || "unknown-variant",
      method,
    });

    updateSource(sourceId, {
      extractionStatus: result.ok ? "extract_ok" : "extract_failed",
      lastFetchedAt: new Date().toISOString(),
      notes:
        `${src.notes || ""}\nLast extract log: ${JSON.stringify(result.log).slice(0, 500)}`,
    });

    console.log(JSON.stringify(result, null, 2));

    process.exit(result.ok ? 0 : 1);
  } catch (e) {
    updateSource(sourceId, {
      extractionStatus: "extract_failed",
      notes: `${src.notes || ""}\nExtract error: ${e.message}`,
    });
    console.error(e);
    process.exit(1);
  }
}

main();
