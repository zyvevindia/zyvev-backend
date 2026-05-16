/**
 * Editorial operations API — admin-only, no auto-publish to Tier-1.
 */

const express = require("express");
const ctrl = require("../controllers/editorial/editorialController");

function createEditorialRouter({ auth, adminOnly }) {
  const router = express.Router();

  router.use(auth, adminOnly);

  router.get("/overview", ctrl.getOverview);
  router.get("/sources", ctrl.getSources);
  router.get("/extracts", ctrl.listExtractsHandler);
  router.get("/extracts/:sourceId", ctrl.getExtract);

  router.get("/jobs", ctrl.getJobs);
  router.get("/jobs/:jobId", ctrl.getJob);
  router.get("/jobs/:jobId/diff", ctrl.getDiff);
  router.get("/jobs/:jobId/revisions", ctrl.getRevisions);

  router.post("/jobs/:jobId/approve", ctrl.approveJob);
  router.post("/jobs/:jobId/reject", ctrl.rejectJob);
  router.post("/jobs/:jobId/needs-manual-review", ctrl.needsManualReview);
  router.post("/jobs/:jobId/return-to-pending", ctrl.returnToPending);
  router.patch("/jobs/:jobId/fields", ctrl.patchField);

  router.get("/staged", ctrl.getStaged);
  router.post("/staged/publish", ctrl.publishStaging);
  router.post("/staged/rollback", ctrl.rollbackStaging);

  router.get("/coverage", ctrl.getCoverage);
  router.get("/observations", ctrl.getObservations);
  router.post("/observations/:observationId/moderate", ctrl.moderateObservation);
  router.get("/lead-quality", ctrl.getLeadQuality);
  router.get("/dealer-readiness", ctrl.getDealerReadiness);
  router.get("/public-beta-checklist", ctrl.getPublicBetaChecklist);
  router.get("/controlled-launch", ctrl.getControlledLaunch);
  router.get("/market-learning", ctrl.getMarketLearning);
  router.get("/market-health", ctrl.getMarketHealth);
  router.get("/production-activation", ctrl.getProductionActivation);

  return router;
}

module.exports = createEditorialRouter;
