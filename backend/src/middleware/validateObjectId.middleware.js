import mongoose from "mongoose";

/**
 * Middleware factory that validates named URL params as MongoDB ObjectIds.
 * Returns 400 with a clear message before the request reaches any controller,
 * preventing CastError exceptions and potential NoSQL injection edge cases.
 *
 * Usage:
 *   router.delete("/:messageId", validateObjectId("messageId"), deleteMessage);
 */
export const validateObjectId = (...paramNames) => (req, res, next) => {
  for (const param of paramNames) {
    const value = req.params[param];
    if (!value) continue; // param not in route — skip

    // Also accept orb_ prefixed obfuscated IDs (resolved later by idResolver)
    if (typeof value === "string" && value.startsWith("orb_")) continue;

    if (!mongoose.Types.ObjectId.isValid(value)) {
      return res.status(400).json({
        success: false,
        message: `Invalid identifier for parameter '${param}'`,
      });
    }
  }
  next();
};
