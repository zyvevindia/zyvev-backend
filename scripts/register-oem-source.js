#!/usr/bin/env node
/**
 * Register or update OEM / public-source records (JSON-driven).
 *
 * Usage:
 *   node scripts/register-oem-source.js --stdin < ./path/to/source.json
 *   node scripts/register-oem-source.js '{"sourceId":"...","brand":"tata","sourceType":"OEM_PDF",...}'
 */

const fs = require("fs");
const { registerSource } = require("../services/source-registry");

function readStdinSync() {
  return fs.readFileSync(0, "utf8");
}

let payload;
try {
  if (process.argv.includes("--stdin")) {
    payload = JSON.parse(readStdinSync() || "{}");
  } else {
    const idx = process.argv.findIndex((a) => !a.startsWith("-"));
    if (idx < 0) {
      console.error(
        'Usage: node scripts/register-oem-source.js \'{"brand":"tata","sourceType":"OEM_BROCHURE",...}\' or --stdin'
      );
      process.exit(2);
    }
    payload = JSON.parse(process.argv[idx]);
  }
} catch (e) {
  console.error("invalid JSON", e.message);
  process.exit(2);
}

try {
  const entry = registerSource(payload);
  console.log(JSON.stringify({ ok: true, entry }, null, 2));
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
