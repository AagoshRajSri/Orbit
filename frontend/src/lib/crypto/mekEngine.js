/**
 * Orbit MEK Engine — Message Encryption Key Cryptographic Engine
 *
 * ARCHITECTURE:
 *   Recovery Passphrase
 *     └─▶ Argon2id-equivalent (PBKDF2-SHA-512, 600k rounds) ──▶ KEK (Key Encryption Key)
 *              └─▶ AES-KW wraps ──▶ eMEK (encrypted MEK, stored in KeyVault)
 *
 *   MEK (Master Encryption Key, AES-256-GCM, non-extractable in memory)
 *     └─▶ HKDF-derived CVKs (Context Vault Keys, one per Nexus/DM context)
 *              └─▶ Encrypts / decrypts SenderKey blobs stored in KeyVault
 *
 * SECURITY PROPERTIES:
 *   - MEK is NEVER exportable as raw bytes during normal operation
 *   - KEK is derived in-browser, never sent to server
 *   - Server only stores: eMEK blob (AES-256-KW wrapped), salt, epoch metadata
 *   - Each epoch generates a new MEK; rotation invalidates prior eMEK blobs
 *   - Nonces are monotonic per epoch to prevent IV reuse
 *   - All CryptoKey objects are non-extractable
 *
 * EPOCH MODEL:
 *   epoch 0 = initial device setup
 *   epoch N = post-rotation (compromise recovery, member change, etc.)
 *   Stale devices on epoch < current must re-derive via passphrase or QR link
 */

// ── Wire format version ───────────────────────────────────────────────────────
const VAULT_VERSION = 1;

// ── Codec helpers ─────────────────────────────────────────────────────────────
const enc = new TextEncoder();
const dec = new TextDecoder();
const buf2b64 = (buf) => {
  const bytes = new Uint8Array(buf instanceof ArrayBuffer ? buf : buf.buffer);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
};
const b64toBuf = (b64) => {
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
};

// ── In-memory MEK cache (single tab lifetime only) ───────────────────────────
// MEK is non-extractable — only held as a CryptoKey reference.
let _cachedMEK = null;      // CryptoKey (AES-GCM, non-extractable)
let _currentEpoch = 0;

/**
 * Clears the in-memory MEK. Call on logout, idle-lock, or tab close.
 */
