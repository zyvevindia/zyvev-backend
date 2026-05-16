#!/usr/bin/env node
const { buildPublicBetaChecklist } = require("../services/public-beta-readiness/publicBetaChecklist");

const report = buildPublicBetaChecklist();
console.log(JSON.stringify(report, null, 2));
process.exit(report.betaReady ? 0 : 1);
