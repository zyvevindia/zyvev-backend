/**
 * Provenance + confidence metadata for intelligence-derived fields.
 * Facts vs interpretations — reusable across master + legacy mappers.
 */

const SOURCE_TYPES = Object.freeze({
  OFFICIAL_OEM: "OFFICIAL_OEM",
  OFFICIAL_NCAP: "OFFICIAL_NCAP",
  EDITORIAL_ESTIMATE: "EDITORIAL_ESTIMATE",
  INDUSTRY_ESTIMATE: "INDUSTRY_ESTIMATE",
  DERIVED_LOGIC: "DERIVED_LOGIC",
  USER_REPORTED: "USER_REPORTED",
  THIRD_PARTY_REFERENCE: "THIRD_PARTY_REFERENCE",
});

const CONFIDENCE_LEVELS = Object.freeze({
  VERIFIED: "verified",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
  EXPERIMENTAL: "experimental",
});

const VERIFICATION_STATUSES = Object.freeze({
  VERIFIED: "verified",
  PENDING_REVIEW: "pending_review",
  UNVERIFIED: "unverified",
});

/**
 * @param {object} opts
 * @returns {{ metadata: object }}
 */
function createFieldProvenance(opts = {}) {
  const {
    sourceType = SOURCE_TYPES.DERIVED_LOGIC,
    confidenceLevel = CONFIDENCE_LEVELS.MEDIUM,
    verificationStatus = VERIFICATION_STATUSES.PENDING_REVIEW,
    lastVerifiedAt = null,
    verificationMethod = null,
  } = opts;

  if (!Object.values(SOURCE_TYPES).includes(sourceType)) {
    throw new Error(`Invalid sourceType: ${sourceType}`);
  }

  return {
    metadata: {
      sourceType,
      confidenceLevel,
      verificationStatus,
      lastVerifiedAt,
      verificationMethod,
    },
  };
}

/**
 * Attach provenance registry for a variant (field-path keyed).
 */
