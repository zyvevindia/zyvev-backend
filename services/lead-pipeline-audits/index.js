/**
 * End-to-end lead pipeline validation (code + optional DB sample).
 */

const fs = require("fs");
const path = require("path");

function auditLeadPipelineCode() {
  const root = path.join(__dirname, "../..");
  const checks = [
    {
      step: "seo_to_detail_event",
      file: path.join(
        root,
        "../zyvev-frontend/src/components/seo/SeoRecommendationList.jsx"
      ),
      pattern: "SEO_TO_DETAIL",
    },
    {
      step: "detail_page_viewed",
      file: path.join(
        root,
        "../zyvev-frontend/src/pages/CarDetails.jsx"
      ),
      pattern: "DETAIL_PAGE_VIEWED",
    },
    {
      step: "compare_started",
      file: path.join(
        root,
        "../zyvev-frontend/src/pages/ComparePage.jsx"
      ),
      pattern: "COMPARE_STARTED",
    },
    {
      step: "lead_cta_initiated",
      file: path.join(
        root,
        "../zyvev-frontend/src/pages/CarDetails.jsx"
      ),
      pattern: "LEAD_CTA_INITIATED",
    },
    {
      step: "lead_submitted_event",
      file: path.join(
        root,
        "../zyvev-frontend/src/components/LeadInquiryModal.jsx"
      ),
      pattern: "LEAD_SUBMITTED",
    },
    {
      step: "anonymous_session_on_lead",
      file: path.join(root, "server.js"),
      pattern: "anonymousSessionId",
    },
    {
      step: "buyer_intent_context_storage",
      file: path.join(root, "models/Lead.js"),
      pattern: "buyerIntentContext",
    },
    {
      step: "no_pii_in_track_payload",
      file: path.join(
        root,
        "services/behavioral-intelligence/eventSchema.js"
      ),
      pattern: "PROHIBITED_PAYLOAD_KEYS",
    },
    {
      step: "dealer_safe_summary",
      file: path.join(
        root,
        "services/buyer-intelligence/dealerSafeSummary.js"
      ),
      pattern: "buildDealerSafeLeadSummary",
    },
  ];

  const results = checks.map((c) => {
    let ok = false;
    try {
      ok = fs.readFileSync(c.file, "utf8").includes(c.pattern);
    } catch {
      ok = false;
    }
    return { ...c, ok, file: path.basename(c.file) };
  });

  return {
    steps: results,
    allConnected: results.every((r) => r.ok),
    flow:
      "SEO page → detail → compare → lead CTA → lead submit → CRM → intent context (internal)",
    piiPolicy: "Behavior events exclude PII; lead form stores contact separately",
  };
}

async function auditLeadPipelineDb() {
  const mongoose = require("mongoose");
  const uri = process.env.MONGO_URI;
  if (!uri) {
    return { skipped: true, reason: "no MONGO_URI" };
  }

  await mongoose.connect(uri);
  const Lead = require("../../models/Lead");

  const recent = await Lead.find()
    .sort({ createdAt: -1 })
    .limit(20)
    .select("+buyerIntentContext +anonymousSessionId")
    .lean();

  const withSource = recent.filter((l) => l.sourcePage).length;
  const withIntent = recent.filter((l) => l.buyerIntentContext).length;
  const withSession = recent.filter((l) => l.anonymousSessionId).length;

  await mongoose.disconnect();

  return {
    sampleSize: recent.length,
    withSourcePage: withSource,
    withBuyerIntentContext: withIntent,
    withAnonymousSession: withSession,
    attributionContinuity:
      withSource > 0 ? "partial_or_full" : "no_recent_leads",
  };
}

async function auditLeadPipeline(options = {}) {
  const code = auditLeadPipelineCode();
  let db = { skipped: true };
  if (options.includeDb) {
    try {
      db = await auditLeadPipelineDb();
    } catch (err) {
      db = { error: err.message };
    }
  }

  return {
    code,
    db,
    errors: code.allConnected ? 0 : 1,
    warnings: db.sampleSize === 0 ? 1 : 0,
  };
}

module.exports = {
  auditLeadPipeline,
  auditLeadPipelineCode,
};
