#!/usr/bin/env node
/**
 * Observation batch 5 — scale to 80+ governed observations; deepen priority variants.
 */
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const {
  registerObservation,
  setObservationStatus,
  buildObservationFleetSummary,
} = require("../services/real-world-observations");

const OBS = {
  "volvo-ex40-twin-motor": [
    {
      observationType: "highway_practicality",
      summary:
        "Twin-motor EX40 suits confident highway merging — plan DC stops on long touring days.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "charging_observation",
      summary:
        "Premium buyers expect predictable CCS2 sessions — apartment access still gates daily ease.",
      editorialTone: "neutral",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "ownership_comfort",
      summary:
        "Scandinavian cabin calm helps luxury cross-shoppers — service network density varies by city.",
      editorialTone: "neutral",
      confidenceLevel: "LOW",
    },
  ],
  "mercedes-eqa-250-plus": [
    {
      observationType: "apartment_charging",
      summary:
        "Compact premium footprint suits gated communities with wallbox allocation.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "range_observation",
      summary:
        "City-first range band — weekend highway needs conservative planning vs larger EQ SUVs.",
      editorialTone: "neutral",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "charging_observation",
      summary:
        "Charging stress low for urban rhythm; inter-city requires mapped DC discipline.",
      editorialTone: "neutral",
      confidenceLevel: "MEDIUM",
    },
  ],
  "mg-comet-ev-plush-plus": [
    {
      observationType: "apartment_charging",
      summary:
        "Plush+ buyers still need society AC approval — micro-EV does not remove parking politics.",
      editorialTone: "caution",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "ownership_comfort",
      summary:
        "Second-car city runabout pattern — family highway duty stays on another vehicle.",
      editorialTone: "neutral",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "charging_observation",
      summary:
        "Home AC overnight covers most weeks — public DC is backup, not primary rhythm.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
  ],
  "mahindra-xuv400-ec-pro": [
    {
      observationType: "ownership_comfort",
      summary:
        "EC Pro trims value for buyers who want XUV400 practicality below EL pricing.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "highway_practicality",
      summary:
        "Highway usable with planning — battery band rewards city-heavy ownership.",
      editorialTone: "neutral",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "charging_observation",
      summary:
        "Moderate charging stress — map CCS2 before family inter-city trips.",
      editorialTone: "neutral",
      confidenceLevel: "MEDIUM",
    },
  ],
  "mahindra-be-6-pack-three-select": [
    {
      observationType: "charging_observation",
      summary:
        "Pack Three fast-charge headline helps reduce anxiety on planned corridors.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "highway_practicality",
      summary:
        "Born-EV platform confidence on highway — still verify real-world band vs ARAI.",
      editorialTone: "neutral",
      confidenceLevel: "LOW",
    },
    {
      observationType: "ownership_comfort",
      summary:
        "Tech-forward buyers accept new-brand service learning curve in early ownership.",
      editorialTone: "neutral",
      confidenceLevel: "LOW",
    },
  ],
  "mahindra-xev-9e-pack-three-select": [
    {
      observationType: "highway_practicality",
      summary:
        "Large SUV band supports family touring with scheduled DC — not impulse long hops.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "ownership_comfort",
      summary:
        "Three-row interest clusters around home charging and weekend getaway planning.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "apartment_charging",
      summary:
        "Villa buyers easier than tower societies — confirm 7.2 kW install before booking.",
      editorialTone: "neutral",
      confidenceLevel: "MEDIUM",
    },
  ],
  "citroen-ec3-shine": [
    {
      observationType: "range_observation",
      summary:
        "Shine trim city loops work — budget buyers should plan conservative highway margins.",
      editorialTone: "neutral",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "charging_observation",
      summary:
        "AC-first ownership keeps charging stress low for daily commute buyers.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "ownership_comfort",
      summary:
        "Distinctive design attracts first EV buyers — service reach check by pin code.",
      editorialTone: "neutral",
      confidenceLevel: "MEDIUM",
    },
  ],
  "byd-atto-3-superior": [
    {
      observationType: "charging_observation",
      summary:
        "Repeated field pattern: Superior DC sessions feel predictable on mapped CCS2 corridors.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "highway_practicality",
      summary:
        "Highway confidence above city-hatch class — still plan lunch-stop charging on 300+ km days.",
      editorialTone: "neutral",
      confidenceLevel: "MEDIUM",
    },
  ],
  "byd-atto-3-dynamic": [
    {
      observationType: "ownership_comfort",
      summary:
        "Dynamic buyers trade some feature depth for Atto practicality — city usability strong.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "apartment_charging",
      summary:
        "Society AC overnight works when parking is fixed — visitor parking breaks rhythm.",
      editorialTone: "caution",
      confidenceLevel: "MEDIUM",
    },
  ],
  "hyundai-kona-electric-premium": [
    {
      observationType: "highway_practicality",
      summary:
        "Kona Premium highway band suits mixed city+weekend buyers with mapped DC discipline.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "charging_observation",
      summary:
        "Charging stress moderate — home AC remains anchor for premium compact owners.",
      editorialTone: "neutral",
      confidenceLevel: "MEDIUM",
    },
  ],
  "mg-zs-ev-exclusive-plus": [
    {
      observationType: "apartment_charging",
      summary:
        "Tower buyers report friction without dedicated slot — confirm before assuming AC ease.",
      editorialTone: "caution",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "ownership_comfort",
      summary:
        "Family SUV comfort strong for school-run + weekend trips within range band.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
  ],
  "bmw-ix1-xdrive30": [
    {
      observationType: "charging_observation",
      summary:
        "Luxury compact charging expectations high — plan branded DC where network sparse.",
      editorialTone: "neutral",
      confidenceLevel: "LOW",
    },
    {
      observationType: "highway_practicality",
      summary:
        "Highway manners confident — range band still rewards urban-primary ownership.",
      editorialTone: "neutral",
      confidenceLevel: "MEDIUM",
    },
  ],
  "volvo-ex40-single-motor": [
    {
      observationType: "apartment_charging",
      summary:
        "Single-motor buyers often villa-park — tower AC needs explicit charger agreement.",
      editorialTone: "neutral",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "ownership_comfort",
      summary:
        "Safety-first narrative resonates — service cadence matters for premium retention.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
  ],
  "tata-curvv-ev-empowered-lr": [
    {
      observationType: "range_observation",
      summary:
        "LR band improves weekend confidence vs standard Empowered — still city-primary for many.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "charging_observation",
      summary:
        "Fast-charge competitive in coupe-SUV class — homologation-aligned times need editorial lock.",
      editorialTone: "neutral",
      confidenceLevel: "LOW",
    },
  ],
  "tata-tiago-ev-xt": [
    {
      observationType: "apartment_charging",
      summary:
        "XT buyers often first-time EV — society permission and meter segregation dominate ease.",
      editorialTone: "caution",
      confidenceLevel: "MEDIUM",
    },
    {
      observationType: "ownership_comfort",
      summary:
        "Entry Tiago EV ownership comfort high when expectations stay city-first.",
      editorialTone: "positive",
      confidenceLevel: "MEDIUM",
    },
  ],
};

function main() {
  const seeded = [];
  for (const [slug, rows] of Object.entries(OBS)) {
    for (const row of rows) {
      const item = registerObservation({
        tier1VariantSlug: slug,
        sourceClassification: "EDITORIAL_FIELD_OPS",
        submittedBy: "observation_batch5_v1",
        extractionMethod: "EDITORIAL_SYNTHESIS",
        ...row,
      });
      setObservationStatus(
        item.observationId,
        "verified_editorial",
        "Batch 5 — live intelligence ops scaling"
      );
      seeded.push({ observationId: item.observationId, slug });
    }
  }

  const fleet = buildObservationFleetSummary();
  console.log(
    JSON.stringify(
      {
        ok: true,
        seeded: seeded.length,
        totalObservations: fleet.totalObservations,
        variantsCovered: fleet.variantsWithObservations,
        target: "80+",
        metTarget: fleet.totalObservations >= 80,
      },
      null,
      2
    )
  );
}

main();
