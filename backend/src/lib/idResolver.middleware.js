import { getRealId } from "./obfuscation.js";

/**
 * Middleware that automatically resolves any obfuscated Orbit IDs (orb_...)
 * found in request parameters, body, or query strings back to their real database IDs.
 * This simplifies controllers by allowing them to work with real IDs transparently.
 */
export const resolveOrbitIds = (req, res, next) => {
  const resolve = (obj) => {
    if (!obj || typeof obj !== "object") return obj;
    
    for (const key in obj) {
      const val = obj[key];
      
      if (typeof val === "string" && val.startsWith("orb_")) {
        obj[key] = getRealId(val);
      } else if (typeof val === "object") {
        resolve(val);
      }
    }
    return obj;
  };

  if (req.params) resolve(req.params);
  if (req.query) resolve(req.query);
  if (req.body) resolve(req.body);

  next();
};
