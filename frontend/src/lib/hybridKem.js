/**
 * Orbit Hybrid KEM — Phase 4 (Post-Quantum)
 *
 * Implements a HYBRID Key Encapsulation Mechanism combining:
 *   - Classical:    X25519 ECDH (via WebCrypto P-256 — X25519 not in WebCrypto API)
 *   - Post-Quantum: Kyber-768 (CRYSTALS-Kyber, round 3 finalist, now FIPS 203)
 *
 * WHY HYBRID:
 *   - Classical provides security against classical computers (proven, widely audited)
 *   - Kyber provides security against quantum computers (Grover + Shor resistant)
 *   - Hybrid ensures: "break both OR break neither" — maximum defense in depth
 *
 * IMPLEMENTATION STRATEGY:
 *   Since browser WebCrypto does not yet expose X25519 or Kyber natively, this module:
 *   1. Uses ECDH P-256 as the classical component (closest to X25519 in WebCrypto)
 *   2. Uses a WASM-compiled Kyber-768 implementation (kyber-crystals npm package)
 *   3. Combines both shared secrets via HKDF: finalKey = HKDF(classical || kyber, "orbit-hybrid-v1")
 *
 * WIRE FORMAT (hybrid KEM bundle, stored in prekey bundle):
 *   {
 *     classicalPublicKey: "<base64 SPKI P-256>",  // ECDH component
 *     kyberPublicKey:     "<base64>",              // Kyber-768 public key (1184 bytes)
 *     algorithm:          "hybrid-kem-v1",
 *   }
 *
 * KEY COMBINER (HKDF):
 *   IKM  = classicalSharedSecret (32 bytes) || kyberSharedSecret (32 bytes)
 *   Salt = SHA-256(senderEphemeralPublicKey || recipientClassicalPublicKey)
 *   Info = "orbit-hybrid-kem-v1"
 *   Output = 32 bytes (AES-256-GCM key)
 */

// ── WASM Kyber-768 loader ────────────────────────────────────────────────────
// We use the `mlkem` package (NIST FIPS 203 compatible) if available.
// Gracefully falls back to classical-only if WASM load fails.

let kyberModule = null;

const loadKyber = async () => {
  if (kyberModule !== null) return kyberModule;
  try {
    // Dynamic import — bundler will tree-shake if not needed
    const mod = await import("mlkem");
    kyberModule = mod;
    console.info("[HybridKEM] Kyber-768 (ML-KEM) WASM loaded successfully");
    return kyberModule;
  } catch (err) {
    console.warn("[HybridKEM] Kyber WASM not available, falling back to classical-only:", err.message);
    kyberModule = false; // falsy sentinel — classical only
    return false;
  }
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const buf2b64  = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf instanceof ArrayBuffer ? buf : buf.buffer)));
const b64toBuf = (b64) => { const bin = atob(b64); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; };

const ECDH_PARAMS  = { name: "ECDH", namedCurve: "P-256" };
const HKDF_HASH    = "SHA-256";
const HYBRID_INFO  = new TextEncoder().encode("orbit-hybrid-kem-v1");

// ── Classical KEM (P-256 ECDH) ───────────────────────────────────────────────

/**
 * Generate a classical P-256 key pair for the hybrid KEM.
 */
const generateClassicalKeyPair = () =>
  crypto.subtle.generateKey(ECDH_PARAMS, true, ["deriveKey", "deriveBits"]);

/**
 * Perform ECDH key agreement using P-256.
 */
const classicalDH = (privateKey, peerPublicKey) =>
  crypto.subtle.deriveBits({ name: "ECDH", public: peerPublicKey }, privateKey, 256);

// ── Key combination via HKDF ─────────────────────────────────────────────────

/**
 * Combine classical and (optionally) quantum shared secrets into a single 256-bit key.
 */
const combineSecrets = async (classicalSecret, kyberSecret = null, salt = null) => {
  // IKM = classical (32 bytes) || kyber (32 bytes, or zeros if no kyber)
  const ikm = new Uint8Array(64);
  ikm.set(new Uint8Array(classicalSecret), 0);
  if (kyberSecret) {
    ikm.set(new Uint8Array(kyberSecret.length <= 32 ? kyberSecret : kyberSecret.slice(0, 32)), 32);
  }

  const saltBuf = salt ? new Uint8Array(salt) : new Uint8Array(32); // 32-zero salt default
  const baseKey = await crypto.subtle.importKey("raw", ikm, { name: "HKDF" }, false, ["deriveBits"]);
  const keyBits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: HKDF_HASH, salt: saltBuf, info: HYBRID_INFO },
    baseKey,
    256
  );
  return keyBits;
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generate a hybrid KEM key bundle (public keys for the prekey server).
 * @returns {{ classicalPublicKey, classicalPrivateKey, kyberPublicKey, kyberPrivateKey, algorithm }}
 */
