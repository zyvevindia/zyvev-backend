/**
 * Writes production sitemaps + robots.txt to frontend public/.
 * Usage: node scripts/build-sitemaps.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { generateSitemapBundle } = require("../services/sitemap-generation");
const { buildRobotsTxt } = require("../services/sitemap-generation/robots");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(
  __dirname,
  "../../zyvev-frontend/public"
);

const siteOrigin =
  process.env.SITE_ORIGIN || "https://evsavari.com";

let files;
let stats;
try {
  const bundle = generateSitemapBundle({ siteOrigin });
  files = bundle.files;
  stats = bundle.stats;
} catch (err) {
  console.error(
    JSON.stringify({
      level: "error",
      category: "sitemap",
      event: "generation_failed",
      message: err.message,
    })
  );
  process.exit(1);
}

for (const [relPath, content] of Object.entries(files)) {
  const outPath = path.join(publicDir, relPath);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, content, "utf8");
  console.log(`Wrote ${relPath}`);
}

const robotsPath = path.join(publicDir, "robots.txt");
fs.writeFileSync(
  robotsPath,
  buildRobotsTxt(siteOrigin),
  "utf8"
);
console.log("Wrote robots.txt");

const manifestPath = path.join(publicDir, "sitemap-manifest.json");
fs.writeFileSync(
  manifestPath,
  JSON.stringify(stats, null, 2) + "\n",
  "utf8"
);
console.log("Wrote sitemap-manifest.json");
console.log(JSON.stringify(stats, null, 2));
