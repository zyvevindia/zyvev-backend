#!/usr/bin/env node
/**
 * Expands moderated observations to next-priority variants (no reset).
 * Usage: node scripts/seed-observation-expansion.mjs
 */

import { createRequire } from "module";

const require = createRequire(import.meta.url);
const {
  registerObservation,
  setObservationStatus,
  listObservations,
} = require("../services/real-world-observations");

const EXPANSION_VARIANTS = [
  "tata-nexon-ev-empowered-lr",
  "mahindra-xev-9e-pack-two",
  "tata-curvv-ev-empowered-lr",
  "tata-tiago-ev-xt",
  "mg-zs-ev-excite",
];

const OBSERVATIONS_BY_SLUG = {
  "tata-nexon-ev-empowered-lr": [
    {
      observationType: "range_observation",
      summary:
        "LR pack improves inter-city confidence versus Creative+ — still plan DC stops on long highways.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "highway_practicality",
      summary:
        "50 kW DC is workable for planned touring; faster rivals reduce wait-time flexibility.",
      editorialTone: "neutral",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "charging_observation",
      summary:
        "Overnight AC remains the daily rhythm; workplace charging reduces weekend range anxiety.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "ownership_comfort",
      summary:
        "Strong choice for first-time EV buyers stepping up from Tata ICE with service familiarity.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
  ],
  "mahindra-xev-9e-pack-two": [
    {
      observationType: "highway_practicality",
      summary:
        "Three-row space plus 175 kW DC suits family highway legs when routes are pre-mapped.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "charging_observation",
      summary:
        "11 kW AC fits dedicated parking; apartment buyers should confirm society approvals early.",
      editorialTone: "neutral",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "ownership_comfort",
      summary:
        "Family upgrade buyers value space and range over mass-market pricing — set expectations accordingly.",
      editorialTone: "neutral",
      confidenceLevel: "MEDIUM",
    },
  ],
  "tata-curvv-ev-empowered-lr": [
    {
      observationType: "range_observation",
      summary:
        "Coupe-SUV profile with long-range band — city efficiency strong, verify launch pricing before booking.",
      editorialTone: "neutral",
      confidenceLevel: "LOW",
    },
    {
      observationType: "charging_observation",
      summary:
        "Fast-charge headline competitive in segment — confirm homologation-aligned times per trim.",
      editorialTone: "neutral",
      confidenceLevel: "LOW",
    },
    {
      observationType: "apartment_charging",
      summary:
        "Wallbox-friendly AC profile; shared parking still needs explicit access confirmation.",
      editorialTone: "neutral",
      confidenceLevel: "MEDIUM",
    },
  ],
  "tata-tiago-ev-xt": [
    {
      observationType: "range_observation",
      summary:
        "Budget hatch sweet spot for short city loops — not positioned for frequent unplanned highway travel.",
      editorialTone: "caution",
      confidenceLevel: "HIGH",
    },
    {
      observationType: "apartment_charging",
      summary:
        "Compact footprint eases tight parking; AC overnight charging is the primary ownership pattern.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "ownership_comfort",
      summary:
        "Entry Tata EV for value-first buyers — charging education matters more than feature wow.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
  ],
  "mg-zs-ev-excite": [
    {
      observationType: "highway_practicality",
      summary:
        "Mid-size EV with usable highway bands — DC planning still required versus newest 150+ kW rivals.",
      editorialTone: "neutral",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "charging_observation",
      summary:
        "Home AC + occasional DC fits mixed city-highway households with mapped chargers.",
      editorialTone: "neutral",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "ownership_comfort",
      summary:
        "Family cross-shop staple — boot and rear seat practicality land well for urban families.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
  ],
};

function slugHasObservations(slug) {
  const { items } = listObservations({ tier1VariantSlug: slug });
  return items.filter((i) => i.status === "verified_editorial").length >= 3;
}

function main() {
  const seeded = [];
  const skipped = [];

  for (const slug of EXPANSION_VARIANTS) {
    if (slugHasObservations(slug)) {
      skipped.push(slug);
      continue;
    }
    for (const row of OBSERVATIONS_BY_SLUG[slug] || []) {
      const item = registerObservation({
        tier1VariantSlug: slug,
        sourceClassification: "EDITORIAL_FIELD_OPS",
        submittedBy: "observation_expansion_v1",
        extractionMethod: "EDITORIAL_SYNTHESIS",
        ...row,
      });
      setObservationStatus(
        item.observationId,
        "verified_editorial",
        "Expansion pilot — controlled launch learning cycle"
      );
      seeded.push(item.observationId);
    }
  }

  console.log(
    JSON.stringify(
      { ok: true, seeded: seeded.length, skipped, observationIds: seeded },
      null,
      2
    )
  );
}

main();
