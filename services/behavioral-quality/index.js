/**
 * Behavioral quality summaries — session depth, progression rates.
 */

const BuyerBehaviorEvent = require("../../models/BuyerBehaviorEvent");
const { aggregateCompareAnalytics } = require("../buyer-intelligence/compareAnalytics");
const { EVENT_TYPES } = require("../behavioral-intelligence/eventSchema");

async function buildBehavioralQualityReport(sinceDays = 7) {
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);

  const events = await BuyerBehaviorEvent.find({
    createdAt: { $gte: since },
  })
    .sort({ timestamp: 1 })
    .lean();

  const compare = aggregateCompareAnalytics(events);

  const eventsBySession = new Map();
  for (const e of events) {
    if (!e.sessionId) continue;
    if (!eventsBySession.has(e.sessionId)) {
      eventsBySession.set(e.sessionId, []);
    }
    eventsBySession.get(e.sessionId).push(e);
  }

  const depths = [...eventsBySession.values()].map((arr) => arr.length);
  const avgSessionDepth =
    depths.length > 0
      ? Math.round(
          (depths.reduce((a, b) => a + b, 0) / depths.length) * 10
        ) / 10
      : 0;

  const detailViews = events.filter(
    (e) => e.eventType === EVENT_TYPES.DETAIL_PAGE_VIEWED
  ).length;
  const ownershipViews = events.filter(
    (e) => e.eventType === EVENT_TYPES.OWNERSHIP_PANEL_VIEWED
  ).length;
  const leadCta = events.filter(
    (e) => e.eventType === EVENT_TYPES.LEAD_CTA_INITIATED
  ).length;
  const leadSubmit = events.filter(
    (e) => e.eventType === EVENT_TYPES.LEAD_SUBMITTED
  ).length;

  const ownershipEngagementRate =
    detailViews > 0
      ? Math.round((ownershipViews / detailViews) * 1000) / 10
      : 0;

  const compareCompletionRate =
    compare.compareStarts > 0
      ? Math.round(
          (compare.compareCompletions / compare.compareStarts) * 1000
        ) / 10
      : 0;

  let seoToCompareSessions = 0;
  let compareToLeadSessions = 0;
  for (const sessEvents of eventsBySession.values()) {
    const types = new Set(sessEvents.map((e) => e.eventType));
    if (
      types.has(EVENT_TYPES.SEO_TO_DETAIL) &&
      types.has(EVENT_TYPES.COMPARE_STARTED)
    ) {
      seoToCompareSessions += 1;
    }
    if (
      types.has(EVENT_TYPES.COMPARE_STARTED) &&
      types.has(EVENT_TYPES.LEAD_SUBMITTED)
    ) {
      compareToLeadSessions += 1;
    }
  }

  const sessionsWithSeo = [...eventsBySession.values()].filter((arr) =>
    arr.some((e) => e.eventType === EVENT_TYPES.SEO_TO_DETAIL)
  ).length;

  const sessionsWithCompare = compare.sessionsWithCompare;

  return {
    generatedAt: new Date().toISOString(),
    periodDays: sinceDays,
    totalEvents: events.length,
    uniqueSessions: eventsBySession.size,
    quality: {
      avgSessionDepth,
      compareCompletionRatePercent: compareCompletionRate,
      ownershipEngagementRatePercent: ownershipEngagementRate,
      compareAbandonmentRate: compare.compareAbandonmentRate,
    },
    progression: {
      seoToCompareSessions,
      seoToCompareRatePercent:
        sessionsWithSeo > 0
          ? Math.round((seoToCompareSessions / sessionsWithSeo) * 1000) /
            10
          : 0,
      compareToLeadSessions,
      compareToLeadRatePercent:
        sessionsWithCompare > 0
          ? Math.round(
              (compareToLeadSessions / sessionsWithCompare) * 1000
            ) / 10
          : 0,
      leadCtaInitiated: leadCta,
      leadSubmittedEvents: leadSubmit,
      ctaToSubmitRatePercent:
        leadCta > 0
          ? Math.round((leadSubmit / leadCta) * 1000) / 10
          : 0,
    },
    compare: {
      topPairs: compare.topComparePairs.slice(0, 10),
      avgCompareDepth: compare.avgCompareDepth,
    },
    aggregatedOnly: true,
    piiExcluded: true,
  };
}

module.exports = {
  buildBehavioralQualityReport,
};
