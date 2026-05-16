#!/usr/bin/env node
/**
 * Review extracted / normalized payloads in the queue.
 *
 * Usage:
 *   node scripts/review-extracted-specs.js list
 *   node scripts/review-extracted-specs.js approve <jobId> --notes "reason"
 *   node scripts/review-extracted-specs.js reject <jobId>
 *   node scripts/review-extracted-specs.js enqueue-file ./payload.json [--source-id xxx]
 *
 * enqueue-file JSON shape (human-curated mapping from raw PDF → flat keys):
 *   { "tier1VariantSlug": "tata-nexon-ev-...", "sourceId": "...", "sourceType": "OEM_PDF",
 *     "extractionMethod": "MANUAL_ENTRY", "flatSpecs": { "batteryKwh": 40.5, "priceExShowroom": 1649000 } }
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { listJobs, enqueueItem, setJobStatus } = require("../services/review-queue");
const { getStagingPaths } = require("../services/data-acquisition");
const {
  normalizeFromFlat,
  validateNormalizedSchema,
} = require("../services/spec-normalization");

const staging = getStagingPaths();

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

function parseNotes() {
  const noteIdx = process.argv.indexOf("--notes");
  return noteIdx >= 0
    ? process.argv.slice(noteIdx + 1).join(" ").trim()
    : "";
}

function enqueueFromNormalizePath(filePath, sourceIdCli) {
  const raw = JSON.parse(fs.readFileSync(path.resolve(filePath), "utf8"));
  const flatSpecs = raw.flatSpecs || raw;
  if (flatSpecs.tier1VariantSlug) delete flatSpecs.tier1VariantSlug;

  const slug =
    raw.tier1VariantSlug ||
    raw.tier1Variant ||
    raw.slug;
  if (!slug) {
    throw new Error("tier1VariantSlug required in JSON");
  }

  const baseMeta = {
    sourceType: raw.sourceType || "OEM_PDF",
    confidenceLevel: raw.confidenceLevel || "MEDIUM",
    extractionMethod:
      raw.extractionMethod || "MANUAL_ENTRY",
    reviewStatus: "pending_review",
    extractedAt: new Date().toISOString(),
    sourceId: raw.sourceId || sourceIdCli || null,
    pageHint: raw.pageHint || null,
  };

  const { normalized, conflicts, missing } =
    normalizeFromFlat(flatSpecs, baseMeta);
  normalized.sourceId = baseMeta.sourceId;
  normalized.tier1VariantSlug = slug;

  const v = validateNormalizedSchema(normalized);
  if (!v.ok) {
    throw new Error(
      `Provenance incomplete: ${v.provenanceGaps.slice(0, 8).join(", ")}`
    );
  }

  if (conflicts.length)
    normalized._normalizationWarnings = conflicts;
  if (missing.length) normalized._missingFlatKeys = missing;

  return enqueueItem({
    tier1VariantSlug: slug,
    sourceId: baseMeta.sourceId,
    reviewerNotes:
      raw.reviewerNotes ||
      (conflicts.length
        ? `conflicts:${JSON.stringify(conflicts).slice(0, 600)}`
        : ""),
    payload: normalized,
  });
}

function cmdList() {
  const rows = listJobs(staging.root);
  console.log(
    JSON.stringify(
      rows.map((j) => ({
        jobId: j.jobId,
        status: j.status,
        tier1VariantSlug: j.tier1VariantSlug,
        artifactPath: j.artifactPath,
        createdAt: j.createdAt,
      })),
      null,
      2
    )
  );
}

const cmd = process.argv[2];
const reviewerNotes = parseNotes();

if (cmd === "list") {
  cmdList();
  process.exit(0);
}

if (cmd === "approve" || cmd === "reject") {
  const jobId = process.argv[3];
  if (!jobId) {
    console.error(`Usage: ${cmd} <jobId>`);
    process.exit(2);
  }
  const updated = setJobStatus(
    staging.root,
    jobId,
    cmd === "approve" ? "approved" : "rejected",
    reviewerNotes
  );
  console.log(JSON.stringify(updated, null, 2));
  process.exit(0);
}

if (cmd === "enqueue-file") {
  const filePath = process.argv[3];
  if (!filePath) {
    console.error("enqueue-file ./payload.json");
    process.exit(2);
  }
  try {
    const job = enqueueFromNormalizePath(
      filePath,
      arg("--source-id")
    );
    console.log(JSON.stringify(job, null, 2));
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
  process.exit(0);
}

console.error(`
Unknown command.
  list
  approve <jobId>
  reject <jobId>
  enqueue-file ./payload.json
`);
process.exit(2);
