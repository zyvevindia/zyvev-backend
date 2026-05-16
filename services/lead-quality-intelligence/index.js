/**
 * Internal lead quality indicators — admin only, no public scoring.
 */

const { isSeoSourcePage, isCompareSource } = require("../lead-quality-report");

function detectChargingConcern(ctx) {
  const concerns = ctx?.buyerConcerns || [];
  return (
    concerns.includes("charging_access") ||
    concerns.includes("charging_anxiety") ||
    ctx?.chargingPriority === "high"
  );
}

function detectFirstTimeBuyer(ctx) {
  const concerns = ctx?.buyerConcerns || [];
  return (
    concerns.includes("first_ev") ||
    ctx?.ownershipPriority === "ease_of_ownership" ||
    ctx?.buyerStage === "researching_first_ev"
  );
}

function detectTrustEngagement(lead) {
  const panels = lead.buyerIntentContext?._internal?.panelsViewed || [];
  return (
    panels.includes("trust_confidence") ||
    panels.includes("ownership_reality") ||
    lead.buyerIntentContext?._internal?.trustEngaged === true
  );
}

/**
 * @param {object} lead — lean lead document
 */
function buildLeadQualityIndicators(lead) {
  const ctx = lead.buyerIntentContext?.leadContext;
  const compared = ctx?.comparedVehicles || [];
  const compareEngaged =
    isCompareSource(lead.sourcePage) || compared.length >= 2;
  const seoOriginated = isSeoSourcePage(lead.sourcePage);
  const chargingConcern = detectChargingConcern(ctx);
  const firstTimeBuyer = detectFirstTimeBuyer(ctx);
  const trustEngaged = detectTrustEngagement(lead);
  const hasIntent = Boolean(ctx);

  let score = 0;
  if (hasIntent) score += 25;
  if (compareEngaged) score += 25;
  if (trustEngaged) score += 20;
  if (seoOriginated) score += 10;
  if (lead.vehicleName) score += 10;
  if (chargingConcern && hasIntent) score += 10;
  if (firstTimeBuyer && hasIntent) score += 10;

  const tier =
    score >= 70 ? "high" : score >= 45 ? "medium" : "low";

  return {
    leadId: lead._id ? String(lead._id) : null,
    qualityTier: tier,
    qualityScore: score,
    indicators: {
      compareEngaged: compareEngaged,
      trustEngaged: trustEngaged,
      seoOriginated: seoOriginated,
      firstTimeBuyerPattern: firstTimeBuyer,
      chargingConcernSignal: chargingConcern,
      hasBuyerIntentContext: hasIntent,
      ownershipIntent:
        ctx?.ownershipPriority && ctx.ownershipPriority !== "balanced",
    },
    dealerValueSignals: {
      compareAssistedLead: compareEngaged,
      trustEngagedSession: trustEngaged,
      practicalInterest:
        chargingConcern || firstTimeBuyer || compareEngaged,
      ownershipIntentQuality: ctx?.ownershipPriority || "unknown",
    },
    _policy: {
      adminOnly: true,
      publicExposure: false,
      notACreditScore: true,
    },
  };
}

function buildFleetLeadQualitySummary(leads) {
  const enriched = leads.map(buildLeadQualityIndicators);
  const tiers = { high: 0, medium: 0, low: 0 };
  let compareEngaged = 0;
  let trustEngaged = 0;
  let chargingConcern = 0;
  let firstTime = 0;

  for (const e of enriched) {
    tiers[e.qualityTier] += 1;
    if (e.indicators.compareEngaged) compareEngaged += 1;
    if (e.indicators.trustEngaged) trustEngaged += 1;
    if (e.indicators.chargingConcernSignal) chargingConcern += 1;
    if (e.indicators.firstTimeBuyerPattern) firstTime += 1;
  }

  const total = leads.length;
  return {
    generatedAt: new Date().toISOString(),
    totalLeads: total,
    tierDistribution: tiers,
    rates: {
      compareEngaged: total ? Math.round((compareEngaged / total) * 100) : 0,
      trustEngaged: total ? Math.round((trustEngaged / total) * 100) : 0,
      chargingConcern: total ? Math.round((chargingConcern / total) * 100) : 0,
      firstTimeBuyer: total ? Math.round((firstTime / total) * 100) : 0,
    },
    samples: enriched.slice(0, 20),
    aggregatedOnly: true,
    piiExcluded: true,
  };
}

async function buildLeadQualitySummaryFromDb(sinceDays = 7) {
  const Lead = require("../../models/Lead");
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
  const leads = await Lead.find({ createdAt: { $gte: since } })
    .select(
      "sourcePage vehicleName createdAt buyerIntentContext anonymousSessionId"
    )
    .lean();
  const { buildLeadCalibrationReport } = require("./calibration");
  let behavioral = null;
  if (process.env.MONGO_URI) {
    try {
      const { buildBehavioralTrends } = require("../behavioral-trends");
      behavioral = await buildBehavioralTrends(sinceDays);
    } catch {
      /* optional */
    }
  }
  return buildLeadCalibrationReport(leads, behavioral);
}

module.exports = {
  buildLeadQualityIndicators,
  buildFleetLeadQualitySummary,
  buildLeadQualitySummaryFromDb,
};
