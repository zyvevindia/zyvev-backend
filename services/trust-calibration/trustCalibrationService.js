/**
 * Trust calibration — aggregates governed observations to inform editorial guidance.
 * Does NOT auto-overwrite Tier-1 or trust blocks.
 */

const {
  listObservations,
  observationSupportBySlug,
} = require("../real-world-observations");
const {
  computeFreshness,
  normalizeStatus,
  isActiveStatus,
} = require("../real-world-observations/governance");

const TYPE_THEMES = {
  range_real_world: "range",
  range_observation: "range",
  charging_experience: "charging",
  charging_observation: "charging",
  apartment_charging: "apartment_charging",
  highway_practicality: "highway",
  highway_observation: "highway",
  ownership_comfort: "ownership",
  service_experience: "service",
  service_observation: "service",
  traffic_impact: "range",
};

function weightForObservation(item) {
  const status = normalizeStatus(item.status);
  let base =
    status === "verified_editorial"
      ? 1
      : status === "low_confidence"
        ? 0.4
        : status === "pending_review"
          ? 0.25
          : 0.1;
  const fresh = computeFreshness(item);
  return base * fresh.weight;
}

function aggregateObservationsForSlug(tier1VariantSlug) {
  const { items } = listObservations({ tier1VariantSlug });
  const active = items.filter((i) => isActiveStatus(i.status));

  const themes = {};
  const conflicts = [];

  for (const item of active) {
    const theme = TYPE_THEMES[item.observationType] || "general";
    if (!themes[theme]) {
      themes[theme] = { positive: 0, caution: 0, neutral: 0, notes: [] };
    }
    const w = weightForObservation(item);
    const tone = item.editorialTone || inferTone(item.summary);
    themes[theme][tone] += w;
    if (statusAllowsNote(item)) {
      themes[theme].notes.push({
        summary: item.summary,
        weight: w,
        status: normalizeStatus(item.status),
        observationId: item.observationId,
      });
    }
  }

  for (const [theme, bucket] of Object.entries(themes)) {
    if (bucket.positive > 0 && bucket.caution > 0) {
      const ratio = bucket.caution / (bucket.positive + bucket.caution);
      if (ratio > 0.35) {
        conflicts.push({
          theme,
          type: "mixed_signals",
          message: `Conflicting ${theme} observations — editorial review recommended`,
          positiveWeight: bucket.positive,
          cautionWeight: bucket.caution,
        });
      }
    }
  }

  const support = observationSupportBySlug(tier1VariantSlug);
  const recurringThemes = detectRecurringThemes(active);
  const staleFlags = detectStaleObservationsForSlug(tier1VariantSlug);
  const suggestions = buildCalibrationSuggestions(
    themes,
    support,
    recurringThemes
  );

  return {
    tier1VariantSlug,
    support,
    themeWeights: themes,
    recurringThemes,
    staleFlags,
    conflicts,
    suggestions,
    calibrationReady:
      support.approved >= 2 && conflicts.length === 0 && staleFlags.length === 0,
    metadata: {
      autoApply: false,
      purpose: "editorial_guidance_only",
    },
  };
}

function statusAllowsNote(item) {
  const s = normalizeStatus(item.status);
  return s === "verified_editorial" || s === "low_confidence";
}

function inferTone(summary = "") {
  const s = summary.toLowerCase();
  if (
    /friction|stress|anxiety|planning|limited|slower|challenge|difficult/.test(s)
  ) {
    return "caution";
  }
  if (/strong|excellent|comfortable|works well|low stress|practical/.test(s)) {
    return "positive";
  }
  return "neutral";
}

function detectRecurringThemes(activeItems) {
  const themeCounts = {};
  for (const item of activeItems) {
    const theme = TYPE_THEMES[item.observationType] || "general";
    themeCounts[theme] = (themeCounts[theme] || 0) + 1;
  }
  return Object.entries(themeCounts)
    .filter(([, count]) => count >= 3)
    .map(([theme, count]) => ({
      theme,
      count,
      note: `Recurring ${theme} theme — editorial reinforcement or conflict review`,
    }));
}

function detectStaleObservationsForSlug(tier1VariantSlug) {
  const { items } = listObservations({ tier1VariantSlug });
  return items
    .filter((i) => isActiveStatus(i.status))
    .filter((i) => computeFreshness(i).tier === "stale")
    .map((i) => ({
      observationId: i.observationId,
      type: "stale_observation",
      message: `Observation older than freshness window — refresh or archive`,
      observationType: i.observationType,
    }));
}

