#!/usr/bin/env node
const { auditInternalLinks } = require("../services/internal-link-audits");
const report = auditInternalLinks();
console.log(JSON.stringify(report, null, 2));
process.exit(report.errors > 0 ? 1 : 0);
