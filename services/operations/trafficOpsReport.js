const Lead = require("../../models/Lead");
const BuyerBehaviorEvent = require("../../models/BuyerBehaviorEvent");
const { buildInternalReport } = require("../buyer-intelligence");

function bucketPath(path = "") {
  const p = String(path).trim();
  if (!p) return "/";
  return p.split("?")[0] || "/";
}

function incMap(map, key, n = 1) {
  if (!key) return;
  map.set(key, (map.get(key) || 0) + n);
}

/**
 * Operational traffic report — behavioral events + lead attribution.
 * @param {number} sinceDays
 */
async function buildTrafficOpsReport(sinceDays = 7) {
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
  const dateFilter = { createdAt: { $gte: since } };

  const [behavioral, events, leads] = await Promise.all([
    buildInternalReport(sinceDays).catch(() => null),
    BuyerBehaviorEvent.find({ timestamp: { $gte: since } })
      .sort({ timestamp: -1 })
      .lean(),
    Lead.find(dateFilter)
      .select(
        "sourcePage leadSource city status vehicleName familySlug variantSlug createdAt"
      )
      .lean(),
  ]);

  const landingPages = new Map();
  const cityHeatmap = new Map();
  const compareStartedMap = new Map();
  const compareCompletedMap = new Map();
  const ctaByType = new Map();
  const variantInterest = new Map();

  for (const e of events) {
    const payload = e.payload || {};
    const path =
      bucketPath(
        payload.discoveryPath ||
          payload.sourcePage ||
          payload.path ||
          ""
      );

    if (
      [
        "detail_page_viewed",
        "guide_viewed",
        "city_page_viewed",
        "seo_to_detail",
      ].includes(e.eventType) &&
      path &&
      path !== "/"
    ) {
      incMap(landingPages, path);
    }

    if (e.eventType === "city_page_viewed" && payload.city) {
      incMap(cityHeatmap, String(payload.city).toLowerCase());
    }

    if (
      path.includes("/cities/") &&
      (e.eventType === "guide_viewed" || e.eventType === "city_page_viewed")
    ) {
      const match = path.match(/\/cities\/([^/]+)/);
      if (match?.[1]) incMap(cityHeatmap, match[1].toLowerCase());
    }

    if (e.eventType === "compare_guide_clicked" || e.eventType === "compare_started") {
      const slug =
        payload.compareSlug ||
        payload.seoPageSlug ||
        (payload.vehicleSlugs || []).join("-vs-");
      if (slug) incMap(compareStartedMap, slug);
    }

    if (e.eventType === "compare_completed") {
      const slug =
        payload.compareSlug ||
        (payload.vehicleSlugs || []).join("-vs-");
      if (slug) incMap(compareCompletedMap, slug);
    }

    if (
      e.eventType === "seo_cta_clicked" ||
      e.eventType === "whatsapp_lead_clicked"
    ) {
      const cta = payload.ctaType || e.eventType;
      incMap(ctaByType, cta);
    }

    const variants = payload.vehicleSlugs || payload.variantSlugs || [];
    for (const v of variants) {
      if (v) incMap(variantInterest, String(v));
    }
  }

  const leadsBySource = new Map();
  const leadsByLanding = new Map();
  const leadCityDemand = new Map();

  for (const lead of leads) {
    const src = lead.leadSource || "form";
    incMap(leadsBySource, src);
    incMap(leadsByLanding, bucketPath(lead.sourcePage));
    if (lead.city) incMap(leadCityDemand, String(lead.city).toLowerCase());
  }

  const detailViews = events.filter((e) => e.eventType === "detail_page_viewed").length;
  const guideViews = events.filter((e) =>
    ["guide_viewed", "city_page_viewed"].includes(e.eventType)
  ).length;
  const compareStarted = events.filter((e) =>
    ["compare_started", "compare_guide_clicked"].includes(e.eventType)
  ).length;
  const compareCompleted = events.filter((e) => e.eventType === "compare_completed").length;
  const whatsappClicks = events.filter((e) => e.eventType === "whatsapp_lead_clicked").length;
  const formLeads = leads.filter((l) => l.leadSource !== "whatsapp").length;

  const toRanked = (map, labelKey = "label") =>
    [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([key, count]) => ({ [labelKey]: key, count }));

  const compareSlugs = new Set([
    ...compareStartedMap.keys(),
    ...compareCompletedMap.keys(),
  ]);

  const compareTrends = [...compareSlugs]
    .map((slug) => {
      const started = compareStartedMap.get(slug) || 0;
      const completed = compareCompletedMap.get(slug) || 0;
      return {
        slug,
        started,
        completed,
        completionRate:
          started > 0 ? Math.round((completed / started) * 100) : null,
      };
    })
    .sort((a, b) => b.started - a.started)
    .slice(0, 12);

  return {
    periodDays: sinceDays,
    generatedAt: new Date().toISOString(),
    behavioral,
    conversionFunnel: [
      { stage: "Discovery views", count: guideViews },
      { stage: "Vehicle detail views", count: detailViews },
      { stage: "Compare started", count: compareStarted },
      { stage: "Compare completed", count: compareCompleted },
      { stage: "WhatsApp CTAs", count: whatsappClicks },
      { stage: "Form leads", count: formLeads },
      { stage: "Total leads", count: leads.length },
    ],
    topLandingPages: toRanked(landingPages, "path").map((r) => ({
      label: r.path,
      count: r.count,
    })),
    cityDemandHeatmap: toRanked(
      new Map([
        ...cityHeatmap,
        ...leadCityDemand,
      ]),
      "city"
    ).map((r) => ({ label: r.city, count: r.count })),
    topCityPages: toRanked(landingPages, "path")
      .filter((r) => String(r.path).includes("/cities/"))
      .map((r) => ({ label: r.path, count: r.count })),
    topComparePages: compareTrends.map((r) => ({
      label: r.slug,
      count: r.started,
      meta: r,
    })),
    compareConversions: {
      total: compareCompleted,
      started: compareStarted,
      completionRate:
        compareStarted > 0
          ? Math.round((compareCompleted / compareStarted) * 100)
          : null,
      trends: compareTrends,
    },
    leadConversions: {
      total: leads.length,
      bySource: toRanked(leadsBySource, "source").map((r) => ({
        label: r.source,
        count: r.count,
      })),
      byLanding: toRanked(leadsByLanding, "path").map((r) => ({
        label: r.path,
        count: r.count,
      })),
    },
    ctaClicks: toRanked(ctaByType, "type").map((r) => ({
      label: r.type,
      count: r.count,
    })),
    variantInterest: toRanked(variantInterest, "slug").map((r) => ({
      label: r.slug,
      count: r.count,
    })),
    topViewedEvs: behavioral?.engagement
      ? []
      : toRanked(variantInterest, "slug").map((r) => ({
          label: r.slug,
          count: r.count,
        })),
  };
}

module.exports = { buildTrafficOpsReport };
