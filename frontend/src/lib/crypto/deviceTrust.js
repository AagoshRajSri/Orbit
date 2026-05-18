/**
 * Orbit Device Trust — Ed25519-equivalent device identity and signing.
 *
 * WebCrypto does not support Ed25519 in all browsers (it landed in Chrome 113+).
 * We use ECDSA P-256 as the signing primitive for maximum compatibility,
 * with a migration path to Ed25519 when it becomes universally available.
 *
 * DEVICE IDENTITY LIFECYCLE:
 *   1. On first login, generate a device identity key pair (ECDSA P-256).
 *   2. Register the device public key with the server (DeviceRegistry).
 *   3. Sign all vault writes with the device private key.
 *   4. Other devices and the server can verify writes using the registered public key.
 *   5. On revocation, the server marks the device as revoked; future signed writes
 *      from that deviceId are rejected by the vault controller.
 *
 * QR / SAS DEVICE LINKING:
 *   1. New device generates an ephemeral ECDH key pair.
 *   2. Trusted device scans QR and performs ECDH to derive a shared secret.
 *   3. SAS (Short Authentication String) is derived from the shared secret.
 *   4. User visually confirms SAS matches on both screens.
 *   5. Trusted device wraps the eMEK envelope + sender keys using the shared secret
 *      and transmits to the new device via the server as an encrypted blob.
 *   6. New device unwraps with the shared secret and initializes its vault.
 *
 * STORAGE:
 *   Device key pair → IndexedDB "orbit-device-trust" store (non-extractable private key)
 *   Device ID → deterministic hash of public key bytes (stable across sessions)
 */

const DB_NAME    = "orbit-device-trust";
const DB_VERSION = 1;
const STORE_NAME = "device-keys";

const ECDSA_PARAMS = { name: "ECDSA", namedCurve: "P-256" };
const ECDH_PARAMS  = { name: "ECDH",  namedCurve: "P-256" };

const buf2b64 = (buf) => {
  const bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : new Uint8Array(buf.buffer ?? buf);
  let s = ""; for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
};
const b64toBuf = (b64) => {
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
};

// ── IndexedDB ─────────────────────────────────────────────────────────────────

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
    req.onsuccess  = (e) => { _db = e.target.result; resolve(_db); };
    req.onerror    = (e) => reject(e.target.error);
  });
};

const idbPut = async (record) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const req = tx.objectStore(STORE_NAME).put(record);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
};

const idbGet = async (id) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(id);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror   = () => reject(req.error);
  });
};

// ── Device ID derivation ──────────────────────────────────────────────────────

/**
 * Derive a stable device ID from the ECDSA public key bytes.
 * SHA-256(spki) → first 16 bytes as hex = 32-char device ID.
 */
export const deriveDeviceId = async (publicKeyBuffer) => {
  const hashBuf = await crypto.subtle.digest("SHA-256", publicKeyBuffer);
  return Array.from(new Uint8Array(hashBuf).slice(0, 16))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

// ── Device Key Generation & Storage ──────────────────────────────────────────

/**
 * Generate and persist a device identity key pair.
 * Called once on first login per device. Idempotent — will not overwrite.
 *
 * @returns {Promise<{ deviceId: string, publicKeyB64: string }>}
 */
export const initDeviceIdentity = async () => {
  const existing = await idbGet("device-identity");
  if (existing) {
    const publicKeyB64 = buf2b64(existing.publicKeyBuffer);
    const deviceId = await deriveDeviceId(existing.publicKeyBuffer);
    return { deviceId, publicKeyB64 };
  }

  const kp = await crypto.subtle.generateKey(ECDSA_PARAMS, false, ["sign", "verify"]);
  const publicKeyBuffer = await crypto.subtle.exportKey("spki", kp.publicKey);
  const deviceId = await deriveDeviceId(publicKeyBuffer);

  await idbPut({
    id:              "device-identity",
    privateKey:      kp.privateKey, // Non-extractable CryptoKey
    publicKeyBuffer,                // ArrayBuffer (exportable for registration)
    deviceId,
    createdAt:       Date.now(),
  });

  return { deviceId, publicKeyB64: buf2b64(publicKeyBuffer) };
};

/**
 * Load the device identity from IndexedDB.
 * Returns null if device has not been initialized.
 */
export const getDeviceIdentity = async () => {
  const record = await idbGet("device-identity");
  if (!record) return null;
  const deviceId = await deriveDeviceId(record.publicKeyBuffer);
  return {
    deviceId,
    privateKey:      record.privateKey,
    publicKeyBuffer: record.publicKeyBuffer,
    publicKeyB64:    buf2b64(record.publicKeyBuffer),
  };
};

// ── Signing & Verification ────────────────────────────────────────────────────

/**
 * Sign an arbitrary string with the device's ECDSA private key.
 * Used to sign vault manifest hashes.
 *
 * @param {string} data - The string to sign (typically the manifest hash)
 * @returns {Promise<string>} Base64 DER signature
 */
export const signWithDeviceKey = async (data) => {
  const identity = await getDeviceIdentity();
  if (!identity) throw new Error("[DeviceTrust] Device identity not initialized");

  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    identity.privateKey,
    new TextEncoder().encode(data)
  );
  return buf2b64(sig);
};

