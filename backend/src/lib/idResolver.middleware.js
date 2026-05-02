import { getRealId } from "./obfuscation.js";

/**
 * Middleware that automatically resolves any obfuscated Orbit IDs (orb_...)
 * found in request parameters, body, or query strings back to their real database IDs.
 * This simplifies controllers by allowing them to work with real IDs transparently.
 */
export const resolveOrbitIds = (req, res, next) => {
  try {
    const resolve = (obj) => {
      if (!obj || typeof obj !== "object") return;
      
      for (const key in obj) {
        try {
          const val = obj[key];
          
          if (typeof val === "string" && val.startsWith("orb_")) {
            obj[key] = getRealId(val);
          } else if (Array.isArray(val)) {
            val.forEach((item, index) => {
               if (typeof item === "string" && item.startsWith("orb_")) {
                 val[index] = getRealId(item);
               }
            });
          }
        } catch (e) {
          // Ignore individual field failures
        }
      }
    };

    if (req.params) resolve(req.params);
    if (req.query) resolve(req.query);
    if (req.body) resolve(req.body);

    next();
  } catch (globalError) {
    console.error("[ID Resolver] Global failure:", globalError.message);
    next(); // Always proceed even if resolver fails
  }
};
