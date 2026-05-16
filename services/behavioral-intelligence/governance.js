/**
 * Privacy governance for behavioral intelligence.
 */

const {
  PROHIBITED_PAYLOAD_KEYS,
  isAllowedEventType,
} = require("./eventSchema");

const RETENTION_POLICY = {
  defaultDays: 90,
  description:
    "Anonymous session events only; TTL purge via MongoDB index.",
};

const PROHIBITED_PRACTICES = [
  "cross_site_tracking",
  "device_fingerprinting",
  "third_party_ad_pixels",
  "storing_lead_pii_in_behavior_events",
  "demographic_profiling",
  "invasive_heatmaps",
];

function assertGovernanceCompliance(event) {
  const violations = [];

  if (!isAllowedEventType(event.eventType)) {
    violations.push({
      code: "DISALLOWED_EVENT",
      message: `Event type not in allowlist: ${event.eventType}`,
    });
  }

  for (const practice of PROHIBITED_PRACTICES) {
    if (event.payload?.trackingMode === practice) {
      violations.push({
        code: "PROHIBITED_PRACTICE",
        message: practice,
      });
    }
  }

  return violations;
}

function getGovernanceManifest() {
  return {
    anonymousOnly: true,
    sessionBased: true,
    piiInEvents: false,
    retention: RETENTION_POLICY,
    prohibitedPractices: PROHIBITED_PRACTICES,
    prohibitedPayloadKeys: [...PROHIBITED_PAYLOAD_KEYS],
  };
}

module.exports = {
  RETENTION_POLICY,
  PROHIBITED_PRACTICES,
  assertGovernanceCompliance,
  getGovernanceManifest,
};
