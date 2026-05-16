/**
 * Safety intelligence consistency rules.
 */

function auditSafety(variant) {
  const warnings = [];
  const errors = [];
  const safety = variant.safety;

  if (!safety) {
    warnings.push({
      code: "SAFETY_MISSING",
      message: "No safety block present",
    });
    return { warnings, errors };
  }

  const adasLevel = safety.adas?.level ?? 0;
  const features = safety.adas?.features || [];
  const airbags = safety.airbags?.count;

  if (adasLevel >= 2 && features.length === 0) {
    errors.push({
      code: "ADAS_L2_NO_FEATURES",
      message: "ADAS level 2 declared without supporting feature list",
    });
  }

  if (adasLevel >= 1 && !(safety.cameraSystems?.length)) {
    warnings.push({
      code: "ADAS_NO_CAMERAS",
      message: "ADAS level set but cameraSystems empty",
    });
  }

  if (airbags != null && (airbags < 2 || airbags > 12)) {
    errors.push({
      code: "AIRBAG_COUNT_IMPLAUSIBLE",
      message: `Airbag count ${airbags} outside plausible range 2–12`,
    });
  }

  if (safety.bharatNcap?.stars != null) {
    const reg = variant.intelligenceGovernance?.fields;
    if (!reg?.["safety.bharatNcap.stars"]) {
      warnings.push({
        code: "NCAP_NO_PROVENANCE",
        message: "Bharat NCAP stars present without provenance metadata",
      });
    }
  }

  if (adasLevel >= 2 && !safety.parkingAssist?.length) {
    warnings.push({
      code: "ADAS_L2_NO_PARKING",
      message: "Level 2 ADAS typically includes parking assist metadata",
    });
  }

  return { warnings, errors };
}

module.exports = { auditSafety };
