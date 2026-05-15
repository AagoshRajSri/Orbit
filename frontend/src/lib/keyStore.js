/**
 * Orbit Secure Key Store
 *
 * Stores cryptographic key pairs in IndexedDB as NON-EXTRACTABLE CryptoKey objects.
 * Private keys are NEVER serialized to strings, localStorage, or any JS-readable form.
 * This protects against XSS-based key theft — even a compromised script cannot export
 * a non-extractable CryptoKey.
 *
 * Architecture:
 *   - Public keys: stored as SPKI ArrayBuffer (shareable, uploadable to server)
 *   - Private keys: stored as non-extractable CryptoKey (hardware-bound where supported)
 *   - DB: "orbit-keystore" / store: "keys"
 */

const DB_NAME = "orbit-keystore";
const DB_VERSION = 1;
const STORE_NAME = "keys";

let _db = null;

/** Open (or reuse) the IndexedDB database */
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

    req.onsuccess = (e) => {
      _db = e.target.result;
      resolve(_db);
    };

    req.onerror = (e) => {
      console.error("[KeyStore] Failed to open IndexedDB:", e.target.error);
      reject(e.target.error);
    };
  });
};

/** Generic IndexedDB transaction helper */
const withStore = async (mode, fn) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const req = fn(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

/**
 * Store a key pair for a user.
 * The private key is stored as a non-extractable CryptoKey.
 * The public key is stored as a raw SPKI ArrayBuffer (so it can be exported/shared).
 *
 * @param {string} userId
 * @param {{ publicKey: CryptoKey, privateKey: CryptoKey }} keyPair - Web Crypto key pair
 */
export const storeKeyPair = async (userId, keyPair) => {
  // Export public key as raw bytes (shareable) — private key stays non-extractable
  const publicKeyBuffer = await crypto.subtle.exportKey("spki", keyPair.publicKey);

  await withStore("readwrite", (store) =>
    store.put({
      id: `keypair_${userId}`,
      publicKeyBuffer, // ArrayBuffer — can be re-imported for sharing
      privateKey: keyPair.privateKey, // CryptoKey (non-extractable)
      algorithm: keyPair.privateKey.algorithm.name,
      createdAt: Date.now(),
    })
  );
};

/**
 * Retrieve a stored key pair for a user.
 * Returns { publicKey: CryptoKey, privateKey: CryptoKey, publicKeyBuffer: ArrayBuffer }
 * or null if not found.
 *
 * @param {string} userId
 * @returns {Promise<{ publicKey: CryptoKey, privateKey: CryptoKey, publicKeyBuffer: ArrayBuffer } | null>}
 */
export const getKeyPair = async (userId) => {
  try {
    const record = await withStore("readonly", (store) =>
      store.get(`keypair_${userId}`)
    );
    if (!record) return null;

    // Re-import public key as CryptoKey for use in crypto operations
    const algorithm = record.algorithm || "ECDH";
    const importParams =
      algorithm === "ECDH"
        ? { name: "ECDH", namedCurve: "P-256" }
        : { name: "RSA-OAEP", hash: "SHA-256" };

    const publicKey = await crypto.subtle.importKey(
      "spki",
      record.publicKeyBuffer,
      importParams,
      true,
      algorithm === "ECDH" ? [] : ["encrypt"]
    );

    return {
      publicKey,
      privateKey: record.privateKey, // Already a CryptoKey
      publicKeyBuffer: record.publicKeyBuffer,
    };
  } catch (err) {
    console.error("[KeyStore] Failed to retrieve key pair:", err);
    return null;
  }
};

/**
 * Check whether a key pair exists for a user.
 * @param {string} userId
 */
export const hasKeyPair = async (userId) => {
  try {
    const record = await withStore("readonly", (store) =>
      store.get(`keypair_${userId}`)
    );
    return !!record;
  } catch {
    return false;
  }
};

/**
 * Delete the stored key pair for a user (on logout / key rotation).
 * @param {string} userId
 */
export const clearKeyPair = async (userId) => {
  try {
    await withStore("readwrite", (store) =>
      store.delete(`keypair_${userId}`)
    );
  } catch (err) {
    console.error("[KeyStore] Failed to clear key pair:", err);
  }
};

/**
 * Clear ALL keys from the store (full logout / factory reset).
 */
export const clearAllKeys = async () => {
  try {
    await withStore("readwrite", (store) => store.clear());
  } catch (err) {
    console.error("[KeyStore] Failed to clear all keys:", err);
  }
};

/**
 * Export the public key as a base64 string for upload to the server.
 * @param {string} userId
 * @returns {Promise<string | null>} base64-encoded SPKI public key
 */
export const exportPublicKeyForServer = async (userId) => {
  try {
    const record = await withStore("readonly", (store) =>
      store.get(`keypair_${userId}`)
    );
    if (!record?.publicKeyBuffer) return null;

    const bytes = new Uint8Array(record.publicKeyBuffer);
    return btoa(String.fromCharCode(...bytes));
  } catch (err) {
    console.error("[KeyStore] Failed to export public key:", err);
    return null;
  }
};