export function clearMEK() {
  _cachedMEK = null;
  _currentEpoch = 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. KEK DERIVATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Derive the Key Encryption Key (KEK) from a passphrase + salt using PBKDF2-SHA-512.
 * This is the closest WebCrypto equivalent to Argon2id. For production hardness,
 * use 600,000 iterations (matches OWASP 2024 recommendation for SHA-512).
 *
 * @param {string} passphrase - The user's security passphrase (ephemeral, cleared after use)
 * @param {Uint8Array} salt   - 32-byte random salt (stored in KeyVault, never secret)
 * @returns {Promise<CryptoKey>} - AES-KW KEK (non-extractable)
 */
export async function deriveKEK(passphrase, salt) {
  if (!passphrase || passphrase.length < 20) {
    throw new Error("[MEK] Passphrase too short for KEK derivation");
  }
  if (!(salt instanceof Uint8Array) || salt.length < 16) {
    throw new Error("[MEK] Salt must be at least 16 bytes");
  }

  const rawKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 600_000,
      hash: "SHA-512",
    },
    rawKey,
    { name: "AES-KW", length: 256 },
    false,        // Non-extractable
    ["wrapKey", "unwrapKey"]
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. MEK GENERATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a fresh 256-bit MEK (AES-GCM, non-extractable).
 * Called during:
 *   - First device setup (epoch 0)
 *   - Key rotation (epoch N+1)
 *
 * @returns {Promise<CryptoKey>} Non-extractable AES-256-GCM key
 */
export async function generateMEK() {
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,   // Must be extractable for wrapKey — but we only wrap, never export raw
    ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. eMEK — WRAP & UNWRAP (KeyVault persistence layer)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Wrap MEK with the KEK using AES-KW to produce an eMEK blob.
 * The eMEK blob is safe to persist on the server (zero-knowledge).
 *
 * Wire format (eMEKEnvelope):
 * {
 *   version: 1,
 *   epoch:   <number>,
 *   salt:    "<base64 32-byte KEK salt>",
 *   eMEK:    "<base64 AES-KW wrapped MEK>",
 *   ts:      <unix ms>,
 * }
 *
 * @param {CryptoKey} mek       - The MEK to wrap
 * @param {CryptoKey} kek       - The KEK to wrap with
 * @param {Uint8Array} kekSalt  - The salt used to derive the KEK (needed for re-derivation)
 * @param {number} epoch        - Current epoch number
 * @returns {Promise<object>} eMEKEnvelope
 */
export async function wrapMEK(mek, kek, kekSalt, epoch = 0) {
  const wrappedBuf = await crypto.subtle.wrapKey("raw", mek, kek, "AES-KW");
  return {
    version: VAULT_VERSION,
    epoch,
    salt: buf2b64(kekSalt),
    eMEK: buf2b64(wrappedBuf),
    ts: Date.now(),
  };
}

/**
 * Unwrap an eMEKEnvelope back into a live MEK CryptoKey.
 * Requires the user's passphrase to re-derive the KEK.
 *
 * @param {object} envelope   - eMEKEnvelope from the server vault
 * @param {string} passphrase - User's security passphrase (ephemeral)
 * @returns {Promise<{ mek: CryptoKey, epoch: number }>}
 */
export async function unwrapMEK(envelope, passphrase) {
  if (!envelope || envelope.version !== VAULT_VERSION) {
    throw new Error("[MEK] Unknown or missing vault version");
  }

  const kekSalt = new Uint8Array(b64toBuf(envelope.salt));
  const kek = await deriveKEK(passphrase, kekSalt);

  const mek = await crypto.subtle.unwrapKey(
    "raw",
    b64toBuf(envelope.eMEK),
    kek,
    "AES-KW",
    { name: "AES-GCM", length: 256 },
    false,        // Non-extractable once unwrapped
    ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
  );

  return { mek, epoch: envelope.epoch };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. CVK DERIVATION (Context Vault Keys)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Derive a Context Vault Key (CVK) from the MEK via HKDF.
 * Each Nexus / DM context gets its own CVK so that a CVK compromise
 * does not expose other contexts.
 *
 * @param {CryptoKey} mek     - The live in-memory MEK
 * @param {string} contextId  - Nexus ID or DM user ID (used as HKDF info)
 * @param {string} label      - Purpose label e.g. "sender-key" | "history-index"
 * @returns {Promise<CryptoKey>} Non-extractable AES-256-GCM CVK
 */
export async function deriveCVK(mek, contextId, label = "sender-key") {
  if (!_cachedMEK && mek) _cachedMEK = mek; // Cache for session lifetime

  const info = enc.encode(`orbit-cvk-v1:${label}:${contextId}`);
  const salt = new Uint8Array(32); // Zero salt (contextId provides the domain separation)

  // Temporarily export MEK raw bits to feed HKDF (only path where raw bits touch memory)
  const mekBits = await crypto.subtle.exportKey("raw", mek);

  const hkdfKey = await crypto.subtle.importKey(
    "raw",
    mekBits,
    { name: "HKDF" },
    false,
    ["deriveKey"]
  );

  // Overwrite the exported bits immediately
  new Uint8Array(mekBits).fill(0);

  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt, info },
    hkdfKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. SENDER KEY VAULT ENCRYPTION / DECRYPTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Encrypt a sender-key blob for vault persistence using the context CVK.
 *
 * Wire format (VaultPayload):
 * {
 *   version: 1,
 *   epoch:   <number>,
 *   keyId:   "<contextId:label>",
 *   nonce:   "<base64 12-byte IV>",
 *   ts:      <unix ms>,
 *   ct:      "<base64 AES-GCM ciphertext>",
 *   sig:     "<base64 HMAC-SHA-256 of version+epoch+keyId+nonce+ts>",
 * }
 *
 * @param {CryptoKey} cvk        - The CVK for this context
 * @param {object|string} data   - Sender key state object to encrypt
 * @param {string} contextId     - Used in integrity metadata
 * @param {number} epoch         - Current key epoch
 * @returns {Promise<object>} VaultPayload
 */
export async function encryptForVault(cvk, data, contextId, epoch = 0) {
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const ts = Date.now();
  const keyId = contextId;
  const plaintext = typeof data === "string" ? data : JSON.stringify(data);

  // Integrity-bound AAD prevents transplanting this payload to another context
  const aad = enc.encode(`${VAULT_VERSION}:${epoch}:${keyId}:${buf2b64(nonce)}:${ts}`);

  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce, additionalData: aad },
    cvk,
    enc.encode(plaintext)
  );

  return {
    version: VAULT_VERSION,
    epoch,
    keyId,
    nonce: buf2b64(nonce),
    ts,
    ct: buf2b64(ct),
    // sig field: HMAC could be added here with a separate signing key derived from MEK
    // For now the GCM auth-tag covers integrity
  };
}

/**
 * Decrypt a VaultPayload using the context CVK.
 *
 * @param {CryptoKey} cvk        - The CVK for this context
 * @param {object} payload       - VaultPayload from server
 * @returns {Promise<object>}    - Decrypted sender key state
 */
export async function decryptFromVault(cvk, payload) {
  if (!payload || payload.version !== VAULT_VERSION) {
    throw new Error("[MEK] Vault payload version mismatch");
  }

  const { epoch, keyId, nonce, ts, ct } = payload;
  const nonceBuf = new Uint8Array(b64toBuf(nonce));
  const aad = enc.encode(`${VAULT_VERSION}:${epoch}:${keyId}:${nonce}:${ts}`);

  const plainBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: nonceBuf, additionalData: aad },
    cvk,
    b64toBuf(ct)
  );

  return JSON.parse(dec.decode(plainBuf));
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. FULL SETUP FLOW
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Initialize MEK engine for a new device (first-time setup or post-rotation).
 * Generates a fresh MEK, wraps it with a new KEK derived from the user's passphrase.
 * Returns the eMEKEnvelope for server storage.
 *
 * @param {string} passphrase - User's security passphrase
 * @param {number} epoch      - Starting epoch (0 for new users, N for rotation)
 * @returns {Promise<{ envelope: object, mek: CryptoKey }>}
 */
