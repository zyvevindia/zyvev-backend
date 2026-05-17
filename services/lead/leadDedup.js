const Lead = require("../../models/Lead");

const OPEN_STATUSES = [
  "new",
  "assigned",
  "contacted",
  "follow_up",
  "interested",
  "test_drive",
  "negotiation",
];

const MERGE_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

function pushAttribution(lead, entry) {
  const meta = lead.leadMetadata && typeof lead.leadMetadata === "object"
    ? { ...lead.leadMetadata }
    : {};
  const history = Array.isArray(meta.attributionHistory)
    ? [...meta.attributionHistory]
    : [];
  history.push({
    ...entry,
    at: entry.at || new Date(),
  });
  meta.attributionHistory = history;
  lead.leadMetadata = meta;
}

/**
 * Find open lead for anonymous session (WhatsApp placeholder or prior touch).
 */
async function findOpenLeadBySession(sessionId) {
  if (!sessionId || !/^[a-zA-Z0-9_-]{16,64}$/.test(String(sessionId))) {
    return null;
  }

  const since = new Date(Date.now() - MERGE_WINDOW_MS);

  return Lead.findOne({
    anonymousSessionId: String(sessionId).slice(0, 64),
    status: { $in: OPEN_STATUSES },
    createdAt: { $gte: since },
  }).select("+anonymousSessionId +buyerIntentContext");
}

function isWhatsAppPlaceholder(lead) {
  return (
    lead.leadSource === "whatsapp" ||
    lead.name === "WhatsApp enquiry" ||
    String(lead.phone || "").startsWith("9") &&
      lead.leadMetadata?.channel === "whatsapp"
  );
}

/**
 * Merge full form enquiry into existing session lead (e.g. WhatsApp intent).
 */
async function mergeFormIntoLead(lead, formPayload) {
  pushAttribution(lead, {
    channel: lead.leadSource || "whatsapp",
    sourcePage: lead.sourcePage,
    familySlug: lead.familySlug,
    variantSlug: lead.variantSlug,
    city: lead.city,
  });

  const previousSource = lead.leadSource;

  lead.name = formPayload.name;
  lead.phone = formPayload.phone;
  lead.email = formPayload.email || lead.email;
  lead.city = formPayload.city || lead.city;
  lead.message = formPayload.message || lead.message;
  lead.vehicleName = formPayload.vehicleName || lead.vehicleName;
  lead.vehicleId = formPayload.vehicleId || lead.vehicleId;
  lead.carId = formPayload.carId || lead.carId;
  lead.sourcePage = formPayload.sourcePage || lead.sourcePage;
  lead.familySlug = formPayload.familySlug || lead.familySlug;
  lead.variantSlug = formPayload.variantSlug || lead.variantSlug;
  lead.leadSource = formPayload.leadSource || "form";
  lead.readByAdmin = false;
  lead.readByDealer = false;

  if (formPayload.buyerIntentContext) {
    lead.buyerIntentContext = formPayload.buyerIntentContext;
  }

  pushAttribution(lead, {
    channel: "form",
    sourcePage: formPayload.sourcePage,
    familySlug: formPayload.familySlug,
    variantSlug: formPayload.variantSlug,
    city: formPayload.city,
  });

  lead.leadMetadata = {
    ...lead.leadMetadata,
    ...(formPayload.leadMetadata || {}),
    mergedFromWhatsApp: previousSource === "whatsapp",
    mergedAt: new Date().toISOString(),
    primaryChannel: "form",
  };

  lead.notes.push({
    text: "Buyer completed enquiry form (merged with earlier session intent).",
    createdAt: new Date(),
  });

  await lead.save();
  return lead;
}

/**
 * Refresh existing WhatsApp intent instead of duplicating.
 */
async function touchWhatsAppIntent(lead, ctx) {
  pushAttribution(lead, {
    channel: "whatsapp",
    sourcePage: ctx.sourcePage,
    familySlug: ctx.familySlug,
    variantSlug: ctx.variantSlug,
    city: ctx.city,
    intent: ctx.intent,
  });

  if (ctx.city && !lead.city) lead.city = ctx.city;
  if (ctx.vehicleName) lead.vehicleName = ctx.vehicleName;
  if (ctx.familySlug) lead.familySlug = ctx.familySlug;
  if (ctx.variantSlug) lead.variantSlug = ctx.variantSlug;
  if (ctx.sourcePage) lead.sourcePage = ctx.sourcePage;

  lead.leadMetadata = {
    ...lead.leadMetadata,
    lastWhatsAppClick: new Date().toISOString(),
    intent: ctx.intent,
  };

  await lead.save();
  return lead;
}

module.exports = {
  findOpenLeadBySession,
  mergeFormIntoLead,
  touchWhatsAppIntent,
  isWhatsAppPlaceholder,
  OPEN_STATUSES,
};
