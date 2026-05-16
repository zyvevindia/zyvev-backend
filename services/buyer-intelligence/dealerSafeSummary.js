/**
 * Dealer-safe lead summaries — no raw behavioral traces, no PII beyond lead form.
 */

function buildDealerSafeLeadSummary(lead) {
  if (!lead) return null;

  const ctx = lead.buyerIntentContext?.leadContext;
  const inferred = lead.buyerIntentContext?._internal;

  const summary = {
    leadId: String(lead._id),
    sourcePage: lead.sourcePage || "",
    vehicleName: lead.vehicleName || "",
    comparedVehicles: ctx?.comparedVehicles || [],
    ownershipPriority: ctx?.ownershipPriority || "unknown",
    chargingPriority: ctx?.chargingPriority || "unknown",
    inferredUsageHints: deriveUsageHints(ctx),
    buyerConcernTags: (ctx?.buyerConcerns || []).slice(0, 4),
    intentConfidence: ctx?.intentConfidence || "unknown",
    disclaimer:
      "Derived from anonymous on-site behavior — not a credit or identity profile.",
  };

  return {
    dealerSummary: summary,
    _policy: {
      adminOnly: true,
      exposedToDealers: false,
      includesRawEvents: false,
      includesPii: false,
    },
    _internalNote: inferred?.exposedToDealers === false
      ? "Full intent context withheld from dealer APIs until policy review"
      : null,
  };
}

function deriveUsageHints(ctx) {
  if (!ctx) return [];
  const hints = [];
  if (ctx.ownershipPriority === "family_space") {
    hints.push("likely_family_focus");
  }
  if (ctx.chargingPriority === "high") {
    hints.push("charging_questions_likely");
  }
  if (ctx.ownershipPriority === "value") {
    hints.push("value_sensitive");
  }
  if ((ctx.comparedVehicles || []).length >= 2) {
    hints.push("active_comparison");
  }
  return hints;
}

module.exports = {
  buildDealerSafeLeadSummary,
};
