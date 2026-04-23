import { z } from "zod";

/**
 * Middleware to validate request body against a Zod schema
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware
 */
export const validateRequestBody = (schema) => {
  return (req, res, next) => {
    try {
      const parsed = schema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid request data",
          errors: parsed.error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }

      req.validated = parsed.data;
      next();
    } catch (error) {
      console.error("Validation middleware error:", error.message);
      res.status(500).json({ message: "Validation error" });
    }
  };
};

/**
 * Middleware to validate request params against a Zod schema
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware
 */
export const validateRequestParams = (schema) => {
  return (req, res, next) => {
    try {
      const parsed = schema.safeParse(req.params);

      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid request parameters",
          errors: parsed.error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }

      req.validatedParams = parsed.data;
      next();
    } catch (error) {
      console.error("Validation middleware error:", error.message);
      res.status(500).json({ message: "Validation error" });
    }
  };
};

/**
 * Middleware to validate request query against a Zod schema
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware
 */
export const validateRequestQuery = (schema) => {
  return (req, res, next) => {
    try {
      const parsed = schema.safeParse(req.query);

      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid query parameters",
          errors: parsed.error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }

      req.validatedQuery = parsed.data;
      next();
    } catch (error) {
      console.error("Validation middleware error:", error.message);
      res.status(500).json({ message: "Validation error" });
    }
  };
};
