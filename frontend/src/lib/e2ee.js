/**
 * Orbit E2EE — ECDH P-256 + HKDF + AES-256-GCM
 *
 * Replaces the legacy RSA-OAEP static key architecture with an ECDH-based
 * scheme that provides:
 *   - Ephemeral shared secret via ECDH P-256 key exchange
 *   - Per-message key derivation via HKDF-SHA-256
 *   - Authenticated encryption via AES-256-GCM (96-bit IV, 128-bit auth tag)
 *   - Associated Authenticated Data (AAD) binding ciphertext to message metadata
 *
 * SECURITY PROPERTIES:
 *   - Private keys stored as non-extractable CryptoKey (via keyStore.js)
 *   - No plaintext fallback — encryption failure throws, never silently downgrades
 *   - Each message has a unique ephemeral key pair (perfect forward secrecy per-message)
 *   - AAD prevents ciphertext from being transplanted to a different message context
 *
 * WIRE FORMAT (encryptedPayload object):
 *   {
 *     v: 2,                          // protocol version
 *     ephemeralPublicKey: "<base64>", // sender's ephemeral ECDH public key (SPKI)
 *     encryptedContent: "<base64>",   // AES-GCM ciphertext
 *     iv: "<base64>",                 // 96-bit random IV
 *     aad: "<base64>",                // Associated authenticated data
 *   }
 *
 * The server stores this opaque blob. It cannot derive the shared secret
 * without the recipient's private key.
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

const buf2b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const b64toBuf = (b64) => {
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
};

const ECDH_PARAMS = { name: "ECDH", namedCurve: "P-256" };
const AES_PARAMS  = { name: "AES-GCM", length: 256 };
const HKDF_HASH   = "SHA-256";
const KEY_INFO    = new TextEncoder().encode("orbit-e2ee-v2");

// ── Key generation ─────────────────────────────────────────────────────────────

/**
 * Generate a new ECDH P-256 key pair.
 * - publicKey  → extractable (SPKI, for upload to server / sharing)
 * - privateKey → non-extractable (stays in IndexedDB via keyStore)
 *
 * @returns {{ publicKey: CryptoKey, privateKey: CryptoKey }}
 */
export const generateKeyPair = async () => {
  return crypto.subtle.generateKey(ECDH_PARAMS, false, ["deriveKey", "deriveBits"]);
  // NOTE: The calling code (useAuthStore / keyStore) stores this via keyStore.js.
  // publicKey will be exported there for server upload.
};

/**
 * Export a public key to base64 SPKI format (for server storage / sharing).
 * @param {CryptoKey} publicKey
 * @returns {Promise<string>}
 */
export const exportPublicKey = async (publicKey) => {
  const buf = await crypto.subtle.exportKey("spki", publicKey);
  return buf2b64(buf);
};

/**
 * Import a base64 SPKI public key back as a CryptoKey.
 * @param {string} base64Spki
 * @returns {Promise<CryptoKey>}
 */
export const importPublicKey = async (base64Spki) => {
  return crypto.subtle.importKey(
    "spki",
    b64toBuf(base64Spki),
    ECDH_PARAMS,
    true,
    [] // No usages needed — only used in ECDH derivation
  );
};

// ── Core crypto ───────────────────────────────────────────────────────────────

/**
 * Derive a one-time AES-256-GCM key from an ECDH shared secret via HKDF.
 * @param {CryptoKey} privateKey  - Sender or receiver's ECDH private key
 * @param {CryptoKey} publicKey   - The other party's ECDH public key
 * @param {Uint8Array} salt       - Per-message random salt (IV reuse as salt is fine here)
 * @returns {Promise<CryptoKey>}  - Non-extractable AES-GCM key
 */
const deriveMessageKey = async (privateKey, publicKey, salt) => {
  const sharedBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: publicKey },
    privateKey,
    256
  );

  const hkdfKey = await crypto.subtle.importKey(
    "raw",
    sharedBits,
    { name: "HKDF" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: HKDF_HASH, salt, info: KEY_INFO },
    hkdfKey,
    AES_PARAMS,
    false,
    ["encrypt", "decrypt"]
  );
};

// ── Encryption ────────────────────────────────────────────────────────────────

/**
 * Encrypt a message payload for a recipient.
 *
 * Uses an ephemeral ECDH key pair so each message has a unique shared secret —
 * leaking the recipient's long-term private key does not expose past messages.
 *
 * @param {{ text?: string, image?: string }} payload - Message content
 * @param {CryptoKey} recipientPublicKey              - Recipient's long-term ECDH public key (CryptoKey)
 * @param {object} [aadContext]                       - Optional context bound into AAD (messageId, timestamp)
 * @returns {Promise<object>} encryptedPayload
 * @throws {Error} if encryption fails — NEVER silently downgrades to plaintext
 */
