/**
 * Ownership reality audits — conservative range, charging claims, tradeoffs.
 */

function auditOwnershipReality(variant) {
  const warnings = [];
  const errors = [];

  const claimed = variant.range?.claimedKm ?? 0;
  const rr = variant.rangeReality;
  const cr = variant.chargingReality;
  const trade = variant.ownershipTradeoffs;
  const reg = variant.intelligenceGovernance?.fields;

  if (!rr && claimed) {
    warnings.push({
      code: "RANGE_REALITY_MISSING",
      message: "claimedKm present but rangeReality block missing",
    });
  }

  if (rr && claimed) {
    const bands = [
      "citySummerKm",
      "cityWinterKm",
      "highwayKm",
      "withACKm",
      "fullLoadKm",
      "ecoDrivingKm",
    ];
    for (const key of bands) {
      const b = rr[key];
      if (!b) continue;
      if (b.max > claimed * 1.01) {
        errors.push({
          code: "RANGE_BAND_EXCEEDS_CLAIM",
          message: `rangeReality.${key}.max (${b.max}) exceeds claimedKm (${claimed})`,
        });
      }
      if (b.min > b.max) {
        errors.push({
          code: "RANGE_BAND_INVERTED",
          message: `rangeReality.${key} min > max`,
        });
      }
    }
    if (rr.highwayKm?.max > rr.citySummerKm?.max * 1.05) {
      warnings.push({
        code: "HIGHWAY_OPTIMISTIC_VS_CITY",
        message: "Highway band max unusually high vs city summer band",
      });
    }
  }

  if (cr) {
    if (cr.apartmentFriendly && cr.societyApprovalRisk === "high") {
      warnings.push({
        code: "APARTMENT_SOCIETY_CONFLICT",
        message: "apartmentFriendly true but societyApprovalRisk high",
      });
    }
    if (cr.roadTripConfidence === "high" && claimed < 350) {
      warnings.push({
        code: "HIGHWAY_CONFIDENCE_UNSUPPORTED",
        message: "roadTripConfidence high with claimed range under 350 km",
      });
    }
    if (!reg?.chargingReality) {
      warnings.push({
        code: "CHARGING_REALITY_NO_PROVENANCE",
        message: "chargingReality without governance provenance entry",
      });
    }
  }

  if (trade) {
    const hype = /\b(perfect|ultimate|best for everyone|unbeatable)\b/i;
    for (const field of [
      trade.primaryStrength,
      trade.primaryCompromise,
      trade.idealUsagePattern,
    ]) {
      if (field && hype.test(field)) {
        warnings.push({
          code: "TRADEOFF_HYPE_LANGUAGE",
          message: `Tradeoff field contains hype language: ${field.slice(0, 60)}`,
        });
      }
    }
    if (
      trade.primaryStrength &&
      trade.primaryCompromise &&
      trade.primaryStrength === trade.primaryCompromise
    ) {
      warnings.push({
        code: "TRADEOFF_CONTRADICTORY",
        message: "primaryStrength identical to primaryCompromise",
      });
    }
    if (!trade.lessSuitableFor?.length) {
      warnings.push({
        code: "TRADEOFF_NO_LESS_SUITABLE",
        message: "lessSuitableFor empty — transparency gap",
      });
    }
  }

  const assurance = variant.buyerAssurance;
  if (assurance) {
    for (const [key, block] of Object.entries(assurance)) {
      if (key === "metadata") continue;
      if (block?.score >= 95) {
        warnings.push({
          code: "ASSURANCE_OVERCONFIDENT",
          message: `buyerAssurance.${key} score ${block.score} may be overconfident`,
        });
      }
    }
  }

  const sc = variant.scenarioCompare;
  if (sc) {
    for (const [key, entry] of Object.entries(sc)) {
      if (key === "metadata" || !entry?.explanation) continue;
      if (/\bwinner\b/i.test(entry.explanation)) {
        warnings.push({
          code: "SCENARIO_WINNER_LANGUAGE",
          message: `scenarioCompare.${key} uses winner language`,
        });
      }
      if (entry.alignmentScore >= 92 && !reg?.scenarioCompare) {
        warnings.push({
          code: "SCENARIO_HIGH_WITHOUT_PROVENANCE",
          message: `High alignment score on ${key} — verify provenance`,
        });
      }
    }
  }

  if (rr && !reg?.rangeReality) {
    warnings.push({
      code: "RANGE_REALITY_NO_PROVENANCE",
      message: "rangeReality without governance provenance entry",
    });
  }

  return { warnings, errors };
}

module.exports = { auditOwnershipReality };
