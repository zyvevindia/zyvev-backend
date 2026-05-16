/**
 * Dealer feedback capture foundation — file-based notes, no CRM redesign.
 */

const fs = require("fs");
const path = require("path");

const DEFAULT_FEEDBACK_PATH = path.join(
  __dirname,
  "../../ops/dealer-feedback.jsonl"
);

const FEEDBACK_CATEGORIES = Object.freeze([
  "lead_quality",
  "response_time",
  "objection",
  "compare_context",
  "ownership_intent",
  "general",
]);

function createDealerFeedbackNote({
  dealerId = "pilot",
  category = "general",
  note,
  leadVolumeObservation = null,
  responseTimeHours = null,
  objectionTag = null,
  recordedBy = "ops",
}) {
  if (!note || typeof note !== "string") {
    throw new Error("note is required");
  }
  if (!FEEDBACK_CATEGORIES.includes(category)) {
    throw new Error(`invalid category: ${category}`);
  }

  return {
    id: `dfb_${Date.now()}`,
    dealerId,
    category,
    note: note.slice(0, 2000),
    leadVolumeObservation,
    responseTimeHours,
    objectionTag,
    recordedBy,
    recordedAt: new Date().toISOString(),
    _purpose: "dealer_pilot_learning",
  };
}

function appendDealerFeedback(note, filePath = DEFAULT_FEEDBACK_PATH) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.appendFileSync(filePath, `${JSON.stringify(note)}\n`, "utf8");
  return { appended: true, path: filePath };
}

function readDealerFeedback(filePath = DEFAULT_FEEDBACK_PATH, limit = 50) {
  if (!fs.existsSync(filePath)) {
    return { notes: [], path: filePath };
  }
  const lines = fs
    .readFileSync(filePath, "utf8")
    .split("\n")
    .filter(Boolean);
  const notes = lines
    .slice(-limit)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  return { notes, path: filePath, count: notes.length };
}

function summarizeDealerFeedback(filePath = DEFAULT_FEEDBACK_PATH) {
  const { notes } = readDealerFeedback(filePath, 500);
  const byCategory = {};
  const objections = new Map();
  const responseTimes = [];

  for (const n of notes) {
    byCategory[n.category] = (byCategory[n.category] || 0) + 1;
    if (n.objectionTag) {
      objections.set(
        n.objectionTag,
        (objections.get(n.objectionTag) || 0) + 1
      );
    }
    if (typeof n.responseTimeHours === "number") {
      responseTimes.push(n.responseTimeHours);
    }
  }

  const avgResponseTime =
    responseTimes.length > 0
      ? Math.round(
          (responseTimes.reduce((a, b) => a + b, 0) /
            responseTimes.length) *
            10
        ) / 10
      : null;

  return {
    generatedAt: new Date().toISOString(),
    totalNotes: notes.length,
    byCategory,
    topObjections: [...objections.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count })),
    avgObservedResponseTimeHours: avgResponseTime,
    foundationOnly: true,
  };
}

module.exports = {
  FEEDBACK_CATEGORIES,
  createDealerFeedbackNote,
  appendDealerFeedback,
  readDealerFeedback,
  summarizeDealerFeedback,
  DEFAULT_FEEDBACK_PATH,
};
