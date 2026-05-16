/**
 * Internal recommendation feedback loop — no public personalization.
 */

function buildRecommendationFeedback(events, intentSignals) {
  const seoTransitions = events.filter(
    (e) => e.eventType === "seo_to_detail"
  );
  const detailViews = events.filter(
    (e) => e.eventType === "detail_page_viewed"
  );

  const slugEngagement = new Map();

  for (const e of [...seoTransitions, ...detailViews]) {
    const slugs =
      e.payload?.vehicleSlugs ||
      (e.payload?.targetSlug
        ? [e.payload.targetSlug]
        : []);
    for (const slug of slugs) {
      slugEngagement.set(
        slug,
        (slugEngagement.get(slug) || 0) + 1
      );
    }
  }

  const topEngagedSlugs = [...slugEngagement.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([slug, weight]) => ({ slug, weight }));

  return {
    purpose:
      "Internal signal for future SEO ranking and compare suggestions — not exposed to users.",
    topEngagedSlugs,
    intentAlignment: intentSignals?.inferredIntent || null,
    suggestedActions: deriveInternalActions(
      intentSignals,
      events
    ),
    updatedAt: new Date().toISOString(),
  };
}

function deriveInternalActions(intent, events) {
  const actions = [];

  if (intent?.inferredIntent?.chargingConcern >= 0.5) {
    actions.push(
      "boost_charging_practicality_content_in_seo_pages"
    );
  }
  if (intent?.inferredIntent?.familyFocus >= 0.5) {
    actions.push(
      "prioritize_family_usage_scenario_in_compare"
    );
  }

  const compareStarts = events.filter(
    (e) => e.eventType === "compare_started"
  ).length;
  if (compareStarts >= 2) {
    actions.push("review_compare_pair_suggestions");
  }

  return actions;
}

module.exports = {
  buildRecommendationFeedback,
};
