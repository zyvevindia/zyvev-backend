const Lead = require("../../models/Lead");
const Dealer = require("../../models/Dealer");
const { isSlaBreached, leadAgeHours, responseHours } = require("./dealerMetrics");
const { isOverdue } = require("./opsSummary");

const OPEN_STATUSES = [
  "new",
  "assigned",
  "contacted",
  "follow_up",
  "interested",
  "test_drive",
  "negotiation",
];

function enrichLeadRow(lead) {
  return {
    _id: lead._id,
    name: lead.name,
    phone: lead.phone,
    city: lead.city,
    status: lead.status,
    leadSource: lead.leadSource || "form",
    sourcePage: lead.sourcePage,
    vehicleName: lead.vehicleName,
    familySlug: lead.familySlug,
    createdAt: lead.createdAt,
    dealer: lead.dealer,
    assignedDealer: lead.assignedDealer,
    ageHours: leadAgeHours(lead),
    responseHours: responseHours(lead),
    overdue: isOverdue(lead),
    slaBreached: isSlaBreached(lead),
    mergedFromWhatsApp: Boolean(lead.leadMetadata?.mergedFromWhatsApp),
  };
}

async function buildAdminOpsQueue(filter = "all") {
  const baseQuery = { status: { $in: OPEN_STATUSES } };

  const [
    unmatchedLeads,
    overdueLeads,
    whatsappLeads,
    inactiveDealers,
    allOpen,
  ] = await Promise.all([
    Lead.find({ ...baseQuery, dealer: null })
      .sort({ createdAt: -1 })
      .limit(40)
      .populate("dealer", "name email isActive")
      .lean(),
    Lead.find({ ...baseQuery })
      .sort({ createdAt: 1 })
      .limit(80)
      .populate("dealer", "name email isActive")
      .lean()
      .then((rows) => rows.filter((l) => isOverdue(l)).slice(0, 25)),
    Lead.find({ ...baseQuery, leadSource: "whatsapp" })
      .sort({ createdAt: -1 })
      .limit(25)
      .populate("dealer", "name email isActive")
      .lean(),
    findInactiveDealers(),
    filter === "all"
      ? Lead.find(baseQuery)
          .sort({ createdAt: -1 })
          .limit(30)
          .populate("dealer", "name email isActive")
          .lean()
      : Promise.resolve([]),
  ]);

  let leads = allOpen;
  if (filter === "unmatched") leads = unmatchedLeads;
  else if (filter === "overdue") leads = overdueLeads;
  else if (filter === "whatsapp") leads = whatsappLeads;

  return {
    filter,
    generatedAt: new Date().toISOString(),
    counts: {
      unmatched: await Lead.countDocuments({ ...baseQuery, dealer: null }),
      overdue: overdueLeads.length,
      whatsappOpen: await Lead.countDocuments({
        ...baseQuery,
        leadSource: "whatsapp",
      }),
      inactiveDealers: inactiveDealers.length,
    },
    unmatchedLeads: unmatchedLeads.map(enrichLeadRow),
    overdueLeads: overdueLeads.map(enrichLeadRow),
    whatsappLeads: whatsappLeads.map(enrichLeadRow),
    inactiveDealers,
    leads: leads.map(enrichLeadRow),
  };
}

async function findInactiveDealers() {
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const dealers = await Dealer.find({ isActive: true })
    .select("name email cities brands updatedAt")
    .lean();

  const warnings = [];

  for (const dealer of dealers) {
    const assigned = await Lead.countDocuments({
      dealer: dealer._id,
      createdAt: { $gte: since7d },
    });

    const responded = await Lead.countDocuments({
      dealer: dealer._id,
      createdAt: { $gte: since7d },
      firstRespondedAt: { $ne: null },
    });

    if (assigned >= 3 && responded === 0) {
      warnings.push({
        dealerId: dealer._id,
        name: dealer.name,
        email: dealer.email,
        assignedLeads7d: assigned,
        reason: "no_response_on_recent_assignments",
      });
    }
  }

  return warnings;
}

module.exports = { buildAdminOpsQueue, enrichLeadRow };
