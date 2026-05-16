/**
 * Provenance / confidence metadata validation.
 */

const DERIVED_PATHS = [
  "personaFit",
  "scenarioFit",
  "decision.whoShouldBuy",
  "compare.narrative",
  "psychologyExtended.scores",
  "range.realWorldKm",
  "ownershipIntelligence.insuranceAnnualRangeInr",
  "safety.adas.level",
  "rangeReality",
  "chargingReality",
  "buyerAssurance",
  "ownershipTradeoffs",
  "scenarioCompare",
];

function auditConfidence(variant) {
  const warnings = [];
  const errors = [];
  const registry = variant.intelligenceGovernance;

  if (!registry?.fields) {
    warnings.push({
      code: "GOVERNANCE_REGISTRY_MISSING",
      message:
        "intelligenceGovernance.fields absent — derived intelligence lacks provenance",
    });
    return { warnings, errors };
  }

  for (const path of DERIVED_PATHS) {
    if (!registry.fields[path]) {
      warnings.push({
        code: "PROVENANCE_MISSING",
        message: `No provenance metadata for derived path: ${path}`,
        path,
      });
    } else {
      const m = registry.fields[path].metadata;
      if (
        m.sourceType === "DERIVED_LOGIC" &&
        m.confidenceLevel === "verified"
      ) {
        warnings.push({
          code: "DERIVED_MARKED_VERIFIED",
          message: `${path}: derived logic should not use confidence verified`,
          path,
        });
      }
      if (
        m.verificationStatus === "verified" &&
        !m.lastVerifiedAt &&
        !m.verificationMethod
      ) {
        warnings.push({
          code: "VERIFIED_WITHOUT_METHOD",
          message: `${path}: verified status without method or date`,
          path,
        });
      }
    }
  }

  return { warnings, errors };
}

module.exports = { auditConfidence };
