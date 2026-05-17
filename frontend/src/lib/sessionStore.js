/**
 * Orbit Ratchet Session Store
 *
 * Persists Double Ratchet session state in IndexedDB per conversation.
 * CryptoKey objects (DHs_priv) are stored directly — IndexedDB supports
 * structured cloning of CryptoKey, so they don't need to be serialized.
 *
 * ArrayBuffer fields (RK, CKs, CKr) are stored as-is.
 * MKSKIPPED is a plain object { "dh:n": base64_key }.
 */

const DB_NAME = "orbit-sessions";
const DB_VERSION = 1;
const STORE_NAME = "ratchet-sessions";

// Separate store for prekey private keys (SPK, OPKs)
const PREKEY_STORE = "prekeys";

let _db = null;

const openDB = () => {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "conversationId" });
      }
      if (!db.objectStoreNames.contains(PREKEY_STORE)) {
        db.createObjectStore(PREKEY_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
    req.onerror = (event) => {
      const error = event.target?.error || event;
      console.error("[SessionStore] Database connection failed:", error);
      if (error && (error.name === "VersionError" || error.message?.includes("version"))) {
        console.warn("[SessionStore] Critical schema/version drift detected. Executing defensive local storage wipe...");
        try {
          indexedDB.deleteDatabase(DB_NAME);
          window.location.reload();
        } catch (wipeError) {
          console.error("[SessionStore] Failed to automate recovery layout purge:", wipeError);
        }
      }
      reject(error);
    };
  });
};

