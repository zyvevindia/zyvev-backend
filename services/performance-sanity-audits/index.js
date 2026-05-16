/**
 * Lightweight performance / bundle sanity checks.
 */

const fs = require("fs");
const path = require("path");

const WARN_CHUNK_KB = 400;
const WARN_TOTAL_JS_KB = 900;

function auditPerformanceSanity(options = {}) {
  const distDir =
    options.distDir ||
    path.join(__dirname, "../../../zyvev-frontend/dist");
  const publicSeoData =
    options.publicSeoData ||
    path.join(__dirname, "../../../zyvev-frontend/public/seo-data");

  const observations = [];
  const warnings = [];

  if (!fs.existsSync(distDir)) {
    return {
      skipped: true,
      reason: "dist/ not found — run npm run build first",
      observations: ["Run frontend build before performance audit"],
      errors: 0,
      warnings: 1,
    };
  }

  const assetsDir = path.join(distDir, "assets");
  let totalJs = 0;
  const chunks = [];

  if (fs.existsSync(assetsDir)) {
    for (const file of fs.readdirSync(assetsDir)) {
      if (!file.endsWith(".js")) continue;
      const size = fs.statSync(path.join(assetsDir, file)).size;
      const kb = Math.round(size / 1024);
      totalJs += size;
      chunks.push({ file, kb });
      if (kb > WARN_CHUNK_KB) {
        warnings.push({
          type: "large_chunk",
          file,
          kb,
          thresholdKb: WARN_CHUNK_KB,
        });
      }
    }
  }

  chunks.sort((a, b) => b.kb - a.kb);
  const totalKb = Math.round(totalJs / 1024);

  observations.push(`Total JS (assets): ~${totalKb} KB`);
  observations.push(`Largest chunks: ${chunks.slice(0, 3).map((c) => `${c.file} (${c.kb}KB)`).join(", ")}`);

  if (totalKb > WARN_TOTAL_JS_KB) {
    warnings.push({
      type: "total_bundle",
      totalKb,
      thresholdKb: WARN_TOTAL_JS_KB,
    });
  }

  if (fs.existsSync(publicSeoData)) {
    let seoBytes = 0;
    let seoCount = 0;
    for (const f of fs.readdirSync(publicSeoData)) {
      if (f.endsWith(".json")) {
        seoBytes += fs.statSync(path.join(publicSeoData, f)).size;
        seoCount += 1;
      }
    }
    observations.push(
      `Static SEO JSON: ${seoCount} files, ~${Math.round(seoBytes / 1024)} KB total (loaded per guide page)`
    );
    if (seoBytes > 500 * 1024) {
      warnings.push({
        type: "seo_static_payload",
        note: "Consider lazy-loading guides if catalog grows",
      });
    }
  }

  observations.push(
    "Compare page: client-side only — payload scales with vehicles in localStorage"
  );
  observations.push(
    "Recommendation: code-split admin/sales routes (already lazy in App.jsx)"
  );

  return {
    totalJsKb: totalKb,
    topChunks: chunks.slice(0, 8),
    observations,
    warnings,
    errors: 0,
  };
}

module.exports = {
  auditPerformanceSanity,
};
