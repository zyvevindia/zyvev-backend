/**
 * Ownership confidence — practical editorial reassurance (not ratings).
 */

const { createFieldProvenance, SOURCE_TYPES, CONFIDENCE_LEVELS, VERIFICATION_STATUSES } = require("../catalog/intelligenceMetadata");

const META = createFieldProvenance({
  sourceType: SOURCE_TYPES.EDITORIAL_ESTIMATE,
  confidenceLevel: CONFIDENCE_LEVELS.MEDIUM,
  verificationStatus: VERIFICATION_STATUSES.PENDING_REVIEW,
  verificationMethod: "evsavari_ownership_confidence_v1",
}).metadata;

function level(score) {
  if (score >= 82) return "strong";
  if (score >= 65) return "moderate";
  return "limited";
}

function buildOwnershipConfidence(variant) {
  const ba = variant.buyerAssurance || {};
  const pe = variant.psychologyExtended?.scores || {};
  const p = variant.practicality || {};
  const op = variant.ownershipPracticality || {};

  const firstTimeEvFriendliness = level(
    ba.firstEVFriendly?.score ?? pe.firstTimeEvFriendliness ?? 70
  );
  const familyConfidence = level(
    ba.familyConfidence?.score ?? p.familyScore ?? 72
  );
  const cityPracticality = level(
    p.cityUsabilityScore ?? op.cityDrivingPracticality ?? 75
  );
  const longTermOwnership = level(
    variant.ownership?.resaleConfidenceScore ?? 75
  );
  const maintenanceSimplicity = level(ba.maintenanceStress?.score ?? 70);
  const easeOfUse = level(
    (p.cityUsabilityScore ?? 70) * 0.5 +
      (pe.seniorCitizenFriendliness ?? 72) * 0.3 +
      (pe.womenDriverFriendliness ?? 78) * 0.2
  );
  const seniorPracticality = level(pe.seniorCitizenFriendliness ?? 72);
  const ingressPracticality = level(op.ingressEgressPracticality ?? 74);
  const chauffeurPracticality = level(pe.chauffeurSuitability ?? 60);

  const editorialGuidance = [];

  if (firstTimeEvFriendliness === "strong") {
    editorialGuidance.push(
      "Beginner-friendly ownership profile when you can charge overnight or at work."
    );
  } else if (firstTimeEvFriendliness === "moderate") {
    editorialGuidance.push(
      "Manageable for first-time EV buyers who accept a short learning curve on charging."
    );
  }

  if (familyConfidence === "strong") {
    editorialGuidance.push(
      "Family practicality is strong for regular city and weekend use within range bands."
    );
  }

  if (cityPracticality === "strong") {
    editorialGuidance.push("City driving and parking footprint suit dense urban routines.");
  }

  if (maintenanceSimplicity === "strong" || maintenanceSimplicity === "moderate") {
    editorialGuidance.push(
      "Service intervals are generally predictable — confirm local workshop EV readiness."
    );
  }

  if (ingressPracticality === "strong") {
    editorialGuidance.push("Ingress/egress and visibility are practical for daily drivers.");
  }

  return {
    firstTimeEvFriendliness,
    familyConfidence,
    cityPracticality,
    longTermOwnership,
    maintenanceSimplicity,
    easeOfUse,
    seniorPracticality,
    ingressPracticality,
    chauffeurPracticality,
    editorialGuidance,
    metadata: {
      ...META,
      interpretation:
        "Qualitative confidence indicators — pair with warranty and charging access facts.",
    },
  };
}

module.exports = { buildOwnershipConfidence };
