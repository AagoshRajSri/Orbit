/**
 * Orbit Nexus Sender Key Protocol
 *
 * Signal-style Sender Key encryption for group (Nexus) chats.
 *
 * ARCHITECTURE:
 *   - Each member generates a SenderKey for each Nexus (chain key + signing key)
 *   - On first send, distribute SenderKey to all current members via standalone X3DH
 *   - Each member's SenderKey is independently advanced (symmetric chain ratchet)
 *   - Receivers hold each sender's key, advancing it per message received
 *
 * WIRE FORMAT (v4 group message):
 *   {
 *     v: 4,
 *     ciphertext: "<base64>",   // AES-256-GCM encrypted payload
 *     iv: "<base64>",           // 96-bit IV
 *     n: <number>,              // Sender's chain message counter
 *     sig: "<base64>",          // ECDSA over "<n>:<ciphertext>"
 *   }
 *
 * DISTRIBUTION (v4_dist, encrypted per recipient via X3DH):
 *   {
 *     type: "sender_key_distribution",
 *     nexusId: "...",
 *     senderId: "...",
 *     chainKey: "<base64>",     // Starting chain key
 *     n: 0,                     // Current counter at time of distribution
 *     signingPublicKey: "...",  // Recipient uses this to verify future messages
 *   }
 */

const buf2b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const b64toBuf = (b64) => {
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
};

const ECDSA_PARAMS = { name: "ECDSA", namedCurve: "P-256" };
const HKDF_HASH   = "SHA-256";
const INFO_CK     = new TextEncoder().encode("orbit-sender-key-chain-v1");
const INFO_MK     = new TextEncoder().encode("orbit-sender-key-msg-v1");

// ── Chain KDF ─────────────────────────────────────────────────────────────────

const advanceChain = async (chainKey) => {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    chainKey instanceof ArrayBuffer ? chainKey : chainKey.buffer,
    { name: "HKDF" },
    false,
    ["deriveBits"]
  );
  const salt = new Uint8Array(32); // 32-zero salt per spec
  const [newCK, mk] = await Promise.all([
    crypto.subtle.deriveBits({ name: "HKDF", hash: HKDF_HASH, salt, info: INFO_CK }, baseKey, 256),
    crypto.subtle.deriveBits({ name: "HKDF", hash: HKDF_HASH, salt, info: INFO_MK  }, baseKey, 256),
  ]);
  return { newChainKey: newCK, messageKey: mk };
};

// ── SenderKey generation ───────────────────────────────────────────────────────

/**
 * Generate a fresh SenderKey for a Nexus.
 * @returns {{ chainKey, n, signingPrivateKey, signingPublicKey }}
 */
export const generateSenderKey = async () => {
  const chainKey = crypto.getRandomValues(new Uint8Array(32)).buffer;
  const kp = await crypto.subtle.generateKey(ECDSA_PARAMS, false, ["sign", "verify"]);
  const signingPublicKey = buf2b64(await crypto.subtle.exportKey("spki", kp.publicKey));
  return {
    chainKey,
    n: 0,
    signingPrivateKey: kp.privateKey, // Non-extractable CryptoKey
    signingPublicKey,                  // base64 SPKI — safe to share
  };
};

// ── Distribution payload ───────────────────────────────────────────────────────

/**
 * Create the plaintext JSON payload included in a sender key distribution
 * message (to be encrypted per-recipient via X3DH).
 */
export const createDistributionPayload = (senderKey, nexusId, senderId) =>
  JSON.stringify({
    type: "sender_key_distribution",
    nexusId,
    senderId,
    chainKey:        buf2b64(senderKey.chainKey),
    n:               senderKey.n,
    signingPublicKey: senderKey.signingPublicKey,
  });

/**
 * Parse a decrypted distribution payload back into a usable state object.
 * The result is suitable for storing in nexusKeyStore.
 */
export const parseDistributionPayload = (json) => {
  const data = JSON.parse(json);
  return {
    chainKey:        b64toBuf(data.chainKey),
    n:               data.n,
    signingPublicKey: data.signingPublicKey,
    // Note: signingPrivateKey is absent — we're the receiver
  };
};

// ── Message encryption ─────────────────────────────────────────────────────────

/**
 * Encrypt a group message using the sender's SenderKey chain.
 * @param {object} senderKey - Own SenderKey state (from nexusKeyStore)
 * @param {string} plaintext - JSON serialised payload
 * @returns {{ ciphertext: object, updatedSenderKey: object }}
 */
