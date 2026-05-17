/** Operational audit log retention and limits. */

const OPS_AUDIT_RETENTION_DAYS = parseInt(
  process.env.OPS_AUDIT_RETENTION_DAYS || "180",
  10
);

const OPS_AUDIT_MAX_PAGE_SIZE = parseInt(
  process.env.OPS_AUDIT_MAX_PAGE_SIZE || "100",
  10
);

const OPS_AUDIT_DEFAULT_PAGE_SIZE = parseInt(
  process.env.OPS_AUDIT_DEFAULT_PAGE_SIZE || "50",
  10
);

module.exports = {
  OPS_AUDIT_RETENTION_DAYS,
  OPS_AUDIT_MAX_PAGE_SIZE,
  OPS_AUDIT_DEFAULT_PAGE_SIZE,
};
