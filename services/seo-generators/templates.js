/**
 * Deterministic editorial templates — no freeform AI generation.
 */

const { sanitizeEditorialText } = require("../editorial-intelligence/toneRules");

const INTRO_TEMPLATES = {
  budget_under_10:
    "These electric cars are better aligned with buyers targeting under ₹10 lakh ex-showroom. Rankings use ownership cost signals and catalog intelligence — not marketing superlatives.",
  budget_under_20:
    "EV options under ₹20 lakh ex-showroom, filtered and ordered by practical ownership fit and value alignment from our Tier-1 catalog.",
  city_driving:
    "City driving suitability combines maneuverability scores, commuter persona fit, and real-world range bands — for buyers who mostly drive in urban conditions.",
  family:
    "Family-oriented picks weigh rear comfort, boot practicality, and family suitability scores — with clear tradeoffs on range and charging for weekend trips.",
  office_commute:
    "Office commute recommendations balance city usability, indicative running cost, and daily-distance practicality.",
  low_maintenance:
    "Lower-maintenance alignment uses indicative service cost per km and resale confidence — always verify with your local service network.",
  first_time_buyer:
    "First-time EV buyer picks emphasize ease-of-ownership, charging clarity, and lower lifestyle friction — with honest tradeoffs, not hype.",
  apartment_living:
    "Apartment living picks prioritize home AC charging support, wallbox practicality, and lower charging friction for shared parking setups. We explain tradeoffs — not every EV fits every society parking rule.",
  home_charging:
    "Home charging–aligned EVs are ranked using AC charging kW, wallbox readiness, and ecosystem compatibility from catalog data.",
  daily_commute:
    "Daily commute EVs combine commuter persona scores with conservative real-world range estimates for routine distances.",
  head_to_head:
    "This comparison contrasts two catalog variants side by side. We highlight where each is better aligned — with tradeoffs, not a single winner claim.",
  highway_driving:
    "Highway driving picks weigh scenario highway confidence, fast-charge practicality, and conservative range bands — for buyers who regularly leave the city. Plan stops; do not treat ARAI range as a petrol tank.",
  lowest_charging_stress:
    "Lower charging-stress picks use charging practicality and anxiety-reduction signals from catalog intelligence — confirm parking access and route chargers before you buy.",
  easiest_first_time:
    "Easiest first-time EV picks combine first-time friendliness, charging clarity, and city usability — explained with transparent tradeoffs.",
  apartment_parking:
    "Apartment parking picks focus on overnight AC charging, wallbox readiness, and shared-parking friction — not marketing range claims.",
  best_city_india:
    "Best city electric cars in India are ranked using city driving scores, daily commute fit, and lower charging-stress signals from catalog intelligence.",
};

const EXPLANATION_TEMPLATES = {
  budget_under_10:
    "Better aligned for budget-conscious ownership under ₹10 lakh ex-showroom (composite score {{score}}).",
  budget_under_20:
    "Practical under ₹20 lakh ex-showroom with strong value and ownership alignment (score {{score}}).",
  city_driving:
    "Well suited for city driving based on maneuverability and commuter fit (score {{score}}).",
  family:
    "Better aligned for family use — space and comfort signals support this pick (score {{score}}).",
  office_commute:
    "Practical for regular office commute distances and running-cost profile (score {{score}}).",
  low_maintenance:
    "Better aligned with lower indicative maintenance and ownership friction (score {{score}}).",
  first_time_buyer:
    "Well suited for first-time EV buyers — ease and charging practicality (score {{score}}).",
  apartment_living:
    "Practical for apartment living with home charging considerations (score {{score}}).",
  home_charging:
    "Well suited for home AC charging setups in catalog data (score {{score}}).",
  daily_commute:
    "Practical for daily commute patterns in city and mixed use (score {{score}}).",
  head_to_head:
    "Compared on catalog intelligence dimensions relevant to this decision (score {{score}}).",
  highway_driving:
    "Better aligned for highway driving with planning-band realism (score {{score}}).",
  lowest_charging_stress:
    "Lower indicative charging stress for practical ownership (score {{score}}).",
  easiest_first_time:
    "Easier first-time EV ownership profile in catalog data (score {{score}}).",
  apartment_parking:
    "Practical for apartment parking with AC charging considerations (score {{score}}).",
  best_city_india:
    "Strong city electric car fit for Indian urban use (score {{score}}).",
};

function formatLakh(inr) {
  if (inr == null) return "—";
  const lakh = inr / 100000;
  return lakh >= 1
    ? `₹${lakh.toFixed(2)} lakh`
    : `₹${(inr / 1000).toFixed(0)}K`;
}

function applyTemplate(template, vars) {
  let out = template;
  for (const [key, val] of Object.entries(vars)) {
    out = out.replace(
      new RegExp(`\\{\\{${key}\\}\\}`, "g"),
      String(val ?? "")
    );
  }
  return sanitizeEditorialText(out);
}

function buildIntro(templateKey) {
  const raw =
    INTRO_TEMPLATES[templateKey] ||
    INTRO_TEMPLATES.city_driving;
  return sanitizeEditorialText(raw);
}

function buildExplanation(templateKey, score) {
  const raw =
    EXPLANATION_TEMPLATES[templateKey] ||
    EXPLANATION_TEMPLATES.city_driving;
  return applyTemplate(raw, { score });
}

function buildTradeoffSummary(variant, pageTypeId) {
  const weaknesses =
    variant.compare?.weakestAreas?.map((w) => w.label).filter(Boolean) ||
    [];
  const advantages =
    variant.compare?.strongestAdvantages?.map((a) => a.label).filter(Boolean) ||
    [];

  const parts = [];
  if (advantages.length) {
    parts.push(
      `Strengths noted in catalog: ${advantages.slice(0, 2).join(", ")}.`
    );
  }
  if (weaknesses.length) {
    parts.push(
      `Tradeoff to weigh: ${weaknesses[0]}.`
    );
  }
  if (pageTypeId.startsWith("budget")) {
    parts.push(
      `Ex-showroom from ${formatLakh(variant.pricing?.exShowroom)} — verify on-road price in your city.`
    );
  }

  return sanitizeEditorialText(
    parts.join(" ") ||
      "Review charging access and on-road pricing in your city before deciding."
  );
}

module.exports = {
  buildIntro,
  buildExplanation,
  buildTradeoffSummary,
  formatLakh,
  applyTemplate,
  INTRO_TEMPLATES,
};
