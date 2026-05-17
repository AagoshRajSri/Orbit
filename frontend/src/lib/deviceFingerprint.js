/**
 * Orbit Device Fingerprint — Phase 3
 *
 * Generates a stable, per-device cryptographic identity that is:
 *   1. Deterministic across page refreshes (same device = same ID)
 *   2. Resistant to user-agent spoofing (uses hardware entropy where available)
 *   3. Stored in IndexedDB as a non-extractable signing key pair
 *
 * The device fingerprint consists of:
 *   - A seeded UUID derived from browser/hardware characteristics (public)
 *   - An ECDSA P-256 signing key pair bound to this device (private = non-extractable)
 *
 * On registration, the server receives:
 *   {
 *     deviceId:         "<uuid-v5-like hash>",
 *     devicePublicKey:  "<base64 SPKI>",        // For verifying device-signed messages
 *     deviceName:       "Chrome on macOS",
 *     registeredAt:     "<ISO timestamp>",
 *     attestation:      "<base64 signature>",   // Signs { deviceId + userId + timestamp }
 *   }
 */

const DB_NAME    = "orbit-device-registry";
const DB_VERSION = 1;
const STORE_NAME = "device-keys";

let _db = null;

const openDB = () => {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
    req.onerror   = (event) => {
      const error = event.target?.error || event;
      console.error("[DeviceRegistry] Database connection failed:", error);
      if (error && (error.name === "VersionError" || error.message?.includes("version"))) {
        console.warn("[DeviceRegistry] Critical schema/version drift detected. Executing defensive local storage wipe...");
        try {
          indexedDB.deleteDatabase(DB_NAME);
          window.location.reload();
        } catch (wipeError) {
          console.error("[DeviceRegistry] Failed to automate recovery layout purge:", wipeError);
        }
      }
      reject(error);
    };
  });
};

const dbTx = async (mode, fn) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t    = db.transaction(STORE_NAME, mode);
    const store = t.objectStore(STORE_NAME);
    const req  = fn(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
};

const buf2b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));

// ── Browser characteristic collector ─────────────────────────────────────────

const collectEntropy = () => {
  const nav = navigator;
  const parts = [
    nav.userAgent || "",
    nav.language  || "",
    nav.hardwareConcurrency?.toString() || "",
    nav.deviceMemory?.toString()        || "",
    screen.width?.toString()  || "",
    screen.height?.toString() || "",
    screen.colorDepth?.toString() || "",
    Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    nav.platform || "",
  ];
  return parts.join("|");
};

/**
 * Hash entropy string → deterministic 16-byte device UUID seed.
 */
const hashEntropy = async (entropy) => {
  const enc = new TextEncoder().encode(entropy);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  const bytes = new Uint8Array(digest).slice(0, 16);
  // RFC 4122 UUID v4 format (deterministic)
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
};

// ── Device key management ─────────────────────────────────────────────────────

/**
 * Get (or generate + persist) the device identity.
 * @returns {Promise<{ deviceId, devicePublicKey, signingPrivateKey, deviceName }>}
 */
export const getOrCreateDeviceIdentity = async () => {
  // Try loading existing identity
  try {
    const existing = await dbTx("readonly", (s) => s.get("device_identity"));
    if (existing) {
      return {
        deviceId:          existing.deviceId,
        devicePublicKey:   existing.devicePublicKey,
        signingPrivateKey: existing.signingPrivateKey,
        deviceName:        existing.deviceName,
      };
    }
  } catch { /* first run */ }

  // Generate new device identity
  const entropy    = collectEntropy();
  const deviceId   = await hashEntropy(entropy);
  const deviceName = buildDeviceName();

  const kp = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    false, // non-extractable
    ["sign", "verify"]
  );

  const pubSpki        = await crypto.subtle.exportKey("spki", kp.publicKey);
  const devicePublicKey = buf2b64(pubSpki);

  await dbTx("readwrite", (s) =>
    s.put({
      id:                "device_identity",
      deviceId,
      devicePublicKey,
      signingPrivateKey: kp.privateKey, // Non-extractable CryptoKey
      deviceName,
      createdAt:         Date.now(),
    })
  );

  return { deviceId, devicePublicKey, signingPrivateKey: kp.privateKey, deviceName };
};

/**
 * Create an attestation signature binding (deviceId + userId + timestamp).
 * Sent on device registration so the server can verify this device's claim.
 */
export const createDeviceAttestation = async (userId) => {
  const { deviceId, signingPrivateKey } = await getOrCreateDeviceIdentity();
  const timestamp = new Date().toISOString();
  const payload   = `${deviceId}:${userId}:${timestamp}`;
  const sigBuf    = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    signingPrivateKey,
    new TextEncoder().encode(payload)
  );
  return { deviceId, timestamp, attestation: buf2b64(sigBuf) };
};

/**
 * Sign an arbitrary message with the device private key.
 * Used for device-bound message signing (Phase 3 security property).
 */
export const signWithDevice = async (message) => {
  const { signingPrivateKey } = await getOrCreateDeviceIdentity();
  const sigBuf = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    signingPrivateKey,
    new TextEncoder().encode(message)
  );
  return buf2b64(sigBuf);
};

/**
 * Clear device identity (on factory reset or explicit logout with device revocation).
 */
export const clearDeviceIdentity = async () => {
  try {
    await dbTx("readwrite", (s) => s.delete("device_identity"));
    _db = null;
  } catch (err) {
    console.error("[DeviceFingerprint] Clear failed:", err);
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const buildDeviceName = () => {
  const ua = navigator.userAgent;
  let browser = "Unknown Browser";
  if (ua.includes("Chrome"))  browser = "Chrome";
  if (ua.includes("Firefox")) browser = "Firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  if (ua.includes("Edge"))    browser = "Edge";

  let os = "Unknown OS";
  if (ua.includes("Windows")) os = "Windows";
  if (ua.includes("Mac OS"))  os = "macOS";
  if (ua.includes("Linux"))   os = "Linux";
  if (ua.includes("Android")) os = "Android";
  if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  return `${browser} on ${os}`;
};

export { collectEntropy, hashEntropy };
