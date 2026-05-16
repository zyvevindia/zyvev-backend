/**
 * HTTP handlers for editorial operations API.
 */

const editorial = require("../../services/editorial-operations");

function sendError(res, err, fallbackStatus = 500) {
  const status = err.status || fallbackStatus;
  res.status(status).json({
    ok: false,
    error: err.message || "editorial_operation_failed",
  });
}

async function getOverview(req, res) {
  try {
    res.json({ ok: true, data: editorial.buildOverview() });
  } catch (err) {
    sendError(res, err);
  }
}

async function getSources(req, res) {
  try {
    res.json({
      ok: true,
      data: editorial.listSources(req.query),
    });
  } catch (err) {
    sendError(res, err);
  }
}

async function getJobs(req, res) {
  try {
    res.json({
      ok: true,
      data: editorial.listJobsFiltered(req.query),
    });
  } catch (err) {
    sendError(res, err);
  }
}

async function getJob(req, res) {
  try {
    const data = editorial.getJobDetail(req.params.jobId);
    if (!data) {
      return res.status(404).json({ ok: false, error: "job_not_found" });
    }
    res.json({ ok: true, data });
  } catch (err) {
    sendError(res, err);
  }
}

async function getExtract(req, res) {
  try {
    const data = editorial.getExtractBySourceId(req.params.sourceId);
    if (!data) {
      return res.status(404).json({ ok: false, error: "extract_not_found" });
    }
    res.json({ ok: true, data });
  } catch (err) {
    sendError(res, err);
  }
}

async function listExtractsHandler(req, res) {
  try {
    res.json({ ok: true, data: editorial.listExtracts() });
  } catch (err) {
    sendError(res, err);
  }
}

async function getDiff(req, res) {
  try {
    const data = editorial.buildJobDiff(req.params.jobId);
    if (!data) {
      return res.status(404).json({ ok: false, error: "job_not_found" });
    }
    if (data.error && data.error !== "artifact_missing") {
      return res.status(422).json({ ok: false, data });
    }
    res.json({ ok: true, data });
  } catch (err) {
    sendError(res, err);
  }
}

async function approveJob(req, res) {
  try {
    const notes = req.body?.reviewerNotes || "";
    const data = editorial.approveJob(req.params.jobId, notes);
    editorial.recordRevision(
      req.params.jobId,
      "approve",
      notes || "Job approved",
      req.admin?.email || "admin"
    );
    res.json({ ok: true, data });
  } catch (err) {
    sendError(res, err, 400);
  }
}

async function rejectJob(req, res) {
  try {
    const notes = req.body?.reviewerNotes || "";
    const data = editorial.rejectJob(req.params.jobId, notes);
    editorial.recordRevision(
      req.params.jobId,
      "reject",
      notes || "Job rejected",
      req.admin?.email || "admin"
    );
    res.json({ ok: true, data });
  } catch (err) {
    sendError(res, err, 400);
  }
}

async function needsManualReview(req, res) {
  try {
    const notes = req.body?.reviewerNotes || "";
    const data = editorial.sendToManualReview(req.params.jobId, notes);
    editorial.recordRevision(
      req.params.jobId,
      "needs_manual_review",
      notes,
      req.admin?.email || "admin"
    );
    res.json({ ok: true, data });
  } catch (err) {
    sendError(res, err, 400);
  }
}

async function returnToPending(req, res) {
  try {
    const notes = req.body?.reviewerNotes || "";
    const data = editorial.returnToPendingReview(req.params.jobId, notes);
    res.json({ ok: true, data });
  } catch (err) {
    sendError(res, err, 400);
  }
}

async function patchField(req, res) {
  try {
    const { fieldPath, value, action, reason, confidenceLevel, pageHint } =
      req.body;
    if (!fieldPath) {
      return res.status(400).json({ ok: false, error: "fieldPath required" });
    }
    const data = editorial.updateField(
      req.params.jobId,
      fieldPath,
      value,
      {
        action,
        reason,
        confidenceLevel,
        pageHint,
        editor: req.admin?.email || "admin",
      }
    );
    res.json({ ok: true, data });
  } catch (err) {
    sendError(res, err, 400);
  }
}

async function getStaged(req, res) {
  try {
    res.json({ ok: true, data: editorial.listStagedArtifacts() });
  } catch (err) {
    sendError(res, err);
  }
}

async function publishStaging(req, res) {
  try {
    const data = editorial.runStagedPublish();
    res.json({ ok: true, data });
  } catch (err) {
    sendError(res, err);
  }
}

async function rollbackStaging(req, res) {
  try {
    const { manifestId } = req.body;
    if (!manifestId) {
      return res.status(400).json({ ok: false, error: "manifestId required" });
    }
    const data = editorial.rollbackManifest(manifestId);
    res.json({ ok: true, data });
  } catch (err) {
    sendError(res, err, 400);
  }
}

