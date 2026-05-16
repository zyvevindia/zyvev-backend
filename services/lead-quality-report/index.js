/**
 * Aggregated lead-quality report — no PII in output.
 */

const { getAllSeoSlugs } = require("../seo-pages/registry");

const SEO_SLUGS = new Set(getAllSeoSlugs());

function isSeoSourcePage(sourcePage) {
  if (!sourcePage) return false;
  const match = String(sourcePage).match(/\/cars\/([^/?]+)/);
  if (!match) return false;
  return SEO_SLUGS.has(match[1]);
}

function isCompareSource(sourcePage) {
  return String(sourcePage || "").toLowerCase() === "compare";
}

function hasCompareContext(lead) {
  const compared =
    lead.buyerIntentContext?.leadContext?.comparedVehicles || [];
  return compared.length >= 2;
}

function hadOwnershipEngagement(lead) {
  const concerns =
    lead.buyerIntentContext?.leadContext?.buyerConcerns || [];
  return (
    concerns.includes("ownership_uncertainty") ||
    lead.buyerIntentContext?.leadContext?.ownershipPriority !==
      "balanced"
  );
}

/**
 * @param {object[]} leads — lean documents, no name/phone in report
 */
function buildLeadQualityReport(leads, options = {}) {
  const sinceDays = options.sinceDays || 7;

  const bySource = {};
  let seoOriginated = 0;
  let compareAssisted = 0;
  let withIntentContext = 0;
  let withOwnershipSignal = 0;
  let withSourcePage = 0;

  for (const lead of leads) {
    const src = (lead.sourcePage || "unknown").trim() || "unknown";
    bySource[src] = (bySource[src] || 0) + 1;

    if (lead.sourcePage) withSourcePage += 1;
    if (isSeoSourcePage(lead.sourcePage)) seoOriginated += 1;
    if (isCompareSource(lead.sourcePage) || hasCompareContext(lead)) {
      compareAssisted += 1;
    }
    if (lead.buyerIntentContext?.leadContext) withIntentContext += 1;
    if (hadOwnershipEngagement(lead)) withOwnershipSignal += 1;
  }

  const total = leads.length;
  const completionRateNote =
    "Lead submission rate requires behavioral event correlation — use report-behavioral-trends.js";

  const sourceDistribution = Object.entries(bySource)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([sourcePage, count]) => ({
      sourcePage,
      count,
      share: total ? Math.round((count / total) * 1000) / 10 : 0,
    }));

  return {
    generatedAt: new Date().toISOString(),
    periodDays: sinceDays,
    totalLeads: total,
    aggregatedOnly: true,
    piiExcluded: true,
    metrics: {
      withSourcePage,
      seoOriginatedLeads: seoOriginated,
      compareAssistedLeads: compareAssisted,
      withBuyerIntentContext: withIntentContext,
      withOwnershipEngagementSignal: withOwnershipSignal,
      sourcePageCoverage:
        total > 0
          ? Math.round((withSourcePage / total) * 1000) / 10
          : 0,
    },
    sourceDistribution,
    completionRateNote,
    qualityHints: deriveQualityHints({
      total,
      seoOriginated,
      compareAssisted,
      withIntentContext,
    }),
  };
}

function deriveQualityHints(metrics) {
  const hints = [];
  if (metrics.total === 0) {
    hints.push("no_leads_in_period — verify forms and API");
  }
  if (metrics.total > 0 && metrics.withIntentContext / metrics.total < 0.2) {
    hints.push(
      "low_intent_context_attach_rate — enable BEHAVIORAL_INTELLIGENCE_ENABLED on submit"
    );
  }
  if (metrics.seoOriginated > 0) {
    hints.push("seo_channel_active — review top SEO source pages in GSC");
  }
  if (metrics.compareAssisted > metrics.total * 0.3) {
    hints.push("compare_heavy_leads — ensure compare page CTA clarity");
  }
  return hints;
}

async function buildLeadQualityReportFromDb(sinceDays = 7) {
  const mongoose = require("mongoose");
  const Lead = require("../../models/Lead");
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);

  const leads = await Lead.find({ createdAt: { $gte: since } })
    .select(
      "sourcePage vehicleName createdAt buyerIntentContext anonymousSessionId"
    )
    .lean();

  return buildLeadQualityReport(leads, { sinceDays });
}

module.exports = {
  buildLeadQualityReport,
  buildLeadQualityReportFromDb,
  isSeoSourcePage,
  isCompareSource,
};
