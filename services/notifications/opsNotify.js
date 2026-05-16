const Admin = require("../../models/Admin");
const Notification = require("../../models/Notification");

/**
 * Lightweight ops notifications: in-app admin alerts + optional webhook.
 */

async function postWebhook(payload) {
  const url = process.env.OPS_WEBHOOK_URL;
  if (!url) return false;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        service: "evsavari-ops",
        at: new Date().toISOString(),
      }),
    });
    return res.ok;
  } catch (err) {
    console.log("OPS WEBHOOK:", err.message);
    return false;
  }
}

async function notifyAdminsInApp({
  title,
  message,
  type = "system",
  priority = "medium",
  lead = null,
}) {
  try {
    const admins = await Admin.find({ role: "admin" }).select("_id");
    for (const admin of admins) {
      await Notification.create({
        user: admin._id,
        title,
        message,
        type,
        priority,
        lead,
      });
    }
  } catch (err) {
    console.log("ADMIN NOTIFY:", err.message);
  }
}

async function notifyOpsEvent({
  event,
  title,
  message,
  meta = {},
  priority = "medium",
  leadId = null,
}) {
  await postWebhook({ event, title, message, meta, priority });
  await notifyAdminsInApp({
    title,
    message,
    type: event,
    priority,
    lead: leadId,
  });
}

async function notifyDealerApplication(application) {
  const title = "New dealer application";
  const message = `${application.dealershipName} (${application.citySlug}) — ${application.email}`;
  await notifyOpsEvent({
    event: "dealer_application_new",
    title,
    message,
    meta: {
      applicationId: String(application._id),
      citySlug: application.citySlug,
      brands: application.brands,
    },
    priority: "high",
  });
}

async function notifyNewLead(lead) {
  const src = lead.leadSource || "form";
  const title = src === "whatsapp" ? "WhatsApp lead intent" : "New lead";
  const message =
    `${lead.name} · ${src}` +
    (lead.sourcePage ? ` · ${lead.sourcePage}` : "") +
    (lead.city ? ` · ${lead.city}` : "");

  await notifyOpsEvent({
    event: "lead_new",
    title,
    message,
    meta: {
      leadId: String(lead._id),
      leadSource: src,
      sourcePage: lead.sourcePage,
      city: lead.city,
    },
    priority: src === "whatsapp" ? "high" : "medium",
    leadId: lead._id,
  });
}

async function notifyLeadAssigned(lead, dealer) {
  if (!dealer) return;

  const title = "Lead assigned to dealer";
  const message = `${lead.name} → ${dealer.name || dealer.email}`;

  await notifyOpsEvent({
    event: "lead_assigned_dealer",
    title,
    message,
    meta: {
      leadId: String(lead._id),
      dealerId: String(dealer._id || dealer),
      dealerEmail: dealer.email,
    },
    priority: "high",
    leadId: lead._id,
  });

  await postWebhook({
    event: "dealer_lead_assigned",
    title,
    message,
    meta: {
      dealerEmail: dealer.email,
      leadId: String(lead._id),
      vehicleName: lead.vehicleName,
      sourcePage: lead.sourcePage,
    },
  });
}

module.exports = {
  notifyOpsEvent,
  notifyAdminsInApp,
  notifyDealerApplication,
  notifyNewLead,
  notifyLeadAssigned,
  postWebhook,
};
