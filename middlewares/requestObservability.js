const logger = require("../utils/logger");
const runtimeMetrics = require("../services/ops/runtimeMetrics");
const { captureException } = require("../utils/sentry");

const SLOW_MS = Number(process.env.SLOW_REQUEST_MS || 2000);

function requestObservability(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - start;

    if (durationMs >= SLOW_MS) {
      runtimeMetrics.recordSlowRequest({
        path: req.path,
        method: req.method,
        durationMs,
        status: res.statusCode,
      });

      logger.warn({
        event: "slow_request",
        path: req.path,
        method: req.method,
        durationMs,
        status: res.statusCode,
      });
    }

    if (res.statusCode >= 500) {
      runtimeMetrics.recordApiError({
        path: req.path,
        method: req.method,
        status: res.statusCode,
      });
    }
  });

  next();
}

function observabilityErrorHandler(err, req, res, next) {
  logger.error({
    event: "api_exception",
    path: req.path,
    method: req.method,
    message: err?.message,
  });

  runtimeMetrics.recordApiError({
    path: req.path,
    method: req.method,
  });

  captureException(err, {
    path: req.path,
    method: req.method,
  });

  next(err);
}

module.exports = {
  requestObservability,
  observabilityErrorHandler,
};
