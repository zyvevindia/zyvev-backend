/**
 * Probabilistic intent signals — derived from anonymous behavior only.
 */

const { EVENT_TYPES } = require("../behavioral-intelligence/eventSchema");

function deriveIntentSignals(events, journey = null) {
  const signals = {
    likelyBudgetBand: null,
    likelyUsageType: null,
    chargingConcern: 0,
    familyFocus: 0,
    firstTimeEVBuyerLikelihood: 0,
    compareIntentStrength: 0,
    ownershipAnxietySignals: 0,
  };

  const explanations = [];

  for (const e of events) {
    const intent = e.payload?.sessionIntent;
    if (intent === "family_usage") {
      signals.familyFocus = Math.min(1, signals.familyFocus + 0.25);
    }
    if (intent === "budget_conscious") {
      signals.likelyBudgetBand = signals.likelyBudgetBand || "under_15_lakh";
    }

    switch (e.eventType) {
      case EVENT_TYPES.CHARGING_REALITY_EXPANDED:
        signals.chargingConcern = Math.min(
          1,
          signals.chargingConcern + 0.35
        );
        explanations.push("charging_section_engaged");
        break;
      case EVENT_TYPES.OWNERSHIP_PANEL_VIEWED:
        signals.ownershipAnxietySignals = Math.min(
          1,
          signals.ownershipAnxietySignals + 0.3
        );
        explanations.push("ownership_panel_viewed");
        break;
      case EVENT_TYPES.SCENARIO_COMPARE_VIEWED:
        signals.compareIntentStrength = Math.min(
          1,
          signals.compareIntentStrength + 0.25
        );
        if (e.payload?.scenarioKey?.includes("family")) {
          signals.familyFocus = Math.min(1, signals.familyFocus + 0.2);
        }
        break;
      case EVENT_TYPES.COMPARE_STARTED:
        signals.compareIntentStrength = Math.min(
          1,
          signals.compareIntentStrength + 0.4
        );
        break;
      case EVENT_TYPES.SEO_TO_DETAIL:
        if (e.payload?.seoPageSlug?.includes("family")) {
          signals.familyFocus = Math.min(1, signals.familyFocus + 0.3);
          signals.likelyUsageType = "family";
        }
        if (e.payload?.seoPageSlug?.includes("first-time")) {
          signals.firstTimeEVBuyerLikelihood = Math.min(
            1,
            signals.firstTimeEVBuyerLikelihood + 0.35
          );
        }
        if (e.payload?.seoPageSlug?.includes("under-10")) {
          signals.likelyBudgetBand = "under_10_lakh";
        }
        if (e.payload?.seoPageSlug?.includes("under-20")) {
          signals.likelyBudgetBand =
            signals.likelyBudgetBand || "under_20_lakh";
        }
        if (e.payload?.seoPageSlug?.includes("apartment")) {
          signals.chargingConcern = Math.min(
            1,
            signals.chargingConcern + 0.25
          );
        }
        break;
      case EVENT_TYPES.DETAIL_PAGE_VIEWED:
        if (e.payload?.sessionIntent === "city_commute") {
          signals.likelyUsageType = "city_commute";
        }
        break;
      default:
        break;
    }
  }

  if (journey?.flags?.reachedCompare) {
    signals.compareIntentStrength = Math.min(
      1,
      signals.compareIntentStrength + 0.2
    );
  }

  return {
    inferredIntent: roundSignals(signals),
    confidence: computeConfidence(events.length, explanations.length),
    explanations: [...new Set(explanations)],
    methodology:
      "Rule-based derivation from allowlisted anonymous events only; not demographic profiling.",
  };
}

function roundSignals(signals) {
  const out = {};
  for (const [k, v] of Object.entries(signals)) {
    if (typeof v === "number") {
      out[k] = Math.round(v * 100) / 100;
    } else {
      out[k] = v;
    }
  }
  return out;
}

function computeConfidence(eventCount, explanationCount) {
  if (eventCount >= 8 && explanationCount >= 3) return "medium";
  if (eventCount >= 4) return "low";
  return "very_low";
}

module.exports = {
  deriveIntentSignals,
};
