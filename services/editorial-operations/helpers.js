/**
 * Shared helpers for editorial operations — file paths, artifacts, manifests.
 */

const fs = require("fs");
const path = require("path");
const { getStagingPaths } = require("../data-acquisition");
const { loadQueue } = require("../review-queue");

function getPaths() {
  return getStagingPaths();
}

function publishedDir(paths = getPaths()) {
  return path.join(paths.root, "staging", "published");
}

function versionsDir(paths = getPaths()) {
  return path.join(paths.root, "versions");
}

function loadJobById(jobId, pathsRoot) {
  const paths = pathsRoot ? getStagingPaths(pathsRoot) : getPaths();
  const job = loadQueue(paths.root).items.find((i) => i.jobId === jobId);
  if (!job) return null;
  return { job, paths };
}

function loadJobArtifact(job, paths) {
  const abs = path.join(paths.root, job.artifactPath);
  if (!fs.existsSync(abs)) {
    return { abs, artifact: null, error: "artifact_missing" };
  }
  const artifact = JSON.parse(fs.readFileSync(abs, "utf8"));
  return { abs, artifact, error: null };
}

function loadRawExtract(sourceId, paths) {
  if (!sourceId) return null;
  const fp = path.join(paths.extracted, `${sourceId}.raw.extract.json`);
  if (!fs.existsSync(fp)) return null;
  return JSON.parse(fs.readFileSync(fp, "utf8"));
}

function listManifests(paths = getPaths()) {
  const dir = publishedDir(paths);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.startsWith("manifest-") && f.endsWith(".json"))
    .map((f) => {
      const fp = path.join(dir, f);
      const data = JSON.parse(fs.readFileSync(fp, "utf8"));
      return {
        manifestId: f.replace(".json", ""),
        fileName: f,
        path: path.relative(paths.root, fp),
        generatedAt: data.generatedAt,
        itemCount: data.items?.length ?? 0,
        items: data.items || [],
      };
    })
    .sort((a, b) => (a.generatedAt < b.generatedAt ? 1 : -1));
}

function jobIdsInStagedManifests(paths = getPaths()) {
  const staged = new Set();
  for (const m of listManifests(paths)) {
    for (const item of m.items) {
      if (item.jobId) staged.add(item.jobId);
    }
  }
  return staged;
}

function effectiveLifecycle(job, paths = getPaths()) {
  const staged = jobIdsInStagedManifests(paths);
  if (staged.has(job.jobId)) return "staged";
  if (job.status === "needs_manual_review") return "needs_manual_review";
  return job.status || job.lifecycleStage || "pending_review";
}

module.exports = {
  getPaths,
  publishedDir,
  versionsDir,
  loadJobById,
  loadJobArtifact,
  loadRawExtract,
  listManifests,
  jobIdsInStagedManifests,
  effectiveLifecycle,
};
