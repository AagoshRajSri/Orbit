import securityService from "../services/security.service.js";

// Global cache for very light rate tracking (for risk engine)
const ipCache = new Map();

// Helper to keep IP cache small
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipCache.entries()) {
    if (now - data.lastCheck > 60000 * 5) {
      ipCache.delete(ip);
    }
  }
}, 60000 * 5); // 5 mins

export const threatDetectionMiddleware = async (req, res, next) => {
  const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
  
  // 1. Isolate permanently blocked IPs immediately
  const isBlocked = await securityService.isIpBlocked(ip);
  if (isBlocked) {
    return res.status(403).json({ message: "Access explicitly denied by security policy" });
  }

  // 2. Tally request counts and evaluate risk
  const userAgent = req.headers["user-agent"] || "unknown";
  let ipData = ipCache.get(ip) || { hits: 0, failures: 0, lastCheck: Date.now() };
  
  ipData.hits++;
  ipData.lastCheck = Date.now();
  ipCache.set(ip, ipData);

  // 3. Compute Risk Score
  const riskScore = securityService.evaluateRisk(ip, userAgent, ipData.failures);

  // Attach to request for logging downstream
  req.riskScore = riskScore;
  req.securityStatus = {
    isHighRisk: riskScore >= 70,
  };

  // 4. Act proactively
  if (riskScore >= 90) {
    // Critical risk: Block IP aggressively to stop brute forces
    await securityService.blockIp(ip, "Critical behavior anomalies detected", 30);
    await securityService.logAuditEvent(req.user?._id || null, "THREAT_BLOCKED", req, { riskScore }, riskScore);
    return res.status(403).json({ message: "Connection forcefully closed due to critical risk factors" });
  } 

  // Wait, if it's "High" (e.g. 70-89) we might want to throttle artificially
  if (req.securityStatus.isHighRisk) {
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 1200)); // tarpit
  }

  next();
};
