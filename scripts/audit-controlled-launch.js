#!/usr/bin/env node
const { buildControlledLaunchChecklist } = require("../services/controlled-launch/activationChecklist");

const report = buildControlledLaunchChecklist({
  profile: process.argv[2] || "public-beta",
});
console.log(JSON.stringify(report, null, 2));
process.exit(report.launchReady ? 0 : 1);
