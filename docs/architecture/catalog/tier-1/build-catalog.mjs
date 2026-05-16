/**
 * Writes import-ready variant JSON from tier-1 data modules.
 * Run: node docs/architecture/catalog/tier-1/build-catalog.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { tier1Variants } from "./data/index.js";
import { enrichVariantIntelligence } from "./data/_intelligence.js";

const require = createRequire(import.meta.url);
const { applyGovernanceLayer } = require(
  "../../../../services/catalog/governancePipeline.js"
);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const variantsDir = path.join(__dirname, "variants");

if (!fs.existsSync(variantsDir)) {
  fs.mkdirSync(variantsDir, { recursive: true });
}

const slugs = [];

for (const variant of tier1Variants) {
  const enriched = applyGovernanceLayer(
    enrichVariantIntelligence(variant)
  );
  const slug = enriched.identity.slug;
  slugs.push(slug);
  const filePath = path.join(variantsDir, `${slug}.json`);
  fs.writeFileSync(
    filePath,
    JSON.stringify(enriched, null, 2) + "\n",
    "utf8"
  );
}

const manifest = {
  catalogId: "tier-1-india-2026-q2",
  generatedAt: new Date().toISOString(),
  variantCount: slugs.length,
  targetRange: "25-35",
  slugs,
  compareTriangles: [
    ["tata-nexon-ev-empowered-lr", "mahindra-xuv400-el-pro", "mg-zs-ev-exclusive-plus"],
    ["tata-punch-ev-empowered-lr", "mg-comet-ev-plush-plus", "tata-tiago-ev-xz-plus"],
    ["byd-atto-3-superior", "hyundai-kona-electric-premium", "mg-zs-ev-exclusive-plus"],
    ["mahindra-be-6-pack-three-select", "tata-curvv-ev-empowered-lr", "byd-atto-3-superior"],
    ["kia-ev6-gt-line", "bmw-ix1-xdrive30", "mercedes-eqb-250-plus"],
    ["citroen-ec3-live", "tata-tiago-ev-xt", "mg-comet-ev-play"],
  ],
  brands: [
    "tata",
    "mg",
    "mahindra",
    "hyundai",
    "byd",
    "citroen",
    "kia",
    "bmw",
    "mercedes",
    "volvo",
  ],
  models: [
    "nexon-ev",
    "punch-ev",
    "curvv-ev",
    "tiago-ev",
    "zs-ev",
    "comet-ev",
    "xuv400",
    "be-6",
    "xev-9e",
    "kona-electric",
    "atto-3",
    "ec3",
    "ev6",
    "ix1",
    "eqa",
    "eqb",
    "ex40",
  ],
};

fs.writeFileSync(
  path.join(__dirname, "manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
  "utf8"
);

console.log(`Wrote ${slugs.length} variants to variants/`);
console.log("Slugs:", slugs.join(", "));
