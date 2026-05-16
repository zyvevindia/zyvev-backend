/**
 * Editorial tone + exaggerated claim detection.
 */

const { scanVariantEditorial } = require("../../editorial-intelligence/toneRules");

const UNSUPPORTED_SUPERLATIVE = [
  /\b(?:the )?best\b(?!\s+(?:for|aligned|value|family|city|highway|first|premium))/i,
  /\bperfect\b/i,
  /\bultimate\b/i,
  /\bunmatched\b/i,
];

function auditEditorial(variant) {
  const warnings = [];
  const errors = [];

  const toneHits = scanVariantEditorial(variant);
  for (const hit of toneHits) {
    warnings.push({
      code: "EDITORIAL_TONE_VIOLATION",
      message: `Banned tone at ${hit.path}: ${hit.hits.join(", ")}`,
      path: hit.path,
    });
  }

  const texts = [
    variant.seo?.expertSummary,
    variant.compare?.narrative?.betterAlignedReason,
    variant.compare?.narrative?.tradeoffSummary,
    ...(variant.decision?.whoShouldBuy || []),
  ].filter(Boolean);

  for (const text of texts) {
    for (const pattern of UNSUPPORTED_SUPERLATIVE) {
      if (pattern.test(text)) {
        warnings.push({
          code: "UNSUPPORTED_SUPERLATIVE",
          message: `Possible exaggerated claim: "${text.slice(0, 80)}..."`,
        });
        break;
      }
    }
  }

  if (variant.compare?.picks?.bestValuePick && !variant.compare?.valueScore) {
    warnings.push({
      code: "VALUE_PICK_NO_SCORE",
      message: "bestValuePick set without compare.valueScore",
    });
  }

  return { warnings, errors };
}

module.exports = { auditEditorial };
