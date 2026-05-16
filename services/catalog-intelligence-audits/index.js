/**
 * Catalog intelligence audit engine — non-blocking, CLI/CI friendly.
 */

const fs = require("fs");
const path = require("path");

const { auditVariant } = require("./auditVariant");

function auditVariants(variants) {
  return variants.map((v) => auditVariant(v));
}

function formatAuditReport(results, { verbose = false } = {}) {
  const lines = [];
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const r of results) {
    totalErrors += r.errors.length;
    totalWarnings += r.warnings.length;
    const status =
      r.errors.length > 0 ? "FAIL" : r.warnings.length > 0 ? "WARN" : "OK";
    lines.push(
      `[${status}] ${r.variantSlug} — score ${r.auditScore} (${r.errors.length} errors, ${r.warnings.length} warnings)`
    );
    if (verbose) {
      for (const e of r.errors) {
        lines.push(`  ERROR ${e.code}: ${e.message}`);
      }
      for (const w of r.warnings) {
        lines.push(`  WARN  ${w.code}: ${w.message}`);
      }
    }
  }

  lines.push(
    `\nTotal: ${results.length} variants, ${totalErrors} errors, ${totalWarnings} warnings`
  );
  return { lines: lines.join("\n"), totalErrors, totalWarnings };
}

function loadTier1Variants(variantsDir) {
  const files = fs
    .readdirSync(variantsDir)
    .filter((f) => f.endsWith(".json"));
  return files.map((f) => {
    const full = path.join(variantsDir, f);
    return JSON.parse(fs.readFileSync(full, "utf8"));
  });
}

function runTier1Audit(variantsDir, options = {}) {
  const variants = loadTier1Variants(variantsDir);
  const results = auditVariants(variants);
  const report = formatAuditReport(results, options);
  return { results, report };
}

module.exports = {
  auditVariant,
  auditVariants,
  formatAuditReport,
  runTier1Audit,
};
