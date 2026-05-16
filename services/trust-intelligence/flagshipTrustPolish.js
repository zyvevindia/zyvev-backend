/**
 * Flagship trust copy polish — reduces repetitive derived language on top-traffic variants.
 */

const { sanitizeEditorialText } = require("../editorial-intelligence/toneRules");

const FLAGSHIP_POLISH = {
  "tata-nexon-ev-creative-plus": {
    headline:
      "India's most cross-shopped compact EV — best when your daily km fit conservative city bands.",
    rangeSummaries: [
      "Plan daily driving inside EVSavari city bands — not the ARAI headline alone.",
      "Highway weekends need charging stops; 50 kW DC suits planned routes.",
    ],
    chargingNotes: [
      "Overnight 7.2 kW AC is the everyday rhythm — confirm parking access first.",
    ],
  },
  "tata-nexon-ev-empowered-lr": {
    headline:
      "Long-range Nexon for buyers who want Tata service reach with fewer highway compromises.",
    rangeSummaries: [
      "LR bands improve inter-city confidence versus Creative+ — still plan fast-charge stops.",
    ],
    chargingNotes: [
      "56-minute indicative DC window — workable for disciplined highway legs.",
    ],
  },
  "tata-punch-ev-empowered-lr": {
    headline:
      "Micro-SUV EV with brochure-verified charging — ideal for urban families avoiding Nexon pricing.",
    chargingNotes: [
      "Brochure-aligned AC/DC times support overnight home charging when parking is secured.",
    ],
  },
  "mg-comet-ev-play": {
    headline:
      "Minimum footprint, minimum charging stress — built for short city loops, not touring.",
    rangeSummaries: [
      "Treat range as a city budget — unplanned highway days are the main mismatch.",
    ],
  },
  "mahindra-be-6-pack-two": {
    headline:
      "Born-electric SUV for upgrade buyers — strong DC headline, verify Mahindra EV service in your city.",
    chargingNotes: [
      "175 kW DC supports planned highway use; confirm Pack Two pricing before booking.",
    ],
  },
  "mahindra-xev-9e-pack-two": {
    headline:
      "Three-row electric SUV for families — space and range first, mass-market pricing second.",
    rangeSummaries: [
      "Pack Two bands suit family highway trips with mapped CCS2 stops.",
    ],
  },
  "byd-atto-3-superior": {
    headline:
      "Feature-rich Atto 3 for buyers cross-shopping mass-market SUVs — strong DC, verify service network.",
    chargingNotes: [
      "Superior trim DC headline helps planned highway use — home AC remains daily rhythm.",
    ],
  },
  "hyundai-kona-electric-premium": {
    headline:
      "Proven Kona EV platform — balanced city-highway EV for buyers wanting Hyundai familiarity.",
  },
  "mg-zs-ev-exclusive-plus": {
    headline:
      "Top ZS EV trim for family practicality — mid-size footprint with moderate charging planning.",
  },
  "bmw-ix1-xdrive30": {
    headline:
      "Premium compact EV — highway comfort and fast-charge capability for upgrade buyers.",
  },
  "volvo-ex40-single-motor": {
    headline:
      "Refined Scandinavian daily EV — comfort-first with conservative highway planning bands.",
  },
  "tata-punch-ev-smart-plus": {
    headline: "Entry Punch EV for budget-first city buyers — confirm parking before you buy.",
  },
  "tata-tiago-ev-xz-plus": {
    headline: "Top Tiago EV trim — city-first hatch with Tata service reach.",
  },
  "mahindra-xuv400-el-pro": {
    headline: "Family XUV400 for ICE upgraders — practical space with planned charging.",
  },
  "byd-atto-3-dynamic": {
    headline: "Value Atto 3 with usable DC — strong cross-shop against mass-market SUVs.",
  },
  "kia-ev6-gt-line": {
    headline: "GT-Line EV6 for buyers who want fast-charge highway confidence.",
  },
  "mercedes-eqb-250-plus": {
    headline: "EQB for premium family buyers — charging access clarity matters as much as badge.",
  },
  "tata-curvv-ev-empowered": {
    headline: "Curvv EV coupe-SUV — style-led city/highway mix; verify on-road price in your city.",
  },
};

function dedupeStrings(arr, max = 4) {
  const seen = new Set();
  const out = [];
  for (const s of arr || []) {
    const key = String(s).toLowerCase().trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(sanitizeEditorialText(s));
    if (out.length >= max) break;
  }
  return out;
}

function applyFlagshipTrustPolish(variant) {
  const slug = variant.identity?.slug;
  const polish = FLAGSHIP_POLISH[slug];
  if (!polish) return variant;

  const rr = { ...(variant.rangeRealityExpanded || {}) };
  const cp = { ...(variant.chargingPracticality || {}) };
  const tp = { ...(variant.trustPresentation || {}) };

  if (polish.headline) {
    tp.headline = sanitizeEditorialText(polish.headline);
  }

  if (polish.rangeSummaries?.length) {
    rr.editorialSummaries = dedupeStrings([
      ...polish.rangeSummaries,
      ...(rr.editorialSummaries || []),
    ]);
  }

  if (polish.chargingNotes?.length) {
    cp.editorialNotes = dedupeStrings([
      ...polish.chargingNotes,
      ...(cp.editorialNotes || []),
    ]);
  }

  tp.disclaimer =
    "Editorial confidence guidance for Indian ownership — not reviews, ratings, or range guarantees.";

  return {
    ...variant,
    rangeRealityExpanded: rr,
    chargingPracticality: cp,
    trustPresentation: tp,
  };
}

module.exports = { applyFlagshipTrustPolish, FLAGSHIP_POLISH };
