const {
  getRegistryEntry,
  listRegistryEntries,
  getAllSeoSlugs,
  isSeoPageSlug,
  resolveRegistrySlug,
} = require("./registry");

const { loadTier1Variants } = require("./loadCatalog");

const { generateSeoPage } = require("../seo-generators/generateSeoPage");

const { getPageType } = require("../seo-intelligence/pageTypes");

function listSeoPages() {
  return listRegistryEntries().map((entry) => {
    const pageType = getPageType(entry.pageTypeId);
    return {
      slug: entry.slug,
      pageTypeId: entry.pageTypeId,
      canonicalPath: `/cars/${entry.slug}`,
      category: pageType?.category || entry.pageTypeId,
    };
  });
}

function buildSeoPage(slug, options = {}) {
  const entry = getRegistryEntry(slug);
  if (!entry) return null;

  const { variants } = loadTier1Variants(options.tier1Root);
  return generateSeoPage(entry, variants, options);
}

function buildAllSeoPages(options = {}) {
  const pages = [];
  for (const entry of listRegistryEntries()) {
    const page = generateSeoPage(
      entry,
      loadTier1Variants(options.tier1Root).variants,
      options
    );
    if (page) pages.push(page);
  }
  return pages;
}

module.exports = {
  listSeoPages,
  buildSeoPage,
  buildAllSeoPages,
  getRegistryEntry,
  getAllSeoSlugs,
  isSeoPageSlug,
  resolveRegistrySlug,
};
