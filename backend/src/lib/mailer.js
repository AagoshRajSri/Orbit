import nodemailer from "nodemailer";

// ─── Constants ────────────────────────────────────────────────────────────────

const OTP_VALIDITY_MINUTES = 5;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Rate Limiting (in-memory, per process) ───────────────────────────────────

const rateLimitMap = new Map(); // email → { count, windowStart }
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 3; // max OTPs per window

function isRateLimited(email) {
  const now = Date.now();
  const entry = rateLimitMap.get(email);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(email, { count: 1, windowStart: now });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) return true;

  entry.count++;
  return false;
}

// ─── Transporter Factory ──────────────────────────────────────────────────────

let cachedTransporter = null;

async function createTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const user = process.env.SMTP_USER || process.env.EMAIL;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "465", 10); // Default to 465 for better Render compatibility

  if (user && pass) {
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // Must be true for 465
      auth: { user, pass },
      // Disabling pool for now as it can cause ENETUNREACH if Render closes idle sockets
      pool: false, 
    });

    await cachedTransporter.verify();
    console.log("[MAILER] SMTP connection verified ✓");
    return cachedTransporter;
  }

  // Fallback: ephemeral Ethereal account (dev only)
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[MAILER] No SMTP credentials found. Set SMTP_USER and SMTP_PASS in .env"
    );
  }

  console.warn(
    "\n[MAILER] ⚠️  No SMTP credentials found. Using Ethereal test account (dev only)."
  );
  const testAccount = await nodemailer.createTestAccount();
  cachedTransporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });

  return cachedTransporter;
}

// ─── Email Template ───────────────────────────────────────────────────────────

