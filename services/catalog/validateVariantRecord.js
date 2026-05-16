const REQUIRED_PATHS = [
  "identity.slug",
  "identity.brandSlug",
  "identity.modelSlug",
  "identity.variantName",
  "identity.segment",
  "pricing.exShowroom",
  "battery.capacityKwh",
  "range.claimedKm",
  "media.heroImage",
  "seo.metaTitle",
  "seo.metaDescription",
  "seo.pros",
  "seo.cons",
  "seo.expertSummary",
];

function get(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function validateVariantRecord(record) {
  const errors = [];
  const warnings = [];

  if (!record || typeof record !== "object") {
    return { valid: false, errors: ["Record must be an object"], warnings };
  }

  for (const p of REQUIRED_PATHS) {
    const val = get(record, p);
    if (
      val === undefined ||
      val === null ||
      (Array.isArray(val) && val.length === 0)
    ) {
      errors.push(`Missing required field: ${p}`);
    }
  }

  const slug = record.identity?.slug;
  if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    errors.push(`Invalid slug format: ${slug}`);
  }

  if ((record.governance?.dataQualityScore ?? 0) < 85) {
    warnings.push(
      `dataQualityScore below 85 (${record.governance?.dataQualityScore})`
    );
  }

  const flags = record.verification?.flags || [];
  const estimated = flags.filter((f) =>
    ["estimated", "needs_review", "placeholder"].includes(f.status)
  );
  if (estimated.length > 0) {
    warnings.push(
      `${estimated.length} field(s) flagged for verification`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

module.exports = { validateVariantRecord, REQUIRED_PATHS };
