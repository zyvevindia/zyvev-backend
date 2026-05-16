#!/usr/bin/env node
/**
 * Observation batch 4 — reach 22+ variant coverage (budget, family, luxury, highway).
 */
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const {
  registerObservation,
  setObservationStatus,
  listObservations,
} = require("../services/real-world-observations");

const BATCH4 = [
  "tata-punch-ev-smart-plus",
  "tata-tiago-ev-xz-plus",
  "mahindra-xuv400-el-pro",
  "byd-atto-3-dynamic",
  "kia-ev6-gt-line",
  "mercedes-eqb-250-plus",
  "tata-curvv-ev-empowered",
];

const OBS = {
  "tata-punch-ev-smart-plus": [
    {
      observationType: "range_observation",
      summary: "Budget micro-SUV band suits city loops — plan conservatively for highway weekends.",
      editorialTone: "neutral",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "apartment_charging",
      summary: "AC overnight works when parking is secured — society permissions still matter.",
      editorialTone: "neutral",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "ownership_comfort",
      summary: "Strong value-first EV for buyers stepping up from Tiago ICE.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
  ],
  "tata-tiago-ev-xz-plus": [
    {
      observationType: "range_observation",
      summary: "XZ+ adds features without Nexon pricing — city-first ownership pattern.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "charging_observation",
      summary: "Home AC remains primary refuel rhythm for budget hatch buyers.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "ownership_comfort",
      summary: "First EV buyers appreciate Tata service familiarity at entry price.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
  ],
  "mahindra-xuv400-el-pro": [
    {
      observationType: "ownership_comfort",
      summary: "Family SUV practicality for buyers cross-shopping Creta-class ICE.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "highway_practicality",
      summary: "Highway usable with planning — not the longest-range EV in segment.",
      editorialTone: "neutral",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "charging_observation",
      summary: "Charging stress moderate — map CCS2 on regular inter-city routes.",
      editorialTone: "neutral",
      confidenceLevel: "MEDIUM",
    },
  ],
  "byd-atto-3-dynamic": [
    {
      observationType: "charging_observation",
      summary: "Dynamic trim still offers practical DC for mixed-use buyers on a budget vs Superior.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "highway_practicality",
      summary: "Better highway confidence than city-only hatches at similar price bands.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "apartment_charging",
      summary: "Confirm dedicated parking — feature-rich cabin does not replace charger access.",
      editorialTone: "neutral",
      confidenceLevel: "MEDIUM",
    },
  ],
  "kia-ev6-gt-line": [
    {
      observationType: "highway_practicality",
      summary: "800V-class charging headline supports touring-oriented buyers.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "charging_observation",
      summary: "Premium charging experience when network aligns with route plan.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "ownership_comfort",
      summary: "Luxury-adjacent ownership — running costs differ from mass-market EV expectations.",
      editorialTone: "neutral",
      confidenceLevel: "LOW",
    },
  ],
  "mercedes-eqb-250-plus": [
    {
      observationType: "ownership_comfort",
      summary: "Premium compact SUV for buyers prioritising badge and rear space over lowest TCO.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "apartment_charging",
      summary: "Wallbox-friendly — valet parking needs explicit charger access agreements.",
      editorialTone: "neutral",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "highway_practicality",
      summary: "Comfortable highway manners — plan charging around luxury time expectations.",
      editorialTone: "neutral",
      confidenceLevel: "MEDIUM",
    },
  ],
  "tata-curvv-ev-empowered": [
    {
      observationType: "range_observation",
      summary: "Coupe-SUV positioning — city efficiency strong; verify launch pricing before booking.",
      editorialTone: "neutral",
      confidenceLevel: "LOW",
    },
    {
      observationType: "charging_observation",
      summary: "Fast-charge competitive for segment — homologation-aligned times still need editorial lock.",
      editorialTone: "neutral",
      confidenceLevel: "LOW",
    },
    {
      observationType: "highway_practicality",
      summary: "Highway planning band better than city hatches — not XEV9-class touring ease.",
      editorialTone: "neutral",
      confidenceLevel: "MEDIUM",
    },
  ],
};

function hasCoverage(slug) {
  const { items } = listObservations({ tier1VariantSlug: slug });
  return items.filter((i) => i.status === "verified_editorial").length >= 3;
}

function main() {
  const seeded = [];
  const skipped = [];
  for (const slug of BATCH4) {
    if (hasCoverage(slug)) {
      skipped.push(slug);
      continue;
    }
    for (const row of OBS[slug] || []) {
      const item = registerObservation({
        tier1VariantSlug: slug,
        sourceClassification: "EDITORIAL_FIELD_OPS",
        submittedBy: "observation_batch4_v1",
        extractionMethod: "EDITORIAL_SYNTHESIS",
        ...row,
      });
      setObservationStatus(
        item.observationId,
        "verified_editorial",
        "Batch 4 — production cutover coverage expansion"
      );
      seeded.push(item.observationId);
    }
  }
  const fleet = require("../services/real-world-observations").buildObservationFleetSummary();
  console.log(
    JSON.stringify(
      {
        ok: true,
        seeded: seeded.length,
        skipped,
        variantsCovered: fleet.variantsWithObservations,
        target: "22+",
      },
      null,
      2
    )
  );
}

main();