function buildEmailPayload(to, otp, type = "verification") {
  const year = new Date().getFullYear();
  const subject = type === "reset" 
    ? `${otp} is your Orbit password reset code`
    : `${otp} is your Orbit verification code`;

  return {
    from: process.env.SMTP_USER || process.env.EMAIL || "noreply@orbit.com",
    to,
    subject,
    text: [
      `Hey,`,
      ``,
      `Your Orbit ${type === "reset" ? "password reset" : "verification"} code is: ${otp}`,
      ``,
      `It expires in ${OTP_VALIDITY_MINUTES} minutes.`,
      `If you didn't request this, you can safely ignore this email.`,
      ``,
      `— Orbit`,
    ].join("\n"),
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Orbit Secure Dispatch</title>
</head>
<body style="margin:0;padding:0;background-color:#020108;font-family:'Inter','Segoe UI',Tahoma,Geneva,Verdana,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#020108;">
    <tr>
      <td align="center" style="padding:40px 10px;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:520px;width:100%;">
          
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding-right:12px;">
                    <div style="width:32px;height:32px;border:2px solid #8b5cf6;border-radius:50%;display:inline-block;background:radial-gradient(circle at 30% 30%, #a78bfa 0%, #7c3aed 100%);box-shadow:0 0 15px rgba(139,92,246,0.3);"></div>
                  </td>
                  <td>
                    <span style="font-size:24px;font-weight:900;color:#ffffff;letter-spacing:-0.03em;text-transform:uppercase;font-family:'Space Mono','Courier New',monospace;">ORBIT<span style="color:#8b5cf6;">_</span>NET</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background:linear-gradient(135deg, #100b2a 0%, #080616 100%);border:1px solid rgba(139,92,246,0.2);border-radius:24px;padding:48px 40px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
              
              <h1 style="margin:0 0 16px;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;line-height:1.2;text-align:center;">
                ${type === "reset" ? "RESTORE_ACCESS" : "VERIFY_IDENTITY"}
              </h1>
              
              <p style="margin:0 0 32px;font-size:14px;color:#94a3b8;line-height:1.6;text-align:center;font-family:'Space Mono',monospace;letter-spacing:0.05em;">
                SECURE_DISPATCH_PROTOCOL: <span style="color:#a78bfa;">${new Date().toISOString().split('T')[0]}</span>
              </p>

              <div style="height:1px;background:linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent);margin-bottom:32px;"></div>

              <p style="margin:0 0 24px;font-size:16px;color:#e2e8f0;line-height:1.6;text-align:center;">
                The Orbit network requires a security sigil to unseal your session. This code will expire in <b>${OTP_VALIDITY_MINUTES} minutes</b>.
              </p>

              <!-- OTP SIGIL BLOCKS -->
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin-bottom:32px;">
                <tr>
                  ${otp.split("").map((digit) => `
                    <td style="padding:0 4px;">
                      <div style="width:52px;height:64px;background-color:#0f172a;border:1px solid #334155;border-radius:12px;text-align:center;line-height:64px;font-size:32px;font-weight:800;color:#a78bfa;font-family:'Courier New',monospace;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1), inset 0 2px 4px 0 rgba(139,92,246,0.05);">
                        ${digit}
                      </div>
                    </td>
                  `).join("")}
                </tr>
              </table>

              <div style="background-color:rgba(139,92,246,0.05);border-radius:16px;padding:20px;text-align:center;border:1px dashed rgba(139,92,246,0.2);">
                <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">
                  If you did not initiate this handshake, please disregard this transmission. No action will be taken.
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:32px;">
              <p style="margin:0;font-size:11px;color:#475569;letter-spacing:0.1em;text-transform:uppercase;font-family:'Space Mono',monospace;">
                // END_OF_TRANSMISSION //
              </p>
              <p style="margin:12px 0 0;font-size:10px;color:#334155;">
                ORBIT_GLOBAL_ENCRYPTION_LAYER v4.2.1
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  };
}

// ─── Retry Helper ─────────────────────────────────────────────────────────────

async function withRetry(fn, retries = MAX_RETRIES, delayMs = RETRY_DELAY_MS) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`[MAILER] Attempt ${attempt} failed. Retrying in ${delayMs}ms...`);
      await new Promise((r) => setTimeout(r, delayMs * attempt)); // exponential backoff
    }
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Send an OTP verification email.
 *
 * @param {string} to   - Recipient email address
 * @param {string|number} otp - The one-time password to send
 * @param {string} type - The type of email (verification or reset)
 * @returns {{ success: boolean, messageId?: string, previewUrl?: string, error?: string }}
 */
export async function sendOTP(to, otp, type = "verification") {
  // ── Input validation ──
  if (!to || !EMAIL_REGEX.test(to)) {
    console.error("[MAILER] Invalid recipient email:", to);
    return { success: false, error: "Invalid recipient email address." };
  }

  if (!otp) {
    console.error("[MAILER] OTP is required.");
    return { success: false, error: "OTP is required." };
  }

  // ── Rate limiting ──
  if (isRateLimited(to)) {
    console.warn(`[MAILER] Rate limit exceeded for: ${to}`);
    return { success: false, error: "Too many OTP requests. Please wait before requesting another." };
  }

  // ── Send with retry ──
  try {
    const transporter = await createTransporter();
    const payload = buildEmailPayload(to, otp, type);

    const info = await withRetry(() => transporter.sendMail(payload));

    console.log("[MAILER] ✓ Message sent:", info.messageId);

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log("\n───────────────────────────────────────────────────");
      console.log("  ✉️  VIEW YOUR TEST EMAIL:");
      console.log(`  👉 ${previewUrl}`);
      console.log("───────────────────────────────────────────────────\n");
    }

    return { success: true, messageId: info.messageId, ...(previewUrl && { previewUrl }) };
  } catch (error) {
    console.error("[MAILER] Failed to send email after retries:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Tear down the cached transporter (useful in tests or graceful shutdown).
 */
export function closeMailer() {
  if (cachedTransporter) {
    cachedTransporter.close?.();
    cachedTransporter = null;
  }
}