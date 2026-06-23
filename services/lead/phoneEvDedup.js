/**
 * Duplicate lead suppression: same phone + same EV within 24 hours.
 * Updates interest metadata instead of creating a new CRM row.
 */

const Lead = require("../../models/Lead");
const { OPEN_STATUSES } = require("./leadDedup");

const DUPLICATE_WINDOW_MS =
  24 * 60 * 60 * 1000;

function normalizePhone(phone = "") {
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
}

function escapeRegex(value = "") {
  return String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

/**
 * Build Mongo filter for "same EV" from lead payload.
 * @returns {object|null}
 */
function buildEvMatchFilter(payload = {}) {
  const familySlug = String(
    payload.familySlug || ""
  ).trim();
  const variantSlug = String(
    payload.variantSlug || ""
  ).trim();
  const vehicleId = String(
    payload.vehicleId || ""
  ).trim();
  const vehicleName = String(
    payload.vehicleName || ""
  ).trim();

  if (familySlug) {
    return { familySlug };
  }

  if (variantSlug) {
    return { variantSlug };
  }

  if (vehicleId) {
    return { vehicleId };
  }

  if (vehicleName.length >= 2) {
    return {
      vehicleName: new RegExp(
        `^${escapeRegex(vehicleName)}$`,
        "i"
      ),
    };
  }

  return null;
}

/**
 * @param {object} payload — lead form payload
 */
async function findDuplicateLeadByPhoneAndEv(
  payload = {}
) {
  const phone = normalizePhone(payload.phone);

  if (phone.length < 10) {
    return null;
  }

  const evFilter = buildEvMatchFilter(payload);

  if (!evFilter) {
    return null;
  }

  const since = new Date(
    Date.now() - DUPLICATE_WINDOW_MS
  );

  const phoneTail = phone.slice(-10);

  return Lead.findOne({
    phone: new RegExp(`${escapeRegex(phoneTail)}$`),
    ...evFilter,
    status: { $in: OPEN_STATUSES },
    $or: [
      { lastInterestedAt: { $gte: since } },
      {
        lastInterestedAt: { $exists: false },
        createdAt: { $gte: since },
      },
    ],
  }).sort({
    lastInterestedAt: -1,
    createdAt: -1,
  });
}

/**
 * Refresh duplicate interest instead of inserting new lead.
 */
async function refreshDuplicateInterest(
  lead,
  formPayload = {}
) {
  const nextCount =
    (lead.interestCount || 1) + 1;

  lead.interestCount = nextCount;
  lead.lastInterestedAt = new Date();
  lead.readByAdmin = false;
  lead.readByDealer = false;

  if (formPayload.message) {
    lead.message = String(formPayload.message).trim();
  }

  if (formPayload.city) {
    lead.city = String(formPayload.city).trim();
  }

  const meta =
    lead.leadMetadata &&
    typeof lead.leadMetadata === "object"
      ? { ...lead.leadMetadata }
      : {};

  meta.duplicateSuppressed = true;
  meta.lastDuplicateAt = new Date().toISOString();
  meta.interestCount = nextCount;

  lead.leadMetadata = meta;

  lead.notes.push({
    text: `Repeat interest #${nextCount} within 24h (same phone + EV).`,
    createdAt: new Date(),
  });

  await lead.save();
  return lead;
}

module.exports = {
  findDuplicateLeadByPhoneAndEv,
  refreshDuplicateInterest,
  DUPLICATE_WINDOW_MS,
  normalizePhone,
  buildEvMatchFilter,
};
