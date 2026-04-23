import logger from "../lib/logger.js";

/**
 * Request logger middleware
 * Logs all incoming requests with method, path, and basic info
 */
export const requestLogger = logger.request;
