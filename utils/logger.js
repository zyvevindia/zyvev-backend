/**
 * Centralized structured logging.
 * Uses Pino when installed; otherwise JSON lines to stdout (production-safe).
 */

function createFallbackLogger() {
  const level =
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === "production"
      ? "info"
      : "debug");

  const levels = {
    debug: 20,
    info: 30,
    warn: 40,
    error: 50,
  };

  const min = levels[level] || 30;

  function write(levelName, payload, msg) {
    if ((levels[levelName] || 30) < min) {
      return;
    }

    const line = {
      level: levelName,
      time: new Date().toISOString(),
      service: "evsavari-api",
      env: process.env.NODE_ENV || "development",
      ...(typeof payload === "object" && payload !== null
        ? payload
        : { msg: payload }),
      ...(msg ? { msg } : {}),
    };

    const out =
      levelName === "error" || levelName === "warn"
        ? process.stderr
        : process.stdout;

    out.write(`${JSON.stringify(line)}\n`);
  }

  return {
    debug: (o, m) => write("debug", o, m),
    info: (o, m) => write("info", o, m),
    warn: (o, m) => write("warn", o, m),
    error: (o, m) => write("error", o, m),
  };
}

let logger;

try {
  const pino = require("pino");

  logger = pino({
    level:
      process.env.LOG_LEVEL ||
      (process.env.NODE_ENV === "production"
        ? "info"
        : "debug"),
    base: {
      service: "evsavari-api",
      env: process.env.NODE_ENV || "development",
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
} catch {
  logger = createFallbackLogger();
}

module.exports = logger;
