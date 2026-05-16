/**
 * Lead-quality validation — meaningful traffic signals, no PII.
 */

const {
  buildLeadQualityReport,
  buildLeadQualityReportFromDb,
  isSeoSourcePage,
  isCompareSource,
} = require("../lead-quality-report");
const { auditLeadSourceContinuity } = require("../lead-source-continuity-audits");

function analyzeIncompleteFunnels(leads) {
  let missingSource = 0;
  let missingVehicle = 0;
  let compareSourceWithoutContext = 0;
  let sessionIdWithoutIntent = 0;

  for (const lead of leads) {
    if (!lead.sourcePage) missingSource += 1;
    if (!lead.vehicleName && !isCompareSource(lead.sourcePage)) {
      missingVehicle += 1;
    }
    if (
      isCompareSource(lead.sourcePage) &&
      (lead.buyerIntentContext?.leadContext?.comparedVehicles || [])
        .length < 2
    ) {
      compareSourceWithoutContext += 1;
    }
    if (lead.anonymousSessionId && !lead.buyerIntentContext?.leadContext) {
      sessionIdWithoutIntent += 1;
    }
  }

  return {
    missingSourcePage: missingSource,
    missingVehicleName: missingVehicle,
    compareSourceWithoutCompareContext: compareSourceWithoutContext,
    sessionWithoutIntentContext: sessionIdWithoutIntent,
  };
}

function buildLeadQualityValidation(leads, options = {}) {
  const sinceDays = options.sinceDays || 7;
  const report = buildLeadQualityReport(leads, { sinceDays });
  const funnelGaps = analyzeIncompleteFunnels(leads);

  const meaningfulTraffic =
    report.totalLeads > 0 &&
    report.metrics.sourcePageCoverage >= 50 &&
    (report.metrics.seoOriginatedLeads > 0 ||
      report.metrics.compareAssistedLeads > 0 ||
      report.metrics.withBuyerIntentContext > 0);

  return {
    ...report,
    validation: {
      meaningfulTrafficSignal: meaningfulTraffic,
      funnelGaps,
      continuityNote:
        "Run audit-lead-source-continuity.js --db for full attribution audit",
    },
  };
}

async function buildLeadQualityValidationFromDb(sinceDays = 7) {
  const mongoose = require("mongoose");
  const Lead = require("../../models/Lead");
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);

  const leads = await Lead.find({ createdAt: { $gte: since } })
    .select(
      "sourcePage vehicleName createdAt buyerIntentContext anonymousSessionId"
    )
    .lean();

  const validation = buildLeadQualityValidation(leads, { sinceDays });
  const continuity = await auditLeadSourceContinuity({
    includeDb: false,
  });

  return {
    ...validation,
    codeContinuity: continuity.code?.allConnected ?? null,
  };
}

module.exports = {
  buildLeadQualityValidation,
  buildLeadQualityValidationFromDb,
  analyzeIncompleteFunnels,
};
