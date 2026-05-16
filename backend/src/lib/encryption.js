import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const SECRET = process.env.TOKEN_ENCRYPTION_SECRET || process.env.JWT_SECRET;

if (!SECRET) {
  throw new Error("CRITICAL: TOKEN_ENCRYPTION_SECRET must be defined");
}

// Ensure key is 32 bytes
const KEY = crypto.createHash("sha256").update(SECRET).digest();

/**
 * Encrypts a string using aes-256-gcm.
 * Returns a colon-separated string: iv:authTag:encryptedData
 */
export const encrypt = (text) => {
  if (!text) return null;
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag().toString("hex");
  
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
};

/**
 * Decrypts a string encrypted by the encrypt function.
 */
export const decrypt = (encryptedText) => {
  if (!encryptedText) return null;
  
  try {
    const [ivHex, authTagHex, encryptedData] = encryptedText.split(":");
    
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (err) {
    console.error("[Encryption] Decryption failed:", err.message);
    return null; // Return null on failure to avoid crashing
  }
};
