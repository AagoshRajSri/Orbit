/**
 * Orbit Double Ratchet Algorithm
 *
 * Implements the Double Ratchet algorithm (Signal specification).
 * Provides forward secrecy and post-compromise security per message.
 *
 * RATCHET COMPONENTS:
 *   - Root Ratchet:     HKDF(root_key, DH_output) → new root_key + chain_key
 *   - Sending Chain:    HKDF(chain_key, constant)  → new chain_key + message_key
 *   - Receiving Chain: Same structure, for incoming messages
 *
 * SECURITY PROPERTIES:
 *   - Forward secrecy:          Old message keys deleted after use; past messages safe
 *   - Post-compromise security: After key compromise, DH ratchet step restores security
 *   - Out-of-order messages:    Up to MAX_SKIP keys cached, then discarded
 *
 * WIRE FORMAT (encrypted ratchet message):
 *   {
 *     v: 3,                           // Protocol version
 *     dh: "<base64>",                 // Sender's current ratchet DH public key
 *     n:  <number>,                   // Message number in current sending chain
 *     pn: <number>,                   // Number of messages in previous sending chain
 *     ciphertext: "<base64>",         // AES-256-GCM ciphertext
 *     iv: "<base64>",                 // 96-bit random IV
 *   }
 *
 * SESSION STATE (persisted in sessionStore.js):
 *   {
 *     DHs: CryptoKey,                 // Our current ratchet sending key pair (private)
 *     DHs_pub: string,                // Our current ratchet sending key (public, base64)
 *     DHr: string|null,               // Remote party's ratchet public key (base64)
 *     RK:  ArrayBuffer,               // Root key (32 bytes)
 *     CKs: ArrayBuffer|null,          // Sending chain key (32 bytes)
 *     CKr: ArrayBuffer|null,          // Receiving chain key (32 bytes)
 *     Ns:  number,                    // Sending message counter
 *     Nr:  number,                    // Receiving message counter
 *     PN:  number,                    // Previous sending chain message count
 *     MKSKIPPED: Map<string, ArrayBuffer> // Skipped message keys
 *   }
 */

const MAX_SKIP = 100; // Max skippable messages (prevents DoS via skipping)

// ── Helpers ──────────────────────────────────────────────────────────────────

const buf2b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const b64toBuf = (b64) => {
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
};

const ECDH_PARAMS = { name: "ECDH", namedCurve: "P-256" };
const HKDF_HASH   = "SHA-256";

// Constants for HKDF info fields (domain separation)
const INFO_ROOT   = new TextEncoder().encode("orbit-ratchet-root-v1");
const INFO_CHAIN  = new TextEncoder().encode("orbit-ratchet-chain-v1");
const INFO_MSG    = new TextEncoder().encode("orbit-ratchet-message-v1");

// ── HKDF primitives ───────────────────────────────────────────────────────────

/**
 * HKDF-SHA-256 with explicit salt + info → raw output bits.
 */
const hkdf = async (keyMaterial, salt, info, bits = 256) => {
  const baseKey = await crypto.subtle.importKey(
    "raw", keyMaterial instanceof ArrayBuffer ? keyMaterial : new Uint8Array(keyMaterial),
    { name: "HKDF" }, false, ["deriveBits"]
  );
  return crypto.subtle.deriveBits(
    { name: "HKDF", hash: HKDF_HASH, salt: salt || new Uint8Array(32), info },
    baseKey,
    bits
  );
};

// ── Ratchet KDF functions ─────────────────────────────────────────────────────

/**
 * KDF_RK: Root key ratchet step.
 * Input: current root key RK, DH output
 * Output: new root key RK', new chain key CK
 */
const kdfRK = async (rootKey, dhOutput) => {
  const combined = await hkdf(dhOutput, rootKey, INFO_ROOT, 512);
  return {
    newRK: combined.slice(0, 32),
    newCK: combined.slice(32, 64),
  };
};

/**
 * KDF_CK: Chain key ratchet step.
 * Input: current chain key CK
 * Output: new chain key CK', message key MK
 */
const kdfCK = async (chainKey) => {
  // Use HKDF with two different info values for CK and MK (domain separation)
  const newCK = await hkdf(chainKey, new Uint8Array(32), INFO_CHAIN, 256);
  const msgKey = await hkdf(chainKey, new Uint8Array(32), INFO_MSG,   256);
  return { newCK, msgKey };
};

// ── DH ratchet step ───────────────────────────────────────────────────────────

/** Generate a new ephemeral ECDH key pair for the DH ratchet */
const generateRatchetKeyPair = async () => {
  const kp = await crypto.subtle.generateKey(ECDH_PARAMS, true, ["deriveKey", "deriveBits"]);
  const pub = buf2b64(await crypto.subtle.exportKey("spki", kp.publicKey));
  return { privateKey: kp.privateKey, publicKeyB64: pub };
};

