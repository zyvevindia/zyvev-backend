#!/usr/bin/env node
/**
 * Usage: node scripts/validate-launch-profile.js [profile]
 */
require("dotenv").config();
const {
  listLaunchProfiles,
  validateEnvAgainstProfile,
} = require("../config/launchProfiles");

const profileName = process.argv[2] || "soft-launch";
const result = validateEnvAgainstProfile(profileName);

if (result.error === "unknown_profile") {
  console.error(
    `Unknown profile: ${profileName}. Available: ${listLaunchProfiles().join(", ")}`
  );
  process.exit(1);
}

console.log(JSON.stringify(result, null, 2));
process.exit(result.valid ? 0 : 1);
