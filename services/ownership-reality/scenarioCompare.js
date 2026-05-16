/**
 * Per-variant scenario alignment for compare intelligence 2.0.
 */

const { sanitizeEditorialText } = require("../editorial-intelligence/toneRules");
const { createFieldProvenance, SOURCE_TYPES, CONFIDENCE_LEVELS, VERIFICATION_STATUSES } = require("../catalog/intelligenceMetadata");

const DERIVED_META = createFieldProvenance({
  sourceType: SOURCE_TYPES.EDITORIAL_ESTIMATE,
  confidenceLevel: CONFIDENCE_LEVELS.MEDIUM,
  verificationStatus: VERIFICATION_STATUSES.PENDING_REVIEW,
  verificationMethod: "evsavari_scenario_compare_v1",
}).metadata;

function scenarioEntry(alignmentScore, explanation, tradeoffSummary) {
  return {
    alignmentScore: Math.max(0, Math.min(100, Math.round(alignmentScore))),
    explanation: sanitizeEditorialText(explanation),
    tradeoffSummary: sanitizeEditorialText(tradeoffSummary),
  };
}

function buildScenarioCompare(variant) {
  const sf = variant.scenarioFit || {};
  const range = variant.rangeReality;
  const charging = variant.chargingReality || {};
  const trade = variant.ownershipTradeoffs || {};
  const value = variant.compare?.valueScore ?? 70;
  const exShowroom = variant.pricing?.exShowroom ?? 0;

  const cityBand = range?.citySummerKm;
  const highwayBand = range?.highwayKm;

  return {
    dailyOfficeCommute: scenarioEntry(
      sf.dailyOfficeCommute ?? 75,
      `Well suited for office commutes when daily distance fits a ${cityBand ? `${cityBand.min}–${cityBand.max} km` : "conservative"} real-world city band.`,
      trade.primaryCompromise ||
        "Less ideal if you cannot charge at home, work, or a reliable overnight location."
    ),
    familyWeekendTrips: scenarioEntry(
      sf.familyWeekendTrips ?? 70,
      `Practical for family weekend trips within its range band with planned stops.`,
      "Packed highway weekends need charging discipline — not a petrol-style fill-and-go rhythm."
    ),
    budgetOwnership: scenarioEntry(
      Math.min(95, value + (exShowroom < 1600000 ? 8 : 0)),
      `Better aligned with value-focused buyers at this ex-showroom band (EVSavari value score ${value}/100).`,
      "Lower upfront price trims may trade range, features, or highway comfort versus rivals."
    ),
    highwayConfidence: scenarioEntry(
      sf.longDistanceTravel ?? 65,
      highwayBand
        ? `Highway planning band roughly ${highwayBand.min}–${highwayBand.max} km — road-trip confidence rated ${charging.roadTripConfidence || "medium"}.`
        : "Highway suitability depends on DC access along your routes.",
      "Frequent high-speed touring without charging planning is less suitable."
    ),
    firstTimeEVOwnership: scenarioEntry(
      sf.firstTimeEVBuyer ?? 72,
      "Practical for first-time EV buyers who accept a learning curve on charging habits.",
      "Buyers wanting zero lifestyle change on long routes should cross-shop longer-range options."
    ),
    metadata: {
      ...DERIVED_META,
      interpretation:
        "Scenario alignment for compare context — not a single winner label.",
    },
  };
}

/**
 * Pick better-aligned slug among compared variants for one scenario key.
 */
function pickScenarioLeader(variants, scenarioKey) {
  let best = null;
  for (const v of variants) {
    const entry = v.scenarioCompare?.[scenarioKey];
    if (!entry?.alignmentScore) continue;
    if (!best || entry.alignmentScore > best.entry.alignmentScore) {
      best = {
        slug: v.identity?.slug,
        name: `${v.identity?.brandSlug || ""} ${v.identity?.modelSlug || ""}`.trim(),
        entry,
      };
    }
  }
  return best;
}

module.exports = { buildScenarioCompare, pickScenarioLeader, scenarioEntry };
