/**
 * Writes static SEO page JSON for frontend fallback (Vercel / CDN).
 * Usage: node scripts/build-seo-pages-json.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { buildAllSeoPages } = require("../services/seo-pages");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(
  __dirname,
  "../../zyvev-frontend/public/seo-data"
);

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const pages = buildAllSeoPages();
const index = [];

for (const { seoPage } of pages) {
  const filePath = path.join(outDir, `${seoPage.slug}.json`);
  fs.writeFileSync(
    filePath,
    JSON.stringify({ seoPage }, null, 2) + "\n",
    "utf8"
  );
  index.push({
    slug: seoPage.slug,
    title: seoPage.title,
    canonicalPath: seoPage.canonicalPath,
    category: seoPage.category,
  });
}

fs.writeFileSync(
  path.join(outDir, "index.json"),
  JSON.stringify({ pages: index, count: index.length }, null, 2) + "\n",
  "utf8"
);

console.log(`Wrote ${pages.length} SEO pages to ${outDir}`);
