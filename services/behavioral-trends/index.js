/**
 * Behavioral trend summaries for market learning — aggregated only.
 */

const BuyerBehaviorEvent = require("../../models/BuyerBehaviorEvent");
const { aggregateCompareAnalytics } = require("../buyer-intelligence/compareAnalytics");

async function buildBehavioralTrends(sinceDays = 7) {
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);

  const events = await BuyerBehaviorEvent.find({
    createdAt: { $gte: since },
  })
    .sort({ timestamp: -1 })
    .lean();

  const compare = aggregateCompareAnalytics(events);

  const seoPageEngagement = new Map();
  const detailFromSeo = events.filter(
    (e) => e.eventType === "seo_to_detail"
  );
  for (const e of detailFromSeo) {
    const slug = e.payload?.seoPageSlug || "unknown";
    seoPageEngagement.set(
      slug,
      (seoPageEngagement.get(slug) || 0) + 1
    );
  }

  const ownershipViews = events.filter(
    (e) => e.eventType === "ownership_panel_viewed"
  ).length;

  const chargingExpanded = events.filter(
    (e) => e.eventType === "charging_reality_expanded"
  ).length;

  const seoToDetail = detailFromSeo.length;
  const compareStarted = events.filter(
    (e) => e.eventType === "compare_started"
  ).length;
  const compareCompleted = events.filter(
    (e) => e.eventType === "compare_completed"
  ).length;
  const leadSubmitted = events.filter(
    (e) => e.eventType === "lead_submitted"
  ).length;

  const sessions = new Set(events.map((e) => e.sessionId));
  const sessionsWithCompare = new Set(
    events
      .filter((e) => e.eventType === "compare_started")
      .map((e) => e.sessionId)
  );
  const sessionsWithLead = new Set(
    events
      .filter((e) => e.eventType === "lead_submitted")
      .map((e) => e.sessionId)
  );

  let seoThenCompare = 0;
  for (const sid of sessionsWithCompare) {
    const sessEvents = events
      .filter((e) => e.sessionId === sid)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const hadSeo = sessEvents.some((e) => e.eventType === "seo_to_detail");
    const hadCompare = sessEvents.some(
      (e) => e.eventType === "compare_started"
    );
    if (hadSeo && hadCompare) seoThenCompare += 1;
  }

  return {
    generatedAt: new Date().toISOString(),
    periodDays: sinceDays,
    totalEvents: events.length,
    uniqueSessions: sessions.size,
    trends: {
      topComparePairs: compare.topComparePairs,
      compareAbandonmentRate: compare.compareAbandonmentRate,
      compareToLeadSessionRate: compare.compareToLeadRate,
      mostEngagingSeoPages: [...seoPageEngagement.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([slug, transitions]) => ({ slug, transitions })),
      ownershipPanelViews: ownershipViews,
      chargingRealityExpanded: chargingExpanded,
      seoToDetailTransitions: seoToDetail,
      compareStarted,
      compareCompleted,
      leadSubmittedEvents: leadSubmitted,
    },
    conversionPatterns: {
      seoToCompareSessions: seoThenCompare,
      sessionsWithLead: sessionsWithLead.size,
      leadRatePerSession:
        sessions.size > 0
          ? Math.round(
              (sessionsWithLead.size / sessions.size) * 1000
            ) / 10
          : 0,
    },
    calibrationNotes: [
      "Use top compare pairs to tune compare SEO pages",
      "High abandonment → review compare page friction",
      "SEO pages with clicks but low leads → strengthen CTAs on guides",
    ],
  };
}

module.exports = {
  buildBehavioralTrends,
};
