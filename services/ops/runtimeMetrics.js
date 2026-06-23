/**
 * In-memory operational counters (resets on process restart).
 * Lightweight soft-launch visibility — not a full BI system.
 */

const MAX_TOP = 25;

const state = {
  startedAt: new Date().toISOString(),
  leadsSubmitted: 0,
  duplicateLeadsSuppressed: 0,
  rateLimitHits: 0,
  turnstileFailures: 0,
  apiErrors: 0,
  slowRequests: 0,
  evViews: new Map(),
  comparePairs: new Map(),
  recentErrors: [],
};

function bumpTop(map, key) {
  if (!key) {
    return;
  }

  map.set(key, (map.get(key) || 0) + 1);

  if (map.size <= MAX_TOP * 2) {
    return;
  }

  const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]);
  map.clear();
  sorted.slice(0, MAX_TOP).forEach(([k, v]) => map.set(k, v));
}

function topList(map, limit = 10) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => ({ key, count }));
}

function recordLeadSubmitted(meta = {}) {
  state.leadsSubmitted += 1;

  if (meta.familySlug) {
    bumpTop(state.evViews, meta.familySlug);
  }
}

function recordDuplicateLead(meta = {}) {
  state.duplicateLeadsSuppressed += 1;

  if (meta.familySlug) {
    bumpTop(state.evViews, meta.familySlug);
  }
}

function recordRateLimitHit(meta = {}) {
  state.rateLimitHits += 1;
  pushRecentError({
    type: "rate_limit",
    at: new Date().toISOString(),
    ...meta,
  });
}

function recordTurnstileFailure(meta = {}) {
  state.turnstileFailures += 1;
  pushRecentError({
    type: "turnstile",
    at: new Date().toISOString(),
    ...meta,
  });
}

function recordApiError(meta = {}) {
  state.apiErrors += 1;
  pushRecentError({
    type: "api_error",
    at: new Date().toISOString(),
    ...meta,
  });
}

function recordSlowRequest(meta = {}) {
  state.slowRequests += 1;
}

function recordEvView(familySlug) {
  bumpTop(state.evViews, familySlug);
}

function recordComparePair(slugs = []) {
  const key = [...slugs]
    .filter(Boolean)
    .map((s) => String(s).trim())
    .sort()
    .join("|");

  if (key) {
    bumpTop(state.comparePairs, key);
  }
}

function pushRecentError(row) {
  state.recentErrors.unshift(row);
  state.recentErrors = state.recentErrors.slice(0, 20);
}

function getSnapshot() {
  return {
    startedAt: state.startedAt,
    generatedAt: new Date().toISOString(),
    counters: {
      leadsSubmitted: state.leadsSubmitted,
      duplicateLeadsSuppressed: state.duplicateLeadsSuppressed,
      rateLimitHits: state.rateLimitHits,
      turnstileFailures: state.turnstileFailures,
      apiErrors: state.apiErrors,
      slowRequests: state.slowRequests,
    },
    topViewedEvs: topList(state.evViews),
    topCompareCombinations: topList(state.comparePairs).map(
      (row) => ({
        vehicles: row.key.split("|"),
        count: row.count,
      })
    ),
    recentErrors: state.recentErrors,
  };
}

module.exports = {
  recordLeadSubmitted,
  recordDuplicateLead,
  recordRateLimitHit,
  recordTurnstileFailure,
  recordApiError,
  recordSlowRequest,
  recordEvView,
  recordComparePair,
  getSnapshot,
};