const tx = async (storeName, mode, fn) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const req = fn(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

// ── Hot-Path In-Memory Cache ──────────────────────────────────────────────────
const sessionCache = new Map();

// ── Ratchet session CRUD ──────────────────────────────────────────────────────

/**
 * Save (upsert) a ratchet session for a conversation.
 * @param {string} conversationId - e.g. userId or nexusId
 * @param {object} session        - Double Ratchet session state
 */
export const saveSession = async (conversationId, session) => {
  // 1. Instant sync update to hot-path cache
  sessionCache.set(conversationId, session);

  // 2. Fire-and-forget background persistence
  tx(STORE_NAME, "readwrite", (store) => {
    const latestSession = sessionCache.get(conversationId) || session;
    return store.put({ conversationId, ...latestSession, updatedAt: Date.now() });
  }).catch(err => console.error("[SessionStore] Background save failed:", err));
};

/**
 * Load a ratchet session for a conversation.
 * @param {string} conversationId
 * @returns {Promise<object|null>} Session state or null if not found
 */
export const loadSession = async (conversationId) => {
  // 1. Hot-path cache hit
  if (sessionCache.has(conversationId)) {
    return sessionCache.get(conversationId);
  }

  // 2. Cold-start load from DB
  try {
    const record = await tx(STORE_NAME, "readonly", (store) =>
      store.get(conversationId)
    );
    if (!record) return null;
    const { conversationId: _id, updatedAt: _ts, ...session } = record;

    // Warm up the cache
    sessionCache.set(conversationId, session);
    return session;
  } catch {
    return null;
  }
};

/**
 * Delete a ratchet session (on conversation clear / security reset).
 * @param {string} conversationId
 */
export const deleteSession = async (conversationId) => {
  sessionCache.delete(conversationId);
  await tx(STORE_NAME, "readwrite", (store) => store.delete(conversationId));
};

/**
 * Check if a ratchet session exists for a conversation.
 * @param {string} conversationId
 */
export const hasSession = async (conversationId) => {
  try {
    const record = await tx(STORE_NAME, "readonly", (store) =>
      store.get(conversationId)
    );
    return !!record;
  } catch {
    return false;
  }
};

/**
 * Clear all ratchet sessions (on logout).
 */
export const clearAllSessions = async () => {
  try {
    sessionCache.clear();
    await tx(STORE_NAME, "readwrite", (store) => store.clear());
  } catch (err) {
    console.error("[SessionStore] Failed to clear sessions:", err);
  }
};

// ── Prekey private key storage ────────────────────────────────────────────────

/**
 * Store the signed prekey private key for the current user.
 * @param {string}    userId
 * @param {CryptoKey} spkPrivate   - Non-extractable ECDH private key
 * @param {string}    spkPublicB64 - Base64 public key (to identify which SPK this is)
 */
export const storeSignedPrekey = async (userId, spkPrivate, spkPublicB64) => {
  await tx(PREKEY_STORE, "readwrite", (store) =>
    store.put({ id: `spk_${userId}`, privateKey: spkPrivate, publicKey: spkPublicB64, createdAt: Date.now() })
  );
};

/**
 * Retrieve the signed prekey private key for the current user.
 * @param {string} userId
 * @returns {Promise<{ privateKey: CryptoKey, publicKey: string }|null>}
 */
export const getSignedPrekey = async (userId) => {
  try {
    const record = await tx(PREKEY_STORE, "readonly", (store) =>
      store.get(`spk_${userId}`)
    );
    return record ? { privateKey: record.privateKey, publicKey: record.publicKey } : null;
  } catch {
    return null;
  }
};

/**
 * Store a one-time prekey private key.
 * @param {string}    userId
 * @param {string}    opkId
 * @param {CryptoKey} opkPrivate
 */
export const storeOneTimePrekey = async (userId, opkId, opkPrivate) => {
  await tx(PREKEY_STORE, "readwrite", (store) =>
    store.put({ id: `opk_${userId}_${opkId}`, privateKey: opkPrivate, createdAt: Date.now() })
  );
};

/**
 * Consume (get + delete) a one-time prekey private key.
 * One-time prekeys are single-use — delete immediately after retrieval.
 * @param {string} userId
 * @param {string} opkId
 * @returns {Promise<CryptoKey|null>}
 */
export const consumeOneTimePrekey = async (userId, opkId) => {
  const key = `opk_${userId}_${opkId}`;
  try {
    const record = await tx(PREKEY_STORE, "readonly", (store) => store.get(key));
    if (!record) return null;
    await tx(PREKEY_STORE, "readwrite", (store) => store.delete(key));
    return record.privateKey;
  } catch {
    return null;
  }
};

/**
 * Store the ECDSA signing key pair for the current user.
 * @param {string}    userId
 * @param {CryptoKey} signingPrivate
 * @param {string}    signingPublicB64
 */
export const storeSigningKeyPair = async (userId, signingPrivate, signingPublicB64) => {
  await tx(PREKEY_STORE, "readwrite", (store) =>
    store.put({ id: `sigkey_${userId}`, privateKey: signingPrivate, publicKey: signingPublicB64 })
  );
};

/**
 * Retrieve the ECDSA signing key pair.
 * @param {string} userId
 * @returns {Promise<{ privateKey: CryptoKey, publicKey: string }|null>}
 */
export const getSigningKeyPair = async (userId) => {
  try {
    const record = await tx(PREKEY_STORE, "readonly", (store) =>
      store.get(`sigkey_${userId}`)
    );
    return record ? { privateKey: record.privateKey, publicKey: record.publicKey } : null;
  } catch {
    return null;
  }
};

/**
 * Clear all prekeys for a user (on logout / key rotation).
 * @param {string} userId
 */
export const clearPrekeys = async (userId) => {
  // We can't do prefix queries in IndexedDB without a custom index,
  // so we open a cursor and delete matching keys manually.
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PREKEY_STORE, "readwrite");
    const store = transaction.objectStore(PREKEY_STORE);
    const req = store.openCursor();
    req.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        if (cursor.key.includes(`_${userId}`)) {
          cursor.delete();
        }
        cursor.continue();
      } else {
        resolve();
      }
    };
    req.onerror = () => reject(req.error);
  });
};