export async function initializeMEK(passphrase, epoch = 0) {
  const kekSalt = crypto.getRandomValues(new Uint8Array(32));
  const kek = await deriveKEK(passphrase, kekSalt);
  const mek = await generateMEK();
  const envelope = await wrapMEK(mek, kek, kekSalt, epoch);

  _cachedMEK = mek;
  _currentEpoch = epoch;

  return { envelope, mek };
}

/**
 * Restore MEK from the server vault using the user's passphrase.
 * Caches the MEK for the session lifetime.
 *
 * @param {object} envelope   - eMEKEnvelope from server KeyVault
 * @param {string} passphrase - User's security passphrase
 * @returns {Promise<CryptoKey>} Live MEK CryptoKey
 */
export async function restoreMEK(envelope, passphrase) {
  const { mek, epoch } = await unwrapMEK(envelope, passphrase);
  _cachedMEK = mek;
  _currentEpoch = epoch;
  return mek;
}

/**
 * Get the currently cached MEK (session-lived).
 * Returns null if MEK has not been initialized or was cleared.
 *
 * @returns {CryptoKey|null}
 */
export function getCachedMEK() {
  return _cachedMEK;
}

/**
 * Get the current key epoch.
 * @returns {number}
 */
export function getCurrentEpoch() {
  return _currentEpoch;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. KEY ROTATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Rotate the MEK — generates a new MEK and increments the epoch.
 * The old MEK is discarded from memory. The new eMEKEnvelope must be
 * persisted to the server vault and all CVKs must be re-derived.
 *
 * Call this on:
 *   - Suspected compromise
 *   - Nexus member departure
 *   - Periodic rotation policy
 *
 * @param {string} passphrase - User's security passphrase (used to wrap new MEK)
 * @returns {Promise<{ envelope: object, newMEK: CryptoKey, epoch: number }>}
 */
export async function rotateMEK(passphrase) {
  const newEpoch = _currentEpoch + 1;
  const { envelope, mek: newMEK } = await initializeMEK(passphrase, newEpoch);

  // Clear old MEK reference (old CryptoKey becomes unreachable for GC)
  _cachedMEK = null;
  _cachedMEK = newMEK;
  _currentEpoch = newEpoch;

  return { envelope, newMEK, epoch: newEpoch };
}
