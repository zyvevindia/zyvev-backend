/**
 * Future-safe dealer intelligence context — NOT exposed to dealers yet.
 */

const { deriveIntentSignals } = require("./intentSignals");
const { reconstructJourney } = require("./journeyMapper");

/**
 * Build internal lead context from anonymous session events.
 * Call server-side only when lead is submitted with sessionId.
 */
function buildLeadContext(sessionEvents) {
  if (!sessionEvents?.length) {
    return null;
  }

  const journey = reconstructJourney(sessionEvents);
  const intent = deriveIntentSignals(sessionEvents, journey);

  const comparedVehicles = [];
  for (const e of sessionEvents) {
    const slugs =
      e.payload?.vehicleSlugs || e.payload?.vehicles || [];
    if (
      e.eventType === "compare_started" ||
      e.eventType === "compare_completed"
    ) {
      comparedVehicles.push(...slugs);
    }
  }

  const buyerConcerns = [];
  if (intent.inferredIntent.chargingConcern >= 0.4) {
    buyerConcerns.push("charging_practicality");
  }
  if (intent.inferredIntent.ownershipAnxietySignals >= 0.4) {
    buyerConcerns.push("ownership_uncertainty");
  }
  if (journey.hesitationIndicators.includes("compare_without_lead")) {
    buyerConcerns.push("comparison_hesitation");
  }

  let ownershipPriority = "balanced";
  if (intent.inferredIntent.familyFocus >= 0.5) {
    ownershipPriority = "family_space";
  } else if (intent.inferredIntent.likelyBudgetBand) {
    ownershipPriority = "value";
  }

  let chargingPriority = "standard";
  if (intent.inferredIntent.chargingConcern >= 0.5) {
    chargingPriority = "high";
  }

  return {
    leadContext: {
      comparedVehicles: [...new Set(comparedVehicles)],
      buyerConcerns: [...new Set(buyerConcerns)],
      ownershipPriority,
      chargingPriority,
      journeyPath: journey.pathSignature,
      intentConfidence: intent.confidence,
    },
    _internal: {
      exposedToDealers: false,
      intentExplanations: intent.explanations,
    },
  };
}

module.exports = {
  buildLeadContext,
};