function buildCalibrationSuggestions(themes, support, recurringThemes = []) {
  const out = [];
  if (support.approved < 2) {
    out.push({
      key: "insufficient_observations",
      priority: "high",
      message:
        "Fewer than two verified editorial observations — keep derived trust language conservative.",
    });
  }
  if (support.approved >= 4) {
    out.push({
      key: "trust_confidence_reinforcement",
      priority: "low",
      message:
        "Strong observation support — editorial may reinforce trust bands after human review (no auto-apply).",
    });
  }
  const highway = themes.highway;
  if (highway?.caution > highway?.positive * 1.2) {
    out.push({
      key: "highway_caution",
      priority: "medium",
      message:
        "Repeated highway practicality friction in observations — tighten highway confidence wording.",
    });
  }
  const apt = themes.apartment_charging;
  if (apt?.caution > apt?.positive) {
    out.push({
      key: "apartment_friction",
      priority: "medium",
      message:
        "Apartment charging friction noted — emphasize parking access and AC overnight suitability.",
    });
  }
  const charging = themes.charging;
  if (charging?.caution > charging?.positive * 1.1) {
    out.push({
      key: "charging_stress_signal",
      priority: "medium",
      message:
        "Charging stress pattern in observations — review chargingPracticality and anxiety copy.",
    });
  }
  if (charging?.positive > charging?.caution * 2) {
    out.push({
      key: "charging_reassurance",
      priority: "low",
      message:
        "Consistent positive charging practicality observations — may support anxiety-reduction copy.",
    });
  }
  const ownership = themes.ownership;
  if (ownership?.positive > ownership?.caution * 1.5) {
    out.push({
      key: "ownership_comfort_reinforcement",
      priority: "low",
      message:
        "Ownership comfort themes recurring — ownership reassurance blocks may align.",
    });
  }
  for (const rt of recurringThemes) {
    if (rt.theme === "charging" || rt.theme === "apartment_charging") {
      out.push({
        key: `recurring_${rt.theme}`,
        priority: "low",
        message: `${rt.count} observations on ${rt.theme} — ensure trust copy does not contradict cluster.`,
      });
    }
  }
  return out;
}

function validateTrustConsistency(variant) {
  const slug = variant.identity?.slug || variant.slug;
  const cal = slug ? aggregateObservationsForSlug(slug) : null;
  const issues = [];

  const rr = variant.rangeRealityExpanded;
  const cp = variant.chargingPracticality;
  if (cal?.conflicts?.length) {
    issues.push(...cal.conflicts.map((c) => ({ ...c, source: "observations" })));
  }
  if (
    rr?.confidenceBands?.highway === "strong" &&
    cal?.themeWeights?.highway?.caution > cal?.themeWeights?.highway?.positive
  ) {
    issues.push({
      type: "trust_mismatch",
      message:
        "Catalog highway band is strong but observations lean caution — reconcile editorially.",
    });
  }
  if (
    cp?.chargingStress === "low" &&
    cal?.themeWeights?.charging?.caution > cal?.themeWeights?.charging?.positive
  ) {
    issues.push({
      type: "trust_mismatch",
      message:
        "Low charging stress in catalog but caution-weighted charging observations.",
    });
  }

  return {
    slug,
    consistent: issues.length === 0,
    issues,
    calibration: cal,
  };
}

function buildFleetCalibrationSummary(slugs) {
  return slugs.map((slug) => ({
    slug,
    ...aggregateObservationsForSlug(slug),
  }));
}

function buildFleetTrustAnomalyReport(slugs) {
  const fs = require("fs");
  const path = require("path");
  const variantDir = path.join(
    __dirname,
    "../../docs/architecture/catalog/tier-1/variants"
  );

  return slugs.map((slug) => {
    const cal = aggregateObservationsForSlug(slug);
    const anomalies = [
      ...cal.conflicts.map((c) => ({ ...c, severity: "medium" })),
      ...cal.staleFlags.map((s) => ({ ...s, severity: "low" })),
    ];

    const variantPath = path.join(variantDir, `${slug}.json`);
    if (fs.existsSync(variantPath)) {
      try {
        const variant = JSON.parse(fs.readFileSync(variantPath, "utf8"));
        const consistency = validateTrustConsistency(variant);
        for (const issue of consistency.issues || []) {
          anomalies.push({ ...issue, severity: "high" });
        }
      } catch {
        /* skip parse errors */
      }
    }

    return {
      tier1VariantSlug: slug,
      anomalyCount: anomalies.length,
      calibrationReady: cal.calibrationReady,
      recurringThemes: cal.recurringThemes,
      anomalies: anomalies.slice(0, 6),
    };
  });
}

module.exports = {
  aggregateObservationsForSlug,
  validateTrustConsistency,
  buildFleetCalibrationSummary,
  buildFleetTrustAnomalyReport,
  detectRecurringThemes,
  detectStaleObservationsForSlug,
  weightForObservation,
};
