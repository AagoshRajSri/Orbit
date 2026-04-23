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
  const port = parseInt(process.env.SMTP_PORT || "587", 10);

  if (user && pass) {
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      pool: true,
      maxConnections: 5,
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

function buildEmailPayload(to, otp) {
  const digits = otp.toString().split("");

  return {
    from: `"Orbit Auth" <${process.env.SMTP_FROM || "noreply@orbit.com"}>`,
    to,
    subject: "Your Orbit verification code",
    text: [
      `Hello,`,
      ``,
      `You requested a password reset. Your verification code is: ${otp}`,
      ``,
      `This code expires in ${OTP_VALIDITY_MINUTES} minutes.`,
      `If you didn't request this, you can safely ignore this email.`,
      ``,
      `— The Orbit Team`,
    ].join("\n"),
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Orbit Verification Code</title>
</head>
<body style="margin:0;padding:0;background-color:#080611;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#080611;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:500px;background:linear-gradient(145deg,#0f0c1a,#130e22);border:1px solid rgba(192,132,252,0.15);border-radius:18px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid rgba(192,132,252,0.1);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:22px;font-weight:800;background:linear-gradient(90deg,#c084fc,#818cf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:-0.5px;">
                      ✦ Orbit
                    </span>
                  </td>
                  <td align="right">
                    <span style="font-size:11px;color:#6b7280;letter-spacing:1.5px;text-transform:uppercase;">Security Alert</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#f0ebff;">Password Reset Request</p>
              <p style="margin:0 0 28px;font-size:14px;color:#9ca3af;line-height:1.6;">
                We received a request to reset your password. Use the code below — it's valid for
                <strong style="color:#c084fc;">${OTP_VALIDITY_MINUTES} minutes</strong>.
              </p>

              <!-- OTP Block -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:28px 0;background:rgba(192,132,252,0.06);border:1px solid rgba(192,132,252,0.18);border-radius:12px;">
                    <p style="margin:0 0 10px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#6b7280;">Your verification code</p>
                    <div style="display:inline-flex;gap:8px;letter-spacing:6px;">
                      ${digits
        .map(
          (d) => `
                        <span style="display:inline-block;width:36px;height:48px;line-height:48px;text-align:center;font-size:28px;font-weight:800;color:#4ade80;background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.2);border-radius:8px;">${d}</span>
                      `
        )
        .join("")}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Warning -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                <tr>
                  <td style="padding:14px 18px;background:rgba(251,191,36,0.05);border-left:3px solid rgba(251,191,36,0.4);border-radius:0 8px 8px 0;">
                    <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.5;">
                      🔒 If you didn't request this code, your account may be at risk.
                      <a href="#" style="color:#c084fc;text-decoration:none;">Secure your account →</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 28px;border-top:1px solid rgba(255,255,255,0.05);">
              <p style="margin:0;font-size:11px;color:#4b5563;text-align:center;line-height:1.6;">
                Sent by Orbit · You're receiving this because a reset was requested for your account.<br/>
                © ${new Date().getFullYear()} Orbit. All rights reserved.
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
 * @returns {{ success: boolean, messageId?: string, previewUrl?: string, error?: string }}
 */
export async function sendOTP(to, otp) {
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
    const payload = buildEmailPayload(to, otp);

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