import { z } from "zod";

// ─── Reusable primitives ──────────────────────────────────────────────────────

/**
 * A single edge in the constellation pattern.
 * Format: { from: "A2", to: "F1" }
 * Labels: 1 letter + 1–2 digits (matches how client generates them).
 */
const edgeSchema = z.object({
  from: z
    .string()
    .trim()
    .min(1)
    .max(10)
    .regex(
      /^[A-Za-z][A-Za-z0-9]*$/,
      "Edge 'from' must be a valid star label (e.g. A2, Solara, K12)",
    ),
  to: z
    .string()
    .trim()
    .min(1)
    .max(10)
    .regex(
      /^[A-Za-z][A-Za-z0-9]*$/,
      "Edge 'to' must be a valid star label (e.g. F1, Veris, B9)",
    ),
});

/**
 * Aggregated behavioral metrics only — no raw timestamps, positions, or paths.
 * Both fields are optional individually; the whole object is optional.
 */
const behavioralSchema = z
  .object({
    drawDurationMs:   z.number().int().min(0).max(300_000),
    timingVarianceMs: z.number().min(0).max(300_000),
  })
  .optional();

/**
 * Nonce: 64-char lowercase hex (32 random bytes from the /challenge endpoint).
 */
const nonceSchema = z
  .string()
  .length(64, "Nonce must be a 64-character hex string")
  .regex(/^[0-9a-f]+$/, "Nonce must be lowercase hex");

// ─── An ordered edge list: min 1, max 21 (7 stars × 6 pairs + generous buffer) ─

const edgeListSchema = z.array(edgeSchema).min(1).max(21);

// ─── Public schemas ───────────────────────────────────────────────────────────

/**
 * POST /api/auth/constellation/signup
 */
export const constellationSignupSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "Username may only contain letters, numbers, underscores and hyphens",
    ),

  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .max(254, "Email address too long")
    .transform((v) => v.toLowerCase()),

  edges: edgeListSchema,
  nonce: nonceSchema,
  selectedIcons: z.array(z.string()).optional(),
});

/**
 * POST /api/auth/constellation/login
 */
export const constellationLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .max(254)
    .transform((v) => v.toLowerCase()),

  edges: edgeListSchema,
  nonce: nonceSchema,

  // Behavioral metrics are optional — only passed when available
  behavioral: behavioralSchema,
});
