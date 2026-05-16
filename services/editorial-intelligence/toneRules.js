/**
 * Trust-safe editorial tone — no freeform AI generation.
 */

const BANNED_PATTERNS = [
  /\bperfect\b/i,
  /\bbest ever\b/i,
  /\bultimate ev\b/i,
  /\bunbeatable\b/i,
  /\bno compromise\b/i,
  /\bguaranteed\b/i,
  /\b#1\b/,
  /\bbest in (?:india|class)\b/i,
];

const PREFERRED_REPLACEMENTS = [
  [/perfect for/gi, "well suited for"],
  [/perfect\b/gi, "well matched"],
  [/best-in[- ]/gi, "strong "],
  [/the best\b/gi, "a strong option"],
  [/best choice\b/gi, "practical choice"],
  [/ultimate\b/gi, "compelling"],
];

function sanitizeEditorialText(text) {
  if (!text || typeof text !== "string") return text;

  let out = text.trim();
  for (const [pattern, replacement] of PREFERRED_REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

function findToneViolations(text) {
  if (!text || typeof text !== "string") return [];
  const hits = [];
  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(text)) {
      hits.push(pattern.source);
    }
  }
  return hits;
}

function scanVariantEditorial(variant) {
  const violations = [];
  const texts = collectEditorialStrings(variant);

  for (const { path, text } of texts) {
    const hits = findToneViolations(text);
    if (hits.length) {
      violations.push({ path, hits, excerpt: text.slice(0, 120) });
    }
  }
  return violations;
}

function collectEditorialStrings(variant) {
  const out = [];
  const push = (path, val) => {
    if (typeof val === "string" && val) out.push({ path, text: val });
  };

  push("seo.expertSummary", variant.seo?.expertSummary);
  push("psychology.narrative", variant.psychology?.narrative);
  push("psychologyExtended.narrative", variant.psychologyExtended?.narrative);

  for (const [k, v] of Object.entries(variant.editorialNarratives || {})) {
    push(`editorialNarratives.${k}`, v);
  }

  if (variant.compare?.narrative) {
    push("compare.narrative.tradeoffSummary", variant.compare.narrative.tradeoffSummary);
    push("compare.narrative.betterAlignedReason", variant.compare.narrative.betterAlignedReason);
    for (const item of variant.compare.narrative.betterFor || []) {
      push("compare.narrative.betterFor", item);
    }
  }

  for (const line of variant.decision?.whoShouldBuy || []) {
    push("decision.whoShouldBuy", line);
  }
  for (const line of variant.decision?.whoShouldAvoid || []) {
    push("decision.whoShouldAvoid", line);
  }

  for (const item of variant.seo?.pros || []) push("seo.pros", item);
  for (const item of variant.seo?.cons || []) push("seo.cons", item);

  return out;
}

module.exports = {
  BANNED_PATTERNS,
  sanitizeEditorialText,
  findToneViolations,
  scanVariantEditorial,
};
