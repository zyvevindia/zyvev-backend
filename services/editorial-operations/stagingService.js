/**
 * Staged publish management — manifest list, publish, rollback.
 */

const fs = require("fs");
const path = require("path");
const { publishApprovedToStaging } = require("../data-acquisition/publishLifecycle");
const { validateNormalizedSchema } = require("../spec-normalization");
const {
  getPaths,
  publishedDir,
  listManifests,
  loadJobById,
  loadJobArtifact,
} = require("./helpers");
const { listJobs } = require("../review-queue");

function listStagedArtifacts() {
  const paths = getPaths();
  const manifests = listManifests(paths);
  const publishedFiles = fs.existsSync(publishedDir(paths))
    ? fs.readdirSync(publishedDir(paths)).filter((f) => !f.startsWith("manifest-"))
    : [];

  const approved = listJobs(paths.root, "approved");

  const readiness = approved.map((job) => {
    const { artifact } = loadJobArtifact(job, paths);
    const validation = artifact
      ? validateNormalizedSchema(artifact)
      : { ok: false, provenanceGaps: ["missing_artifact"] };
    return {
      jobId: job.jobId,
      tier1VariantSlug: job.tier1VariantSlug,
      provenanceComplete: validation.ok,
      provenanceGaps: validation.provenanceGaps || [],
      readyForStaging: validation.ok && !!artifact,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    manifests,
    publishedFileCount: publishedFiles.length,
    approvedJobs: readiness,
    notReadyCount: readiness.filter((r) => !r.readyForStaging).length,
  };
}

function runStagedPublish() {
  const result = publishApprovedToStaging();
  const manifest = JSON.parse(fs.readFileSync(result.manifestPath, "utf8"));
  return {
    generatedAt: new Date().toISOString(),
    manifestPath: result.manifestPath,
    count: result.count,
    manifest,
    tier1Unchanged: true,
  };
}

function rollbackManifest(manifestId) {
  const paths = getPaths();
  const dir = publishedDir(paths);
  const fileName = manifestId.endsWith(".json")
    ? manifestId
    : `${manifestId}.json`;
  const manifestPath = path.join(dir, fileName);

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`manifest not found: ${manifestId}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const removed = [];

  for (const item of manifest.items || []) {
    if (!item.dest) continue;
    const abs = path.join(paths.root, item.dest);
    if (fs.existsSync(abs)) {
      fs.unlinkSync(abs);
      removed.push(item.dest);
    }
  }

  const archiveName = `manifest-rollback-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(dir, archiveName),
    JSON.stringify(
      {
        rolledBackAt: new Date().toISOString(),
        originalManifest: fileName,
        removed,
        tier1Unchanged: true,
      },
      null,
      2
    )
  );

  return {
    generatedAt: new Date().toISOString(),
    manifestId: fileName.replace(".json", ""),
    removedCount: removed.length,
    removed,
    archiveManifest: archiveName,
    tier1Unchanged: true,
  };
}

module.exports = {
  listStagedArtifacts,
  runStagedPublish,
  rollbackManifest,
};
