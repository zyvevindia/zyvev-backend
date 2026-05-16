/**
 * Compare intelligence aggregates — internal analytics only.
 */

function aggregateCompareAnalytics(events) {
  const pairCounts = new Map();
  const starts = [];
  const completions = [];
  const scenarioViews = [];
  const leadAfterCompare = new Set();

  const sessionsWithCompare = new Set();
  const sessionsConverted = new Set();

  for (const e of events) {
    if (e.eventType === "compare_started") {
      starts.push(e);
      sessionsWithCompare.add(e.sessionId);
      const slugs = normalizeSlugs(e);
      if (slugs.length >= 2) {
        const key = pairKey(slugs);
        pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
      }
    }
    if (e.eventType === "compare_completed") {
      completions.push(e);
    }
    if (e.eventType === "scenario_compare_viewed") {
      scenarioViews.push(e);
    }
    if (e.eventType === "lead_submitted") {
      sessionsConverted.add(e.sessionId);
    }
  }

  for (const sid of sessionsWithCompare) {
    if (sessionsConverted.has(sid)) {
      leadAfterCompare.add(sid);
    }
  }

  const topPairs = [...pairCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([pair, count]) => ({
      pair,
      count,
    }));

  const abandonmentRate =
    starts.length > 0
      ? Math.round(
          ((starts.length - completions.length) /
            starts.length) *
            100
        ) / 100
      : 0;

  return {
    compareStarts: starts.length,
    compareCompletions: completions.length,
    compareAbandonmentRate: abandonmentRate,
    scenarioEngagement: scenarioViews.length,
    sessionsWithCompare: sessionsWithCompare.size,
    compareToLeadSessions: leadAfterCompare.size,
    compareToLeadRate:
      sessionsWithCompare.size > 0
        ? Math.round(
            (leadAfterCompare.size /
              sessionsWithCompare.size) *
              100
          ) / 100
        : 0,
    topComparePairs: topPairs,
    avgCompareDepth:
      starts.length > 0
        ? Math.round(
            (starts.reduce(
              (s, e) =>
                s + (e.payload?.compareDepth || 2),
              0
            ) /
              starts.length) *
              10
          ) / 10
        : 0,
  };
}

function normalizeSlugs(e) {
  const raw =
    e.payload?.vehicleSlugs || e.payload?.vehicles || [];
  return raw
    .map((s) => String(s).toLowerCase().trim())
    .filter(Boolean)
    .sort();
}

function pairKey(slugs) {
  return slugs.slice(0, 2).join("|");
}

module.exports = {
  aggregateCompareAnalytics,
};
