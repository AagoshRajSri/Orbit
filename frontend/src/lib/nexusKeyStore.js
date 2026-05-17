/**
 * Orbit Nexus Key Store
 *
 * IndexedDB persistence for Sender Keys used in group (Nexus) E2EE.
 * Keyed by (nexusId, senderId) pairs.
 *
 * CryptoKey objects (signingPrivateKey) are stored directly via IndexedDB
 * structured-clone — no serialization needed.
 */

const DB_NAME    = "orbit-nexus-keys";
const DB_VERSION = 1;
const STORE_NAME = "sender-keys";

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
      console.error("[NexusKeyStore] Database connection failed:", error);
      if (error && (error.name === "VersionError" || error.message?.includes("version"))) {
        console.warn("[NexusKeyStore] Critical schema/version drift detected. Executing defensive local storage wipe...");
        try {
          indexedDB.deleteDatabase(DB_NAME);
          window.location.reload();
        } catch (wipeError) {
          console.error("[NexusKeyStore] Failed to automate recovery layout purge:", wipeError);
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
    req.onerror   = () => reject(req.error);
  });
};

const makeKey = (nexusId, senderId) => `${nexusId}::${senderId}`;

/**
 * Save (upsert) a sender key for a (nexus, member) pair.
 * @param {string} nexusId
 * @param {string} senderId
 * @param {object} senderKey  - { chainKey, n, signingPublicKey, signingPrivateKey? }
 */
export const saveSenderKey = async (nexusId, senderId, senderKey) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const key = makeKey(nexusId, senderId);
    
    const getReq = store.get(key);
    getReq.onsuccess = () => {
      const existing = getReq.result;
      let previousKeys = [];
      
      if (existing) {
        previousKeys = existing.previousKeys || [];
        
        // If the signing public key has changed, archive the old active key
        if (existing.signingPublicKey && existing.signingPublicKey !== senderKey.signingPublicKey) {
          const archiveItem = {
            chainKey:          existing.chainKey,
            n:                 existing.n,
            signingPublicKey:  existing.signingPublicKey,
            signingPrivateKey: existing.signingPrivateKey,
            messageKeys:       existing.messageKeys,
            archivedAt:        Date.now(),
          };
          previousKeys = [...previousKeys, archiveItem];
        }
      }
      
      const putReq = store.put({
        id: key,
        nexusId,
        senderId,
        ...senderKey,
        previousKeys,
        updatedAt: Date.now(),
      });
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
};

/**
 * Load a sender key for a (nexus, member) pair.
 * @returns {object|null}
 */
export const loadSenderKey = async (nexusId, senderId) => {
  try {
    const record = await tx("readonly", (store) =>
      store.get(makeKey(nexusId, senderId))
    );
    if (!record) return null;
    const { id: _, nexusId: _n, senderId: _s, updatedAt: _ts, ...sk } = record;
    return sk;
  } catch {
    return null;
  }
};

/**
 * Check if a sender key exists for a (nexus, member) pair.
 */
export const hasSenderKey = async (nexusId, senderId) => {
  try {
    const record = await tx("readonly", (store) =>
      store.get(makeKey(nexusId, senderId))
    );
    return !!record;
  } catch {
    return false;
  }
};

/**
 * Delete all sender keys for a Nexus (e.g. on leave or member join → rotation needed).
 */
export const clearNexusSenderKeys = async (nexusId) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const req = store.openCursor();
    req.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        const record = cursor.value;
        if (record.nexusId === nexusId) {
          // Archive the current active key before clearing
          let previousKeys = record.previousKeys || [];
          if (record.signingPublicKey) {
            const archiveItem = {
              chainKey:          record.chainKey,
              n:                 record.n,
              signingPublicKey:  record.signingPublicKey,
              signingPrivateKey: record.signingPrivateKey,
              messageKeys:       record.messageKeys,
              archivedAt:        Date.now(),
            };
            // Prevent duplicates in archive
            if (!previousKeys.some(k => k.signingPublicKey === record.signingPublicKey)) {
              previousKeys = [...previousKeys, archiveItem];
            }
          }
          
          // Put back a record with active key cleared but previousKeys preserved!
          const updatedRecord = {
            id: record.id,
            nexusId: record.nexusId,
            senderId: record.senderId,
            previousKeys,
            updatedAt: Date.now()
          };
          cursor.update(updatedRecord);
        }
        cursor.continue();
      } else {
        resolve();
      }
    };
    req.onerror = () => reject(req.error);
  });
};

/**
 * Clear all nexus sender keys (e.g. on full logout).
 */
export const clearAllNexusSenderKeys = async () => {
  try {
    await tx("readwrite", (store) => store.clear());
  } catch (err) {
    console.error("[NexusKeyStore] clearAll failed:", err);
  }
};
