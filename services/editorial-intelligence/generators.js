/**
 * Template-driven editorial narratives (deterministic, trust-safe).
 */

const { sanitizeEditorialText } = require("./toneRules");

function ownershipNarrative(variant) {
  const o = variant.ownership || {};
  const p = variant.pricing?.ownershipCost5yr;
  const brand = variant.identity?.brandSlug || "this brand";
  const resale = o.resaleConfidenceScore ?? 75;

  let text = `Ownership on ${brand} EVs is generally practical for Indian buyers who value predictable service intervals`;
  if (o.warrantyBatteryYears) {
    text += ` and an ${o.warrantyBatteryYears}-year battery warranty narrative`;
  }
  text += `. Resale confidence is modeled at ${resale}/100 — interpret as editorial guidance, not a guarantee.`;
  if (p?.totalInr) {
    text += ` Indicative 5-year costs are planning figures; confirm insurance and energy rates in your city.`;
  }
  return sanitizeEditorialText(text);
}

function chargingNarrative(variant) {
  const c = variant.charging || {};
  const km = variant.range?.claimedKm;
  const parts = [];
  if (c.acKw) {
    parts.push(
      `Home or workplace AC charging at ${c.acKw} kW is well suited for overnight top-ups`
    );
  }
  if (c.dcKw && c.dcTime10to80Minutes) {
    parts.push(
      `DC sessions around ${c.dcTime10to80Minutes} minutes (10–80%) are practical for planned highway stops — not a fuel-station-style minute fill`
    );
  }
  if (km) {
    parts.push(`against a certified ${km} km ARAI figure`);
  }
  return sanitizeEditorialText(
    parts.length
      ? `${parts.join("; ")}.`
      : "Charging experience depends on your access to AC and CCS2 DC infrastructure."
  );
}

function familySuitabilityNarrative(variant) {
  const score = variant.practicality?.familyScore ?? 70;
  const boot = variant.practicality?.bootSpaceL;
  let text = `Family suitability scores ${score}/100 in our model — `;
  text +=
    score >= 78
      ? "well suited for small families with regular city and weekend use"
      : "better aligned with couples or compact-family needs";
  if (boot) {
    text += `; boot space around ${boot} L should be checked against your stroller or luggage routine.`;
  }
  return sanitizeEditorialText(text);
}

function firstTimeEvNarrative(variant) {
  const score =
    variant.psychology?.scores?.best_first_ev ??
    variant.psychologyExtended?.scores?.firstTimeEvFriendliness ??
    72;
  const anxiety =
    variant.psychologyExtended?.scores?.anxietyReduction ?? 70;
  return sanitizeEditorialText(
    `First-time EV friendliness is rated ${score}/100 with anxiety-reduction at ${anxiety}/100. ` +
      `This variant is practical for buyers who want clear warranty terms and manageable charging habits — ` +
      `less ideal if you expect zero planning on long routes.`
  );
}

function compareExplanation(variant, context = {}) {
  const adv =
    variant.compare?.strongestAdvantages?.[0]?.label ||
    variant.compare?.picks?.strongestAdvantageLabel;
  const weak =
    variant.compare?.weakestAreas?.[0]?.label ||
    variant.compare?.picks?.biggestWeaknessLabel;
  const segment = variant.identity?.segment?.replace(/-/g, " ") || "segment";

  let text = `In the ${segment} set on EVSavari, this variant `;
  if (adv) {
    text += `is better aligned with buyers who prioritise ${adv.toLowerCase()}`;
  } else {
    text += "suits buyers whose needs match its range and price band";
  }
  if (weak) {
    text += `; trade-off: ${weak.toLowerCase()}`;
  }
  if (context.rivalName) {
    text += ` versus ${context.rivalName}`;
  }
  return sanitizeEditorialText(text + ".");
}

function buildEditorialNarratives(variant) {
  return {
    ownership: ownershipNarrative(variant),
    charging: chargingNarrative(variant),
    familySuitability: familySuitabilityNarrative(variant),
    firstTimeEv: firstTimeEvNarrative(variant),
    compare: compareExplanation(variant),
  };
}

function buildCompareNarrative(variant) {
  const p = variant.practicality || {};
  const psych = variant.psychology?.scores || {};
  const km = variant.range?.claimedKm ?? 0;
  const betterFor = [];

  if ((p.cityUsabilityScore ?? 0) >= 80 || (psych.best_for_city ?? 0) >= 80) {
    betterFor.push("daily city commuting");
  }
  if ((p.familyScore ?? 0) >= 76) {
    betterFor.push("family weekend trips");
  }
  if (km >= 400 && (p.highwayComfortScore ?? 0) >= 70) {
    betterFor.push("planned long-distance travel");
  }
  if ((psych.best_first_ev ?? 0) >= 80) {
    betterFor.push("first-time EV buyers");
  }
  if ((variant.charging?.acKw ?? 0) >= 7) {
    betterFor.push("home or workplace AC charging routines");
  }

  const adv = sanitizeEditorialText(
    variant.compare?.strongestAdvantages?.[0]?.label ||
      "its core EV value proposition"
  );
  const weak = sanitizeEditorialText(
    variant.compare?.weakestAreas?.[0]?.label ||
      "segments where rivals offer more range or cabin tech"
  );

  return {
    betterFor: betterFor.slice(0, 4),
    betterAlignedReason: sanitizeEditorialText(
      `Better aligned with buyers who need ${betterFor[0] || "urban EV practicality"} — ` +
        `strength area: ${adv}.`
    ),
    tradeoffSummary: sanitizeEditorialText(
      `Trade-off to weigh: ${weak}. Compare charging access and on-road price in your city before deciding.`
    ),
  };
}

function buildScenarioFit(variant) {
  const p = variant.practicality || {};
  const psych = variant.psychology?.scores || {};
  const km = variant.range?.claimedKm ?? 0;
  const c = variant.charging || {};
  const pe = variant.psychologyExtended?.scores || {};

  const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));

  return {
    dailyOfficeCommute: clamp(p.cityUsabilityScore ?? psych.best_for_city ?? 75),
    familyWeekendTrips: clamp(p.familyScore ?? psych.best_for_family ?? 70),
    longDistanceTravel: clamp(
      (km / 5) * 0.6 + (p.highwayComfortScore ?? 65) * 0.4
    ),
    apartmentChargingFriendliness: clamp(
      (c.acKw ? 78 : 55) - (c.dcKw && !c.acKw ? 10 : 0)
    ),
    firstTimeEVBuyer: clamp(
      psych.best_first_ev ?? pe.firstTimeEvFriendliness ?? 70
    ),
    chauffeurDrivenUsage: clamp(
      pe.chauffeurSuitability ?? psych.premium_feel ?? 58
    ),
  };
}

module.exports = {
  ownershipNarrative,
  chargingNarrative,
  familySuitabilityNarrative,
  firstTimeEvNarrative,
  compareExplanation,
  buildEditorialNarratives,
  buildCompareNarrative,
  buildScenarioFit,
};
