/**
 * SEO page generation pipeline — single entry for API + audits.
 */

const { getPageType } = require("../seo-intelligence/pageTypes");
const { buildIntro } = require("./templates");
const { rankVariantsForPage } = require("./ranking");
const { generateFaqs } = require("./faqGenerator");
const { SEO_INTELLIGENCE_PUBLIC } = require("../../config/seo");

function generateSeoPage(registryEntry, variants, options = {}) {
  const pageType = getPageType(registryEntry.pageTypeId);
  if (!pageType) return null;

  const { ranked, recommendationLogic } = rankVariantsForPage(
    variants,
    registryEntry
  );

  if (ranked.length === 0 && !options.allowEmpty) {
    return null;
  }

  const slug = registryEntry.slug;
  const canonicalPath = `/cars/${slug}`;
  const siteOrigin =
    options.siteOrigin || "https://evsavari.com";

  const tradeoffs = {
    summary: sanitizeTradeoffBlock(registryEntry, ranked),
    considerations: ranked.map((r) => ({
      slug: r.slug,
      tradeoff: r.tradeoff,
    })),
  };

  const faq = generateFaqs(registryEntry, ranked);

  const seoPage = {
    slug,
    pageTypeId: registryEntry.pageTypeId,
    category: pageType.category,
    title: registryEntry.titleTemplate,
    metaDescription: registryEntry.metaDescriptionTemplate,
    intro: buildIntro(registryEntry.introTemplateKey),
    recommendationLogic,
    rankedVehicles: ranked.map((r) => {
      const item = {
        rank: r.rank,
        slug: r.slug,
        displayName: r.displayName,
        exShowroom: r.exShowroom,
        claimedRangeKm: r.claimedRangeKm,
        compositeScore: r.compositeScore,
        confidence: r.confidence,
        explanation: r.explanation,
        tradeoff: r.tradeoff,
        detailPath: r.detailPath,
      };
      if (options.includeInternalScores || SEO_INTELLIGENCE_PUBLIC) {
        item.recommendationScore = r.recommendationScore;
      }
      return item;
    }),
    tradeoffs,
    faq,
    canonicalPath,
    canonicalUrl: `${siteOrigin}${canonicalPath}`,
    generatedAt: new Date().toISOString(),
    governance: {
      tonePolicy: "editorial_templates_only",
      rankingMethod: recommendationLogic.methodology,
      superlativesAvoided: true,
    },
  };

  return { seoPage };
}

function sanitizeTradeoffBlock(registryEntry, ranked) {
  if (registryEntry.pageTypeId === "head_to_head" && ranked.length === 2) {
    return `Compare ${ranked[0].displayName} and ${ranked[1].displayName} on the dimensions that matter to you — range, charging, space, and on-road budget. Neither is positioned as a universal winner.`;
  }
  if (ranked.length === 0) {
    return "No catalog variants matched the filters for this page at generation time. Check back after catalog updates.";
  }
  return "Every recommendation includes tradeoffs. Higher composite scores indicate better alignment with this page's intent — not a guarantee for every buyer.";
}

module.exports = {
  generateSeoPage,
};
