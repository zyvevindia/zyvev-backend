/**
 * Editorial versioning foundation — field-level change snapshots.
 */

const fs = require("fs");
const path = require("path");
const {
  getPaths,
  versionsDir,
  loadJobById,
  loadJobArtifact,
} = require("./helpers");

function ensureVersionsDir(jobId) {
  const dir = path.join(versionsDir(), jobId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function recordRevision(jobId, action, summary, editor = "admin") {
  const found = loadJobById(jobId);
  if (!found) throw new Error(`unknown jobId: ${jobId}`);

  const dir = ensureVersionsDir(jobId);
  const ts = Date.now();
  const entry = {
    revisionId: `rev_${ts}`,
    jobId,
    action,
    summary,
    editor,
    recordedAt: new Date().toISOString(),
  };

  const indexPath = path.join(dir, "index.json");
  let index = { jobId, revisions: [] };
  if (fs.existsSync(indexPath)) {
    index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  }
  index.revisions.unshift(entry);
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));

  const { artifact } = loadJobArtifact(found.job, found.paths);
  if (artifact) {
    fs.writeFileSync(
      path.join(dir, `${entry.revisionId}.json`),
      JSON.stringify(artifact, null, 2)
    );
  }

  return entry;
}

function listRevisions(jobId) {
  const dir = path.join(versionsDir(), jobId);
  const indexPath = path.join(dir, "index.json");
  if (!fs.existsSync(indexPath)) {
    return { jobId, revisions: [] };
  }
  return JSON.parse(fs.readFileSync(indexPath, "utf8"));
}

function getRollbackCandidate(jobId, revisionId) {
  const fp = path.join(versionsDir(), jobId, `${revisionId}.json`);
  if (!fs.existsSync(fp)) return null;
  return JSON.parse(fs.readFileSync(fp, "utf8"));
}

module.exports = {
  recordRevision,
  listRevisions,
  getRollbackCandidate,
};
