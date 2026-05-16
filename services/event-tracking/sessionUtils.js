const crypto = require("crypto");

function buildDedupeKey(event) {
  const minute = new Date(event.timestamp)
    .toISOString()
    .slice(0, 16);
  const vehicles = (event.payload?.vehicleSlugs || [])
    .slice()
    .sort()
    .join(",");
  return crypto
    .createHash("sha256")
    .update(
      `${event.sessionId}|${event.eventType}|${minute}|${vehicles}`
    )
    .digest("hex")
    .slice(0, 32);
}

module.exports = {
  buildDedupeKey,
};
