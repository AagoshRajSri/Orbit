import crypto from "crypto";

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLevel = process.env.LOG_LEVEL
  ? LOG_LEVELS[process.env.LOG_LEVEL] ?? LOG_LEVELS.info
  : LOG_LEVELS.info;

const isProd = process.env.NODE_ENV === "production";

function formatMessage(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const requestId = global.__requestId || crypto.randomUUID().slice(0, 8);

  const logEntry = {
    timestamp,
    level,
    message,
    requestId,
    ...(isProd ? {} : { _raw: true }),
    ...meta,
  };

  if (meta.error && meta.error instanceof Error) {
    logEntry.error = {
      name: meta.error.name,
      message: meta.error.message,
      stack: isProd ? undefined : meta.error.stack,
    };
    delete logEntry.error;
    logEntry.error = {
      name: meta.error.name,
      message: meta.error.message,
      ...(isProd ? {} : { stack: meta.error.stack }),
    };
  }

  return logEntry;
}

function output(logEntry) {
  if (isProd) {
    console.log(JSON.stringify(logEntry));
  } else {
    const { timestamp, level, message, ...rest } = logEntry;
    const metaStr = Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest)}` : "";
    const prefix = {
      error: "\x1b[31m",
      warn: "\x1b[33m",
      info: "\x1b[36m",
      debug: "\x1b[90m",
    }[level] || "";
    const suffix = "\x1b[0m";
    console.log(`${prefix}[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}${suffix}`);
  }
}

const logger = {
  error(message, meta = {}) {
    if (currentLevel >= LOG_LEVELS.error) {
      output(formatMessage("error", message, meta));
    }
  },

  warn(message, meta = {}) {
    if (currentLevel >= LOG_LEVELS.warn) {
      output(formatMessage("warn", message, meta));
    }
  },

  info(message, meta = {}) {
    if (currentLevel >= LOG_LEVELS.info) {
      output(formatMessage("info", message, meta));
    }
  },

  debug(message, meta = {}) {
    if (currentLevel >= LOG_LEVELS.debug) {
      output(formatMessage("debug", message, meta));
    }
  },

  withRequest(req, res, next) {
    const requestId = crypto.randomUUID().slice(0, 8);
    global.__requestId = requestId;
    req.requestId = requestId;
    res.setHeader("X-Request-ID", requestId);
    next();
  },

  request(req, res, next) {
    const start = Date.now();
    const requestId = req.requestId || crypto.randomUUID().slice(0, 8);
    req.requestId = requestId;
    res.setHeader("X-Request-ID", requestId);

    res.on("finish", () => {
      const duration = Date.now() - start;
      output(formatMessage("info", `${req.method} ${req.path}`, {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userId: req.user?._id?.toString(),
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      }));
    });

    next();
  },
};

export default logger;
