/**
 * Scaffold local OEM media ingest folders per Tier-1 slug.
 * Run: node media-operations/prepare-media-package.mjs [--slug name]
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tier1Root = path.join(__dirname, "..");
const manifest = JSON.parse(
  fs.readFileSync(path.join(tier1Root, "manifest.json"), "utf8")
);

const REQUIRED_FILES = [
  "hero.jpg",
  "listing-thumb.jpg",
  "compare-thumb.jpg",
  "og.jpg",
  "exterior-1.jpg",
  "exterior-2.jpg",
  "exterior-3.jpg",
  "interior-1.jpg",
  "charging-port.jpg",
];

const slugArg = process.argv.find((a) => a.startsWith("--slug="))?.split("=")[1]
  || (process.argv.includes("--slug")
    ? process.argv[process.argv.indexOf("--slug") + 1]
    : null);

const slugs = slugArg ? [slugArg] : manifest.slugs;
const packagesRoot = path.join(tier1Root, "media-packages");

if (!fs.existsSync(packagesRoot)) {
  fs.mkdirSync(packagesRoot, { recursive: true });
}

const manifestMd = (slug) => `# Media package: ${slug}

Upload optimized files to CDN: \`https://cdn.evsavari.com/catalog/${slug}/\`

## Required files

${REQUIRED_FILES.map((f) => `- [ ] ${f}`).join("\n")}

## Workflow

1. Place OEM raw files in \`_source/\`
2. Optimize per media-operations/image-optimization.md
3. Copy finals into this folder (filenames exact)
4. Sync to CDN
5. Run: \`node media-operations/verify-cdn-media.mjs --slug ${slug}\`
`;

for (const slug of slugs) {
  if (!manifest.slugs.includes(slug)) {
    console.error(`Unknown slug: ${slug}`);
    process.exit(1);
  }

  const dir = path.join(packagesRoot, slug);
  const sourceDir = path.join(dir, "_source");

  fs.mkdirSync(sourceDir, { recursive: true });
  fs.writeFileSync(path.join(dir, "MANIFEST.md"), manifestMd(slug), "utf8");

  console.log(`Prepared ${dir}`);
}

console.log(`Done — ${slugs.length} package(s) under media-packages/`);
