/**
 * Ownership reality layer — range, charging lifestyle, assurance, tradeoffs, scenario compare.
 */

const { buildRangeReality } = require("./rangeReality");
const { buildChargingReality } = require("./chargingReality");
const { buildBuyerAssurance } = require("./buyerAssurance");
const { buildOwnershipTradeoffs } = require("./ownershipTradeoffs");
const { buildScenarioCompare } = require("./scenarioCompare");
const { applyTrustIntelligence } = require("../trust-intelligence");

/**
 * @param {object} variant — after intelligence + governance enrichment
 */
function applyOwnershipReality(variant) {
  if (!variant) return variant;

  const rangeReality =
    variant.rangeReality || buildRangeReality(variant);

  const withRange = { ...variant, rangeReality };

  const chargingReality =
    variant.chargingReality || buildChargingReality(withRange);

  const withCharging = { ...withRange, chargingReality };

  const buyerAssurance =
    variant.buyerAssurance || buildBuyerAssurance(withCharging);

  const ownershipTradeoffs =
    variant.ownershipTradeoffs ||
    buildOwnershipTradeoffs({ ...withCharging, buyerAssurance });

  const scenarioCompare =
    variant.scenarioCompare ||
    buildScenarioCompare({
      ...withCharging,
      buyerAssurance,
      ownershipTradeoffs,
    });

  const withCore = {
    ...withCharging,
    buyerAssurance,
    ownershipTradeoffs,
    scenarioCompare,
  };

  return applyTrustIntelligence(withCore);
}

module.exports = {
  applyOwnershipReality,
  buildRangeReality,
  buildChargingReality,
  buildBuyerAssurance,
  buildOwnershipTradeoffs,
  buildScenarioCompare,
};