/** Compute ECDH shared bits between our private key and their public key */
const dhRatchet = async (privateKey, theirPublicKeyB64) => {
  const theirKey = await crypto.subtle.importKey(
    "spki", b64toBuf(theirPublicKeyB64), ECDH_PARAMS, true, []
  );
  return crypto.subtle.deriveBits({ name: "ECDH", public: theirKey }, privateKey, 256);
};

// ── Session initialization ────────────────────────────────────────────────────

/**
 * Initialize a Double Ratchet session as the SENDER (Alice).
 * Called after X3DH completes — Alice knows SK and Bob's initial ratchet key.
 *
 * @param {ArrayBuffer} SK              - Shared session key from X3DH (32 bytes)
 * @param {string}      recipientDHPub  - Bob's signed prekey public key (base64 SPKI)
 *                                        Used as the initial DHr (remote ratchet key)
 * @returns {Promise<object>} Initial ratchet session state
 */
export const initSenderSession = async (SK, recipientDHPub) => {
  const DHs = await generateRatchetKeyPair();

  // Perform first DH ratchet step to derive initial sending chain
  const dhOut = await dhRatchet(DHs.privateKey, recipientDHPub);
  const { newRK, newCK } = await kdfRK(SK, dhOut);

  return {
    DHs_priv:    DHs.privateKey,       // CryptoKey (non-extractable for signing)
    DHs_pub:     DHs.publicKeyB64,     // base64 — sent in every message header
    DHr:         recipientDHPub,       // base64 — Bob's current ratchet key
    RK:          newRK,                // ArrayBuffer
    CKs:         newCK,               // ArrayBuffer — sending chain
    CKr:         null,                // ArrayBuffer — receiving chain (not yet)
    Ns:          0,                   // Sending message counter
    Nr:          0,                   // Receiving message counter
    PN:          0,                   // Previous chain message count
    MKSKIPPED:   {},                  // { "dh:n": base64_message_key }
  };
};

/**
 * Initialize a Double Ratchet session as the RECEIVER (Bob).
 * Called when Bob receives Alice's first X3DH message.
 *
 * @param {ArrayBuffer} SK              - Shared session key from X3DH (32 bytes)
 * @param {CryptoKey}   ourSPKPrivate   - Bob's signed prekey private key (used as initial DHs)
 * @param {string}      ourSPKPublic    - Bob's signed prekey public key (base64)
 * @returns {Promise<object>} Initial ratchet session state
 */
export const initReceiverSession = async (SK, ourSPKPrivate, ourSPKPublic) => {
  return {
    DHs_priv:    ourSPKPrivate,    // Bob uses his SPK as the first ratchet sending key
    DHs_pub:     ourSPKPublic,
    DHr:         null,             // Alice's ratchet key (learned from first message header)
    RK:          SK,               // Root key = X3DH session key
    CKs:         null,             // No sending chain yet
    CKr:         null,             // No receiving chain yet (set when first message arrives)
    Ns:          0,
    Nr:          0,
    PN:          0,
    MKSKIPPED:   {},
  };
};

// ── Message encryption ────────────────────────────────────────────────────────

/**
 * Encrypt a message using the Double Ratchet sending chain.
 * Advances CKs → new CKs + message key, encrypts with AES-256-GCM.
 *
 * @param {object} session     - Mutable ratchet session state (will be updated)
 * @param {string} plaintext   - Message plaintext (text or JSON string)
 * @returns {Promise<{ ciphertext: object, updatedSession: object }>}
 * @throws if CKs (sending chain) is null — session not initialized for sending
 */
export const ratchetEncrypt = async (session, plaintext) => {
  if (!session.CKs) {
    throw new Error("[DoubleRatchet] No sending chain key — session not initialized for sending.");
  }

  // Advance the sending chain
  const { newCK, msgKey } = await kdfCK(session.CKs);

  // Import message key as AES-GCM key
  const aesKey = await crypto.subtle.importKey(
    "raw", msgKey, { name: "AES-GCM", length: 256 }, false, ["encrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedPlain = new TextEncoder().encode(plaintext);

  // AAD: bind ciphertext to message header (prevents header swap attacks)
  const header = { dh: session.DHs_pub, n: session.Ns, pn: session.PN };
  const aad = new TextEncoder().encode(JSON.stringify(header));

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: aad },
    aesKey,
    encodedPlain
  );

  const ciphertext = {
    v:          3,
    dh:         session.DHs_pub,
    n:          session.Ns,
    pn:         session.PN,
    ciphertext: buf2b64(encrypted),
    iv:         buf2b64(iv),
  };

  // Advance session state
  const updatedSession = {
    ...session,
    CKs: newCK,
    Ns:  session.Ns + 1,
  };

  return { ciphertext, updatedSession };
};