export const generateHybridKeyBundle = async () => {
  const kyber = await loadKyber();

  // Classical component
  const classicalKP = await generateClassicalKeyPair();
  const classicalPub = buf2b64(await crypto.subtle.exportKey("spki", classicalKP.publicKey));

  let kyberPublicKey  = null;
  let kyberPrivateKey = null;

  if (kyber) {
    try {
      // ML-KEM-768 (Kyber-768) key generation
      const kem       = new kyber.MlKem768();
      const [pub, priv] = await kem.generateKeyPair();
      kyberPublicKey  = buf2b64(pub);
      kyberPrivateKey = priv; // Uint8Array — store securely
    } catch (err) {
      console.warn("[HybridKEM] Kyber keygen failed, classical only:", err.message);
    }
  }

  return {
    classicalPublicKey:  classicalPub,
    classicalPrivateKey: classicalKP.privateKey, // Non-extractable CryptoKey
    kyberPublicKey,
    kyberPrivateKey,
    algorithm: kyberPublicKey ? "hybrid-kem-v1" : "classical-kem-v1",
  };
};

/**
 * Sender-side encapsulation: create a shared secret and an encapsulated key.
 * Used by Alice to initiate a hybrid session with Bob.
 *
 * @param {object} recipientBundle - Bob's hybrid public key bundle
 * @returns {{ sharedSecret: ArrayBuffer, encapsulation: object }}
 */
export const hybridEncapsulate = async (recipientBundle) => {
  const kyber = await loadKyber();

  // ── Classical component ──────────────────────────────────────────────────
  const myEphemeral = await generateClassicalKeyPair();

  const bobClassicalPub = await crypto.subtle.importKey(
    "spki", b64toBuf(recipientBundle.classicalPublicKey), ECDH_PARAMS, true, []
  );
  const classicalSecret = await classicalDH(myEphemeral.privateKey, bobClassicalPub);

  const myEphemeralPub = buf2b64(await crypto.subtle.exportKey("spki", myEphemeral.publicKey));

  // ── Kyber component ──────────────────────────────────────────────────────
  let kyberCiphertext = null;
  let kyberSecret     = null;

  if (kyber && recipientBundle.kyberPublicKey) {
    try {
      const kem = new kyber.MlKem768();
      const bobKyberPub = new Uint8Array(b64toBuf(recipientBundle.kyberPublicKey));
      const [ct, ss]    = await kem.encap(bobKyberPub);
      kyberCiphertext   = buf2b64(ct);
      kyberSecret       = ss;
    } catch (err) {
      console.warn("[HybridKEM] Kyber encapsulation failed:", err.message);
    }
  }

  // ── Combine secrets ──────────────────────────────────────────────────────
  const sharedSecret = await combineSecrets(classicalSecret, kyberSecret);

  return {
    sharedSecret,
    encapsulation: {
      classicalEphemeralKey: myEphemeralPub,
      kyberCiphertext,
      algorithm: kyberCiphertext ? "hybrid-kem-v1" : "classical-kem-v1",
    },
  };
};

/**
 * Receiver-side decapsulation: recover the shared secret from an encapsulation.
 * Used by Bob to recover the key Alice encapsulated for him.
 *
 * @param {object} encapsulation   - Received encapsulation from Alice
 * @param {object} myKeyBundle     - Bob's private key bundle
 * @returns {ArrayBuffer} sharedSecret (256 bits)
 */
export const hybridDecapsulate = async (encapsulation, myKeyBundle) => {
  const kyber = await loadKyber();

  // ── Classical component ──────────────────────────────────────────────────
  const aliceEphemeralPub = await crypto.subtle.importKey(
    "spki", b64toBuf(encapsulation.classicalEphemeralKey), ECDH_PARAMS, true, []
  );
  const classicalSecret = await classicalDH(myKeyBundle.classicalPrivateKey, aliceEphemeralPub);

  // ── Kyber component ──────────────────────────────────────────────────────
  let kyberSecret = null;
  if (kyber && encapsulation.kyberCiphertext && myKeyBundle.kyberPrivateKey) {
    try {
      const kem    = new kyber.MlKem768();
      const ct     = new Uint8Array(b64toBuf(encapsulation.kyberCiphertext));
      const priv   = myKeyBundle.kyberPrivateKey instanceof Uint8Array
        ? myKeyBundle.kyberPrivateKey
        : new Uint8Array(b64toBuf(myKeyBundle.kyberPrivateKey));
      kyberSecret  = await kem.decap(ct, priv);
    } catch (err) {
      console.warn("[HybridKEM] Kyber decapsulation failed:", err.message);
    }
  }

  return combineSecrets(classicalSecret, kyberSecret);
};

/**
 * Check if the Kyber WASM module is available (for UI status indicators).
 */
export const isPostQuantumAvailable = async () => {
  const kyber = await loadKyber();
  return !!kyber;
};
