/**
 * Verify Tier-1 catalog images are reachable on CDN.
 * Run: node media-operations/verify-cdn-media.mjs [--slug x] [--strict]
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tier1Root = path.join(__dirname, "..");
const manifest = JSON.parse(
  fs.readFileSync(path.join(tier1Root, "manifest.json"), "utf8")
);

const strict = process.argv.includes("--strict");
const slugArg = process.argv.find((a) => a.startsWith("--slug="))?.split("=")[1]
  || (process.argv.includes("--slug")
    ? process.argv[process.argv.indexOf("--slug") + 1]
    : null);

const slugs = slugArg ? [slugArg] : manifest.slugs;
const variantsDir = path.join(tier1Root, "variants");

const URL_FIELDS = [
  "heroImage",
  "listingThumbnail",
  "compareThumbnail",
  "ogImage",
];

async function checkUrl(url) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    const type = res.headers.get("content-type") || "";
    const len = Number(res.headers.get("content-length") || 0);
    const ok =
      res.ok &&
      type.startsWith("image/") &&
      (len === 0 || len > 5000);
    return { ok, status: res.status, type, len };
  } catch (err) {
    return { ok: false, status: 0, error: err.message };
  }
}

let failures = 0;
let warnings = 0;

for (const slug of slugs) {
  const record = JSON.parse(
    fs.readFileSync(path.join(variantsDir, `${slug}.json`), "utf8")
  );
  const media = record.media || {};
  const urls = new Set();

  for (const f of URL_FIELDS) {
    if (media[f]) urls.add(media[f]);
  }
  for (const arr of ["gallery", "interior", "charging"]) {
    for (const u of media[arr] || []) urls.add(u);
  }

  console.log(`\n${slug} (${urls.size} URLs)`);

  for (const url of urls) {
    const result = await checkUrl(url);
    if (result.ok) {
      console.log(`  OK  ${url}`);
    } else {
      const line = `  FAIL ${url} — ${result.status || result.error} ${result.type || ""}`;
      if (strict) {
        console.error(line);
        failures++;
      } else {
        console.warn(line);
        warnings++;
      }
    }
  }
}

console.log(`\nSummary: ${failures} failures, ${warnings} warnings (strict=${strict})`);

if (failures > 0) process.exit(1);
process.exit(0);
