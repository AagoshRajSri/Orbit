import AuditLog from "../models/auditLog.model.js";
import BlockedIP from "../models/blockedIP.model.js";
import Session from "../models/session.model.js";
import crypto from "crypto";

class SecurityService {
  /**
   * Generates a unique fingerprint for a request to track behavior across IPs
   */
  generateFingerprint(req) {
    const ua = req.headers["user-agent"] || "unknown";
    const lang = req.headers["accept-language"] || "unknown";
    const encoding = req.headers["accept-encoding"] || "unknown";
    const data = `${ua}|${lang}|${encoding}`;
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  async logAuditEvent(userId, action, req, details = {}, riskScore = 0) {
    try {
      const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
      const userAgent = req.headers["user-agent"] || "unknown";
      const fingerprint = this.generateFingerprint(req);

      await AuditLog.create({
        userId,
        action,
        ip,
        userAgent,
        fingerprint,
        details,
        riskScore,
      });
    } catch (e) {
      console.error("Failed to write audit log:", e.message);
    }
  }

  async blockIp(ip, reason, durationMinutes = 60) {
    try {
      await BlockedIP.findOneAndUpdate(
        { ip },
        { 
          reason, 
          expiresAt: new Date(Date.now() + durationMinutes * 60 * 1000) 
        },
        { upsert: true }
      );
      console.warn(`[SECURITY] Blocked IP: ${ip} for ${durationMinutes} mins. Reason: ${reason}`);
    } catch (e) {
      console.error("Failed to block IP:", e.message);
    }
  }

  async isIpBlocked(ip) {
    try {
      const block = await BlockedIP.findOne({ ip, expiresAt: { $gt: new Date() } });
      return !!block;
    } catch (e) {
      return false;
    }
  }

  /**
   * Advanced risk evaluation engine
   * Tracks behavior patterns, not just immediate failures
   */
  evaluateRisk(ip, userAgent, recentFails = 0, fingerprint = null) {
    let score = 0;
    
    // 1. Failure-based risk (exponential)
    if (recentFails > 3) score += 30;
    if (recentFails > 7) score += 50;
    if (recentFails > 12) score += 100;
    
    // 2. Client-based risk
    if (!userAgent || userAgent.length < 25) score += 40;
    const suspiciousTokens = ['python', 'curl', 'postman', 'insomnia', 'headless', 'puppeteer', 'selenium'];
    if (suspiciousTokens.some(t => userAgent?.toLowerCase().includes(t))) {
      score += 60;
    }

    // 3. Behavioral speed (theoretical - would use Redis in production)
    // If fingerprint repeat rate is too high, it's likely a script
    
    return Math.min(score, 100);
  }

  async invalidateSessions(userId, currentSessionId = null) {
    try {
      const query = { userId };
      if (currentSessionId) {
        query.sessionId = { $ne: currentSessionId };
      }
      await Session.updateMany(query, { isValid: false });
    } catch (e) {
      console.error("Failed to invalidate sessions:", e.message);
    }
  }
}

export default new SecurityService();