// ── Message decryption ────────────────────────────────────────────────────────

/**
 * Decrypt an incoming Double Ratchet message.
 * Performs DH ratchet step if the sender's ratchet key has changed.
 * Handles out-of-order messages by caching skipped message keys.
 *
 * @param {object} session     - Current ratchet session state
 * @param {object} ciphertext  - Wire format object from sender
 * @returns {Promise<{ plaintext: string, updatedSession: object }>}
 */
export const ratchetDecrypt = async (session, ciphertext) => {
  const { dh: senderDH, n: msgNum, pn: prevChainLen, ciphertext: ct, iv: ivB64 } = ciphertext;

  let updatedSession = { ...session, MKSKIPPED: { ...session.MKSKIPPED } };

  // Check if this is a skipped message we have a cached key for
  const skipKey = `${senderDH}:${msgNum}`;
  if (updatedSession.MKSKIPPED[skipKey]) {
    const msgKeyB64 = updatedSession.MKSKIPPED[skipKey];
    delete updatedSession.MKSKIPPED[skipKey];
    const plaintext = await _decryptWithKey(b64toBuf(msgKeyB64), ct, ivB64, ciphertext);
    return { plaintext, updatedSession };
  }

  // DH ratchet step: sender's ratchet key changed
  if (senderDH !== updatedSession.DHr) {
    // Skip messages from previous chain if needed
    updatedSession = await _skipMessageKeys(updatedSession, prevChainLen);

    // DH ratchet step
    updatedSession = await _dhRatchetStep(updatedSession, senderDH);
  }

  // Skip messages in current chain if needed
  updatedSession = await _skipMessageKeys(updatedSession, msgNum);

  // Advance receiving chain and decrypt
  const { newCK, msgKey } = await kdfCK(updatedSession.CKr);
  const plaintext = await _decryptWithKey(msgKey, ct, ivB64, ciphertext);

  updatedSession = {
    ...updatedSession,
    CKr: newCK,
    Nr:  updatedSession.Nr + 1,
  };

  return { plaintext, updatedSession };
};

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Decrypt using a raw 32-byte AES-GCM message key */
const _decryptWithKey = async (msgKeyBuf, ctB64, ivB64, headerObj) => {
  const aesKey = await crypto.subtle.importKey(
    "raw", msgKeyBuf, { name: "AES-GCM", length: 256 }, false, ["decrypt"]
  );
  const header = { dh: headerObj.dh, n: headerObj.n, pn: headerObj.pn };
  const aad = new TextEncoder().encode(JSON.stringify(header));
  const iv = new Uint8Array(b64toBuf(ivB64));

  const plainBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv, additionalData: aad },
    aesKey,
    b64toBuf(ctB64)
  );
  return new TextDecoder().decode(plainBuf);
};

/** Cache skipped message keys up to `until` from the receiving chain */
const _skipMessageKeys = async (session, until) => {
  if (until <= session.Nr) return session; // nothing to skip
  if (until - session.Nr > MAX_SKIP) {
    throw new Error(`[DoubleRatchet] Too many skipped messages (${until - session.Nr} > ${MAX_SKIP})`);
  }

  let { CKr, Nr, MKSKIPPED, DHr } = session;
  MKSKIPPED = { ...MKSKIPPED };

  while (Nr < until) {
    const { newCK, msgKey } = await kdfCK(CKr);
    const key = `${DHr}:${Nr}`;
    MKSKIPPED[key] = buf2b64(msgKey);
    CKr = newCK;
    Nr += 1;
  }

  return { ...session, CKr, Nr, MKSKIPPED };
};

/** Perform a DH ratchet step when a new sender ratchet key is observed */
const _dhRatchetStep = async (session, senderDHPub) => {
  // Save PN = current Ns before resetting
  const PN = session.Ns;

  // Receiving ratchet: derive new RK + CKr from DH with sender's new key
  const dhOut1 = await dhRatchet(session.DHs_priv, senderDHPub);
  const { newRK: RK1, newCK: CKr } = await kdfRK(session.RK, dhOut1);

  // Generate new sending ratchet key pair
  const newDHs = await generateRatchetKeyPair();

  // Sending ratchet: derive new RK + CKs from DH with sender's new key
  const dhOut2 = await dhRatchet(newDHs.privateKey, senderDHPub);
  const { newRK: RK2, newCK: CKs } = await kdfRK(RK1, dhOut2);

  return {
    ...session,
    DHs_priv: newDHs.privateKey,
    DHs_pub:  newDHs.publicKeyB64,
    DHr:      senderDHPub,
    RK:       RK2,
    CKs,
    CKr,
    Ns:       0,
    Nr:       0,
    PN,
  };
};
