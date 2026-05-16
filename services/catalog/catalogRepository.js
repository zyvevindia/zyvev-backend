const EvMasterVariant = require("../../models/EvMasterVariant");
const EvBrand = require("../../models/EvBrand");
const EvModel = require("../../models/EvModel");
const Car = require("../../models/Car");

const PUBLISHED = "published";
const PREVIEW_STATUSES = ["draft", "review", "published"];

function statusFilter(preview) {
  if (preview) {
    return { "governance.status": { $in: PREVIEW_STATUSES } };
  }
  return { "governance.status": PUBLISHED };
}

async function findPublishedVariants(filter = {}, options = {}) {
  const { preview = false, sort = { "pricing.exShowroom": 1 }, limit, skip } =
    options;

  let q = EvMasterVariant.find({
    ...filter,
    ...statusFilter(preview),
  }).sort(sort);

  if (skip) q = q.skip(skip);
  if (limit) q = q.limit(limit);

  return q.lean();
}

async function findVariantBySlug(slug, preview = false) {
  return EvMasterVariant.findOne({
    "identity.slug": slug.toLowerCase(),
    ...statusFilter(preview),
  }).lean();
}

async function findVariantsBySlugs(slugs, preview = false) {
  const normalized = slugs.map((s) => s.toLowerCase().trim()).filter(Boolean);
  return EvMasterVariant.find({
    "identity.slug": { $in: normalized },
    ...statusFilter(preview),
  }).lean();
}

async function findVariantById(id, preview = false) {
  return EvMasterVariant.findOne({
    _id: id,
    ...statusFilter(preview),
  }).lean();
}

async function countPublishedVariants(filter = {}, preview = false) {
  return EvMasterVariant.countDocuments({
    ...filter,
    ...statusFilter(preview),
  });
}

async function findLegacyCatalogCars(filter = {}, sort = { createdAt: -1 }) {
  const catalogFilter = {
    $or: [{ dealer: null }, { dealer: { $exists: false } }],
  };

  return Car.find({ $and: [catalogFilter, filter] })
    .sort(sort)
    .lean();
}

async function findLegacyCarBySlug(slug) {
  const car = await Car.findOne({ slug }).lean();
  if (!car || car.dealer) return null;
  return car;
}

async function findLegacyCarById(id) {
  const car = await Car.findById(id).lean();
  if (!car || car.dealer) return null;
  return car;
}

async function listBrands() {
  return EvBrand.find({ status: "active" }).sort({ name: 1 }).lean();
}

async function listModels(brandSlug) {
  const filter = brandSlug
    ? { brandSlug: brandSlug.toLowerCase() }
    : {};
  return EvModel.find(filter).sort({ name: 1 }).lean();
}

async function upsertBrand({ name, slug }) {
  return EvBrand.findOneAndUpdate(
    { slug },
    { name, slug, status: "active" },
    { upsert: true, new: true }
  );
}

async function upsertModel({ brandSlug, name, slug, bodyType, segment, launchStatus, defaultHeroImage }) {
  return EvModel.findOneAndUpdate(
    { brandSlug, slug },
    {
      brandSlug,
      name,
      slug,
      bodyType,
      segment,
      launchStatus,
      defaultHeroImage,
    },
    { upsert: true, new: true }
  );
}

async function upsertVariantBySlug(slug, payload) {
  return EvMasterVariant.findOneAndUpdate(
    { "identity.slug": slug },
    { $set: payload, $inc: { "governance.version": 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function slugExists(slug, excludeId = null) {
  const filter = { "identity.slug": slug.toLowerCase() };
  if (excludeId) filter._id = { $ne: excludeId };
  const n = await EvMasterVariant.countDocuments(filter);
  return n > 0;
}

module.exports = {
  findPublishedVariants,
  findVariantBySlug,
  findVariantsBySlugs,
  findVariantById,
  countPublishedVariants,
  findLegacyCatalogCars,
  findLegacyCarBySlug,
  findLegacyCarById,
  listBrands,
  listModels,
  upsertBrand,
  upsertModel,
  upsertVariantBySlug,
  slugExists,
  PUBLISHED,
};
