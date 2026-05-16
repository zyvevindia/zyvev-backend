/**
 * Controlled launch activation — extends public beta with live-deploy checks.
 */

const fs = require("fs");
const path = require("path");
const { buildPublicBetaChecklist } = require("../public-beta-readiness/publicBetaChecklist");
const { validateEnvAgainstProfile } = require("../../config/launchProfiles");
const { auditCanonicalSeo } = require("../canonical-seo-audits");
const { auditStructuredData } = require("../structured-data-audits");
const { generateSitemapBundle } = require("../sitemap-generation");
const { buildRobotsTxt } = require("../sitemap-generation/robots");

const FRONTEND_PUBLIC = path.join(__dirname, "../../../zyvev-frontend/public");
const FRONTEND_CONFIG = path.join(
  __dirname,
  "../../../zyvev-frontend/src/config/launchProfiles.js"
);

function check(id, label, pass, detail) {
  return { id, label, pass, detail };
}

function buildControlledLaunchChecklist(options = {}) {
  const siteOrigin = options.siteOrigin || process.env.SITE_ORIGIN || "https://evsavari.com";
  const beta = buildPublicBetaChecklist({ siteOrigin });
  const profileName = options.profile || "public-beta";
  const profileValidation = validateEnvAgainstProfile(profileName);

  const canonical = auditCanonicalSeo({ siteOrigin });
  const structured = auditStructuredData();
  let sitemapStats = null;
  try {
    sitemapStats = generateSitemapBundle({ siteOrigin }).stats;
  } catch (e) {
    sitemapStats = { error: e.message };
  }

  const robotsExpected = buildRobotsTxt(siteOrigin);
  const robotsPath = path.join(FRONTEND_PUBLIC, "robots.txt");
  const robotsOnDisk = fs.existsSync(robotsPath)
    ? fs.readFileSync(robotsPath, "utf8")
    : "";

  const bannerSource = fs.existsSync(FRONTEND_CONFIG)
    ? fs.readFileSync(FRONTEND_CONFIG, "utf8")
    : "";

  const activation = [
    check(
      "launch_profile",
      `Launch profile '${profileName}' validates`,
      profileValidation.valid === true,
      profileValidation.missing?.join(", ") || "ok"
    ),
    check(
      "public_beta_banner",
      "PublicBetaBanner wired to VITE_LAUNCH_PROFILE",
      bannerSource.includes("public-beta") && bannerSource.includes("LAUNCH_PROFILE"),
      "src/config/launchProfiles.js + PublicBetaBanner.jsx"
    ),
    check(
      "robots_production",
      "robots.txt blocks admin and query traps",
      robotsOnDisk.includes("Disallow: /admin") && robotsOnDisk.includes("/*?*"),
      robotsPath
    ),
    check(
      "sitemap_url_count",
      "Sitemap bundle matches Tier-1 + SEO registry",
      Boolean(sitemapStats?.totalUrls >= 50),
      sitemapStats?.totalUrls
        ? `${sitemapStats.totalUrls} URLs`
        : sitemapStats?.error
    ),
    check(
      "canonical_live_origin",
      "Canonical URLs use production origin",
      canonical.errors === 0,
      `${canonical.errors} errors`
    ),
    check(
      "structured_data_ready",
      "Structured data audit clean",
      structured.errors === 0,
      `${structured.errors} errors`
    ),
    check(
      "beta_foundation",
      "Public beta checklist passes",
      beta.betaReady === true,
      `${beta.summary?.passed}/${beta.summary?.total}`
    ),
  ];

  const codeChecks = activation.filter((a) => a.id !== "launch_profile");
  const failedCode = codeChecks.filter((a) => !a.pass);
  const envReady = profileValidation.valid === true;

  return {
    generatedAt: new Date().toISOString(),
    phase: "controlled-launch-activation",
    launchReady: failedCode.length === 0 && beta.betaReady,
    envReady,
    siteOrigin,
    profile: profileName,
    profileValidation,
    activationChecks: activation,
    envActivationRequired: !envReady,
    profileMissingEnv: profileValidation.missing || [],
    publicBeta: {
      betaReady: beta.betaReady,
      summary: beta.summary,
    },
    sitemap: sitemapStats,
    manualActivation: [
      "Set VITE_LAUNCH_PROFILE=public-beta on frontend deploy",
      "Set LAUNCH_PROFILE=public-beta on backend if using profile gates",
      "Enable BEHAVIORAL_INTELLIGENCE_ENABLED=true only when ready to learn",
      "Submit sitemap in GSC after first production deploy",
      "Spot-check live vehicle + SEO guide + compare on mobile",
    ],
    rollback: [
      "Revert launch profile to soft-launch",
      "Disable behavioral ingestion first",
      "Redeploy previous sitemap if URL set changed",
    ],
  };
}

module.exports = { buildControlledLaunchChecklist };