async function getCoverage(req, res) {
  try {
    res.json({ ok: true, data: editorial.buildCoverageReport() });
  } catch (err) {
    sendError(res, err);
  }
}

async function getObservations(req, res) {
  try {
    const observations = require("../../services/observation-operations");
    res.json({
      ok: true,
      data: observations.listForModeration(req.query),
    });
  } catch (err) {
    sendError(res, err);
  }
}

async function moderateObservation(req, res) {
  try {
    const observations = require("../../services/observation-operations");
    const { action, reviewerNotes, replacementId } = req.body || {};
    if (action === "supersede" && replacementId) {
      const data = observations.supersede(
        req.params.observationId,
        replacementId,
        reviewerNotes || ""
      );
      return res.json({ ok: true, data });
    }
    const data = observations.moderateObservation(
      req.params.observationId,
      action,
      reviewerNotes || ""
    );
    res.json({ ok: true, data });
  } catch (err) {
    sendError(res, err, 400);
  }
}

async function getLeadQuality(req, res) {
  try {
    const lqi = require("../../services/lead-quality-intelligence");
    const days = Number(req.query.days) || 7;
    let data;
    try {
      data = await lqi.buildLeadQualitySummaryFromDb(days);
    } catch {
      data = lqi.buildFleetLeadQualitySummary([]);
    }
    res.json({ ok: true, data });
  } catch (err) {
    sendError(res, err);
  }
}

async function getDealerReadiness(req, res) {
  try {
    const { buildDealerReadinessReport } = require("../../services/dealer-readiness");
    const lqi = require("../../services/lead-quality-intelligence");
    const days = Number(req.query.days) || 7;
    let leads = [];
    try {
      const summary = await lqi.buildLeadQualitySummaryFromDb(days);
      leads = summary.samples || [];
    } catch {
      /* no db */
    }
    res.json({ ok: true, data: buildDealerReadinessReport(leads) });
  } catch (err) {
    sendError(res, err);
  }
}

async function getPublicBetaChecklist(req, res) {
  try {
    const { buildPublicBetaChecklist } = require("../../services/public-beta-readiness/publicBetaChecklist");
    res.json({ ok: true, data: buildPublicBetaChecklist() });
  } catch (err) {
    sendError(res, err);
  }
}

async function getControlledLaunch(req, res) {
  try {
    const {
      buildControlledLaunchChecklist,
    } = require("../../services/controlled-launch/activationChecklist");
    res.json({
      ok: true,
      data: buildControlledLaunchChecklist({
        profile: req.query.profile || "public-beta",
      }),
    });
  } catch (err) {
    sendError(res, err);
  }
}

async function getMarketLearning(req, res) {
  try {
    const {
      buildWeeklyMarketLearningReport,
    } = require("../../services/market-learning/weeklyMarketLearningReport");
    const days = Number(req.query.days) || 7;
    const data = await buildWeeklyMarketLearningReport({
      sinceDays: days,
      includeDb: req.query.db === "true",
    });
    res.json({ ok: true, data });
  } catch (err) {
    sendError(res, err);
  }
}

async function getProductionActivation(req, res) {
  try {
    const {
      buildProductionActivationReport,
    } = require("../../services/production-activation");
    const data = await buildProductionActivationReport({
      profile: req.query.profile || "public-beta",
      liveOrigin: req.query.live || null,
    });
    res.json({ ok: true, data });
  } catch (err) {
    sendError(res, err);
  }
}

async function getMarketHealth(req, res) {
  try {
    const {
      buildMarketHealthReport,
    } = require("../../services/market-health-monitoring");
    const data = await buildMarketHealthReport({
      includeDb: req.query.db === "true",
    });
    res.json({ ok: true, data });
  } catch (err) {
    sendError(res, err);
  }
}

async function getRevisions(req, res) {
  try {
    res.json({
      ok: true,
      data: editorial.listRevisions(req.params.jobId),
    });
  } catch (err) {
    sendError(res, err);
  }
}

module.exports = {
  getOverview,
  getSources,
  getJobs,
  getJob,
  getExtract,
  listExtractsHandler,
  getDiff,
  approveJob,
  rejectJob,
  needsManualReview,
  returnToPending,
  patchField,
  getStaged,
  publishStaging,
  rollbackStaging,
  getCoverage,
  getRevisions,
  getObservations,
  moderateObservation,
  getLeadQuality,
  getDealerReadiness,
  getPublicBetaChecklist,
  getControlledLaunch,
  getMarketLearning,
  getMarketHealth,
  getProductionActivation,
};