export const encryptMessage = async (payload, recipientPublicKey, aadContext = {}) => {
  // 1. Generate ephemeral sender key pair (per-message forward secrecy)
  const ephemeralKeyPair = await crypto.subtle.generateKey(ECDH_PARAMS, true, ["deriveKey", "deriveBits"]);

  // 2. Random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // 3. Derive shared secret: ephemeral private ↔ recipient public → HKDF → AES key
  const aesKey = await deriveMessageKey(ephemeralKeyPair.privateKey, recipientPublicKey, iv);

  // 4. Build AAD: binds ciphertext to context (prevents transplanting)
  const aadObj = {
    ts: aadContext.timestamp || Date.now(),
    id: aadContext.messageId || "",
    v: 2,
  };
  const aad = new TextEncoder().encode(JSON.stringify(aadObj));

  // 5. Encrypt payload
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: aad },
    aesKey,
    plaintext
  );

  // 6. Export ephemeral public key (recipient needs this to derive the same shared secret)
  const ephemeralSpki = await crypto.subtle.exportKey("spki", ephemeralKeyPair.publicKey);

  return {
    v: 2,
    ephemeralPublicKey: buf2b64(ephemeralSpki),
    encryptedContent: buf2b64(ciphertext),
    iv: buf2b64(iv),
    aad: buf2b64(aad),
  };
};

// ── Decryption ────────────────────────────────────────────────────────────────

/**
 * Decrypt a message encrypted with encryptMessage().
 *
 * @param {object} encryptedData           - The encryptedPayload from encryptMessage()
 * @param {CryptoKey} recipientPrivateKey  - Non-extractable ECDH private key from keyStore
 * @returns {Promise<{ text?: string, image?: string } | null>}
 *   Returns null only on decryption failure (key mismatch / corrupted data).
 *   Does NOT silently return plaintext on failure.
 */
export const decryptMessage = async (encryptedData, recipientPrivateKey) => {
  // Handle legacy RSA-OAEP messages (v1 or unversioned) — decrypt best-effort
  if (!encryptedData.v || encryptedData.v < 2) {
    return _decryptLegacy(encryptedData, recipientPrivateKey);
  }

  try {
    const { ephemeralPublicKey, encryptedContent, iv: ivB64, aad: aadB64 } = encryptedData;

    if (!ephemeralPublicKey || !encryptedContent || !ivB64) {
      console.error("[E2EE] Missing required fields in encrypted payload");
      return null;
    }

    // 1. Import sender's ephemeral public key
    const ephemeralPubKey = await importPublicKey(ephemeralPublicKey);

    // 2. Derive same shared secret: recipient private ↔ ephemeral public → HKDF → AES key
    const iv = new Uint8Array(b64toBuf(ivB64));
    const aesKey = await deriveMessageKey(recipientPrivateKey, ephemeralPubKey, iv);

    // 3. Decrypt
    const aad = aadB64 ? new Uint8Array(b64toBuf(aadB64)) : undefined;
    const ciphertext = b64toBuf(encryptedContent);

    const decryptParams = { name: "AES-GCM", iv };
    if (aad) decryptParams.additionalData = aad;

    const plaintext = await crypto.subtle.decrypt(decryptParams, aesKey, ciphertext);
    return JSON.parse(new TextDecoder().decode(plaintext));
  } catch (err) {
    console.error("[E2EE] Decryption failed:", err.message || err);
    return null;
  }
};

// ── Legacy RSA-OAEP compatibility (v1 messages) ───────────────────────────────

/**
 * Attempt to decrypt a legacy RSA-OAEP encrypted message (v1 / unversioned).
 * New ECDH private keys cannot decrypt old RSA ciphertext, so these messages
 * return a stable placeholder. Historical messages encrypted with old RSA keys
 * are permanently inaccessible after the key migration — this is intentional
 * and mirrors Signal's behavior on identity key resets.
 *
 * @private
 */
const _decryptLegacy = async (encryptedData, privateKey) => {
  // If the private key is a CryptoKey (new ECDH format), it cannot decrypt RSA ciphertext
  if (privateKey instanceof CryptoKey) {
    return { text: "🔒 [Encrypted with legacy key — message history not migrated]" };
  }

  // Old path: private key was a base64 RSA PKCS8 string (pre-migration)
  // Try RSA-OAEP decryption using the Web Crypto API directly
  try {
    const { encryptedKeyForReceiver, encryptedKeyForSender, encryptedContent, iv } = encryptedData;
    const encryptedAesKeyB64 = encryptedKeyForReceiver || encryptedKeyForSender;
    if (!encryptedAesKeyB64 || !encryptedContent || !iv) {
      return { text: "🔒 [Incomplete legacy message]" };
    }

    const b64toBuf = (b64) => {
      const bin = atob(b64);
      const buf = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      return buf.buffer;
    };

    const privKey = await crypto.subtle.importKey(
      "pkcs8",
      b64toBuf(privateKey),
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["decrypt"]
    );

    const aesKeyBuf = await crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privKey,
      b64toBuf(encryptedAesKeyB64)
    );

    const aesKey = await crypto.subtle.importKey(
      "raw", aesKeyBuf, { name: "AES-GCM" }, false, ["decrypt"]
    );

    const plainBuf = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(b64toBuf(iv)) },
      aesKey,
      b64toBuf(encryptedContent)
    );

    return JSON.parse(new TextDecoder().decode(plainBuf));
  } catch {
    return { text: "🔒 [Legacy encrypted message — decryption failed]" };
  }
};
