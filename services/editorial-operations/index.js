/**
 * Editorial operations — internal EV intelligence control plane.
 */

const { buildOverview } = require("./overviewService");
const {
  listJobsFiltered,
  getJobDetail,
  approveJob,
  rejectJob,
  sendToManualReview,
  returnToPendingReview,
} = require("./jobsService");
const { getExtractBySourceId, listExtracts } = require("./extractService");
const { buildJobDiff } = require("./diffService");
const {
  listStagedArtifacts,
  runStagedPublish,
  rollbackManifest,
} = require("./stagingService");
const { buildCoverageReport } = require("./coverageService");
const { updateField } = require("./fieldsService");
const {
  recordRevision,
  listRevisions,
  getRollbackCandidate,
} = require("./versioningService");
const { loadRegistry } = require("../source-registry");

function listSources(filters = {}) {
  const data = loadRegistry();
  let sources = data.sources;
  if (filters.brand) {
    const b = String(filters.brand).toLowerCase();
    sources = sources.filter((s) => s.brand === b);
  }
  if (filters.extractionStatus) {
    sources = sources.filter(
      (s) => s.extractionStatus === filters.extractionStatus
    );
  }
  if (filters.reviewStatus) {
    sources = sources.filter((s) => s.reviewStatus === filters.reviewStatus);
  }
  return {
    generatedAt: new Date().toISOString(),
    count: sources.length,
    sources,
  };
}

module.exports = {
  buildOverview,
  listJobsFiltered,
  getJobDetail,
  approveJob,
  rejectJob,
  sendToManualReview,
  returnToPendingReview,
  getExtractBySourceId,
  listExtracts,
  buildJobDiff,
  listStagedArtifacts,
  runStagedPublish,
  rollbackManifest,
  buildCoverageReport,
  updateField,
  recordRevision,
  listRevisions,
  getRollbackCandidate,
  listSources,
};
