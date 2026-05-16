/**
 * Trust signal foundation — catalog-derived snippets only.
 * NOT exposed as public ratings/reviews. Foundation for future UI.
 */

/**
 * @param {object} variant — Tier-1 variant
 * @returns {object|null}
 */
function buildTrustSignals(variant) {
  if (!variant?.identity?.slug) return null;

  const meta = variant.intelligenceGovernance;
  const ownership = variant.ownershipIntelligence;
  const charging = variant.chargingEcosystem;
  const range = variant.range;

  return {
    variantSlug: variant.identity.slug,
    verifiedOwnerInsights: {
      available: false,
      note: "Owner-verified insights pipeline not active — do not render synthetic reviews",
    },
    chargingExperienceSummary: charging?.homeCharging
      ? {
          homeAcSupported: charging.homeCharging.supported !== false,
          recommendedKw: charging.homeCharging.recommendedKw ?? null,
          networkCount:
            charging.networkCompatibility?.length ?? 0,
          source: "catalog_charging_ecosystem",
        }
      : null,
    ownershipConfidenceSnippet: ownership
      ? {
          resaleConfidenceScore:
            ownership.resaleConfidenceScore ?? null,
          serviceCostPerKm:
            ownership.estimatedServiceCostPerKm ?? null,
          disclaimer:
            "Indicative catalog signals — not a warranty or guarantee",
        }
      : null,
    dealerTrustMarkers: {
      available: false,
      note: "Dealer trust badges not exposed in marketplace activation v1",
    },
    provenanceAvailable: Boolean(meta?.fieldRegistry),
    realWorldRangeBand: range?.realWorldKm
      ? {
          min: range.realWorldKm.min,
          max: range.realWorldKm.max,
          methodology: range.realWorldKm.methodology,
        }
      : null,
    generatedAt: new Date().toISOString(),
    _policy: {
      noPublicStarRatings: true,
      noSyntheticReviews: true,
      noCommunityForum: true,
    },
  };
}

function buildTrustSignalsForCatalog(variants) {
  return variants
    .map(buildTrustSignals)
    .filter(Boolean);
}

module.exports = {
  buildTrustSignals,
  buildTrustSignalsForCatalog,
};
