/**
 * Data acquisition governance audits — pre-merge safety.
 */

const fs = require("fs");
const path = require("path");
const { loadRegistry } = require("../source-registry");
const { validateNormalizedSchema } = require("../spec-normalization");
const { getStagingPaths } = require("./index");
const { listJobs } = require("../review-queue");

function walkJsonFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walkJsonFiles(full, acc);
    else if (name.endsWith(".json")) acc.push(full);
  }
  return acc;
}

function auditDataAcquisition(options = {}) {
  const registryPath =
    options.registryPath ||
    path.join(__dirname, "../source-registry/sources.json");
  const paths = getStagingPaths(options.stagingRoot);

  const findings = [];
  const registry = loadRegistry(registryPath);
  const sourceIds = new Set(registry.sources.map((s) => s.sourceId));

  for (const s of registry.sources) {
    if (!s.sourceUrl && !String(s.localAssetPath || "").trim()) {
      findings.push({
        severity: "info",
        code: "source_needs_asset",
        sourceId: s.sourceId,
        message: "No URL or local asset — expected until OEM registration",
      });
    }
    if (s.reviewStatus === "needs_manual_check") {
      findings.push({
        severity: "info",
        code: "review_needs_manual_check",
        sourceId: s.sourceId,
      });
    }
  }

  const dirsToScan = [
    paths.normalized,
    paths.pendingReview,
    paths.approved,
    path.join(paths.root, "staging", "published"),
  ].filter(Boolean);

  const normalizedFiles = [];
  for (const dir of dirsToScan) {
    walkJsonFiles(dir, normalizedFiles);
  }

  for (const fp of normalizedFiles) {
    let doc;
    try {
      doc = JSON.parse(fs.readFileSync(fp, "utf8"));
    } catch {
      findings.push({
        severity: "error",
        code: "invalid_json",
        path: fp,
      });
      continue;
    }
    if (doc._normalized) {
      const schema = validateNormalizedSchema(doc);
      if (!schema.ok) {
        findings.push({
          severity: "error",
          code: "missing_provenance",
          path: fp,
          gaps: schema.provenanceGaps.slice(0, 30),
        });
      }
    }
    if (doc.sourceId && !sourceIds.has(doc.sourceId)) {
      findings.push({
        severity: "error",
        code: "orphan_source_reference",
        path: fp,
        sourceId: doc.sourceId,
      });
    }
  }

  const approved = listJobs(paths.root, "approved");
  const bySlug = new Map();
  for (const item of approved) {
    const slug = item.tier1VariantSlug;
    if (!slug) continue;
    bySlug.set(slug, (bySlug.get(slug) || 0) + 1);
  }
  for (const [slug, n] of bySlug) {
    if (n > 1) {
      findings.push({
        severity: "warning",
        code: "duplicate_approved_variant",
        tier1VariantSlug: slug,
        count: n,
      });
    }
  }

  const errors = findings.filter((f) => f.severity === "error").length;
  const warnings = findings.filter((f) => f.severity === "warning").length;

  return {
    generatedAt: new Date().toISOString(),
    ok: errors === 0,
    errors,
    warnings,
    findings,
    paths,
  };
}

module.exports = {
  auditDataAcquisition,
};
