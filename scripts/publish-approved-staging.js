#!/usr/bin/env node
/**
 * Copy approved normalized artifacts → staging/published (manifest only).
 * Does NOT mutate Tier-1 catalog JSON files.
 */

const { publishApprovedToStaging } = require("../services/data-acquisition/publishLifecycle");

const result = publishApprovedToStaging();
console.log(JSON.stringify(result, null, 2));
