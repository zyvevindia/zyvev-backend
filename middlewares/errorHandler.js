const logger = require("../utils/logger");
const { captureException } = require("../utils/sentry");

const errorHandler = (err, req, res, next) => {
  const statusCode =
    res.statusCode && res.statusCode !== 200
      ? res.statusCode
      : 500;

  logger.error({
    event: "unhandled_error",
    path: req?.path,
    method: req?.method,
    statusCode,
    message: err?.message,
  });

  captureException(err, {
    path: req?.path,
    method: req?.method,
  });

  res.status(statusCode).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Server Error"
        : err.message,
    stack:
      process.env.NODE_ENV === "production"
        ? undefined
        : err.stack,
  });
};

module.exports = errorHandler;
