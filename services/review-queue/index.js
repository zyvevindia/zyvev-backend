/**
 * Lightweight human review queue — file-based, no auto-publish.
 */

const fs = require("fs");
const path = require("path");
const { getStagingPaths } = require("../data-acquisition");

const QUEUE_FILE = "review-queue.json";

function ensureDirs(paths) {
  for (const dir of [
    paths.pendingReview,
    paths.approved,
    paths.rejects,
    paths.normalized,
    paths.extracted,
  ]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function queueFilePath(pathsRoot) {
  return path.join(pathsRoot || getStagingPaths().root, QUEUE_FILE);
}

function loadQueue(pathsRoot) {
  const p = queueFilePath(pathsRoot);
  if (!fs.existsSync(p)) {
    return {
      version: 1,
      items: [],
      updatedAt: null,
    };
  }
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function saveQueue(data, pathsRoot) {
  const p = queueFilePath(pathsRoot);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const out = { ...data, updatedAt: new Date().toISOString() };
  fs.writeFileSync(p, `${JSON.stringify(out, null, 2)}\n`, "utf8");
  return out;
}

/**
 * @param {{ sourceId?: string, tier1VariantSlug: string, payload: object, reviewerNotes?: string, jobId?: string }} item
 */
function enqueueItem(item, pathsRootOverride) {
  const paths = pathsRootOverride
    ? getStagingPaths(pathsRootOverride)
    : getStagingPaths();
  ensureDirs(paths);

  const id =
    item.jobId ||
    `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const destAbs = path.join(paths.pendingReview, `${id}.json`);
  fs.writeFileSync(destAbs, JSON.stringify(item.payload, null, 2));

  const q = loadQueue(paths.root);
  q.items.unshift({
    jobId: id,
    sourceId: item.sourceId || null,
    tier1VariantSlug: item.tier1VariantSlug,
    status: "pending_review",
    lifecycleStage: "pending_review",
    artifactPath: path.relative(paths.root, destAbs),
    createdAt: new Date().toISOString(),
    reviewerNotes: item.reviewerNotes || "",
  });

  saveQueue(q, paths.root);
  return q.items[0];
}

function setJobStatus(pathsRoot, jobId, status, reviewerNotes = "") {
  const paths = pathsRoot ? getStagingPaths(pathsRoot) : getStagingPaths();
  const q = loadQueue(paths.root);
  const ix = q.items.findIndex((i) => i.jobId === jobId);
  if (ix < 0) throw new Error(`unknown jobId: ${jobId}`);

  const job = q.items[ix];
  const abs = path.join(paths.root, job.artifactPath);
  job.status = status;
  job.reviewedAt = new Date().toISOString();
  if (reviewerNotes) job.reviewerNotes = reviewerNotes;

  const destFolder =
    status === "approved"
      ? paths.approved
      : status === "rejected"
        ? paths.rejects
        : paths.pendingReview;

  if (status === "approved" || status === "rejected") {
    const base = path.basename(abs);
    const dest = path.join(destFolder, base);
    if (fs.existsSync(abs) && dest !== abs) {
      fs.renameSync(abs, dest);
      job.artifactPath = path.relative(paths.root, dest);
    }
  }

  saveQueue(q, paths.root);
  return job;
}

function listJobs(pathsRoot, statusFilter = null) {
  const paths = pathsRoot ? getStagingPaths(pathsRoot) : getStagingPaths();
  const items = loadQueue(paths.root).items;
  return statusFilter
    ? items.filter((i) => i.status === statusFilter)
    : items;
}

module.exports = {
  loadQueue,
  saveQueue,
  enqueueItem,
  setJobStatus,
  listJobs,
};
