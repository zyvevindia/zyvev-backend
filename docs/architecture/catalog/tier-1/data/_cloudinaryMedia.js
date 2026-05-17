/**
 * Cloudinary catalog URL builders (Tier-1 data layer).
 */

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "evsavari";
const CLOUDINARY_BASE = `https://res.cloudinary.com/${CLOUD_NAME}`;

export const PRODUCTION_FAMILY_SLUGS = [
  "tata-nexon-ev",
  "tata-punch-ev",
  "tata-curvv-ev",
  "mg-comet-ev",
  "mg-zs-ev",
  "mahindra-be-6",
];

function buildTransform({ width, format = "auto", quality = "auto" } = {}) {
  const parts = [
    `f_${format}`,
    `q_${quality}`,
    width ? `w_${width}` : null,
    "c_limit",
  ].filter(Boolean);
  return parts.join(",");
}

export function cloudinaryDeliveryUrl(publicId, options = {}) {
  const id = String(publicId || "").replace(/^\/+/, "");
  const transform = buildTransform(options);
  return `${CLOUDINARY_BASE}/image/upload/${transform}/${id}`;
}

export function familyCatalogPublicId(familySlug, filename) {
  return `evsavari/catalog/families/${familySlug}/${filename}`;
}

export function familyCatalogUrl(familySlug, filename) {
  return cloudinaryDeliveryUrl(familyCatalogPublicId(familySlug, filename));
}

export function variantCatalogPublicId(variantSlug, filename) {
  return `evsavari/catalog/variants/${variantSlug}/${filename}`;
}

export function variantCatalogUrl(variantSlug, filename) {
  return cloudinaryDeliveryUrl(variantCatalogPublicId(variantSlug, filename));
}

export function resolveFamilySlugFromVariantSlug(variantSlug = "") {
  const slug = String(variantSlug || "").trim().toLowerCase();
  if (!slug) return null;
  if (PRODUCTION_FAMILY_SLUGS.includes(slug)) return slug;
  const sorted = [...PRODUCTION_FAMILY_SLUGS].sort((a, b) => b.length - a.length);
  for (const family of sorted) {
    if (slug === family || slug.startsWith(`${family}-`)) {
      return family;
    }
  }
  return null;
}

function familyMediaBlock(familySlug) {
  return {
    heroImage: familyCatalogUrl(familySlug, "hero.jpg"),
    listingThumbnail: familyCatalogUrl(familySlug, "listing-thumb.jpg"),
    compareThumbnail: familyCatalogUrl(familySlug, "compare-thumb.jpg"),
    ogImage: familyCatalogUrl(familySlug, "og.jpg"),
    gallery: [
      familyCatalogUrl(familySlug, "exterior-1.jpg"),
      familyCatalogUrl(familySlug, "exterior-2.jpg"),
      familyCatalogUrl(familySlug, "exterior-3.jpg"),
    ],
    interior: [familyCatalogUrl(familySlug, "interior-1.jpg")],
    charging: [familyCatalogUrl(familySlug, "charging-port.jpg")],
  };
}

export function getProductionFamilyMedia(familySlug) {
  const key = resolveFamilySlugFromVariantSlug(familySlug) || familySlug;
  if (!PRODUCTION_FAMILY_SLUGS.includes(key)) return null;
  return familyMediaBlock(key);
}

function assetEntry(url, meta) {
  return {
    key: meta.key,
    url,
    filename: meta.filename,
    role: meta.role,
    category: meta.category,
    angle: meta.angle || null,
    variant: meta.variant || "light",
    tags: meta.tags || [],
    attribution: {
      sourceType: meta.sourceType || "oem_press",
      usage: "editorial_marketplace",
      rightsNote:
        "OEM press / brochure — verify brand media terms before publish",
      capturedAt: null,
      ...meta.attribution,
    },
  };
}

export function mediaAssetRegistry(slug) {
  const family = resolveFamilySlugFromVariantSlug(slug);
  const useFamily = family && PRODUCTION_FAMILY_SLUGS.includes(family);
  const hero = useFamily
    ? familyCatalogUrl(family, "hero.jpg")
    : variantCatalogUrl(slug, "hero.jpg");
  const listing = useFamily
    ? familyCatalogUrl(family, "listing-thumb.jpg")
    : variantCatalogUrl(slug, "listing-thumb.jpg");
  const compare = useFamily
    ? familyCatalogUrl(family, "compare-thumb.jpg")
    : variantCatalogUrl(slug, "compare-thumb.jpg");
  const og = useFamily
    ? familyCatalogUrl(family, "og.jpg")
    : variantCatalogUrl(slug, "og.jpg");

  const galleryBase = (file, meta) =>
    assetEntry(
      useFamily ? familyCatalogUrl(family, file) : variantCatalogUrl(slug, file),
      meta
    );

  return [
    assetEntry(hero, {
      key: "hero",
      filename: "hero.jpg",
      role: "hero",
      category: "exterior",
      angle: "front-three-quarter",
      tags: ["exterior", "hero"],
    }),
    assetEntry(listing, {
      key: "listing_thumb",
      filename: "listing-thumb.jpg",
      role: "listing",
      category: "exterior",
      angle: "front-three-quarter",
      tags: ["listing", "exterior"],
    }),
    assetEntry(compare, {
      key: "compare_thumb",
      filename: "compare-thumb.jpg",
      role: "compare",
      category: "exterior",
      angle: "side-profile",
      tags: ["compare", "exterior"],
    }),
    assetEntry(og, {
      key: "og",
      filename: "og.jpg",
      role: "social",
      category: "exterior",
      angle: "front-three-quarter",
      tags: ["og", "social"],
    }),
    galleryBase("exterior-1.jpg", {
      key: "exterior_1",
      filename: "exterior-1.jpg",
      role: "gallery",
      category: "exterior",
      angle: "front-three-quarter",
      tags: ["exterior", "gallery"],
    }),
    galleryBase("exterior-2.jpg", {
      key: "exterior_2",
      filename: "exterior-2.jpg",
      role: "gallery",
      category: "exterior",
      angle: "rear-three-quarter",
      tags: ["exterior", "gallery"],
    }),
    galleryBase("exterior-3.jpg", {
      key: "exterior_3",
      filename: "exterior-3.jpg",
      role: "gallery",
      category: "exterior",
      angle: "side-profile",
      tags: ["exterior", "gallery"],
    }),
    galleryBase("interior-1.jpg", {
      key: "interior_1",
      filename: "interior-1.jpg",
      role: "gallery",
      category: "interior",
      angle: "dashboard",
      tags: ["interior", "gallery"],
    }),
    galleryBase("charging-port.jpg", {
      key: "charging_port",
      filename: "charging-port.jpg",
      role: "gallery",
      category: "charging",
      angle: "charging-port",
      tags: ["charging", "ccs2", "gallery"],
    }),
  ];
}
