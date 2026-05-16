const Lead = require("../../models/Lead");
const { findMatchingDealer } = require("../operations/dealerRouting");
const {
  notifyNewLead,
  notifyLeadAssigned,
} = require("../notifications/opsNotify");

function syntheticWhatsAppPhone(sessionKey = "") {
  const digits = String(sessionKey || Date.now())
    .replace(/\D/g, "")
    .slice(-10)
    .padStart(10, "0");
  return `9${digits.slice(1)}`;
}

/**
 * Auto-assign dealer when city + brand match an active dealer.
 */
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
  await lead.save();

  await notifyLeadAssigned(lead, dealer);

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
    anonymousSessionId || `wa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

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
    },
    status: "new",
    readByAdmin: false,
    statusHistory: [{ status: "new", at: new Date() }],
  });

  await notifyNewLead(lead);

  const routed = await autoAssignDealerToLead(lead);

  return {
    leadId: routed.lead._id,
    leadSource: "whatsapp",
    autoAssigned: routed.assigned,
    dealer: routed.lead.dealer || null,
  };
}

async function onFormLeadCreated(lead) {
  await notifyNewLead(lead);
  return autoAssignDealerToLead(lead);
}

module.exports = {
  createWhatsAppIntentLead,
  autoAssignDealerToLead,
  onFormLeadCreated,
  syntheticWhatsAppPhone,
};
