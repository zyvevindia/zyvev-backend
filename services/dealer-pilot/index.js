/**
 * Dealer pilot summaries — admin/internal, aggregated, no behavioral overexposure.
 */

const {
  buildLeadQualityReport,
  isSeoSourcePage,
  isCompareSource,
} = require("../lead-quality-report");
const { buildDealerSafeLeadSummary } = require("../buyer-intelligence/dealerSafeSummary");

function hadOwnershipSignal(lead) {
  const concerns =
    lead.buyerIntentContext?.leadContext?.buyerConcerns || [];
  return (
    concerns.includes("ownership_uncertainty") ||
    lead.buyerIntentContext?.leadContext?.ownershipPriority !== "balanced"
  );
}

function buildDealerPilotSummary(leads, options = {}) {
  const sinceDays = options.sinceDays || 7;
  const aggregated = buildLeadQualityReport(leads, { sinceDays });

  const compareContextLeads = leads.filter(
    (l) =>
      isCompareSource(l.sourcePage) ||
      (l.buyerIntentContext?.leadContext?.comparedVehicles || []).length >= 2
  ).length;

  const ownershipIntentLeads = leads.filter(hadOwnershipSignal).length;

  const sourcePageRollup = {};
  for (const lead of leads) {
    const key = (lead.sourcePage || "unknown").slice(0, 80);
    sourcePageRollup[key] = (sourcePageRollup[key] || 0) + 1;
  }

  const sampleSummaries = leads
    .filter((l) => l.buyerIntentContext?.leadContext)
    .slice(0, options.sampleLimit || 5)
    .map((l) => buildDealerSafeLeadSummary(l)?.dealerSummary)
    .filter(Boolean);

  return {
    generatedAt: new Date().toISOString(),
    periodDays: sinceDays,
    totalLeads: leads.length,
    aggregatedOnly: true,
    piiExcluded: true,
    adminOnly: true,
    summaries: {
      leadVolume: aggregated.totalLeads,
      compareContextLeads,
      ownershipIntentLeads,
      seoOriginatedLeads: aggregated.metrics.seoOriginatedLeads,
      sourcePageTop: Object.entries(sourcePageRollup)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([sourcePage, count]) => ({ sourcePage, count })),
    },
    dealerSafeSamples: sampleSummaries,
    policy: {
      noRawBehavioralEvents: true,
      noSessionIdsInOutput: true,
      noPublicScoring: true,
    },
  };
}

async function buildDealerPilotSummaryFromDb(sinceDays = 7) {
  const Lead = require("../../models/Lead");
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);

  const leads = await Lead.find({ createdAt: { $gte: since } })
    .select(
      "+buyerIntentContext sourcePage vehicleName createdAt"
    )
    .lean();

  return buildDealerPilotSummary(leads, { sinceDays });
}

module.exports = {
  buildDealerPilotSummary,
  buildDealerPilotSummaryFromDb,
};
