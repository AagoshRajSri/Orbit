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
import { saveLocalMessage, loadLocalMessage } from "./localMessageStore.js";

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
      const { authUserId, e2eePublicKey, recipientId, text, mediaArrayBuffer, idempotencyKey } = payload;
      
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

      // Cache the plaintext locally mapped to idempotencyKey
      if (idempotencyKey) {
        await saveLocalMessage(null, text, mediaArrayBuffer, idempotencyKey);
      }

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

      // 1. Try local plaintext cache lookup (heals lock icon / decryption failures and handles sender sent message history)
      const cached = await loadLocalMessage(message._id, message.idempotencyKey);
      if (cached) {
        // If loaded by idempotencyKey but message._id wasn't cached yet, bind it now
        if (message._id && message.idempotencyKey && cached.id !== message._id.toString()) {
          await saveLocalMessage(message._id, cached.text, cached.image, message.idempotencyKey);
        }
        
        let imageUrl = cached.image;
        if (imageUrl instanceof ArrayBuffer) {
          const blob = new Blob([imageUrl]);
          imageUrl = URL.createObjectURL(blob);
        } else if (imageUrl && typeof imageUrl === "object" && imageUrl.mediaKey) {
          // Decrypt media on the fly using cached keys
          try {
            imageUrl = await decryptMedia(imageUrl.encryptedUrl, imageUrl.mediaKey, imageUrl.mediaIv);
          } catch (err) {
            console.error("[CryptoWorker] Failed to decrypt cached media:", err);
            imageUrl = null;
          }
        }
        
        self.postMessage({
          id,
          success: true,
          result: { ...message, text: cached.text, image: imageUrl, isMe }
        });
        return;
      }

      if (!message.ciphertext && !message.encryptedContent) {
        self.postMessage({ id, success: true, result: { ...message, isMe } });
        return;
      }

      if (message.v === 3) {
        if (isMe) {
          self.postMessage({ 
            id, 
            success: true, 
            result: { ...message, text: "🔒 [Plaintext not available on this device]", isMe: true } 
          });
          return;
        }

        let session = await loadSession(senderId);

        // If the message contains an X3DH header, it means the sender initiated
        // a new session (e.g. because they reinstalled the app, cleared site data,
        // or rotated their identity keys). We must discard our old session and
        // establish a new receiver session using the X3DH parameters, otherwise
        // we will fail to decrypt all future messages.
        if (message.x3dh) {
          const isNewInitiation = !session || session.lastX3dhEphemeralKey !== message.x3dh.ephemeralKey;
          
          if (isNewInitiation) {
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
              session.lastX3dhEphemeralKey = message.x3dh.ephemeralKey;
            }
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

        // Cache the decrypted plaintext locally so we never fail to decrypt it on reload
        const cacheMedia = decryptedPayload.mediaKey 
          ? { mediaKey: decryptedPayload.mediaKey, mediaIv: decryptedPayload.mediaIv, encryptedUrl: message.image } 
          : null;
        await saveLocalMessage(message._id, decryptedPayload.text, cacheMedia, message.idempotencyKey);

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
        
        if (decrypted) {
          await saveLocalMessage(message._id, decrypted.text, decrypted.image, message.idempotencyKey);
        }

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
