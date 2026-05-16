/**
 * Lightweight structured production logging — stdout only, no heavy APM.
 */

const LEVELS = ["debug", "info", "warn", "error"];

function shouldLog(level) {
  if (process.env.NODE_ENV !== "production") return true;
  return level !== "debug";
}

/**
 * @param {string} category
 * @param {string} event
 * @param {object} [meta]
 * @param {'info'|'warn'|'error'|'debug'} [level]
 */
function logProduction(category, event, meta = {}, level = "info") {
  if (!shouldLog(level)) return;

  const entry = {
    ts: new Date().toISOString(),
    level,
    category,
    event,
    ...meta,
  };

  const line = JSON.stringify(entry);

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

module.exports = {
  logProduction,
  LEVELS,
};