function buildProvenanceRegistry(variant, overrides = {}) {
  const fields = { ...overrides };
  const gov = variant.governance || {};
  const verifiedAt =
    variant.verification?.lastReviewedAt ||
    gov.publishedAt ||
    null;

  const set = (path, metaOpts) => {
    if (!fields[path]) {
      fields[path] = createFieldProvenance(metaOpts);
    }
  };

  set("pricing.exShowroom", {
    sourceType: SOURCE_TYPES.OFFICIAL_OEM,
    confidenceLevel: CONFIDENCE_LEVELS.HIGH,
    verificationStatus: VERIFICATION_STATUSES.PENDING_REVIEW,
    verificationMethod: "oem_price_list",
    lastVerifiedAt: variant.pricing?.priceLastUpdated || null,
  });

  set("range.claimedKm", {
    sourceType: SOURCE_TYPES.OFFICIAL_OEM,
    confidenceLevel: CONFIDENCE_LEVELS.VERIFIED,
    verificationStatus: VERIFICATION_STATUSES.PENDING_REVIEW,
    verificationMethod: "arai_certification",
  });

  set("range.realWorldKm", {
    sourceType: SOURCE_TYPES.EDITORIAL_ESTIMATE,
    confidenceLevel: CONFIDENCE_LEVELS.MEDIUM,
    verificationStatus: VERIFICATION_STATUSES.PENDING_REVIEW,
    verificationMethod: "evsavari_mixed_cycle_model",
  });

  set("battery.capacityKwh", {
    sourceType: SOURCE_TYPES.OFFICIAL_OEM,
    confidenceLevel: CONFIDENCE_LEVELS.HIGH,
    verificationStatus: VERIFICATION_STATUSES.PENDING_REVIEW,
    verificationMethod: "oem_spec_sheet",
  });

  set("charging.dcTime10to80Minutes", {
    sourceType: SOURCE_TYPES.OFFICIAL_OEM,
    confidenceLevel: CONFIDENCE_LEVELS.HIGH,
    verificationStatus: VERIFICATION_STATUSES.PENDING_REVIEW,
    verificationMethod: "oem_charging_spec",
  });

  set("safety.airbags.count", {
    sourceType: SOURCE_TYPES.OFFICIAL_OEM,
    confidenceLevel: CONFIDENCE_LEVELS.HIGH,
    verificationStatus: VERIFICATION_STATUSES.PENDING_REVIEW,
    verificationMethod: "oem_spec_sheet",
  });

  if (variant.safety?.bharatNcap?.stars != null) {
    set("safety.bharatNcap.stars", {
      sourceType: SOURCE_TYPES.OFFICIAL_NCAP,
      confidenceLevel: CONFIDENCE_LEVELS.VERIFIED,
      verificationStatus: VERIFICATION_STATUSES.PENDING_REVIEW,
      verificationMethod: "bharat_ncap_publish",
      lastVerifiedAt: verifiedAt,
    });
  }

  set("safety.adas.level", {
    sourceType: SOURCE_TYPES.DERIVED_LOGIC,
    confidenceLevel: CONFIDENCE_LEVELS.MEDIUM,
    verificationStatus: VERIFICATION_STATUSES.UNVERIFIED,
    verificationMethod: "feature_matrix_inference",
  });

  set("personaFit", {
    sourceType: SOURCE_TYPES.DERIVED_LOGIC,
    confidenceLevel: CONFIDENCE_LEVELS.MEDIUM,
    verificationStatus: VERIFICATION_STATUSES.PENDING_REVIEW,
    verificationMethod: "score_composite",
  });

  set("scenarioFit", {
    sourceType: SOURCE_TYPES.DERIVED_LOGIC,
    confidenceLevel: CONFIDENCE_LEVELS.MEDIUM,
    verificationStatus: VERIFICATION_STATUSES.PENDING_REVIEW,
    verificationMethod: "scenario_model_v1",
  });

  set("decision.whoShouldBuy", {
    sourceType: SOURCE_TYPES.EDITORIAL_ESTIMATE,
    confidenceLevel: CONFIDENCE_LEVELS.MEDIUM,
    verificationStatus: VERIFICATION_STATUSES.PENDING_REVIEW,
    verificationMethod: "editorial_template",
  });

  set("compare.narrative", {
    sourceType: SOURCE_TYPES.EDITORIAL_ESTIMATE,
    confidenceLevel: CONFIDENCE_LEVELS.MEDIUM,
    verificationStatus: VERIFICATION_STATUSES.PENDING_REVIEW,
    verificationMethod: "compare_template_v1",
  });

  set("psychologyExtended.scores", {
    sourceType: SOURCE_TYPES.DERIVED_LOGIC,
    confidenceLevel: CONFIDENCE_LEVELS.MEDIUM,
    verificationStatus: VERIFICATION_STATUSES.PENDING_REVIEW,
    verificationMethod: "psychology_composite",
  });

  set("ownershipIntelligence.insuranceAnnualRangeInr", {
    sourceType: SOURCE_TYPES.INDUSTRY_ESTIMATE,
    confidenceLevel: CONFIDENCE_LEVELS.LOW,
    verificationStatus: VERIFICATION_STATUSES.UNVERIFIED,
    verificationMethod: "ex_showroom_heuristic",
  });

  set("rangeReality", {
    sourceType: SOURCE_TYPES.DERIVED_LOGIC,
    confidenceLevel: CONFIDENCE_LEVELS.MEDIUM,
    verificationStatus: VERIFICATION_STATUSES.PENDING_REVIEW,
    verificationMethod: "evsavari_range_reality_v1",
  });

  set("chargingReality", {
    sourceType: SOURCE_TYPES.DERIVED_LOGIC,
    confidenceLevel: CONFIDENCE_LEVELS.MEDIUM,
    verificationStatus: VERIFICATION_STATUSES.PENDING_REVIEW,
    verificationMethod: "evsavari_charging_reality_v1",
  });

  set("buyerAssurance", {
    sourceType: SOURCE_TYPES.DERIVED_LOGIC,
    confidenceLevel: CONFIDENCE_LEVELS.MEDIUM,
    verificationStatus: VERIFICATION_STATUSES.PENDING_REVIEW,
    verificationMethod: "evsavari_buyer_assurance_v1",
  });

  set("ownershipTradeoffs", {
    sourceType: SOURCE_TYPES.EDITORIAL_ESTIMATE,
    confidenceLevel: CONFIDENCE_LEVELS.MEDIUM,
    verificationStatus: VERIFICATION_STATUSES.PENDING_REVIEW,
    verificationMethod: "evsavari_tradeoff_v1",
  });

  set("scenarioCompare", {
    sourceType: SOURCE_TYPES.EDITORIAL_ESTIMATE,
    confidenceLevel: CONFIDENCE_LEVELS.MEDIUM,
    verificationStatus: VERIFICATION_STATUSES.PENDING_REVIEW,
    verificationMethod: "evsavari_scenario_compare_v1",
  });

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    fields,
  };
}

function getFieldProvenance(registry, path) {
  return registry?.fields?.[path]?.metadata || null;
}

module.exports = {
  SOURCE_TYPES,
  CONFIDENCE_LEVELS,
  VERIFICATION_STATUSES,
  createFieldProvenance,
  buildProvenanceRegistry,
  getFieldProvenance,
};