/**
 * Verify a signature against a registered device's public key.
 *
 * @param {string} data         - The original signed string
 * @param {string} sigB64       - Base64 DER signature
 * @param {string} pubKeyB64    - Base64 SPKI public key of the signing device
 * @returns {Promise<boolean>}
 */
export const verifyDeviceSignature = async (data, sigB64, pubKeyB64) => {
  try {
    const pubKey = await crypto.subtle.importKey(
      "spki", b64toBuf(pubKeyB64), ECDSA_PARAMS, true, ["verify"]
    );
    return crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      pubKey,
      b64toBuf(sigB64),
      new TextEncoder().encode(data)
    );
  } catch {
    return false;
  }
};

// ── QR Linking — ECDH Shared Secret ──────────────────────────────────────────

/**
 * Generate an ephemeral ECDH key pair for QR-based device linking.
 * The public key is encoded in the QR code.
 *
 * @returns {Promise<{ ephemeralPublicKeyB64: string, privateKey: CryptoKey }>}
 */
export const generateLinkEphemeralKey = async () => {
  const kp = await crypto.subtle.generateKey(ECDH_PARAMS, false, ["deriveKey", "deriveBits"]);
  const spki = await crypto.subtle.exportKey("spki", kp.publicKey);
  return {
    ephemeralPublicKeyB64: buf2b64(spki),
    privateKey: kp.privateKey,
  };
};

/**
 * Derive the shared secret between two devices during QR linking.
 * Both devices call this with their private key and the peer's public key.
 * Outputs an AES-GCM wrapping key.
 *
 * @param {CryptoKey} myPrivateKey      - This device's ephemeral private key
 * @param {string}    peerPublicKeyB64  - Peer device's ephemeral public key (from QR)
 * @returns {Promise<{ sharedKey: CryptoKey, sasCode: string }>}
 */
export const deriveLinkSharedSecret = async (myPrivateKey, peerPublicKeyB64) => {
  const peerPubKey = await crypto.subtle.importKey(
    "spki", b64toBuf(peerPublicKeyB64), ECDH_PARAMS, true, []
  );

  const sharedBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: peerPubKey },
    myPrivateKey,
    256
  );

  const hkdfKey = await crypto.subtle.importKey("raw", sharedBits, { name: "HKDF" }, false, ["deriveKey"]);

  // Derive AES-GCM wrapping key for vault blob transfer
  const sharedKey = await crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: new Uint8Array(32), info: new TextEncoder().encode("orbit-device-link-v1") },
    hkdfKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  // Derive SAS (Short Authentication String) — first 4 decimal digits of the shared secret
  const sasBits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: new Uint8Array(32), info: new TextEncoder().encode("orbit-sas-v1") },
    hkdfKey,
    16
  );
  const sasNum = new DataView(sasBits).getUint16(0) % 10000;
  const sasCode = sasNum.toString().padStart(4, "0");

  return { sharedKey, sasCode };
};

/**
 * Encrypt the vault transfer blob for a new device using the shared secret.
 * The trusted device calls this to send its vault to the linking device.
 *
 * @param {CryptoKey} sharedKey  - Derived from QR linking
 * @param {object}    vaultBlob  - { eMEKEnvelope, senderKeys }
 * @returns {Promise<{ ct: string, nonce: string }>}
 */
export const encryptVaultTransfer = async (sharedKey, vaultBlob) => {
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const ct    = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce },
    sharedKey,
    new TextEncoder().encode(JSON.stringify(vaultBlob))
  );
  return { ct: buf2b64(ct), nonce: buf2b64(nonce) };
};

/**
 * Decrypt the vault transfer blob on the new device.
 *
 * @param {CryptoKey} sharedKey  - Derived from QR linking
 * @param {string}    ct         - Base64 ciphertext
 * @param {string}    nonce      - Base64 12-byte IV
 * @returns {Promise<object>}    - { eMEKEnvelope, senderKeys }
 */
export const decryptVaultTransfer = async (sharedKey, ct, nonce) => {
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(b64toBuf(nonce)) },
    sharedKey,
    b64toBuf(ct)
  );
  return JSON.parse(new TextDecoder().decode(plain));
};

// ── Device Cleanup ────────────────────────────────────────────────────────────

/**
 * Destroy the device identity from IndexedDB.
 * Call on factory reset or logout with "forget this device".
 */
export const destroyDeviceIdentity = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, "readwrite");
    const req = tx.objectStore(STORE_NAME).delete("device-identity");
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
};
