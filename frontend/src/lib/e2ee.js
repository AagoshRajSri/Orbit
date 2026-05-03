/**
 * End-to-End Encryption (E2EE) Utility using Web Crypto API
 * 
 * Provides robust AES-GCM encryption for messages and RSA-OAEP for key exchange.
 */

// Generate RSA-OAEP Key Pair for the user (run on signup/login)
export const generateKeyPair = async () => {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  const exportedPublicKey = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
  const exportedPrivateKey = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

  return {
    publicKey: btoa(String.fromCharCode(...new Uint8Array(exportedPublicKey))),
    privateKey: btoa(String.fromCharCode(...new Uint8Array(exportedPrivateKey)))
  };
};

// Helper: Convert base64 string to ArrayBuffer
const base64ToArrayBuffer = (base64) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

// Helper: Convert ArrayBuffer to base64 string
const arrayBufferToBase64 = (buffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Import an RSA Public Key
export const importPublicKey = async (base64Key) => {
  const keyBuffer = base64ToArrayBuffer(base64Key);
  return await window.crypto.subtle.importKey(
    "spki",
    keyBuffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );
};

// Import an RSA Private Key
export const importPrivateKey = async (base64Key) => {
  const keyBuffer = base64ToArrayBuffer(base64Key);
  return await window.crypto.subtle.importKey(
    "pkcs8",
    keyBuffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"]
  );
};

// Encrypt a payload (JSON object) for a receiver
export const encryptMessage = async (payload, senderPublicKeyBase64, receiverPublicKeyBase64) => {
  // Generate random AES-GCM session key
  const aesKey = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedPayload = new TextEncoder().encode(JSON.stringify(payload));

  // Encrypt payload with AES-GCM
  const encryptedContentBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    encodedPayload
  );

  // Export AES key to encrypt it with RSA keys
  const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey);

  // Encrypt AES key for Receiver
  const receiverPubKey = await importPublicKey(receiverPublicKeyBase64);
  const encryptedKeyForReceiverBuf = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    receiverPubKey,
    exportedAesKey
  );

  // Encrypt AES key for Sender (so they can read their own sent messages)
  const senderPubKey = await importPublicKey(senderPublicKeyBase64);
  const encryptedKeyForSenderBuf = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    senderPubKey,
    exportedAesKey
  );

  return {
    encryptedContent: arrayBufferToBase64(encryptedContentBuffer),
    encryptedKeyForReceiver: arrayBufferToBase64(encryptedKeyForReceiverBuf),
    encryptedKeyForSender: arrayBufferToBase64(encryptedKeyForSenderBuf),
    iv: arrayBufferToBase64(iv)
  };
};

// Decrypt a payload using the user's private key
export const decryptMessage = async (encryptedData, privateKeyBase64, isSender) => {
  try {
    const privKey = await importPrivateKey(privateKeyBase64);
    
    // Determine which encrypted AES key to use
    const encryptedAesKeyB64 = isSender ? encryptedData.encryptedKeyForSender : encryptedData.encryptedKeyForReceiver;
    if (!encryptedAesKeyB64) return null; // Fallback to raw text if no key

    const encryptedAesKeyBuf = base64ToArrayBuffer(encryptedAesKeyB64);

    // Decrypt the AES key
    const aesKeyBuf = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privKey,
      encryptedAesKeyBuf
    );

    const aesKey = await window.crypto.subtle.importKey(
      "raw",
      aesKeyBuf,
      { name: "AES-GCM" },
      true,
      ["decrypt"]
    );

    // Decrypt the content
    const iv = base64ToArrayBuffer(encryptedData.iv);
    const contentBuf = base64ToArrayBuffer(encryptedData.encryptedContent);

    const decryptedContentBuf = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      aesKey,
      contentBuf
    );

    const decodedPayloadStr = new TextDecoder().decode(decryptedContentBuf);
    return JSON.parse(decodedPayloadStr);
  } catch (err) {
    console.error("E2EE Decryption failed:", err);
    return null;
  }
};
