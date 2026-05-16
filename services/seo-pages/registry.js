/**
 * SEO page registry — deterministic slugs, canonical paths, page type bindings.
 * Keep slugs stable; add aliases only via LEGACY_SEO_SLUG_ALIASES.
 */

const LEGACY_SEO_SLUG_ALIASES = {
  "best-family-electric-cars-india": "best-family-electric-cars",
};

/**
 * @typedef {object} SeoPageRegistryEntry
 * @property {string} slug
 * @property {string} pageTypeId — key in pageTypes.PAGE_TYPES
 * @property {string} titleTemplate
 * @property {string} metaDescriptionTemplate
 * @property {string} introTemplateKey
 * @property {string[]} [compareSlugs] — head-to-head only
 * @property {boolean} [enabled]
 */

/** @type {SeoPageRegistryEntry[]} */
const SEO_PAGE_REGISTRY = [
  {
    slug: "best-evs-under-10-lakh",
    pageTypeId: "budget_under_10",
    titleTemplate:
      "Electric cars well suited under ₹10 lakh (ex-showroom) | EVSavari",
    metaDescriptionTemplate:
      "Data-backed EV picks under ₹10 lakh ex-showroom in India — aligned with city use, ownership cost, and charging practicality.",
    introTemplateKey: "budget_under_10",
    enabled: true,
  },
  {
    slug: "best-evs-under-20-lakh",
    pageTypeId: "budget_under_20",
    titleTemplate:
      "Electric cars well suited under ₹20 lakh (ex-showroom) | EVSavari",
    metaDescriptionTemplate:
      "EV recommendations under ₹20 lakh ex-showroom — ranked by ownership practicality, not hype.",
    introTemplateKey: "budget_under_20",
    enabled: true,
  },
  {
    slug: "best-evs-for-city-driving",
    pageTypeId: "city_driving",
    titleTemplate:
      "EVs well suited for city driving in India | EVSavari",
    metaDescriptionTemplate:
      "City-focused EV picks based on maneuverability, real-world range bands, and commuter fit scores.",
    introTemplateKey: "city_driving",
    enabled: true,
  },
  {
    slug: "best-family-electric-cars",
    pageTypeId: "family",
    titleTemplate:
      "Family electric cars — practical picks for Indian buyers | EVSavari",
    metaDescriptionTemplate:
      "Family-oriented EV recommendations using boot space, rear comfort, and family suitability intelligence.",
    introTemplateKey: "family",
    enabled: true,
  },
  {
    slug: "best-evs-for-office-commute",
    pageTypeId: "office_commute",
    titleTemplate:
      "EVs practical for office commute in India | EVSavari",
    metaDescriptionTemplate:
      "Office commute EV picks — balanced for daily distance, running cost, and ease of use.",
    introTemplateKey: "office_commute",
    enabled: true,
  },
  {
    slug: "lowest-maintenance-electric-cars",
    pageTypeId: "low_maintenance",
    titleTemplate:
      "Lower-maintenance electric cars in India | EVSavari",
    metaDescriptionTemplate:
      "EVs better aligned with lower indicative service and ownership friction — with clear tradeoffs.",
    introTemplateKey: "low_maintenance",
    enabled: true,
  },
  {
    slug: "best-evs-for-first-time-buyers",
    pageTypeId: "first_time_buyer",
    titleTemplate:
      "EVs well suited for first-time electric car buyers | EVSavari",
    metaDescriptionTemplate:
      "First EV buyer guidance with anxiety-reduction and ease-of-ownership signals from catalog intelligence.",
    introTemplateKey: "first_time_buyer",
    enabled: true,
  },
  {
    slug: "best-evs-for-apartment-living",
    pageTypeId: "apartment_living",
    titleTemplate:
      "EVs practical for apartment living & home charging | EVSavari",
    metaDescriptionTemplate:
      "Apartment-friendly EV picks — home AC charging support, wallbox practicality, and charging ecosystem notes.",
    introTemplateKey: "apartment_living",
    enabled: true,
  },
  {
    slug: "best-evs-for-home-charging",
    pageTypeId: "home_charging",
    titleTemplate:
      "EVs well suited for home charging in India | EVSavari",
    metaDescriptionTemplate:
      "Home charging–aligned EV recommendations using AC kW, wallbox readiness, and charging ecosystem data.",
    introTemplateKey: "home_charging",
    enabled: true,
  },
  {
    slug: "best-evs-for-daily-commute",
    pageTypeId: "daily_commute",
    titleTemplate:
      "EVs practical for daily commute in India | EVSavari",
    metaDescriptionTemplate:
      "Daily commute EV picks — city fit, real-world range bands, and value alignment.",
    introTemplateKey: "daily_commute",
    enabled: true,
  },
  {
    slug: "nexon-ev-vs-mg-zs-ev",
    pageTypeId: "head_to_head",
    titleTemplate:
      "Tata Nexon EV vs MG ZS EV — decision comparison | EVSavari",
    metaDescriptionTemplate:
      "Side-by-side Nexon EV and MG ZS EV comparison using catalog intelligence — tradeoffs, not rankings hype.",
    introTemplateKey: "head_to_head",
    compareSlugs: [
      "tata-nexon-ev-empowered-lr",
      "mg-zs-ev-excite",
    ],
    enabled: true,
  },
  {
    slug: "comet-ev-vs-tiago-ev",
    pageTypeId: "head_to_head",
    titleTemplate:
      "MG Comet EV vs Tata Tiago EV — decision comparison | EVSavari",
    metaDescriptionTemplate:
      "Comet EV vs Tiago EV — compact EV decision page with explainable strengths and tradeoffs.",
    introTemplateKey: "head_to_head",
    compareSlugs: ["mg-comet-ev-play", "tata-tiago-ev-xt"],
    enabled: true,
  },
  {
    slug: "best-evs-for-highway-driving",
    pageTypeId: "highway_driving",
    titleTemplate:
      "EVs well suited for highway driving in India | EVSavari",
    metaDescriptionTemplate:
      "Highway-practical EV picks using range realism, fast-charge practicality, and scenario alignment — not ARAI hype.",
    introTemplateKey: "highway_driving",
    enabled: true,
  },
  {
    slug: "lowest-charging-stress-evs",
    pageTypeId: "lowest_charging_stress",
    titleTemplate:
      "Lower charging-stress electric cars in India | EVSavari",
    metaDescriptionTemplate:
      "EVs better aligned with lower charging anxiety — home AC, apartment access, and practical charging notes.",
    introTemplateKey: "lowest_charging_stress",
    enabled: true,
  },
  {
    slug: "easiest-evs-for-first-time-buyers",
    pageTypeId: "easiest_first_time",
    titleTemplate:
      "Easiest EVs for first-time electric car buyers | EVSavari",
    metaDescriptionTemplate:
      "First EV picks emphasizing ease of ownership, charging clarity, and lower lifestyle friction.",
    introTemplateKey: "easiest_first_time",
    enabled: true,
  },
  {
    slug: "best-evs-for-apartment-parking",
    pageTypeId: "apartment_parking",
    titleTemplate:
      "EVs practical for apartment parking & AC charging | EVSavari",
    metaDescriptionTemplate:
      "Apartment parking picks — overnight AC suitability, wallbox practicality, and shared-parking considerations.",
    introTemplateKey: "apartment_parking",
    enabled: true,
  },
  {
    slug: "best-city-electric-cars-india",
    pageTypeId: "best_city_india",
    titleTemplate:
      "Best city electric cars in India — practical picks | EVSavari",
    metaDescriptionTemplate:
      "City EV recommendations using maneuverability, commuter fit, and conservative range planning bands.",
    introTemplateKey: "best_city_india",
    enabled: true,
  },
];

function resolveRegistrySlug(rawSlug) {
  const normalized = String(rawSlug || "")
    .trim()
    .toLowerCase();
  return LEGACY_SEO_SLUG_ALIASES[normalized] || normalized;
}

function getRegistryEntry(slug) {
  const resolved = resolveRegistrySlug(slug);
  return (
    SEO_PAGE_REGISTRY.find(
      (e) => e.slug === resolved && e.enabled !== false
    ) || null
  );
}

function listRegistryEntries() {
  return SEO_PAGE_REGISTRY.filter((e) => e.enabled !== false);
}

function getAllSeoSlugs() {
  return listRegistryEntries().map((e) => e.slug);
}

function isSeoPageSlug(slug) {
  return Boolean(getRegistryEntry(slug));
}

function getVehicleSlugDenylist() {
  return new Set(getAllSeoSlugs());
}

module.exports = {
  SEO_PAGE_REGISTRY,
  LEGACY_SEO_SLUG_ALIASES,
  getRegistryEntry,
  listRegistryEntries,
  getAllSeoSlugs,
  isSeoPageSlug,
  getVehicleSlugDenylist,
  resolveRegistrySlug,
};
