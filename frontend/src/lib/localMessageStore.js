/**
 * Orbit Local Plaintext Message Store
 *
 * Caches the plaintext of sent/received messages locally in IndexedDB.
 * Since a true zero-trust E2EE server never stores plaintext, and Double Ratchet
 * forward-secrecy discards keys immediately after message transmission, the
 * client must store a local copy of plaintext history to display history on reload.
 */

const DB_NAME = "orbit-local-messages";
const DB_VERSION = 1;
const STORE_NAME = "messages";

let _db = null;

const openDB = () => {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("idempotencyKey", "idempotencyKey", { unique: false });
      }
    };
    req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
    req.onerror = (event) => {
      const error = event.target?.error || event;
      console.error("[LocalMessageStore] Database connection failed:", error);
      if (error && (error.name === "VersionError" || error.message?.includes("version"))) {
        console.warn("[LocalMessageStore] Critical schema/version drift detected. Executing defensive local storage wipe...");
        try {
          indexedDB.deleteDatabase(DB_NAME);
          window.location.reload();
        } catch (wipeError) {
          console.error("[LocalMessageStore] Failed to automate recovery layout purge:", wipeError);
        }
      }
      reject(error);
    };
  });
};

const tx = async (mode, fn) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const req = fn(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

/**
 * Cache a message's plaintext locally.
 */
export const saveLocalMessage = async (msgId, text, image, idempotencyKey) => {
  if (!msgId && !idempotencyKey) return;
  const id = (msgId || idempotencyKey).toString();
  try {
    await tx("readwrite", (store) =>
      store.put({ 
        id, 
        text, 
        image, 
        idempotencyKey: idempotencyKey ? idempotencyKey.toString() : null, 
        updatedAt: Date.now() 
      })
    );
  } catch (err) {
    console.error("[LocalMessageStore] Save failed:", err);
  }
};

/**
 * Load a message's cached plaintext.
 */
export const loadLocalMessage = async (msgId, idempotencyKey) => {
  try {
    if (msgId) {
      const record = await tx("readonly", (store) => store.get(msgId.toString()));
      if (record) return record;
    }
    if (idempotencyKey) {
      const db = await openDB();
      return new Promise((resolve) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index("idempotencyKey");
        const req = index.get(idempotencyKey.toString());
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    }
  } catch {
    return null;
  }
  return null;
};

/**
 * Clear all cached messages (e.g. on logout).
 */
export const clearAllLocalMessages = async () => {
  try {
    await tx("readwrite", (store) => store.clear());
  } catch (err) {
    console.error("[LocalMessageStore] Clear failed:", err);
  }
};
