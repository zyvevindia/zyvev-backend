/**
 * Trust presentation — editorial confidence indicators (not star ratings).
 */

const { sanitizeEditorialText } = require("../editorial-intelligence/toneRules");

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function buildTrustPresentation(variant) {
  const cp = variant.chargingPracticality || {};
  const oc = variant.ownershipConfidence || {};
  const rr = variant.rangeRealityExpanded || {};
  const indicators = [];

  if (oc.firstTimeEvFriendliness === "strong") {
    indicators.push({
      id: "first_ev",
      label: "Well suited for first-time EV buyers",
      tone: "positive",
    });
  } else if (oc.firstTimeEvFriendliness === "moderate") {
    indicators.push({
      id: "first_ev",
      label: "First-time EV friendly with charging planning",
      tone: "neutral",
    });
  }

  if (cp.apartmentSuitability) {
    indicators.push({
      id: "apartment",
      label: `Apartment charging confidence: ${cp.apartmentSuitability}`,
      tone:
        cp.apartmentSuitability === "strong"
          ? "positive"
          : cp.apartmentSuitability === "limited"
            ? "caution"
            : "neutral",
    });
  }

  if (rr.confidenceBands?.highway) {
    indicators.push({
      id: "highway",
      label: `Highway practicality: ${rr.confidenceBands.highway}`,
      tone:
        rr.confidenceBands.highway === "strong" ? "positive" : "neutral",
    });
  }

  if (oc.familyConfidence) {
    indicators.push({
      id: "family",
      label: `Family practicality: ${oc.familyConfidence}`,
      tone: oc.familyConfidence === "strong" ? "positive" : "neutral",
    });
  }

  if (cp.chargingAnxietyLevel) {
    const stress =
      cp.chargingAnxietyLevel === "low"
        ? "low"
        : cp.chargingAnxietyLevel === "high"
          ? "higher"
          : "moderate";
    indicators.push({
      id: "charging_stress",
      label: `Charging planning stress: ${stress}`,
      tone: stress === "low" ? "positive" : stress === "higher" ? "caution" : "neutral",
    });
  }

  if (oc.cityPracticality === "strong") {
    indicators.push({
      id: "city",
      label: "Strong city-driving practicality",
      tone: "positive",
    });
  }

  return {
    indicators: indicators.map((i) => ({
      ...i,
      label: sanitizeEditorialText(i.label),
    })),
    headline: sanitizeEditorialText(
      variant.ownershipTradeoffs?.idealUse ||
        "Practical EV for buyers who match its charging and range profile."
    ),
    disclaimer:
      "Editorial confidence indicators — not user reviews, star ratings, or guarantees.",
  };
}

module.exports = { buildTrustPresentation };
