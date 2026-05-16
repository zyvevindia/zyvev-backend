/**
 * Run all intelligence governance audits on one variant record.
 */

const { auditSafety } = require("./rules/safetyConsistency");
const { auditCharging } = require("./rules/chargingConsistency");
const { auditConfidence } = require("./rules/confidenceValidation");
const { auditEditorial } = require("./rules/editorialSafety");
const { auditOwnershipReality } = require("./rules/ownershipReality");

function computeAuditScore(warnings, errors) {
  let score = 100;
  score -= errors.length * 15;
  score -= warnings.length * 4;
  return Math.max(0, Math.min(100, score));
}

/**
 * @param {object} variant — Tier-1 / master variant JSON
 * @returns {{ variantSlug: string, warnings: object[], errors: object[], auditScore: number }}
 */
function auditVariant(variant) {
  const slug = variant?.identity?.slug || "unknown";
  const warnings = [];
  const errors = [];

  for (const fn of [
    auditSafety,
    auditCharging,
    auditConfidence,
    auditEditorial,
    auditOwnershipReality,
  ]) {
    const result = fn(variant);
    warnings.push(...(result.warnings || []));
    errors.push(...(result.errors || []));
  }

  return {
    variantSlug: slug,
    warnings,
    errors,
    auditScore: computeAuditScore(warnings, errors),
  };
}

module.exports = { auditVariant, computeAuditScore };
