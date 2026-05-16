/**
 * Governance-safe ranking — composite scores, confidence tiers, no unsupported superlatives.
 */

const { computeRecommendationScores } = require("../seo-intelligence/scoring");
const { getPageType } = require("../seo-intelligence/pageTypes");
const {
  buildExplanation,
  buildTradeoffSummary,
} = require("./templates");
const { variantToSummary } = require("../seo-pages/loadCatalog");

function passesFilters(variant, filters = {}) {
  const price = variant.pricing?.exShowroom ?? 0;
  const status = variant.identity?.launchStatus;

  if (filters.launchStatus && status !== filters.launchStatus) {
    return false;
  }
  if (
    filters.maxExShowroom != null &&
    price > filters.maxExShowroom
  ) {
    return false;
  }
  if (
    filters.minExShowroom != null &&
    price < filters.minExShowroom
  ) {
    return false;
  }
  return true;
}

function compositeScore(scores, pageType) {
  const primary = scores[pageType.primaryScoreKey] ?? 0;
  let secondarySum = 0;
  let secondaryCount = 0;

  for (const key of pageType.secondaryScoreKeys || []) {
    if (scores[key] != null) {
      secondarySum += scores[key];
      secondaryCount += 1;
    }
  }

  const secondaryAvg =
    secondaryCount > 0 ? secondarySum / secondaryCount : 0;

  return Math.round(primary * 0.7 + secondaryAvg * 0.3);
}

function confidenceTier(score) {
  if (score >= 82) return "high";
  if (score >= 72) return "medium";
  return "low";
}

/**
 * @param {object[]} variants
 * @param {object} registryEntry
 * @returns {{ ranked: object[], recommendationLogic: object }}
 */
function rankVariantsForPage(variants, registryEntry) {
  const pageType = getPageType(registryEntry.pageTypeId);
  if (!pageType) {
    return { ranked: [], recommendationLogic: { error: "unknown_page_type" } };
  }

  if (registryEntry.compareSlugs?.length === 2) {
    const bySlug = new Map(
      variants.map((v) => [v.identity.slug, v])
    );
    const pair = registryEntry.compareSlugs
      .map((s) => bySlug.get(s))
      .filter(Boolean);

    const ranked = pair.map((variant, index) => {
      const scores = computeRecommendationScores(variant);
      const score = compositeScore(scores, pageType);
      return formatRankedItem(
        variant,
        index + 1,
        score,
        scores,
        registryEntry,
        pageType
      );
    });

    return {
      ranked,
      recommendationLogic: buildLogic(pageType, registryEntry, pair.length),
    };
  }

  const eligible = variants.filter((v) =>
    passesFilters(v, pageType.filters)
  );

  const scored = eligible.map((variant) => {
    const scores = computeRecommendationScores(variant);
    const score = compositeScore(scores, pageType);
    return { variant, scores, score };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (a.variant.pricing?.exShowroom ?? 0) -
      (b.variant.pricing?.exShowroom ?? 0);
  });

  const max = pageType.maxResults ?? 6;
  const top = scored.slice(0, max);

  const ranked = top.map((item, index) =>
    formatRankedItem(
      item.variant,
      index + 1,
      item.score,
      item.scores,
      registryEntry,
      pageType
    )
  );

  return {
    ranked,
    recommendationLogic: buildLogic(
      pageType,
      registryEntry,
      eligible.length
    ),
  };
}

function buildLogic(pageType, registryEntry, poolSize) {
  return {
    pageTypeId: pageType.id,
    category: pageType.category,
    primaryScoreKey: pageType.primaryScoreKey,
    secondaryScoreKeys: pageType.secondaryScoreKeys,
    filters: pageType.filters,
    compareSlugs: registryEntry.compareSlugs || null,
    candidatePoolSize: poolSize,
    methodology:
      "Deterministic composite of internal recommendation scores (70% primary, 30% secondary average). No manual ranking overrides.",
    tonePolicy: "well_suited_language_only",
  };
}

function formatRankedItem(
  variant,
  rank,
  score,
  scores,
  registryEntry,
  pageType
) {
  const summary = variantToSummary(variant);
  const templateKey = registryEntry.introTemplateKey;

  return {
    rank,
    slug: summary.slug,
    displayName:
      `${variant.identity?.brandSlug || ""} ${variant.identity?.variantName || summary.slug}`
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .replace(/^\s+/, ""),
    exShowroom: summary.exShowroom,
    claimedRangeKm: summary.claimedRangeKm,
    compositeScore: score,
    confidence: confidenceTier(score),
    explanation: buildExplanation(templateKey, score),
    tradeoff: buildTradeoffSummary(variant, pageType.id),
    recommendationScore: scores,
    detailPath: `/cars/${summary.slug}`,
  };
}

module.exports = {
  rankVariantsForPage,
  compositeScore,
  confidenceTier,
  passesFilters,
};
