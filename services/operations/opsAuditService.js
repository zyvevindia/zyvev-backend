const OpsAuditEntry = require("../../models/OpsAuditEntry");
const {
  OPS_AUDIT_RETENTION_DAYS,
  OPS_AUDIT_MAX_PAGE_SIZE,
  OPS_AUDIT_DEFAULT_PAGE_SIZE,
} = require("../../config/opsAudit");

const ALLOWED_ACTIONS = new Set([
  "dealer_application_review",
  "lead_assigned",
  "lead_status_changed",
  "lead_read_admin",
  "lead_read_dealer",
  "lead_read_all_dealer",
  "dealer_override",
  "admin_override",
  "whatsapp_intent",
  "bulk_lead_read",
  "bulk_lead_assign",
  "bulk_status_update",
  "site_feedback",
]);

function buildActorLabel(actor = {}) {
  if (actor.label) return String(actor.label);
  if (actor.name) return String(actor.name);
  if (actor.email) return String(actor.email);
  return "";
}

/**
 * @param {object} params
 */
async function appendOpsAuditEntry(params = {}) {
  const {
    action,
    actorRole = "system",
    actorId = "",
    actorLabel = "",
    targetType = "",
    targetId = "",
    metadata = {},
    at,
    clientId,
  } = params;

  if (!action || !ALLOWED_ACTIONS.has(action)) {
    return null;
  }

  const doc = {
    action,
    actorRole,
    actorId: String(actorId || ""),
    actorLabel: String(actorLabel || ""),
    targetType: String(targetType || ""),
    targetId: String(targetId || ""),
    metadata,
    at: at ? new Date(at) : new Date(),
  };

  if (clientId) {
    doc.clientId = String(clientId);
    const existing = await OpsAuditEntry.findOne({
      clientId: doc.clientId,
    }).lean();
    if (existing) {
      return { ...existing, id: existing._id.toString(), deduped: true };
    }
  }

  const row = await OpsAuditEntry.create(doc);
  const json = row.toObject();
  return {
    ...json,
    id: json._id.toString(),
    at: json.at.toISOString(),
  };
}

/**
 * @param {object} query
 */
async function listOpsAuditEntries(query = {}) {
  const page = Math.max(parseInt(query.page || "1", 10), 1);
  const limit = Math.min(
    Math.max(
      parseInt(query.limit || String(OPS_AUDIT_DEFAULT_PAGE_SIZE), 10),
      1
    ),
    OPS_AUDIT_MAX_PAGE_SIZE
  );
  const skip = (page - 1) * limit;

  const filter = {};

  if (query.action) {
    filter.action = query.action;
  }

  if (query.actorRole) {
    filter.actorRole = query.actorRole;
  }

  if (query.targetType) {
    filter.targetType = query.targetType;
  }

  if (query.targetId) {
    filter.$or = [
      { targetId: String(query.targetId) },
      { "metadata.leadId": String(query.targetId) },
    ];
  }

  if (query.from || query.to) {
    filter.at = {};
    if (query.from) {
      filter.at.$gte = new Date(query.from);
    }
    if (query.to) {
      filter.at.$lte = new Date(query.to);
    }
  } else if (query.days) {
    const days = Math.min(Math.max(parseInt(query.days, 10) || 7, 1), 90);
    const from = new Date();
    from.setDate(from.getDate() - days);
    filter.at = { $gte: from };
  }

  const [total, rows] = await Promise.all([
    OpsAuditEntry.countDocuments(filter),
    OpsAuditEntry.find(filter)
      .sort({ at: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const entries = rows.map((r) => ({
    id: r.clientId || r._id.toString(),
    _id: r._id.toString(),
    action: r.action,
    actorRole: r.actorRole,
    actorId: r.actorId,
    actorLabel: r.actorLabel,
    targetType: r.targetType,
    targetId: r.targetId,
    metadata: r.metadata || {},
    at: r.at instanceof Date ? r.at.toISOString() : r.at,
  }));

  return {
    entries,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    limit,
    retentionDays: OPS_AUDIT_RETENTION_DAYS,
  };
}

function auditFromRequest(req, overrides = {}) {
  const admin = req.admin || {};
  const dealer = req.dealer || {};
  if (dealer._id) {
    return {
      actorRole: "dealer",
      actorId: String(dealer._id),
      actorLabel: buildActorLabel(dealer),
      ...overrides,
    };
  }
  return {
    actorRole: admin.role || "admin",
    actorId: String(admin.id || admin._id || ""),
    actorLabel: buildActorLabel(admin),
    ...overrides,
  };
}

module.exports = {
  appendOpsAuditEntry,
  listOpsAuditEntries,
  auditFromRequest,
  ALLOWED_ACTIONS,
  OPS_AUDIT_RETENTION_DAYS,
};
