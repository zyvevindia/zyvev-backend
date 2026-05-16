/**
 * Staged publish — copies approved drafts to a published staging bucket only.
 * Never overwrites Tier-1 catalog variants without explicit human merge steps.
 */

const fs = require("fs");
const path = require("path");
const { getStagingPaths } = require("./index");
const { listJobs } = require("../review-queue");

function publishApprovedToStaging(pathsRootOverride) {
  const paths = getStagingPaths(pathsRootOverride);
  const publishedDir = path.join(paths.root, "staging", "published");
  fs.mkdirSync(publishedDir, { recursive: true });

  const manifest = [];
  const approvedJobs = listJobs(paths.root, "approved");

  for (const job of approvedJobs) {
    const artifact = path.join(paths.root, job.artifactPath);
    if (!fs.existsSync(artifact)) {
      manifest.push({
        jobId: job.jobId,
        status: "missing_artifact",
        path: job.artifactPath,
      });
      continue;
    }
    const basename = `${job.jobId}_${path.basename(artifact)}`;
    const dest = path.join(publishedDir, basename);
    fs.copyFileSync(artifact, dest);
    manifest.push({
      jobId: job.jobId,
      tier1VariantSlug: job.tier1VariantSlug,
      dest: path.relative(paths.root, dest),
      copiedAt: new Date().toISOString(),
    });
  }

  const manifestPath = path.join(
    publishedDir,
    `manifest-${Date.now()}.json`
  );
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        items: manifest,
        _rollback: {
          hint: "Delete published copies; Tier-1 JSON unchanged",
        },
      },
      null,
      2
    )
  );

  return { manifestPath, count: manifest.length };
}

module.exports = {
  publishApprovedToStaging,
};
