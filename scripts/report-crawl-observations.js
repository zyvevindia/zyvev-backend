#!/usr/bin/env node
const { buildCrawlObservations } = require("../services/crawl-observations");
console.log(JSON.stringify(buildCrawlObservations(), null, 2));
