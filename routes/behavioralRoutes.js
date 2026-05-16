const express = require("express");
const {
  BEHAVIORAL_INTELLIGENCE_ENABLED,
} = require("../config/behavioral");
const {
  getGovernanceManifest,
} = require("../services/behavioral-intelligence/governance");
const {
  storeBuyerEvent,
  storeBuyerEventsBatch,
} = require("../services/event-tracking/storeEvent");
const {
  analyzeSession,
  buildInternalReport,
} = require("../services/buyer-intelligence");

function createBehavioralRouter(deps = {}) {
  const router = express.Router();
  const { auth, adminOnly } = deps;

  router.get("/status", (req, res) => {
    res.json({
      enabled: BEHAVIORAL_INTELLIGENCE_ENABLED,
      governance: getGovernanceManifest(),
    });
  });

  router.post("/events", async (req, res) => {
    if (!BEHAVIORAL_INTELLIGENCE_ENABLED) {
      return res.status(204).end();
    }

    try {
      const body = req.body;
      const events = Array.isArray(body?.events)
        ? body.events
        : body?.eventType
          ? [body]
          : [];

      if (!events.length) {
        return res.status(400).json({
          error: "No events provided",
        });
      }

      if (events.length > 20) {
        return res.status(400).json({
          error: "Batch limit 20 events",
        });
      }

      const results = await storeBuyerEventsBatch(events);
      const stored = results.filter((r) => r.stored).length;

      res.status(202).json({
        accepted: events.length,
        stored,
        results,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get(
    "/report",
    auth,
    adminOnly,
    async (req, res) => {
      if (!BEHAVIORAL_INTELLIGENCE_ENABLED) {
        return res.status(404).json({
          error: "Behavioral intelligence disabled",
        });
      }

      const days = parseInt(req.query.days || "7", 10);
      const report = await buildInternalReport(days);
      res.json(report);
    }
  );

  router.get(
    "/session/:sessionId",
    auth,
    adminOnly,
    async (req, res) => {
      if (!BEHAVIORAL_INTELLIGENCE_ENABLED) {
        return res.status(404).json({
          error: "Behavioral intelligence disabled",
        });
      }

      const analysis = await analyzeSession(
        req.params.sessionId
      );
      res.json(analysis);
    }
  );

  return router;
}

module.exports = createBehavioralRouter;
