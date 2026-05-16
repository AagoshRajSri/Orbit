import { loadSession, saveSession, getSignedPrekey, consumeOneTimePrekey } from "./sessionStore.js";
import { getKeyPair } from "./keyStore.js";
import { x3dhSender, x3dhReceiver } from "./x3dh.js";
import { 
  initSenderSession, 
  initReceiverSession, 
  ratchetEncrypt, 
  ratchetDecrypt 
} from "./doubleRatchet.js";
import { encryptMedia, decryptMedia } from "./mediaEncryption.js";
import { API_URL } from "../config.js";

// Utility to handle fetch with credentials
const fetchBundle = async (recipientId) => {
  const res = await fetch(`${API_URL}/api/prekeys/bundle/${recipientId}`, {
    credentials: "include"
  });
  const data = await res.json();
  if (!data.success || !data.bundle) {
    throw new Error("Recipient prekey bundle unavailable.");
  }
  return data.bundle;
};

// Listen for messages from the main thread
self.addEventListener("message", async (e) => {
  // 1. Structural Schema Validation
  if (!e.data || typeof e.data !== "object") return;
  
  const { id, type, payload } = e.data;
  if (!id || typeof type !== "string" || !payload || typeof payload !== "object") {
    self.postMessage({ id: id || 'unknown', success: false, error: "SECURITY_VIOLATION: Invalid worker message schema" });
    return;
  }
  
  try {
    if (type === "ENCRYPT_OUTGOING") {
      const { authUserId, e2eePublicKey, recipientId, text, mediaArrayBuffer } = payload;
      
      // 2. Strict Payload Type Validation
      if (
        typeof authUserId !== "string" || 
        typeof e2eePublicKey !== "string" || 
        typeof recipientId !== "string" || 
        typeof text !== "string" ||
        (mediaArrayBuffer && !(mediaArrayBuffer instanceof ArrayBuffer))
      ) {
        throw new Error("SECURITY_VIOLATION: Malformed ENCRYPT_OUTGOING payload schema");
      }
      
      const keyPair = await getKeyPair(authUserId);
      if (!keyPair) throw new Error("Local identity keys missing.");

      // 1. Optional Media Encryption
      let mediaMetadata = {};
      let encryptedMedia = null;
      if (mediaArrayBuffer) {
        const { ciphertext, key, iv } = await encryptMedia(mediaArrayBuffer);
        encryptedMedia = ciphertext;
        mediaMetadata = { mediaKey: key, mediaIv: iv };
      }

      // 2. Session Management
      let session = await loadSession(recipientId);
      let x3dhHeader = null;

      if (!session) {
        const bundle = await fetchBundle(recipientId);
        const { sessionKey, ephemeralPublicKey, oneTimePrekeyId } = await x3dhSender({
          senderIdentityPrivateKey: keyPair.privateKey,
          recipientBundle: bundle,
        });

        session = await initSenderSession(sessionKey, bundle.signedPrekey);
        x3dhHeader = {
          identityKey: e2eePublicKey,
          ephemeralKey: ephemeralPublicKey,
          opkId: oneTimePrekeyId,
        };
      }

      // 3. Ratchet Encryption
      const payloadObj = JSON.stringify({
        text,
        hasMedia: !!mediaArrayBuffer,
        ...mediaMetadata
      });

      const { ciphertext: ratchetCipher, updatedSession } = await ratchetEncrypt(session, payloadObj);
      await saveSession(recipientId, updatedSession);

      const result = {
        v: 3,
        ...ratchetCipher,
        image: encryptedMedia,
        ...(x3dhHeader && { x3dh: x3dhHeader }),
      };

      const transferList = [];
      if (encryptedMedia instanceof ArrayBuffer) transferList.push(encryptedMedia);

      self.postMessage({ id, success: true, result }, transferList);
    } 
    else if (type === "DECRYPT_INCOMING") {
      const { authUserId, message } = payload;

      // 2. Strict Payload Type Validation
      if (typeof authUserId !== "string" || typeof message !== "object" || message === null) {
        throw new Error("SECURITY_VIOLATION: Malformed DECRYPT_INCOMING payload schema");
      }

      const keyPair = await getKeyPair(authUserId);
      if (!keyPair) {
        self.postMessage({ id, success: true, result: message });
        return;
      }

      const senderId = (message.senderId?._id || message.senderId?.id || message.senderId)?.toString();
      const isMe = senderId === authUserId;

      if (!message.ciphertext && !message.encryptedContent) {
        self.postMessage({ id, success: true, result: { ...message, isMe } });
        return;
      }

      if (message.v === 3) {
        if (isMe) {
          self.postMessage({ id, success: true, result: { ...message, isMe: true } });
          return;
        }

        let session = await loadSession(senderId);

        if (!session && message.x3dh) {
          const spk = await getSignedPrekey(authUserId);
          const opkPriv = message.x3dh.opkId
            ? await consumeOneTimePrekey(authUserId, message.x3dh.opkId)
            : null;

          if (spk) {
            const SK = await x3dhReceiver({
              recipientIdentityPrivateKey: keyPair.privateKey,
              signedPrekeyPrivateKey: spk.privateKey,
              oneTimePrekeyPrivateKey: opkPriv,
              senderHeader: {
                identityKey: message.x3dh.identityKey,
                ephemeralKey: message.x3dh.ephemeralKey,
              },
            });
            session = await initReceiverSession(SK, spk.privateKey, spk.publicKey);
          }
        }

        if (!session) throw new Error("No encryption session established.");

        const { plaintext, updatedSession } = await ratchetDecrypt(session, message);
        await saveSession(senderId, updatedSession);

        const decryptedPayload = JSON.parse(plaintext);
        let imageUrl = message.image;

        if (decryptedPayload.mediaKey && decryptedPayload.mediaIv && message.image) {
          imageUrl = await decryptMedia(message.image, decryptedPayload.mediaKey, decryptedPayload.mediaIv);
        }

        const transferList = [];
        // `imageUrl` might be a blob url or an ArrayBuffer? Actually, let's see decryptMedia: it probably returns a blob URL if it was decrypted to a Blob. Wait, if it returns a blob URL we can't transfer it. Let's just transfer if it's an ArrayBuffer.
        if (imageUrl instanceof ArrayBuffer) transferList.push(imageUrl);

        self.postMessage({ 
          id, 
          success: true, 
          result: { ...message, text: decryptedPayload.text, image: imageUrl, isMe } 
        }, transferList);
        return;
      }

      // Legacy v2
      if (message.v === 2 || message.ephemeralPublicKey) {
        const { decryptMessage } = await import("./e2ee.js");
        const decrypted = await decryptMessage(message, keyPair.privateKey);
        self.postMessage({ 
          id, 
          success: true, 
          result: { ...message, text: decrypted?.text, image: decrypted?.image, isMe } 
        });
        return;
      }

      self.postMessage({ id, success: true, result: { ...message, isMe } });
    }
  } catch (error) {
    console.error("[CryptoWorker] Error:", error);
    self.postMessage({ id, success: false, error: error.message });
  }
});
