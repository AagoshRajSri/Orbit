import DeviceRegistry from "../models/deviceRegistry.model.js";
import { z } from "zod";
import crypto from "crypto";

// ── Attestation verification ──────────────────────────────────────────────────

/**
 * Verify a device attestation signature.
 * The client signs: "<deviceId>:<userId>:<timestamp>" with its ECDSA P-256 key.
 */
const verifyAttestation = async (deviceId, userId, timestamp, attestation, devicePublicKey) => {
  try {
    // Reject stale attestations (> 5 minutes old)
    const ts = new Date(timestamp).getTime();
    if (Date.now() - ts > 5 * 60 * 1000) return false;

    // Import the device public key (base64 SPKI → CryptoKey)
    const pubKeyBuf = Buffer.from(devicePublicKey, "base64");
    const cryptoKey = await crypto.subtle.importKey(
      "spki",
      pubKeyBuf,
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["verify"]
    );

    const payload = `${deviceId}:${userId}:${timestamp}`;
    const sigBuf  = Buffer.from(attestation, "base64");

    return crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      cryptoKey,
      sigBuf,
      new TextEncoder().encode(payload)
    );
  } catch (err) {
    console.error("[Device] Attestation verification error:", err.message);
    return false;
  }
};

// ── Controller functions ──────────────────────────────────────────────────────

/**
 * POST /api/devices/register
 * Register (or update) the calling user's current device.
 */
export const registerDevice = async (req, res) => {
  try {
    const schema = z.object({
      deviceId:        z.string().min(10).max(128),
      devicePublicKey: z.string().min(20),
      deviceName:      z.string().max(128).default("Unknown Device"),
      timestamp:       z.string().datetime(),
      attestation:     z.string().min(20),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", details: parsed.error.issues } });
    }

    const { deviceId, devicePublicKey, deviceName, timestamp, attestation } = parsed.data;
    const userId = req.user._id.toString();

    // Verify the ECDSA attestation
    const valid = await verifyAttestation(deviceId, userId, timestamp, attestation, devicePublicKey);
    if (!valid) {
      return res.status(403).json({ success: false, error: { code: "INVALID_ATTESTATION", message: "Device attestation signature is invalid or expired" } });
    }

    const ip = req.ip || req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || "unknown";

    // Upsert device record
    const device = await DeviceRegistry.findOneAndUpdate(
      { userId: req.user._id, deviceId },
      {
        $set: {
          devicePublicKey,
          deviceName,
          attestation,
          lastSeenAt: new Date(),
          lastSeenIp: ip,
          revoked: false, // Re-registration un-revokes
        },
        $setOnInsert: {
          registrationIp: ip,
          trusted: false,
          verified: false,
        },
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      device: {
        deviceId:   device.deviceId,
        deviceName: device.deviceName,
        trusted:    device.trusted,
        verified:   device.verified,
        createdAt:  device.createdAt,
        lastSeenAt: device.lastSeenAt,
      },
    });
  } catch (error) {
    console.error("[Device] registerDevice error:", error.message);
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR" } });
  }
};

/**
 * GET /api/devices
 * List all registered devices for the calling user.
 */
export const listDevices = async (req, res) => {
  try {
    const devices = await DeviceRegistry.find({
      userId:  req.user._id,
      revoked: false,
    })
      .sort({ lastSeenAt: -1 })
      .select("deviceId deviceName devicePublicKey trusted verified lastSeenAt lastSeenIp registrationIp createdAt")
      .lean();

    return res.status(200).json({ success: true, devices });
  } catch (error) {
    console.error("[Device] listDevices error:", error.message);
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR" } });
  }
};

/**
 * DELETE /api/devices/:deviceId
 * Revoke a specific device (marks it as revoked, sessions will be invalidated).
 */
export const revokeDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;

    const result = await DeviceRegistry.findOneAndUpdate(
      { userId: req.user._id, deviceId },
      { $set: { revoked: true, revokedAt: new Date() } },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Device not found" } });
    }

    // TODO (Phase 3+): Invalidate all active sessions for this device
    // For now, rely on short-lived JWTs + refresh cookie invalidation

    return res.status(200).json({ success: true, message: "Device revoked successfully" });
  } catch (error) {
    console.error("[Device] revokeDevice error:", error.message);
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR" } });
  }
};

/**
 * PATCH /api/devices/:deviceId/trust
 * Mark a device as explicitly trusted by the user.
 */
export const trustDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;

    const result = await DeviceRegistry.findOneAndUpdate(
      { userId: req.user._id, deviceId, revoked: false },
      { $set: { trusted: true, verified: true } },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND" } });
    }

    return res.status(200).json({ success: true, device: { deviceId, trusted: true, verified: true } });
  } catch (error) {
    console.error("[Device] trustDevice error:", error.message);
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR" } });
  }
};

/**
 * GET /api/devices/check/:deviceId
 * Check if a specific device is registered and trusted (used by auth middleware).
 * Returns trust status without exposing the full device record.
 */
export const checkDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const device = await DeviceRegistry.findOne({
      userId:  req.user._id,
      deviceId,
      revoked: false,
    }).select("trusted verified lastSeenAt").lean();

    if (!device) {
      return res.status(200).json({ success: true, known: false, trusted: false });
    }

    return res.status(200).json({
      success: true,
      known:     true,
      trusted:   device.trusted,
      verified:  device.verified,
      lastSeenAt: device.lastSeenAt,
    });
  } catch (error) {
    console.error("[Device] checkDevice error:", error.message);
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR" } });
  }
};
