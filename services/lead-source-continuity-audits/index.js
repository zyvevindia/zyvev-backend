/**
 * Lead source attribution continuity audit — code + optional DB.
 */

const { auditLeadPipelineCode } = require("../lead-pipeline-audits");
const { getAllSeoSlugs } = require("../seo-pages/registry");

const SEO_SLUGS = new Set(getAllSeoSlugs());

async function auditLeadSourceContinuityDb(sinceDays = 30) {
  const mongoose = require("mongoose");
  const Lead = require("../../models/Lead");
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);

  const leads = await Lead.find({ createdAt: { $gte: since } })
    .select(
      "+buyerIntentContext +anonymousSessionId sourcePage vehicleName createdAt"
    )
    .lean();

  const gaps = [];
  let withSource = 0;
  let withSession = 0;
  let withIntent = 0;
  let compareContextOk = 0;
  let seoAttributionOk = 0;

  for (const lead of leads) {
    if (lead.sourcePage) withSource += 1;
    else {
      gaps.push({ leadId: String(lead._id), issue: "missing_sourcePage" });
    }

    if (lead.anonymousSessionId) withSession += 1;

    const ctx = lead.buyerIntentContext?.leadContext;
    if (ctx) {
      withIntent += 1;
      if (
        lead.sourcePage === "compare" &&
        (ctx.comparedVehicles || []).length >= 2
      ) {
        compareContextOk += 1;
      }
      const seoMatch = String(lead.sourcePage || "").match(
        /\/cars\/([^/?]+)/
      );
      if (seoMatch && SEO_SLUGS.has(seoMatch[1])) {
        seoAttributionOk += 1;
      }
    } else if (lead.anonymousSessionId) {
      gaps.push({
        leadId: String(lead._id),
        issue: "session_without_intent_context",
      });
    }

    const piiInContext = scanForPiiInObject(lead.buyerIntentContext);
    if (piiInContext.length) {
      gaps.push({
        leadId: String(lead._id),
        issue: "possible_pii_in_intent_context",
        fields: piiInContext,
      });
    }
  }

  return {
    sampleSize: leads.length,
    withSourcePage: withSource,
    withAnonymousSession: withSession,
    withBuyerIntentContext: withIntent,
    compareContextAligned: compareContextOk,
    seoSourceAttributed: seoAttributionOk,
    gaps: gaps.slice(0, 20),
    gapCount: gaps.length,
  };
}

function scanForPiiInObject(obj, path = "") {
  const hits = [];
  if (!obj || typeof obj !== "object") return hits;
  const piiKeys = ["name", "phone", "email", "address"];
  for (const [k, v] of Object.entries(obj)) {
    const p = path ? `${path}.${k}` : k;
    if (piiKeys.includes(k.toLowerCase())) {
      hits.push(p);
    }
    if (v && typeof v === "object") {
      hits.push(...scanForPiiInObject(v, p));
    }
  }
  return hits;
}

async function auditLeadSourceContinuity(options = {}) {
  const code = auditLeadPipelineCode();
  let db = { skipped: true };
  if (options.includeDb && process.env.MONGO_URI) {
    const mongoose = require("mongoose");
    await mongoose.connect(process.env.MONGO_URI);
    db = await auditLeadSourceContinuityDb(
      options.sinceDays || 30
    );
    await mongoose.disconnect();
  }

  const errors =
    (code.allConnected ? 0 : 1) +
    (db.gapCount > 0 && db.sampleSize > 5 ? 1 : 0) +
    (db.gaps?.some((g) => g.issue.includes("pii")) ? 1 : 0);

  return {
    generatedAt: new Date().toISOString(),
    code,
    db,
    continuity:
      "SEO → detail → compare → lead CTA → submit → CRM with optional intent context",
    piiPolicy: "No PII in behavioral events; lead form PII only in Lead collection",
    errors,
    warnings: db.gapCount || 0,
  };
}

module.exports = {
  auditLeadSourceContinuity,
};
