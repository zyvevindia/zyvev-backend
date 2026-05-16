#!/usr/bin/env node
/**
 * Observation expansion batch 3 — premium / highway-cross-shop variants.
 * Usage: node scripts/seed-observation-batch3.mjs
 */

import { createRequire } from "module";

const require = createRequire(import.meta.url);
const {
  registerObservation,
  setObservationStatus,
  listObservations,
} = require("../services/real-world-observations");

const BATCH3_VARIANTS = [
  "byd-atto-3-superior",
  "hyundai-kona-electric-premium",
  "mg-zs-ev-exclusive-plus",
  "bmw-ix1-xdrive30",
  "volvo-ex40-single-motor",
];

const OBSERVATIONS_BY_SLUG = {
  "byd-atto-3-superior": [
    {
      observationType: "charging_observation",
      summary:
        "Strong DC charging headline for segment — planned highway legs benefit versus 50 kW mass-market SUVs.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "highway_practicality",
      summary:
        "Better suited to mixed city-highway households than city-only micro EVs.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "apartment_charging",
      summary:
        "AC overnight remains primary; confirm dedicated parking before purchase.",
      editorialTone: "neutral",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "ownership_comfort",
      summary:
        "Feature-rich cabin — buyers should validate after-sales network density in their city.",
      editorialTone: "neutral",
      confidenceLevel: "LOW",
    },
  ],
  "hyundai-kona-electric-premium": [
    {
      observationType: "range_observation",
      summary:
        "Mature Kona EV platform — conservative planning bands suit daily commute plus occasional highway.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "highway_practicality",
      summary:
        "Highway confidence moderate-to-strong for segment; DC planning still required on long routes.",
      editorialTone: "neutral",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "charging_observation",
      summary:
        "Home AC + CCS2 network compatibility align with Hyundai ownership patterns.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
  ],
  "mg-zs-ev-exclusive-plus": [
    {
      observationType: "ownership_comfort",
      summary:
        "Mid-size SUV practicality suits family cross-shops from ICE compacts.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "highway_practicality",
      summary:
        "Exclusive+ trim improves feature comfort — highway charging discipline still applies.",
      editorialTone: "neutral",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "apartment_charging",
      summary:
        "Overnight AC workable with society approval — not the smallest footprint for tight basements.",
      editorialTone: "neutral",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "charging_observation",
      summary:
        "Charging stress moderate — map regular routes before committing to long tours.",
      editorialTone: "neutral",
      confidenceLevel: "MEDIUM",
    },
  ],
  "bmw-ix1-xdrive30": [
    {
      observationType: "highway_practicality",
      summary:
        "Premium compact SUV highway manners strong — ownership cost expectations differ from mass-market EVs.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "charging_observation",
      summary:
        "Fast-charge sessions suit premium buyer touring when routes are pre-planned.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "apartment_charging",
      summary:
        "Wallbox-friendly profile; valet/shared premium parking needs charger access clarity.",
      editorialTone: "neutral",
      confidenceLevel: "MEDIUM",
    },
  ],
  "volvo-ex40-single-motor": [
    {
      observationType: "ownership_comfort",
      summary:
        "Refined daily drive — buyers prioritise comfort and safety narrative over lowest price.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "highway_practicality",
      summary:
        "Single-motor efficiency helps city use; highway range planning uses conservative bands.",
      editorialTone: "neutral",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "charging_observation",
      summary:
        "Lower charging stress for buyers with home charging — public network planning for road trips.",
      editorialTone: "neutral",
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

  for (const slug of BATCH3_VARIANTS) {
    if (slugHasObservations(slug)) {
      skipped.push(slug);
      continue;
    }
    for (const row of OBSERVATIONS_BY_SLUG[slug] || []) {
      const item = registerObservation({
        tier1VariantSlug: slug,
        sourceClassification: "EDITORIAL_FIELD_OPS",
        submittedBy: "observation_batch3_v1",
        extractionMethod: "EDITORIAL_SYNTHESIS",
        ...row,
      });
      setObservationStatus(
        item.observationId,
        "verified_editorial",
        "Batch 3 — Week 1 live learning cycle"
      );
      seeded.push(item.observationId);
    }
  }

  console.log(
    JSON.stringify({ ok: true, seeded: seeded.length, skipped, observationIds: seeded }, null, 2)
  );
}

main();
