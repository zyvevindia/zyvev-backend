/**
 * SEO page type taxonomy — deterministic scoring dimensions per category.
 */

/** @typedef {Record<string, number>} RecommendationScoreMap */

/**
 * @typedef {object} SeoPageTypeDef
 * @property {string} id
 * @property {string} category — budget | usage | ownership | charging | compare
 * @property {string} primaryScoreKey
 * @property {string[]} secondaryScoreKeys
 * @property {{ maxExShowroom?: number, minExShowroom?: number, launchStatus?: string }} [filters]
 * @property {number} [maxResults]
 */

const PAGE_TYPES = {
  budget_under_10: {
    id: "budget_under_10",
    category: "budget",
    primaryScoreKey: "budgetOwnership",
    secondaryScoreKeys: ["compareValue", "dailyCommute"],
    filters: { maxExShowroom: 1000000, launchStatus: "on-sale" },
    maxResults: 6,
  },
  budget_under_20: {
    id: "budget_under_20",
    category: "budget",
    primaryScoreKey: "budgetOwnership",
    secondaryScoreKeys: ["compareValue", "familyUsage"],
    filters: { maxExShowroom: 2000000, launchStatus: "on-sale" },
    maxResults: 8,
  },
  city_driving: {
    id: "city_driving",
    category: "usage",
    primaryScoreKey: "cityDriving",
    secondaryScoreKeys: ["dailyCommute", "officeCommute"],
    filters: { launchStatus: "on-sale" },
    maxResults: 6,
  },
  family: {
    id: "family",
    category: "usage",
    primaryScoreKey: "familyUsage",
    secondaryScoreKeys: ["cityDriving", "compareValue"],
    filters: { launchStatus: "on-sale" },
    maxResults: 6,
  },
  office_commute: {
    id: "office_commute",
    category: "usage",
    primaryScoreKey: "officeCommute",
    secondaryScoreKeys: ["cityDriving", "dailyCommute"],
    filters: { launchStatus: "on-sale" },
    maxResults: 6,
  },
  low_maintenance: {
    id: "low_maintenance",
    category: "ownership",
    primaryScoreKey: "lowMaintenance",
    secondaryScoreKeys: ["budgetOwnership", "compareValue"],
    filters: { launchStatus: "on-sale" },
    maxResults: 6,
  },
  first_time_buyer: {
    id: "first_time_buyer",
    category: "ownership",
    primaryScoreKey: "firstTimeBuyer",
    secondaryScoreKeys: ["apartmentCharging", "cityDriving"],
    filters: { launchStatus: "on-sale" },
    maxResults: 6,
  },
  apartment_living: {
    id: "apartment_living",
    category: "ownership",
    primaryScoreKey: "apartmentCharging",
    secondaryScoreKeys: ["homeCharging", "firstTimeBuyer"],
    filters: { launchStatus: "on-sale" },
    maxResults: 6,
  },
  home_charging: {
    id: "home_charging",
    category: "charging",
    primaryScoreKey: "homeCharging",
    secondaryScoreKeys: ["apartmentCharging", "dailyCommute"],
    filters: { launchStatus: "on-sale" },
    maxResults: 6,
  },
  daily_commute: {
    id: "daily_commute",
    category: "charging",
    primaryScoreKey: "dailyCommute",
    secondaryScoreKeys: ["cityDriving", "officeCommute"],
    filters: { launchStatus: "on-sale" },
    maxResults: 6,
  },
  head_to_head: {
    id: "head_to_head",
    category: "compare",
    primaryScoreKey: "compareValue",
    secondaryScoreKeys: [],
    filters: { launchStatus: "on-sale" },
    maxResults: 2,
  },
  highway_driving: {
    id: "highway_driving",
    category: "usage",
    primaryScoreKey: "highwayDriving",
    secondaryScoreKeys: ["dailyCommute", "compareValue"],
    filters: { launchStatus: "on-sale" },
    maxResults: 6,
  },
  lowest_charging_stress: {
    id: "lowest_charging_stress",
    category: "charging",
    primaryScoreKey: "lowChargingStress",
    secondaryScoreKeys: ["homeCharging", "apartmentCharging"],
    filters: { launchStatus: "on-sale" },
    maxResults: 6,
  },
  easiest_first_time: {
    id: "easiest_first_time",
    category: "ownership",
    primaryScoreKey: "firstTimeBuyer",
    secondaryScoreKeys: ["lowChargingStress", "cityDriving"],
    filters: { launchStatus: "on-sale" },
    maxResults: 6,
  },
  apartment_parking: {
    id: "apartment_parking",
    category: "ownership",
    primaryScoreKey: "apartmentCharging",
    secondaryScoreKeys: ["homeCharging", "lowChargingStress"],
    filters: { launchStatus: "on-sale" },
    maxResults: 6,
  },
  best_city_india: {
    id: "best_city_india",
    category: "usage",
    primaryScoreKey: "cityDriving",
    secondaryScoreKeys: ["dailyCommute", "lowChargingStress"],
    filters: { launchStatus: "on-sale" },
    maxResults: 8,
  },
};

function getPageType(typeId) {
  return PAGE_TYPES[typeId] || null;
}

module.exports = {
  PAGE_TYPES,
  getPageType,
};
