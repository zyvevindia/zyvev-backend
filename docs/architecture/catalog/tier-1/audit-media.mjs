/**
 * Tier-1 media mapping audit.
 * Run: node docs/architecture/catalog/tier-1/audit-media.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const variantsDir = path.join(__dirname, "variants");
const manifest = JSON.parse(
  fs.readFileSync(path.join(__dirname, "manifest.json"), "utf8")
);

const UNSPLASH = "unsplash.com";
const PLACEHOLDER_PATTERNS = [
  /placeholder/i,
  /picsum/i,
  /via\.placeholder/i,
];

const heroByUrl = new Map();
const issues = [];

function checkUrl(slug, field, url) {
  if (!url || typeof url !== "string") {
    issues.push({ slug, severity: "error", field, message: "missing URL" });
    return;
  }
  if (url.includes(UNSPLASH)) {
    issues.push({
      slug,
      severity: "error",
      field,
      message: "Unsplash placeholder — not vehicle-specific",
    });
  }
  for (const pat of PLACEHOLDER_PATTERNS) {
    if (pat.test(url)) {
      issues.push({
        slug,
        severity: "warn",
        field,
        message: "generic placeholder pattern in URL",
      });
    }
  }
  if (url.includes("cdn.evsavari.com")) {
    issues.push({
      slug,
      severity: "error",
      field,
      message: "legacy cdn.evsavari.com placeholder — use Cloudinary",
    });
  }
  if (!url.includes("res.cloudinary.com")) {
    issues.push({
      slug,
      severity: "warn",
      field,
      message: "URL not on Cloudinary delivery",
    });
  }
  const familyOrVariant =
    url.includes(`/families/`) || url.includes(`/variants/${slug}/`);
  if (
    url.includes("res.cloudinary.com") &&
    !familyOrVariant &&
    !url.includes("/_fallbacks/")
  ) {
    issues.push({
      slug,
      severity: "warn",
      field,
      message: "Cloudinary path not under families/ or variants/ slug scope",
    });
  }
}

for (const slug of manifest.slugs) {
  const filePath = path.join(variantsDir, `${slug}.json`);
  const record = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const media = record.media || {};

  const fields = [
    "heroImage",
    "listingThumbnail",
    "compareThumbnail",
    "ogImage",
  ];

  for (const field of fields) {
    if (media[field]) {
      checkUrl(slug, field, media[field]);
      const key = media[field];
      if (!heroByUrl.has(key)) heroByUrl.set(key, []);
      heroByUrl.get(key).push(`${slug}:${field}`);
    }
  }

  if (!media.listingThumbnail) {
    issues.push({
      slug,
      severity: "warn",
      field: "listingThumbnail",
      message: "missing — will alias hero at runtime",
    });
  }

  const gallery = media.gallery || [];
  if (gallery.length < 2) {
    issues.push({
      slug,
      severity: "warn",
      field: "gallery",
      message: "fewer than 2 gallery images",
    });
  }

  const dupGallery = new Set(gallery);
  if (dupGallery.size !== gallery.length) {
    issues.push({
      slug,
      severity: "error",
      field: "gallery",
      message: "duplicate gallery URLs",
    });
  }
}

for (const [url, users] of heroByUrl) {
  if (users.length > 1 && url.includes("/hero.jpg")) {
    const sharedFamily = url.includes("/families/");
    issues.push({
      slug: users.join(", "),
      severity: sharedFamily ? "info" : "error",
      field: "heroImage",
      message: sharedFamily
        ? `shared family hero (expected): ${url}`
        : `duplicate hero URL across variants: ${url}`,
    });
  }
}

const errors = issues.filter((i) => i.severity === "error");
const warns = issues.filter((i) => i.severity === "warn");
const infos = issues.filter((i) => i.severity === "info");

console.log(`\nTier-1 media audit — ${manifest.slugs.length} variants\n`);
console.log(
  `Errors: ${errors.length}  Warnings: ${warns.length}  Info: ${infos.length}\n`
);

for (const item of issues) {
  console.log(
    `[${item.severity.toUpperCase()}] ${item.slug} — ${item.field}: ${item.message}`
  );
}

if (errors.length) {
  process.exit(1);
}

console.log("\nNo blocking media mapping errors.");
