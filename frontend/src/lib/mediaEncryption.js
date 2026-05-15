/**
 * Orbit Media Encryption
 *
 * Implements client-side AES-256-GCM encryption for media (images, files).
 * Each file is encrypted with a unique, one-time symmetric key.
 *
 * WORKFLOW:
 *   1. Sender generates a random AES-256-GCM key + IV.
 *   2. Sender encrypts the file blob.
 *   3. Sender uploads the encrypted blob (ciphertext) to the server.
 *   4. Sender sends the (key + IV) to the recipient(s) via the E2EE channel.
 *   5. Recipient downloads the encrypted blob.
 *   6. Recipient decrypts the blob using the key + IV from the E2EE message.
 */

const AES_PARAMS = { name: "AES-GCM", length: 256 };

/**
 * Encrypt a file (Blob or base64 string).
 * @param {Blob|string} data - The media data to encrypt
 * @returns {Promise<{ ciphertext: string, key: string, iv: string }>}
 */
export const encryptMedia = async (data) => {
  let arrayBuffer;
  if (data instanceof Blob) {
    arrayBuffer = await data.arrayBuffer();
  } else if (typeof data === "string" && data.startsWith("data:")) {
    // base64 data URL
    const b64 = data.split(",")[1];
    const bin = atob(b64);
    const buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    arrayBuffer = buf.buffer;
  } else {
    throw new Error("Unsupported media format for encryption");
  }

  // Generate ephemeral key + IV
  const key = await crypto.subtle.generateKey(AES_PARAMS, true, ["encrypt", "decrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt
  const ciphertextBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    arrayBuffer
  );

  // Export key and encode everything
  const exportedKey = await crypto.subtle.exportKey("raw", key);
  
  const buf2b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
  
  // Return ciphertext as base64 data URL (so backend can treat it as an image upload)
  // We use a dummy mime type so Cloudinary accepts it, but it's actually encrypted noise.
  const ciphertextB64 = buf2b64(ciphertextBuf);
  const dataUrl = `data:application/octet-stream;base64,${ciphertextB64}`;

  return {
    ciphertext: dataUrl,
    key: buf2b64(exportedKey),
    iv: buf2b64(iv),
  };
};

/**
 * Decrypt media.
 * @param {string} url - The URL of the encrypted blob (e.g. Cloudinary URL)
 * @param {string} keyB64 - base64 encoded raw AES key
 * @param {string} ivB64 - base64 encoded IV
 * @returns {Promise<string>} data URL of the decrypted media
 */
export const decryptMedia = async (url, keyB64, ivB64) => {
  // 1. Fetch the encrypted data
  const res = await fetch(url);
  const encryptedBuf = await res.arrayBuffer();

  const b64toBuf = (b64) => {
    const bin = atob(b64);
    const buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    return buf.buffer;
  };

  // 2. Import the key
  const key = await crypto.subtle.importKey(
    "raw",
    b64toBuf(keyB64),
    AES_PARAMS,
    false,
    ["decrypt"]
  );

  // 3. Decrypt
  const decryptedBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(b64toBuf(ivB64)) },
    key,
    encryptedBuf
  );

  // 4. Convert back to a displayable Blob URL
  // We might not know the original mime type, but usually it's an image.
  // We can try to guess or just use a generic one.
  // Actually, we could store the mime type in the E2EE metadata too.
  const blob = new Blob([decryptedBuf]);
  return URL.createObjectURL(blob);
};
