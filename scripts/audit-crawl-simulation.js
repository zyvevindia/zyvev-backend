#!/usr/bin/env node
const { simulateCrawl } = require("../services/crawl-simulation");
const report = simulateCrawl();
console.log(JSON.stringify(report, null, 2));
process.exit(report.errors > 0 ? 1 : 0);
