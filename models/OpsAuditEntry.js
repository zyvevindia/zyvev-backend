const mongoose = require("mongoose");
const {
  OPS_AUDIT_RETENTION_DAYS,
} = require("../config/opsAudit");

const opsAuditEntrySchema = new mongoose.Schema(
  {
    /** Client-provided id for dedup (optional). */
    clientId: {
      type: String,
      index: true,
      sparse: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    actorRole: {
      type: String,
      default: "system",
      index: true,
    },
    actorId: {
      type: String,
      default: "",
      index: true,
    },
    actorLabel: {
      type: String,
      default: "",
    },
    targetType: {
      type: String,
      default: "",
      index: true,
    },
    targetId: {
      type: String,
      default: "",
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    at: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

opsAuditEntrySchema.index({ targetId: 1, at: -1 });
opsAuditEntrySchema.index({ action: 1, at: -1 });
opsAuditEntrySchema.index(
  { at: 1 },
  {
    expireAfterSeconds:
      OPS_AUDIT_RETENTION_DAYS * 24 * 60 * 60,
  }
);

module.exports = mongoose.model("OpsAuditEntry", opsAuditEntrySchema);
