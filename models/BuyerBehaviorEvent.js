const mongoose = require("mongoose");

/**
 * Anonymous buyer behavior events — no PII, session-scoped only.
 */
const buyerBehaviorEventSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    /** Deterministic hash for dedup within session+type+minute */
    dedupeKey: {
      type: String,
      index: true,
      sparse: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

buyerBehaviorEventSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 90 * 24 * 60 * 60,
  }
);

buyerBehaviorEventSchema.index({
  sessionId: 1,
  timestamp: -1,
});

buyerBehaviorEventSchema.index({
  eventType: 1,
  timestamp: -1,
});

module.exports = mongoose.model(
  "BuyerBehaviorEvent",
  buyerBehaviorEventSchema
);
