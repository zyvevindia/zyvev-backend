#!/usr/bin/env node
/**
 * Seeds governed observation pilot for flagship variants.
 * Usage: node scripts/seed-observation-pilot.mjs [--reset]
 */

import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const {
  registerObservation,
  setObservationStatus,
  OBS_ROOT,
} = require("../services/real-world-observations");

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PILOT_VARIANTS = [
  "tata-nexon-ev-creative-plus",
  "tata-punch-ev-empowered-lr",
  "mg-comet-ev-play",
  "mahindra-be-6-pack-two",
  "citroen-ec3-live",
];

const OBSERVATIONS_BY_SLUG = {
  "tata-nexon-ev-creative-plus": [
    {
      observationType: "range_observation",
      summary:
        "Dense city commuting stays comfortable when daily distance fits conservative planning bands.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "apartment_charging",
      summary:
        "Overnight AC charging works well when parking access is confirmed — shared-basement setups need society approval.",
      editorialTone: "neutral",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "highway_practicality",
      summary:
        "High-speed highway stretches need disciplined charging stops — not a fill-and-go petrol rhythm.",
      editorialTone: "caution",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "ownership_comfort",
      summary:
        "First-time EV buyers appreciate Tata service density for early ownership questions.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "charging_observation",
      summary:
        "50 kW DC peak is adequate for planned stops but slower than newer 100+ kW rivals.",
      editorialTone: "neutral",
      confidenceLevel: "HIGH",
    },
  ],
  "tata-punch-ev-empowered-lr": [
    {
      observationType: "range_observation",
      summary:
        "Micro-SUV footprint suits urban duty cycles; long highway days need route planning.",
      editorialTone: "neutral",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "apartment_charging",
      summary:
        "Brochure-aligned AC times support overnight home charging when a dedicated socket is available.",
      editorialTone: "positive",
      confidenceLevel: "HIGH",
      verificationNotes: "Aligned with curator-reviewed brochure cycle 1",
    },
    {
      observationType: "charging_observation",
      summary:
        "DC sessions are practical for inter-city hops when drivers accept 50–60 minute top-up windows.",
      editorialTone: "neutral",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "ownership_comfort",
      summary:
        "Family buyers value elevated seating without stepping up to Nexon pricing.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
  ],
  "mg-comet-ev-play": [
    {
      observationType: "range_observation",
      summary:
        "Excellent for short city hops; highway touring is outside the sweet spot.",
      editorialTone: "caution",
      confidenceLevel: "HIGH",
    },
    {
      observationType: "apartment_charging",
      summary:
        "Compact footprint and AC charging simplicity suit tight parking and low daily km.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "charging_observation",
      summary:
        "Low charging stress for predictable city routines — anxiety rises on unplanned long routes.",
      editorialTone: "neutral",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "ownership_comfort",
      summary:
        "Two-to-four seat urban trips feel easy; rear adults are a compromise.",
      editorialTone: "neutral",
      confidenceLevel: "MEDIUM",
    },
  ],
  "mahindra-be-6-pack-two": [
    {
      observationType: "highway_practicality",
      summary:
        "175 kW DC headline supports planned highway legs better than mass-market 50 kW SUVs.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "charging_observation",
      summary:
        "11 kW AC suits dedicated home wallboxes; apartment shared parking still needs access clarity.",
      editorialTone: "neutral",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "service_observation",
      summary:
        "New nameplate — buyers should confirm Mahindra EV service lane availability in their city.",
      editorialTone: "caution",
      confidenceLevel: "LOW",
    },
    {
      observationType: "ownership_comfort",
      summary:
        "Born-electric cabin and tech appeal land well with upgrade buyers from ICE SUVs.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
  ],
  "citroen-ec3-live": [
    {
      observationType: "range_observation",
      summary:
        "City-first range band fits daily office loops; avoid treating ARAI claim as a highway guarantee.",
      editorialTone: "neutral",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "apartment_charging",
      summary:
        "AC-only charging is straightforward for overnight parking — no DC fallback on road trips.",
      editorialTone: "positive",
      confidenceLevel: "HIGH",
    },
    {
      observationType: "highway_practicality",
      summary:
        "Frequent highway travel without DC fast charge requires deliberate route discipline.",
      editorialTone: "caution",
      confidenceLevel: "HIGH",
    },
    {
      observationType: "charging_observation",
      summary:
        "Low charging-stress profile for urban owners with reliable home or office AC access.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
  ],
};

function resetStore() {
  if (fs.existsSync(OBS_ROOT)) {
    for (const f of fs.readdirSync(OBS_ROOT)) {
      if (f.endsWith(".json")) {
        fs.unlinkSync(path.join(OBS_ROOT, f));
      }
    }
  }
}

function main() {
  const reset = process.argv.includes("--reset");
  if (reset) resetStore();

  const seeded = [];
  for (const slug of PILOT_VARIANTS) {
    const rows = OBSERVATIONS_BY_SLUG[slug] || [];
    for (const row of rows) {
      const item = registerObservation({
        tier1VariantSlug: slug,
        sourceClassification: "EDITORIAL_FIELD_OPS",
        submittedBy: "observation_pilot_v1",
        extractionMethod: "EDITORIAL_SYNTHESIS",
        ...row,
      });
      setObservationStatus(
        item.observationId,
        "verified_editorial",
        "Pilot observation — editorial governance sign-off"
      );
      seeded.push(item.observationId);
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        variants: PILOT_VARIANTS.length,
        observationsSeeded: seeded.length,
        observationIds: seeded,
      },
      null,
      2
    )
  );
}

main();
