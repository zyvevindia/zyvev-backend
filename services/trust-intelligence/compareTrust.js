/**
 * Compare trust insights — lifestyle-fit language for compare contexts.
 */

const { sanitizeEditorialText } = require("../editorial-intelligence/toneRules");

function insight(dimension, label, strength, note) {
  return {
    dimension,
    label,
    strength,
    note: sanitizeEditorialText(note),
  };
}

function buildCompareTrust(variant) {
  const cp = variant.chargingPracticality || {};
  const oc = variant.ownershipConfidence || {};
  const rr = variant.rangeRealityExpanded || {};

  return {
    chargingPracticality: insight(
      "charging",
      "Charging practicality",
      cp.chargingAnxietyLevel === "low" ? "strong" : "moderate",
      cp.editorialNotes?.[0] ||
        "Compare overnight AC suitability and DC planning needs."
    ),
    ownershipConfidence: insight(
      "ownership",
      "Ownership confidence",
      oc.longTermOwnership || "moderate",
      oc.editorialGuidance?.[0] || "Compare warranty clarity and service reach."
    ),
    familyPracticality: insight(
      "family",
      "Family practicality",
      oc.familyConfidence || "moderate",
      "Boot space, rear seat comfort, and weekend range bands matter for families."
    ),
    highwayUsability: insight(
      "highway",
      "Highway usability",
      rr.confidenceBands?.highway || "moderate",
      rr.editorialSummaries?.find((s) => s.includes("Highway")) ||
        "Highway fit depends on DC stops and steady cruise speeds."
    ),
    cityUsability: insight(
      "city",
      "City usability",
      oc.cityPracticality || "moderate",
      "Parking footprint and city range bands drive daily confidence."
    ),
    anxietyReduction: insight(
      "anxiety",
      "Anxiety reduction",
      cp.chargingAnxietyLevel === "low" ? "strong" : "moderate",
      oc.firstTimeEvFriendliness === "strong"
        ? "More beginner-friendly charging rhythm."
        : "May need more charging planning discipline."
    ),
    apartmentFit: insight(
      "apartment",
      "Apartment owners",
      cp.apartmentSuitability || "moderate",
      cp.apartmentSuitability === "strong"
        ? "Better suited for apartment owners with parking access."
        : "Confirm society charging before purchase."
    ),
  };
}

/**
 * Pick compare-set winners per trust dimension (for UI).
 */
function pickCompareTrustLeaders(variants) {
  const dimensions = [
    "apartmentFit",
    "highwayUsability",
    "anxietyReduction",
    "familyPracticality",
    "cityUsability",
  ];
  const labels = {
    apartmentFit: "Apartment charging fit",
    highwayUsability: "Highway confidence",
    anxietyReduction: "Lower charging stress",
    familyPracticality: "Family practicality",
    cityUsability: "City usability",
  };
  const strengthRank = { strong: 3, moderate: 2, limited: 1, not_applicable: 0 };

  const leaders = [];
  for (const dim of dimensions) {
    let best = null;
    for (const v of variants) {
      const entry = v.compareTrust?.[dim];
      if (!entry) continue;
      const rank = strengthRank[entry.strength] ?? 0;
      if (!best || rank > best.rank) {
        best = {
          dimension: dim,
          label: labels[dim],
          rank,
          carName: v.marketplace?.name || v.identity?.slug,
          slug: v.identity?.slug,
          note: entry.note,
        };
      }
    }
    if (best && best.rank >= 2) leaders.push(best);
  }
  return leaders.slice(0, 4);
}

module.exports = { buildCompareTrust, pickCompareTrustLeaders };
