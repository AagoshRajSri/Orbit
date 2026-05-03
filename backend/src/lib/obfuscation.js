import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

// Use a stable key for encryption/decryption
const SECRET = process.env.JWT_SECRET || "orbit-default-obfuscation-secret";
const ALGORITHM = "aes-256-ctr";

// Derived key for AES (must be 32 bytes)
const key = crypto.createHash("sha256").update(SECRET).digest();

/**
 * Obfuscates a database ID into a stateless, deterministic handle.
 * We use a HMAC of the ID to derive a stable IV, ensuring the same ID 
 * always results in the same obfuscated string.
 */
export const obfuscateId = (id) => {
  if (!id) return null;
  const idStr = id.toString();
  
  // Create a deterministic IV from the ID and Secret
  const iv = crypto.createHmac("sha256", SECRET)
    .update(idStr)
    .digest()
    .slice(0, 16);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(idStr), cipher.final()]);
  
  // Format: orb_ [IV in hex] [Encrypted in hex]
  return `orb_${iv.toString("hex")}${encrypted.toString("hex")}`;
};

/**
 * Resolves an obfuscated handle back to its real database ID.
 */
export const getRealId = (fakeId) => {
  if (!fakeId || typeof fakeId !== "string" || !fakeId.startsWith("orb_")) {
    return fakeId;
  }

  try {
    const raw = fakeId.substring(4);
    if (raw.length < 32) return fakeId; // Not enough for IV + data

    const iv = Buffer.from(raw.substring(0, 32), "hex");
    const encrypted = Buffer.from(raw.substring(32), "hex");
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    
    return decrypted.toString();
  } catch (err) {
    console.error("[Obfuscation] Decryption failed:", err.message);
    return fakeId;
  }
};

/**
 * Legacy support / Utility
 */
export const registerObfuscatedId = (realId) => {
  return obfuscateId(realId);
};

/**
 * Sanitizes an object by obfuscating any 'id' or '_id' fields.
 * Now deterministic and stateless.
 */
export const sanitizeForOrbit = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForOrbit(item));
  }
  
  if (obj !== null && typeof obj === 'object') {
    // If it's a Mongoose document, convert to object first
    const newObj = obj.toObject ? obj.toObject() : { ...obj };
    
    if (newObj._id) {
       const idStr = newObj._id.toString();
       newObj.id = idStr.startsWith("orb_") ? idStr : obfuscateId(idStr);
    } else if (newObj.id) {
       const idStr = newObj.id.toString();
       newObj.id = idStr.startsWith("orb_") ? idStr : obfuscateId(idStr);
    }
    
    // Obfuscate related fields and recurse into nested objects
    for (const key in newObj) {
      const val = newObj[key];
      if (key.endsWith('Id') && typeof val === 'string' && val.length > 20 && !val.startsWith("orb_")) {
        newObj[key] = obfuscateId(val);
      } else if (val !== null && typeof val === 'object' && key !== '_id' && key !== 'id') {
        newObj[key] = sanitizeForOrbit(val);
      }
    }
    
    return newObj;
  }
  
  return obj;
};
