#!/usr/bin/env node
const { buildSeoOperationsReport } = require("../services/seo-operations-report");
console.log(JSON.stringify(buildSeoOperationsReport(), null, 2));
