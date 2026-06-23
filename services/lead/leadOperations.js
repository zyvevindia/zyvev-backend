const Lead = require("../../models/Lead");
const { findMatchingDealer } = require("../operations/dealerRouting");
const {
  notifyNewLead,
  notifyLeadAssigned,
  notifyDealerNewLead,
} = require("../notifications/opsNotify");
const {
  findOpenLeadBySession,
  mergeFormIntoLead,
  touchWhatsAppIntent,
} = require("./leadDedup");
const {
  findDuplicateLeadByPhoneAndEv,
  refreshDuplicateInterest,
} = require("./phoneEvDedup");
const logger = require("../../utils/logger");
const runtimeMetrics = require("../ops/runtimeMetrics");

function normalizeLeadPhone(phone = "") {
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
}

function syntheticWhatsAppPhone(sessionKey = "") {
  const digits = String(sessionKey || Date.now())
    .replace(/\D/g, "")
    .slice(-10)
    .padStart(10, "0");
  return `9${digits.slice(1)}`;
}

async function autoAssignDealerToLead(lead) {
  if (lead.dealer) {
    return { lead, assigned: false, reason: "already_assigned" };
  }

  const { dealer, brand, reason } = await findMatchingDealer({
    city: lead.city,
    brand: lead.leadMetadata?.brand,
    familySlug: lead.familySlug,
    vehicleName: lead.vehicleName,
  });

  if (!dealer) {
    return { lead, assigned: false, reason };
  }

  lead.dealer = dealer._id;
  lead.assignedAt = new Date();
  lead.status = lead.status === "new" ? "assigned" : lead.status;
  lead.statusHistory.push({
    status: lead.status,
    at: new Date(),
  });
  lead.assignedDealer = dealer.name || dealer.email;
  lead.readByDealer = false;
  await lead.save();

  await notifyLeadAssigned(lead, dealer);
  await notifyDealerNewLead(dealer, lead);

  const updated = await Lead.findById(lead._id).populate(
    "dealer",
    "name email cities brands"
  );

  return { lead: updated, assigned: true, reason: "auto_routed", brand };
}

async function createWhatsAppIntentLead({
  sourcePage = "",
  familySlug = "",
  variantSlug = "",
  city = "",
  vehicleName = "",
  anonymousSessionId = "",
  intent = "inquiry",
  brand = "",
}) {
  const sessionKey =
    anonymousSessionId ||
    `wa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const existing = await findOpenLeadBySession(sessionKey);
  if (existing) {
    const touched = await touchWhatsAppIntent(existing, {
      sourcePage,
      familySlug,
      variantSlug,
      city,
      vehicleName,
      intent,
    });
    const routed = touched.dealer
      ? { lead: touched, assigned: true }
      : await autoAssignDealerToLead(touched);

    return {
      leadId: routed.lead._id,
      leadSource: "whatsapp",
      autoAssigned: routed.assigned,
      dealer: routed.lead.dealer || null,
      deduplicated: true,
    };
  }

  const lead = await Lead.create({
    name: "WhatsApp enquiry",
    phone: syntheticWhatsAppPhone(sessionKey),
    email: "",
    city: String(city || "").trim(),
    message: `WhatsApp CTA — ${intent}`,
    sourcePage: String(sourcePage || "").trim(),
    leadSource: "whatsapp",
    familySlug: String(familySlug || "").trim(),
    variantSlug: String(variantSlug || "").trim(),
    vehicleName: String(vehicleName || "").trim(),
    anonymousSessionId: String(sessionKey).slice(0, 64),
    leadMetadata: {
      intent,
      channel: "whatsapp",
      capturedAt: new Date().toISOString(),
      brand: brand || undefined,
      attributionHistory: [
        {
          channel: "whatsapp",
          sourcePage: String(sourcePage || "").trim(),
          familySlug,
          variantSlug,
          city,
          at: new Date(),
        },
      ],
    },
    status: "new",
    readByAdmin: false,
    readByDealer: false,
    statusHistory: [{ status: "new", at: new Date() }],
  });

  await notifyNewLead(lead);

  const routed = await autoAssignDealerToLead(lead);

  return {
    leadId: routed.lead._id,
    leadSource: "whatsapp",
    autoAssigned: routed.assigned,
    dealer: routed.lead.dealer || null,
    deduplicated: false,
  };
}

/**
 * Create form lead or merge into existing session lead (WhatsApp intent).
 */
async function createOrMergeFormLead(leadPayload) {
  const normalizedPayload = {
    ...leadPayload,
    phone: normalizeLeadPhone(leadPayload.phone),
  };

  const sessionId = normalizedPayload.anonymousSessionId;

  if (sessionId) {
    const existing = await findOpenLeadBySession(sessionId);
    if (existing) {
      const merged = await mergeFormIntoLead(
        existing,
        normalizedPayload
      );
      const routed = merged.dealer
        ? { lead: merged, assigned: false }
        : await autoAssignDealerToLead(merged);

      return {
        lead: routed.lead,
        merged: true,
        autoAssigned: routed.assigned,
        duplicateSuppressed: false,
      };
    }
  }

  const duplicate = await findDuplicateLeadByPhoneAndEv(
    normalizedPayload
  );

  if (duplicate) {
    const refreshed = await refreshDuplicateInterest(
      duplicate,
      normalizedPayload
    );

    runtimeMetrics.recordDuplicateLead({
      familySlug: refreshed.familySlug,
    });

    logger.info({
      event: "duplicate_lead_suppressed",
      leadId: String(refreshed._id),
      phone: refreshed.phone,
      familySlug: refreshed.familySlug,
      variantSlug: refreshed.variantSlug,
      interestCount: refreshed.interestCount,
    });

    return {
      lead: refreshed,
      merged: false,
      autoAssigned: false,
      duplicateSuppressed: true,
    };
  }

  const lead = await Lead.create({
    ...normalizedPayload,
    interestCount: 1,
    lastInterestedAt: new Date(),
    readByDealer: false,
    leadMetadata: {
      ...(leadPayload.leadMetadata || {}),
      attributionHistory: [
        {
          channel: leadPayload.leadSource || "form",
          sourcePage: leadPayload.sourcePage,
          at: new Date(),
        },
      ],
    },
  });

  runtimeMetrics.recordLeadSubmitted({
    familySlug: lead.familySlug,
  });

  logger.info({
    event: "lead_submitted",
    leadId: String(lead._id),
    leadSource: lead.leadSource,
    familySlug: lead.familySlug,
  });

  const routed = await onFormLeadCreated(lead, { isNew: true });
  return {
    lead: routed.lead,
    merged: false,
    autoAssigned: routed.assigned,
    duplicateSuppressed: false,
  };
}

async function onFormLeadCreated(lead, { isNew = true, merged = false } = {}) {
  if (isNew && !merged) {
    await notifyNewLead(lead);
  } else if (merged) {
    await notifyNewLead(lead);
  }
  return autoAssignDealerToLead(lead);
}

module.exports = {
  createWhatsAppIntentLead,
  createOrMergeFormLead,
  autoAssignDealerToLead,
  onFormLeadCreated,
  syntheticWhatsAppPhone,
};
