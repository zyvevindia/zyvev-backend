/**
 * Safe launch profiles — env combinations for controlled rollout.
 * Validate with: node scripts/validate-launch-profile.js [profile]
 */

const LAUNCH_PROFILES = {
  staging: {
    description: "Internal QA — intelligence staging, no public behavioral API",
    env: {
      NODE_ENV: "development",
      USE_EV_MASTER: "false",
      CATALOG_INTELLIGENCE_ENABLED: "false",
      SEO_PAGES_ENABLED: "false",
      BEHAVIORAL_INTELLIGENCE_ENABLED: "false",
      SEO_INTELLIGENCE_PUBLIC: "false",
      VITE_CATALOG_INTELLIGENCE: "false",
      VITE_CATALOG_DETAIL_ENRICH: "false",
      VITE_BEHAVIORAL_INTELLIGENCE: "false",
      VITE_SEO_PAGES: "false",
    },
  },
  "soft-launch": {
    description:
      "Limited public — SEO via static JSON, catalog stable, behavioral off",
    env: {
      NODE_ENV: "production",
      USE_EV_MASTER: "true",
      CATALOG_INTELLIGENCE_ENABLED: "false",
      SEO_PAGES_ENABLED: "false",
      BEHAVIORAL_INTELLIGENCE_ENABLED: "false",
      SEO_INTELLIGENCE_PUBLIC: "false",
      VITE_CATALOG_INTELLIGENCE: "false",
      VITE_CATALOG_DETAIL_ENRICH: "false",
      VITE_BEHAVIORAL_INTELLIGENCE: "false",
      VITE_SEO_PAGES: "false",
    },
    notes: [
      "SEO guides served from public/seo-data/*.json without API flag",
      "Run build:sitemaps before deploy",
    ],
  },
  "public-beta": {
    description:
      "Wider traffic — SEO API, behavioral events, intelligence UI enabled",
    env: {
      NODE_ENV: "production",
      USE_EV_MASTER: "true",
      CATALOG_INTELLIGENCE_ENABLED: "true",
      SEO_PAGES_ENABLED: "true",
      BEHAVIORAL_INTELLIGENCE_ENABLED: "true",
      SEO_INTELLIGENCE_PUBLIC: "false",
      VITE_CATALOG_INTELLIGENCE: "true",
      VITE_CATALOG_DETAIL_ENRICH: "true",
      VITE_BEHAVIORAL_INTELLIGENCE: "true",
      VITE_SEO_PAGES: "true",
    },
  },
  "intelligence-public": {
    description:
      "Catalog intelligence on marketplace UI — behavioral tracking still off",
    env: {
      NODE_ENV: "production",
      USE_EV_MASTER: "true",
      CATALOG_INTELLIGENCE_ENABLED: "true",
      SEO_PAGES_ENABLED: "true",
      BEHAVIORAL_INTELLIGENCE_ENABLED: "false",
      SEO_INTELLIGENCE_PUBLIC: "false",
      VITE_CATALOG_INTELLIGENCE: "true",
      VITE_CATALOG_DETAIL_ENRICH: "true",
      VITE_BEHAVIORAL_INTELLIGENCE: "false",
      VITE_SEO_PAGES: "true",
    },
  },
  "behavioral-public": {
    description:
      "Anonymous behavioral events on — use with privacy review complete",
    env: {
      NODE_ENV: "production",
      USE_EV_MASTER: "true",
      CATALOG_INTELLIGENCE_ENABLED: "true",
      SEO_PAGES_ENABLED: "true",
      BEHAVIORAL_INTELLIGENCE_ENABLED: "true",
      SEO_INTELLIGENCE_PUBLIC: "false",
      VITE_CATALOG_INTELLIGENCE: "false",
      VITE_CATALOG_DETAIL_ENRICH: "false",
      VITE_BEHAVIORAL_INTELLIGENCE: "true",
      VITE_SEO_PAGES: "true",
    },
    notes: [
      "Intelligence UI can remain off while collecting anonymous events",
    ],
  },
};

/** Rules evaluated against resolved env (backend vars). */
const PROFILE_GOVERNANCE_RULES = [
  {
    id: "behavioral_requires_production",
    test: (env) =>
      env.BEHAVIORAL_INTELLIGENCE_ENABLED === "true" &&
      env.NODE_ENV !== "production",
    message: "Behavioral ingestion should not run in non-production NODE_ENV",
  },
  {
    id: "no_public_scores_without_flag",
    test: (env) =>
      env.SEO_INTELLIGENCE_PUBLIC === "true" &&
      env.CATALOG_INTELLIGENCE_ENABLED !== "true",
    message:
      "SEO_INTELLIGENCE_PUBLIC requires CATALOG_INTELLIGENCE_ENABLED",
  },
  {
    id: "soft_launch_no_behavioral",
    test: (env, profileName) =>
      profileName === "soft-launch" &&
      env.BEHAVIORAL_INTELLIGENCE_ENABLED === "true",
    message: "soft-launch profile must keep behavioral off",
  },
  {
    id: "staging_no_master_required_off",
    test: (env, profileName) =>
      profileName === "staging" &&
      env.USE_EV_MASTER === "true" &&
      env.BEHAVIORAL_INTELLIGENCE_ENABLED === "true",
    message: "staging should not combine master + behavioral",
  },
];

function getLaunchProfile(name) {
  return LAUNCH_PROFILES[name] || null;
}

function listLaunchProfiles() {
  return Object.keys(LAUNCH_PROFILES);
}

function validateProfileGovernance(profileName, env = process.env) {
  const violations = [];
  for (const rule of PROFILE_GOVERNANCE_RULES) {
    if (rule.test(env, profileName)) {
      violations.push({ id: rule.id, message: rule.message });
    }
  }
  return violations;
}

function validateEnvAgainstProfile(profileName, env = process.env) {
  const profile = getLaunchProfile(profileName);
  if (!profile) {
    return { valid: false, error: "unknown_profile" };
  }

  const mismatches = [];
  for (const [key, expected] of Object.entries(profile.env)) {
    if (key.startsWith("VITE_")) continue;
    const actual = env[key];
    if (String(actual ?? "") !== String(expected)) {
      mismatches.push({ key, expected, actual: actual ?? "(unset)" });
    }
  }

  const governanceViolations = validateProfileGovernance(
    profileName,
    env
  );

  return {
    profile: profileName,
    description: profile.description,
    notes: profile.notes || [],
    mismatches,
    governanceViolations,
    valid:
      mismatches.length === 0 && governanceViolations.length === 0,
  };
}

module.exports = {
  LAUNCH_PROFILES,
  PROFILE_GOVERNANCE_RULES,
  getLaunchProfile,
  listLaunchProfiles,
  validateProfileGovernance,
  validateEnvAgainstProfile,
};
