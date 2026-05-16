/**
 * Raw extraction viewer — full extract payload for editorial review.
 */

const fs = require("fs");
const path = require("path");
const { getPaths, loadRawExtract } = require("./helpers");
const { loadRegistry } = require("../source-registry");

function getExtractBySourceId(sourceId) {
  const paths = getPaths();
  const raw = loadRawExtract(sourceId, paths);
  if (!raw) return null;

  const source = loadRegistry().sources.find((s) => s.sourceId === sourceId);
  const logPath = path.join(paths.logs, `${sourceId}.extract.log`);
  let extractionLog = null;
  if (fs.existsSync(logPath)) {
    extractionLog = fs.readFileSync(logPath, "utf8");
  }

  const pages = raw.payload?.pages || [];
  const ocrWarnings = pages
    .filter((p) => p.ocrUsed || p.lowConfidence)
    .map((p) => ({
      page: p.pageNumber,
      ocrUsed: !!p.ocrUsed,
      lowConfidence: !!p.lowConfidence,
      note: p.ocrNote || null,
    }));

  return {
    generatedAt: new Date().toISOString(),
    sourceId,
    source,
    extract: raw,
    extractionLog,
    ocrWarnings,
    tableCount: raw.payload?.tables?.length ?? 0,
    textBlockCount: pages.reduce(
      (n, p) => n + (p.textBlocks?.length || (p.text ? 1 : 0)),
      0
    ),
    provenance: {
      extractionMethod: raw.extractionMethod,
      confidenceLevel: raw.confidenceLevel,
      artifactType: raw.artifactType,
      governance: raw._governance || null,
    },
  };
}

function listExtracts() {
  const paths = getPaths();
  const dir = paths.extracted;
  if (!fs.existsSync(dir)) return { items: [] };

  const items = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".raw.extract.json"))
    .map((f) => {
      const raw = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      return {
        sourceId: raw.sourceId,
        tier1VariantSlug: raw.tier1VariantSlug,
        extractedAt: raw.extractedAt,
        extractionMethod: raw.extractionMethod,
        confidenceLevel: raw.confidenceLevel,
        pageCount: raw.payload?.pages?.length ?? 0,
      };
    });

  return { generatedAt: new Date().toISOString(), count: items.length, items };
}

module.exports = { getExtractBySourceId, listExtracts };
