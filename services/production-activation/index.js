/**
 * Production environment activation — deploy-time validation for Week 1 live ops.
 */

const fs = require("fs");
const path = require("path");
const { validateEnvAgainstProfile } = require("../../config/launchProfiles");
const { buildControlledLaunchChecklist } = require("../controlled-launch/activationChecklist");
const { auditCanonicalSeo } = require("../canonical-seo-audits");
const { auditBehavioralIntelligence } = require("../behavioral-intelligence-audits");

const FRONTEND_ENV_EXAMPLE = path.join(
  __dirname,
  "../../../zyvev-frontend/.env.example"
);

function readEnvExampleHints() {
  if (!fs.existsSync(FRONTEND_ENV_EXAMPLE)) return {};
  const text = fs.readFileSync(FRONTEND_ENV_EXAMPLE, "utf8");
  return {
    documentsPublicBeta: text.includes("public-beta"),
    documentsBehavioral: text.includes("VITE_BEHAVIORAL_INTELLIGENCE"),
    documentsLaunchProfile: text.includes("VITE_LAUNCH_PROFILE"),
  };
}

function checkBehavioralConfig() {
  const enabled = process.env.BEHAVIORAL_INTELLIGENCE_ENABLED === "true";
  const audit = auditBehavioralIntelligence();
  return {
    enabled,
    routeReady: audit.errors === 0,
    warnings: audit.warnings,
    note: enabled
      ? "Behavioral ingestion ON — ensure privacy policy covers anonymous events"
      : "Set BEHAVIORAL_INTELLIGENCE_ENABLED=true when starting Week 1 learning",
  };
}

async function probeLiveFrontend(liveOrigin) {
  if (!liveOrigin) return { skipped: true };
  try {
    const { runLiveSmokeTest } = require("../live-smoke-test");
    return await runLiveSmokeTest({ origin: liveOrigin });
  } catch (err) {
    return { error: err.message };
  }
}

async function probeLiveApi(liveOrigin) {
  if (!liveOrigin) {
    return { skipped: true, reason: "Pass --live URL or SITE_ORIGIN" };
  }
  const base = liveOrigin.replace(/\/$/, "");
  const paths = ["/api/catalog/vehicles", "/api/seo/pages"];
  const results = [];
  let allOk = true;

  for (const p of paths) {
    try {
      const res = await fetch(`${base}${p}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(12000),
      });
      const ok = res.status >= 200 && res.status < 400;
      if (!ok) allOk = false;
      results.push({ path: p, status: res.status, ok });
    } catch (err) {
      allOk = false;
      results.push({ path: p, ok: false, error: err.message });
    }
  }

  return { liveOrigin: base, allOk, probes: results };
}

async function buildProductionActivationReport(options = {}) {
  const profile = options.profile || "public-beta";
  const siteOrigin = options.siteOrigin || process.env.SITE_ORIGIN || "https://evsavari.com";
  const liveOrigin = options.liveOrigin || null;

  const backendProfile = validateEnvAgainstProfile(profile);
  const controlled = buildControlledLaunchChecklist({ siteOrigin, profile });
  const canonical = auditCanonicalSeo({ siteOrigin });
  const behavioral = checkBehavioralConfig();
  const envHints = readEnvExampleHints();
  const liveApi = await probeLiveApi(liveOrigin);
  const liveSmoke = await probeLiveFrontend(liveOrigin);

  const frontendProfileVars = [
    "VITE_LAUNCH_PROFILE=public-beta",
    "VITE_CATALOG_INTELLIGENCE=true",
    "VITE_CATALOG_DETAIL_ENRICH=true",
    "VITE_BEHAVIORAL_INTELLIGENCE=true",
    "VITE_SEO_PAGES=true",
  ];

  const backendProfileVars = [
    "LAUNCH_PROFILE=public-beta (if used)",
    "BEHAVIORAL_INTELLIGENCE_ENABLED=true",
    "CATALOG_INTELLIGENCE_ENABLED=true",
    "SEO_PAGES_ENABLED=true",
    "USE_EV_MASTER=true",
    "SITE_ORIGIN=https://evsavari.com",
  ];

  const checks = [
    {
      id: "backend_profile",
      pass: backendProfile.valid,
      detail: backendProfile.valid
        ? "ok"
        : `${backendProfile.mismatches?.length || 0} env mismatch(es) — set on deploy host`,
    },
    {
      id: "controlled_launch",
      pass: controlled.launchReady,
      detail: `${controlled.summary?.passed || "—"} activation checks`,
    },
    {
      id: "canonical_production",
      pass: canonical.errors === 0,
      detail: `${canonical.errors} errors`,
    },
    {
      id: "behavioral_route",
      pass: behavioral.routeReady,
      detail: behavioral.note,
    },
    {
      id: "live_api",
      pass: liveApi.skipped || liveApi.allOk === true,
      detail: liveApi.skipped ? liveApi.reason : liveApi.probes,
    },
    {
      id: "live_smoke",
      pass: liveSmoke.skipped || liveSmoke.smokePass === true,
      detail: liveSmoke.skipped
        ? "no --live origin"
        : `${liveSmoke.summary?.passed}/${liveSmoke.summary?.total} paths`,
    },
  ];

  const failed = checks.filter((c) => !c.pass);
  const cutoverCodeReady =
    controlled.launchReady && canonical.errors === 0 && behavioral.routeReady;
  const cutoverReady =
    cutoverCodeReady &&
    backendProfile.valid &&
    (liveSmoke.skipped || liveSmoke.smokePass === true);

  return {
    generatedAt: new Date().toISOString(),
    phase: "production-cutover",
    productionReady: cutoverCodeReady && backendProfile.valid,
    cutoverCodeReady,
    cutoverReady,
    envReady: backendProfile.valid,
    profile,
    siteOrigin,
    checks,
    behavioral,
    controlledLaunch: {
      launchReady: controlled.launchReady,
      envReady: controlled.envReady,
    },
    frontendDeployVars: frontendProfileVars,
    backendDeployVars: backendProfileVars,
    envTemplateHints: envHints,
    week1Activation: [
      "Deploy with public-beta profile on frontend + backend",
      "Enable behavioral ingestion after deploy smoke test",
      "Submit sitemap in GSC within 24h of deploy",
      "Run npm run ops:market-learning -- --db 7 daily during Week 1",
    ],
    rollback: controlled.rollback,
    liveSmoke: liveSmoke.skipped ? null : liveSmoke,
  };
}

module.exports = { buildProductionActivationReport, probeLiveApi };
