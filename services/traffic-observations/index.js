/**
 * Traffic observation helpers — foundation for manual GSC/analytics notes.
 */

const {
  createTrafficObservation,
  createLandingEffectivenessRecord,
  TRAFFIC_LEARNING_SCHEMA,
} = require("../traffic-learning");

function createLandingPageObservation({
  pagePath,
  pageType,
  sessions = 0,
  leads = 0,
  compareStarts = 0,
  periodDays = 7,
  source = "manual",
  notes = "",
}) {
  return {
    ...createLandingEffectivenessRecord({
      pagePath,
      pageType,
      sessions,
      leads,
      compareStarts,
      periodDays,
    }),
    source,
    notes,
    observationType: "landing_page",
  };
}

function createCompareEntryObservation({
  entryPath = "/compare",
  sessions = 0,
  compareStarts = 0,
  compareCompletions = 0,
  leads = 0,
  periodDays = 7,
  notes = "",
}) {
  const completionRate =
    compareStarts > 0 ? compareCompletions / compareStarts : 0;
  return {
    observationType: "compare_entry",
    entryPath,
    sessions,
    compareStarts,
    compareCompletions,
    completionRate: Math.round(completionRate * 1000) / 1000,
    leads,
    periodDays,
    notes,
    recordedAt: new Date().toISOString(),
  };
}

function createSeoGuideEngagementObservation({
  seoSlug,
  impressions = null,
  clicks = null,
  seoToDetailTransitions = 0,
  leads = 0,
  periodDays = 7,
  notes = "",
}) {
  return {
    observationType: "seo_guide_engagement",
    seoSlug,
    pagePath: `/cars/${seoSlug}`,
    impressions,
    clicks,
    seoToDetailTransitions,
    leads,
    periodDays,
    notes,
    recordedAt: new Date().toISOString(),
    ctr:
      impressions > 0 && clicks != null
        ? Math.round((clicks / impressions) * 10000) / 10000
        : null,
  };
}

function createOwnershipPanelObservation({
  detailViews = 0,
  ownershipPanelViews = 0,
  chargingExpanded = 0,
  periodDays = 7,
  notes = "",
}) {
  const rate =
    detailViews > 0 ? ownershipPanelViews / detailViews : 0;
  return {
    observationType: "ownership_panel_engagement",
    detailViews,
    ownershipPanelViews,
    chargingExpanded,
    engagementRate: Math.round(rate * 1000) / 1000,
    periodDays,
    notes,
    recordedAt: new Date().toISOString(),
  };
}

function buildTrafficObservationTemplate() {
  return {
    schema: TRAFFIC_LEARNING_SCHEMA,
    examples: {
      gscCtr: createTrafficObservation({
        pagePath: "/cars/best-evs-for-city-driving",
        impressions: 500,
        clicks: 20,
        periodStart: "2026-05-01",
        periodEnd: "2026-05-07",
      }),
      landing: createLandingPageObservation({
        pagePath: "/cars/tata-nexon-ev-empowered-lr",
        pageType: "vehicle_detail",
        sessions: 100,
        leads: 3,
      }),
      compare: createCompareEntryObservation({
        compareStarts: 40,
        compareCompletions: 25,
        leads: 5,
      }),
      seo: createSeoGuideEngagementObservation({
        seoSlug: "best-evs-for-city-driving",
        clicks: 45,
        seoToDetailTransitions: 12,
        leads: 2,
      }),
      ownership: createOwnershipPanelObservation({
        detailViews: 200,
        ownershipPanelViews: 45,
      }),
    },
    storagePath: "ops/traffic-observations.jsonl",
  };
}

module.exports = {
  createLandingPageObservation,
  createCompareEntryObservation,
  createSeoGuideEngagementObservation,
  createOwnershipPanelObservation,
  buildTrafficObservationTemplate,
};
