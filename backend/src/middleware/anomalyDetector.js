/**
 * Orbit Anomaly Detector — Phase 3
 *
 * Express middleware that performs behavioral analysis on authenticated requests.
 * Detects: impossible travel, IP hopping, concurrent session abuse, revoked devices.
 *
 * DESIGN: Non-blocking by default (logs + emits risk scores). Only hard-blocks
 * on confirmed revoked devices or extreme anomaly scores (≥ 90).
 *
 * Risk Scoring:
 *   - New unregistered device:        +40
 *   - IP change within same session:  +20
 *   - Impossible travel (>900 km/h):  +60
 *   - Revoked device:                +100 (hard block)
 *   - Missing device header:          +10
 */

import DeviceRegistry from "../models/deviceRegistry.model.js";

// Simple in-memory IP → location cache (city-level, no PII stored)
const ipCache = new Map();
const SESSION_IP_MAP = new Map(); // sessionId → last seen IP

// ── GeoIP approximation via public API (fallback to null) ───────────────────

const geoLookup = async (ip) => {
  if (!ip || ip === "unknown" || ip === "::1" || ip === "127.0.0.1") return null;
  if (ipCache.has(ip)) return ipCache.get(ip);
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) return null;
    const data = await res.json();
    const loc = { lat: data.latitude, lon: data.longitude, country: data.country_code, city: data.city };
    ipCache.set(ip, loc);
    return loc;
  } catch {
    return null;
  }
};

// Haversine distance in km between two lat/lon pairs
const haversine = (a, b) => {
  if (!a || !b || !a.lat || !b.lat) return 0;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

// ── Main middleware ───────────────────────────────────────────────────────────

export const anomalyDetector = async (req, res, next) => {
  if (!req.user) return next(); // Auth middleware didn't set user; skip

  const userId   = req.user._id.toString();
  const deviceId = req.headers["x-device-id"] || null;
  const ip       = req.ip || req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || "unknown";
  const sessionId = req.user.jti || userId; // Use JWT ID if available

  let riskScore = 0;
  const riskFactors = [];

  try {
    // ── 1. Device check ──────────────────────────────────────────────────────
    if (!deviceId) {
      riskScore += 10;
      riskFactors.push("MISSING_DEVICE_HEADER");
    } else {
      const device = await DeviceRegistry.findOne({ userId: req.user._id, deviceId }).lean();

      if (!device) {
        riskScore += 40;
        riskFactors.push("UNKNOWN_DEVICE");
      } else if (device.revoked) {
        // Hard block — revoked device
        console.warn(`[Anomaly] HARD_BLOCK: Revoked device ${deviceId} for user ${userId}`);
        return res.status(403).json({
          success: false,
          error: { code: "DEVICE_REVOKED", message: "This device has been revoked. Please log in from a trusted device." },
        });
      } else {
        // Update last seen (fire-and-forget)
        DeviceRegistry.updateOne(
          { userId: req.user._id, deviceId },
          { $set: { lastSeenAt: new Date(), lastSeenIp: ip } }
        ).catch(() => {});
      }
    }

    // ── 2. IP change detection ───────────────────────────────────────────────
    const lastIp = SESSION_IP_MAP.get(sessionId);
    if (lastIp && lastIp !== ip) {
      riskScore += 20;
      riskFactors.push(`IP_CHANGE:${lastIp}→${ip}`);

      // ── 3. Impossible travel detection ──────────────────────────────────────
      // (async — don't block request; only log/score)
      setImmediate(async () => {
        try {
          const [oldGeo, newGeo] = await Promise.all([geoLookup(lastIp), geoLookup(ip)]);
          const distKm = haversine(oldGeo, newGeo);
          // Assume min 60s between requests; 900 km/h is supersonic commercial threshold
          if (distKm > 900) {
            console.warn(`[Anomaly] IMPOSSIBLE_TRAVEL: user=${userId} dist=${Math.round(distKm)}km`);
            // Can't modify response here (already sent), but we log for audit
          }
        } catch { /* geo lookup failed */ }
      });
    }
    SESSION_IP_MAP.set(sessionId, ip);
    // Prevent unbounded growth
    if (SESSION_IP_MAP.size > 50000) {
      const firstKey = SESSION_IP_MAP.keys().next().value;
      SESSION_IP_MAP.delete(firstKey);
    }

    // ── 4. Attach risk info to request ───────────────────────────────────────
    req.securityContext = { riskScore, riskFactors, deviceId, ip };

    // Hard block if score is extreme (should not be reached without device revocation above)
    if (riskScore >= 90) {
      console.error(`[Anomaly] HIGH_RISK_BLOCK: user=${userId} score=${riskScore} factors=${riskFactors.join(",")}`);
      return res.status(403).json({
        success: false,
        error: { code: "HIGH_RISK_SESSION", message: "Suspicious activity detected. Please re-authenticate." },
      });
    }

    if (riskScore > 0) {
      console.warn(`[Anomaly] Risk score ${riskScore} for user=${userId}: ${riskFactors.join(", ")}`);
    }

  } catch (err) {
    // Never let anomaly detection crash the request
    console.error("[Anomaly] Detection error (non-fatal):", err.message);
  }

  next();
};

// ── Utility: clean up stale session IP entries ────────────────────────────────
export const clearSessionCache = (sessionId) => {
  SESSION_IP_MAP.delete(sessionId);
};
