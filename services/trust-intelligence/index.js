/**
 * Trust & decision-confidence intelligence layer.
 */

const { buildRangeRealityExpanded } = require("./rangeRealityExpanded");
const { buildChargingPracticality } = require("./chargingPracticality");
const { buildOwnershipConfidence } = require("./ownershipConfidence");
const { buildTrustPresentation } = require("./trustPresentation");
const { buildCompareTrust } = require("./compareTrust");
const { applyFlagshipTrustPolish } = require("./flagshipTrustPolish");

function applyTrustIntelligence(variant) {
  if (!variant) return variant;

  const withPrior = { ...variant };

  const rangeRealityExpanded =
    variant.rangeRealityExpanded ||
    buildRangeRealityExpanded(withPrior);

  const chargingPracticality =
    variant.chargingPracticality ||
    buildChargingPracticality({ ...withPrior, rangeRealityExpanded });

  const ownershipConfidence =
    variant.ownershipConfidence ||
    buildOwnershipConfidence({
      ...withPrior,
      rangeRealityExpanded,
      chargingPracticality,
    });

  const trustPresentation =
    variant.trustPresentation ||
    buildTrustPresentation({
      ...withPrior,
      rangeRealityExpanded,
      chargingPracticality,
      ownershipConfidence,
    });

  const compareTrust =
    variant.compareTrust ||
    buildCompareTrust({
      ...withPrior,
      rangeRealityExpanded,
      chargingPracticality,
      ownershipConfidence,
    });

  const withTrust = {
    ...withPrior,
    rangeRealityExpanded,
    chargingPracticality,
    ownershipConfidence,
    trustPresentation,
    compareTrust,
  };

  return applyFlagshipTrustPolish(withTrust);
}

module.exports = {
  applyTrustIntelligence,
  buildRangeRealityExpanded,
  buildChargingPracticality,
  buildOwnershipConfidence,
  buildTrustPresentation,
  buildCompareTrust,
};
