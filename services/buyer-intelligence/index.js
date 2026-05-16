const BuyerBehaviorEvent = require("../../models/BuyerBehaviorEvent");
const { reconstructJourney } = require("./journeyMapper");
const { deriveIntentSignals } = require("./intentSignals");
const { aggregateCompareAnalytics } = require("./compareAnalytics");
const { buildRecommendationFeedback } = require("./recommendationFeedback");
const { buildLeadContext } = require("./dealerContext");

async function getSessionEvents(sessionId, limit = 100) {
  return BuyerBehaviorEvent.find({ sessionId })
    .sort({ timestamp: 1 })
    .limit(limit)
    .lean();
}

async function analyzeSession(sessionId) {
  const events = await getSessionEvents(sessionId);
  const journey = reconstructJourney(events);
  const intentSignals = deriveIntentSignals(events, journey);
  const feedback = buildRecommendationFeedback(
    events,
    intentSignals
  );

  return {
    sessionId,
    eventCount: events.length,
    journey,
    intentSignals,
    recommendationFeedback: feedback,
  };
}

async function buildInternalReport(sinceDays = 7) {
  const since = new Date(
    Date.now() - sinceDays * 24 * 60 * 60 * 1000
  );

  const events = await BuyerBehaviorEvent.find({
    timestamp: { $gte: since },
  })
    .sort({ timestamp: -1 })
    .lean();

  const compare = aggregateCompareAnalytics(events);

  const ownershipViews = events.filter(
    (e) => e.eventType === "ownership_panel_viewed"
  ).length;

  const seoToDetail = events.filter(
    (e) => e.eventType === "seo_to_detail"
  ).length;

  const seoPages = new Map();
  for (const e of events.filter(
    (x) => x.eventType === "seo_to_detail"
  )) {
    const slug = e.payload?.seoPageSlug || "unknown";
    seoPages.set(slug, (seoPages.get(slug) || 0) + 1);
  }

  const detailViews = events.filter(
    (e) => e.eventType === "detail_page_viewed"
  ).length;

  const leadSubmitted = events.filter(
    (e) => e.eventType === "lead_submitted"
  ).length;

  return {
    periodDays: sinceDays,
    totalEvents: events.length,
    uniqueSessions: new Set(events.map((e) => e.sessionId)).size,
    compare,
    engagement: {
      detailPageViews: detailViews,
      ownershipPanelViews: ownershipViews,
      seoToDetailTransitions: seoToDetail,
      leadSubmissions: leadSubmitted,
      topSeoSources: [...seoPages.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([slug, count]) => ({ slug, count })),
    },
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  getSessionEvents,
  analyzeSession,
  buildInternalReport,
  buildLeadContext,
  reconstructJourney,
  deriveIntentSignals,
  aggregateCompareAnalytics,
};
