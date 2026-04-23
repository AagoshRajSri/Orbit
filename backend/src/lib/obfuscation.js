import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const SECRET = process.env.JWT_SECRET || "orbit-default-obfuscation-secret";

/**
 * Obfuscates a database ID (or any string) into a session-safe temporary handle.
 * This prevents users from mapping our DB structure or scraping based on stable IDs.
 */
export const obfuscateId = (id, saltOrSession = "global") => {
  if (!id) return null;
  const hash = crypto.createHmac("sha256", SECRET)
    .update(`${id}:${saltOrSession}`)
    .digest("hex");
  
  // Return a compact, readable version of the hash
  return `orb_${hash.substring(0, 16)}`;
};

/**
 * Reverses the obfuscation (theoretical)
 * NOTE: In a production "Inside Out" system, we'd store a mapping in Redis
 * for the session's duration. For now, we'll use a deterministic approach
 * if the salt is consistent, or a lookup table.
 */
const lookupMap = new Map();

export const registerObfuscatedId = (realId, saltOrSession = "global") => {
  const fakeId = obfuscateId(realId, saltOrSession);
  lookupMap.set(fakeId, realId);
  return fakeId;
};

export const getRealId = (fakeId) => {
  return lookupMap.get(fakeId) || fakeId;
};

/**
 * Sanitizes an object by obfuscating any 'id' or '_id' fields
 */
export const sanitizeForOrbit = (obj, saltOrSession = "global") => {
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForOrbit(item, saltOrSession));
  }
  
  if (obj !== null && typeof obj === 'object') {
    const newObj = { ...obj };
    if (newObj._id) {
       newObj.id = registerObfuscatedId(newObj._id.toString(), saltOrSession);
       delete newObj._id;
    } else if (newObj.id) {
       newObj.id = registerObfuscatedId(newObj.id.toString(), saltOrSession);
    }
    
    // Obfuscate related fields if they look like IDs
    for (const key in newObj) {
      if (key.endsWith('Id') && typeof newObj[key] === 'string' && newObj[key].length > 20) {
        newObj[key] = registerObfuscatedId(newObj[key], saltOrSession);
      }
    }
    
    return newObj;
  }
  
  return obj;
};
