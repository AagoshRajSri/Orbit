import mongoose from "mongoose";

/**
 * DeviceRegistry — Phase 3
 *
 * Stores registered devices per user for device trust management.
 * Enables detection of:
 *   - New unrecognized device logins
 *   - Concurrent sessions from suspicious locations
 *   - Device revocation by the user
 */
const deviceRegistrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "User",
      required: true,
      index: true,
    },
    // Client-generated deterministic device UUID (hash of hardware fingerprint)
    deviceId: {
      type: String,
      required: true,
    },
    // ECDSA P-256 public key (base64 SPKI) — used to verify device attestations
    devicePublicKey: {
      type: String,
      required: true,
    },
    // Human-readable name e.g. "Chrome on macOS"
    deviceName: {
      type:    String,
      default: "Unknown Device",
    },
    // Registration IP for anomaly detection
    registrationIp: {
      type: String,
    },
    // Last seen metadata
    lastSeenAt:  { type: Date,   default: Date.now },
    lastSeenIp:  { type: String, default: null },
    // Geo-approximate last location (city-level, from IP)
    lastLocation: {
      city:    { type: String, default: null },
      country: { type: String, default: null },
    },
    // Trust state
    trusted:    { type: Boolean, default: false }, // Manually confirmed by user
    revoked:    { type: Boolean, default: false }, // User-initiated revocation
    revokedAt:  { type: Date,    default: null },
    // Attestation signature provided during registration
    attestation: {
      type: String,
      required: true,
    },
    // Whether this device has been verified (e.g., via email confirmation)
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Compound unique: one registration per (user, device)
deviceRegistrySchema.index({ userId: 1, deviceId: 1 }, { unique: true });

const DeviceRegistry = mongoose.model("DeviceRegistry", deviceRegistrySchema);

export default DeviceRegistry;
