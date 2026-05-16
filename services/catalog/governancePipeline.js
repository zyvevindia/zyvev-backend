/**
 * Applies governance layer: provenance, scenario fit, editorial + compare narratives.
 */

const {
  buildProvenanceRegistry,
} = require("./intelligenceMetadata");

const {
  buildEditorialNarratives,
  buildCompareNarrative,
  buildScenarioFit,
} = require("../editorial-intelligence");

const { applyOwnershipReality } = require("../ownership-reality");

/**
 * @param {object} variant — after enrichVariantIntelligence
 */
function applyGovernanceLayer(variant) {
  if (!variant) return variant;

  const withOwnership = applyOwnershipReality(variant);

  const intelligenceGovernance = buildProvenanceRegistry(withOwnership);
  const scenarioFit =
    withOwnership.scenarioFit || buildScenarioFit(withOwnership);
  const editorialNarratives =
    withOwnership.editorialNarratives ||
    buildEditorialNarratives(withOwnership);
  const compareNarrative =
    withOwnership.compare?.narrative ||
    buildCompareNarrative(withOwnership);

  return {
    ...withOwnership,
    intelligenceGovernance,
    scenarioFit,
    editorialNarratives,
    compare: {
      ...withOwnership.compare,
      narrative: compareNarrative,
    },
  };
}

module.exports = {
  applyGovernanceLayer,
};