export const senderKeyEncrypt = async (senderKey, plaintext) => {
  const { newChainKey, messageKey } = await advanceChain(senderKey.chainKey);

  const aesKey = await crypto.subtle.importKey(
    "raw", messageKey, { name: "AES-GCM", length: 256 }, false, ["encrypt"]
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    new TextEncoder().encode(plaintext)
  );

  const ctB64  = buf2b64(encrypted);
  const ivB64  = buf2b64(iv);
  const n      = senderKey.n + 1;

  // Sign (n:ciphertext) so receivers can detect tampering / forgery
  const sigBuf = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    senderKey.signingPrivateKey,
    new TextEncoder().encode(`${n}:${ctB64}`)
  );

  const messageKeys = senderKey.messageKeys || {};
  const updatedSenderKey = { 
    ...senderKey, 
    chainKey: newChainKey, 
    n,
    messageKeys: { ...messageKeys, [n]: buf2b64(messageKey) }
  };

  return {
    ciphertext: { v: 4, ciphertext: ctB64, iv: ivB64, n, sig: buf2b64(sigBuf) },
    updatedSenderKey,
  };
};

// ── Message decryption ─────────────────────────────────────────────────────────

/**
 * Decrypt a v4 group message using the sender's SenderKey.
 * Handles gaps (out-of-order delivery) by fast-forwarding the chain.
 *
 * @param {object} senderKey          - Sender's SenderKey from nexusKeyStore
 * @param {object} msg                - The v4 message object (from DB/socket)
 * @param {string} signingPublicKeyB64 - Sender's signing public key (base64)
 * @returns {{ plaintext: string, updatedSenderKey: object }}
 */
export const senderKeyDecrypt = async (senderKey, msg, signingPublicKeyB64) => {
  const { ciphertext: ctB64, iv: ivB64, n: targetN, sig } = msg;

  // ── 1. Verify ECDSA signature ───────────────────────────────────────────────
  const verifyKey = await crypto.subtle.importKey(
    "spki", b64toBuf(signingPublicKeyB64), ECDSA_PARAMS, true, ["verify"]
  );
  const valid = await crypto.subtle.verify(
    { name: "ECDSA", hash: "SHA-256" },
    verifyKey,
    b64toBuf(sig),
    new TextEncoder().encode(`${targetN}:${ctB64}`)
  );
  if (!valid) throw new Error("[SenderKey] Signature verification failed — message may be forged");

  // ── 2. Advance chain to targetN ─────────────────────────────────────────────
  let { chainKey, n: currentN, messageKeys = {} } = senderKey;

  let messageKey;
  let updatedMessageKeys = { ...messageKeys };

  if (targetN <= currentN) {
    if (updatedMessageKeys[targetN]) {
      messageKey = b64toBuf(updatedMessageKeys[targetN]);
    } else {
      throw new Error(`[SenderKey] Message ${targetN} already consumed (chain at ${currentN}) and key lost`);
    }
  } else {
    while (currentN < targetN) {
      const { newChainKey, messageKey: mk } = await advanceChain(chainKey);
      chainKey = newChainKey;
      currentN++;
      if (currentN === targetN) {
        messageKey = mk;
      } else {
        // Cache skipped keys just in case they arrive out of order
        updatedMessageKeys[currentN] = buf2b64(mk);
      }
    }
    // Cache the target message key so we can decrypt it again later (e.g. page refresh)
    updatedMessageKeys[targetN] = buf2b64(messageKey);
  }

  // ── 3. AES-GCM decrypt ──────────────────────────────────────────────────────
  const aesKey = await crypto.subtle.importKey(
    "raw", messageKey, { name: "AES-GCM", length: 256 }, false, ["decrypt"]
  );
  const plainBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(b64toBuf(ivB64)) },
    aesKey,
    b64toBuf(ctB64)
  );

  // Keep cache bounded to 2000 keys to avoid blowing up IndexedDB
  const cachedKeys = Object.keys(updatedMessageKeys).map(Number).sort((a,b) => a-b);
  if (cachedKeys.length > 2000) {
    const keysToRemove = cachedKeys.slice(0, cachedKeys.length - 2000);
    for (const k of keysToRemove) delete updatedMessageKeys[k];
  }

  return {
    plaintext: new TextDecoder().decode(plainBuf),
    updatedSenderKey: { ...senderKey, chainKey, n: currentN, messageKeys: updatedMessageKeys },
  };
};
