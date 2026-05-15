import { useAuthStore } from "../store/useAuthStore";
import CryptoWorker from "./crypto.worker.js?worker";

/**
 * Orbit E2EE Service (Web Worker Proxy)
 * 
 * Offloads all heavy cryptographic lifting to a dedicated background worker.
 * Prevents 60fps frame drops during X3DH handshakes or ML-KEM encapsulation.
 */
class E2EEService {
  constructor() {
    this.worker = new CryptoWorker();
    this.callbacks = new Map();
    this.msgId = 0;

    this.worker.addEventListener("message", (e) => {
      const { id, success, result, error } = e.data;
      const cb = this.callbacks.get(id);
      if (cb) {
        if (success) cb.resolve(result);
        else cb.reject(new Error(error));
        this.callbacks.delete(id);
      }
    });
  }

  _callWorker(type, payload, transferList = []) {
    return new Promise((resolve, reject) => {
      const id = ++this.msgId;
      this.callbacks.set(id, { resolve, reject });
      this.worker.postMessage({ id, type, payload }, transferList);
    });
  }

  /**
   * Helper to convert a File/Blob to ArrayBuffer for the worker
   */
  async _fileToArrayBuffer(media) {
    if (!media) return null;
    if (media instanceof ArrayBuffer) return media;
    if (media instanceof Blob) return await media.arrayBuffer();
    
    // If it's a data URL or blob URL, convert it back to ArrayBuffer
    if (typeof media === 'string' && (media.startsWith('data:') || media.startsWith('blob:'))) {
      const res = await fetch(media);
      return await res.arrayBuffer();
    }
    
    return null;
  }

  /**
   * Encrypts an outgoing message payload using the worker.
   */
  async encryptOutgoing(recipientId, text, media = null) {
    const authUser = useAuthStore.getState().authUser;
    const authUserId = authUser?._id?.toString();
    const e2eePublicKey = useAuthStore.getState().e2eePublicKey;

    if (!authUserId) throw new Error("Authentication required for encryption.");

    const mediaArrayBuffer = await this._fileToArrayBuffer(media);

    return this._callWorker("ENCRYPT_OUTGOING", {
      authUserId,
      e2eePublicKey,
      recipientId,
      text,
      mediaArrayBuffer
    }, mediaArrayBuffer ? [mediaArrayBuffer] : []);
  }

  /**
   * Decrypts an incoming message using the worker.
   */
  async decryptIncoming(message) {
    const authUser = useAuthStore.getState().authUser;
    const authUserId = authUser?._id?.toString();
    if (!authUserId) return message;

    return this._callWorker("DECRYPT_INCOMING", {
      authUserId,
      message
    });
  }
}

export const e2eeService = new E2EEService();
