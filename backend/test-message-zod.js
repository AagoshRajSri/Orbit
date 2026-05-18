import { z } from "zod";

const messageSchema = z
  .object({
    text: z.string().max(2000).optional(),
    image: z.string().max(5000000).optional(),
    idempotencyKey: z.string().optional(),
    // ── v3: Double Ratchet fields ───────────────────────────────────────────────
    v: z.number().int().min(1).max(10).optional(),
    ciphertext: z.string().optional(),  // AES-GCM encrypted payload
    dh: z.string().optional(),          // Sender's ratchet DH pub key (base64)
    n:  z.number().int().optional(),    // Message counter
    pn: z.number().int().optional(),    // Previous chain length
    iv: z.string().optional(),          // AES-GCM IV (also used by v2)
    x3dh: z.object({
      identityKey:  z.string(),
      ephemeralKey: z.string(),
      opkId: z.string().nullable().optional(),
    }).optional(),
    // ── v2: ECDH + HKDF + AES-GCM fields ─────────────────────────────────
    ephemeralPublicKey: z.string().max(1024).optional(),
    encryptedContent: z.string().optional(),
    aad: z.string().max(512).optional(),
    // ── v1 legacy: RSA-OAEP fields ───────────────────────────────────────────
    encryptedKeyForReceiver: z.string().optional(),
    encryptedKeyForSender: z.string().optional(),
  })
  .refine(
    (data) => data.text || data.image || data.encryptedContent || data.ciphertext,
    { message: "Message must contain text, image, or encrypted content" }
  );

const payload = {
  idempotencyKey: "123e4567-e89b-12d3-a456-426614174000",
  v: 3,
  dh: "base64encodedpubkey",
  n: 0,
  pn: 0,
  ciphertext: "base64encodedciphertext",
  iv: "base64encodediv",
  x3dh: {
    identityKey: "base64encodedidentitykey",
    ephemeralKey: "base64encodedephemeralkey",
    opkId: null
  }
};

const parsed = messageSchema.safeParse(payload);
console.log("Parsed success:", parsed.success);
if (!parsed.success) {
  console.log("Validation errors:", parsed.error.format());
}
