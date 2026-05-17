const Lead = require("../../models/Lead");
const Dealer = require("../../models/Dealer");
const DealerApplication = require("../../models/DealerApplication");

const MS_HOUR = 60 * 60 * 1000;
const OVERDUE_HOURS = 48;

function hoursSince(date) {
  if (!date) return null;
  return Math.round((Date.now() - new Date(date).getTime()) / MS_HOUR);
}

function responseHours(lead) {
  if (!lead.firstRespondedAt || !lead.createdAt) return null;
  const ms =
    new Date(lead.firstRespondedAt).getTime() -
    new Date(lead.createdAt).getTime();
  return Math.max(0, Math.round(ms / MS_HOUR * 10) / 10);
}

function isOverdue(lead) {
  if (["won", "lost", "converted"].includes(lead.status)) return false;
  if (lead.nextFollowUp && new Date(lead.nextFollowUp) < new Date()) {
    return true;
  }
  const age = hoursSince(lead.createdAt);
  if (age == null) return false;
  if (!lead.firstRespondedAt && age >= OVERDUE_HOURS) return true;
  if (
    ["contacted", "follow_up", "assigned"].includes(lead.status) &&
    lead.nextFollowUp &&
    new Date(lead.nextFollowUp) < new Date()
  ) {
    return true;
  }
  return false;
}

async function buildOpsSummary() {
  const since7d = new Date(Date.now() - 7 * 24 * MS_HOUR);

  const [
    recentLeads,
    statusAgg,
    pendingApplications,
    activeDealers,
    dealerLeadAgg,
  ] = await Promise.all([
    Lead.find()
      .sort({ createdAt: -1 })
      .limit(200)
      .populate("dealer", "name email")
      .lean(),
    Lead.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    DealerApplication.countDocuments({
      onboardingStatus: { $in: ["pending", "under_review"] },
    }),
    Dealer.countDocuments({ isActive: true }),
    Lead.aggregate([
      { $match: { dealer: { $ne: null }, createdAt: { $gte: since7d } } },
      {
        $group: {
          _id: "$dealer",
          total: { $sum: 1 },
          won: {
            $sum: {
              $cond: [{ $in: ["$status", ["won", "converted"]] }, 1, 0],
            },
          },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "dealers",
          localField: "_id",
          foreignField: "_id",
          as: "dealer",
        },
      },
      { $unwind: { path: "$dealer", preserveNullAndEmptyArrays: true } },
    ]),
  ]);

  const enriched = recentLeads.map((lead) => ({
    _id: lead._id,
    name: lead.name,
    status: lead.status,
    leadSource: lead.leadSource,
    createdAt: lead.createdAt,
    firstRespondedAt: lead.firstRespondedAt,
    nextFollowUp: lead.nextFollowUp,
    dealerName: lead.dealer?.name || lead.assignedDealer || "",
    responseHours: responseHours(lead),
    ageHours: hoursSince(lead.createdAt),
    overdue: isOverdue(lead),
  }));

  const overdueLeads = enriched.filter((l) => l.overdue).slice(0, 15);

  const responded = recentLeads.filter((l) => l.firstRespondedAt);
  const avgResponseHours =
    responded.length > 0
      ? Math.round(
          (responded.reduce((s, l) => s + (responseHours(l) || 0), 0) /
            responded.length) *
            10
        ) / 10
      : null;

  const { buildAllDealerScores } = require("./dealerMetrics");
  const dealerScores = await buildAllDealerScores(7);

  return {
    generatedAt: new Date().toISOString(),
    statusCounts: statusAgg.map((r) => ({
      status: r._id,
      count: r.count,
    })),
    pendingDealerApplications: pendingApplications,
    activeDealers,
    avgResponseHours,
    overdueCount: overdueLeads.length,
    overdueLeads,
    dealerActivity: dealerLeadAgg.map((r) => ({
      dealerId: r._id,
      name: r.dealer?.name || "Dealer",
      email: r.dealer?.email || "",
      leads7d: r.total,
      won7d: r.won,
    })),
    recentHighlights: enriched.slice(0, 12),
    dealerScores,
    slaHours: OVERDUE_HOURS,
  };
}

module.exports = { buildOpsSummary, isOverdue, responseHours };
