const Lead = require("../../models/Lead");
const Dealer = require("../../models/Dealer");

const MS_HOUR = 60 * 60 * 1000;
const SLA_HOURS = 48;

function responseHours(lead) {
  if (!lead.firstRespondedAt || !lead.createdAt) return null;
  const ms =
    new Date(lead.firstRespondedAt).getTime() -
    new Date(lead.createdAt).getTime();
  return Math.max(0, Math.round((ms / MS_HOUR) * 10) / 10);
}

function leadAgeHours(lead) {
  if (!lead.createdAt) return null;
  return Math.round(
    ((Date.now() - new Date(lead.createdAt).getTime()) / MS_HOUR) * 10
  ) / 10;
}

function isSlaBreached(lead) {
  if (["won", "lost", "converted"].includes(lead.status)) return false;
  const age = leadAgeHours(lead);
  if (age == null) return false;
  return !lead.firstRespondedAt && age >= SLA_HOURS;
}

function computeResponseScore(leads) {
  if (!leads.length) {
    return {
      score: null,
      avgFirstResponseHours: null,
      slaBreaches: 0,
      respondedWithinSla: 0,
      totalScored: 0,
    };
  }

  let breach = 0;
  let withinSla = 0;
  let responseSum = 0;
  let responseCount = 0;

  for (const lead of leads) {
    if (isSlaBreached(lead)) breach += 1;
    const hrs = responseHours(lead);
    if (hrs != null) {
      responseCount += 1;
      responseSum += hrs;
      if (hrs <= SLA_HOURS) withinSla += 1;
    } else if (!isSlaBreached(lead)) {
      withinSla += 1;
    }
  }

  const totalScored = leads.length;
  const score =
    totalScored > 0
      ? Math.round((withinSla / totalScored) * 100)
      : null;

  return {
    score,
    avgFirstResponseHours:
      responseCount > 0
        ? Math.round((responseSum / responseCount) * 10) / 10
        : null,
    slaBreaches: breach,
    respondedWithinSla: withinSla,
    totalScored,
  };
}

async function buildDealerResponsiveness(dealerId, sinceDays = 30) {
  const since = new Date(Date.now() - sinceDays * 24 * MS_HOUR);
  const leads = await Lead.find({
    dealer: dealerId,
    createdAt: { $gte: since },
  }).lean();

  const metrics = computeResponseScore(leads);

  return {
    periodDays: sinceDays,
    totalLeads: leads.length,
    ...metrics,
    leads: leads.map((l) => ({
      id: l._id,
      name: l.name,
      status: l.status,
      ageHours: leadAgeHours(l),
      responseHours: responseHours(l),
      slaBreached: isSlaBreached(l),
      firstRespondedAt: l.firstRespondedAt,
      createdAt: l.createdAt,
    })),
  };
}

async function buildAllDealerScores(sinceDays = 30) {
  const since = new Date(Date.now() - sinceDays * 24 * MS_HOUR);
  const dealers = await Dealer.find({ isActive: true })
    .select("name email cities brands isActive updatedAt")
    .lean();

  const agg = await Lead.aggregate([
    { $match: { dealer: { $ne: null }, createdAt: { $gte: since } } },
    {
      $group: {
        _id: "$dealer",
        total: { $sum: 1 },
        responded: {
          $sum: {
            $cond: [{ $ifNull: ["$firstRespondedAt", false] }, 1, 0],
          },
        },
        breaches: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$firstRespondedAt", null] },
                  {
                    $gte: [
                      {
                        $divide: [
                          { $subtract: [new Date(), "$createdAt"] },
                          3600000,
                        ],
                      },
                      SLA_HOURS,
                    ],
                  },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  const byDealer = new Map(agg.map((r) => [String(r._id), r]));

  return dealers.map((d) => {
    const row = byDealer.get(String(d._id)) || {
      total: 0,
      responded: 0,
      breaches: 0,
    };
    const score =
      row.total > 0
        ? Math.round(((row.total - row.breaches) / row.total) * 100)
        : null;
    return {
      dealerId: d._id,
      name: d.name,
      email: d.email,
      isActive: d.isActive,
      leadsAssigned: row.total,
      slaBreaches: row.breaches,
      responseScore: score,
    };
  });
}

module.exports = {
  buildDealerResponsiveness,
  buildAllDealerScores,
  computeResponseScore,
  responseHours,
  leadAgeHours,
  isSlaBreached,
  SLA_HOURS,
};
