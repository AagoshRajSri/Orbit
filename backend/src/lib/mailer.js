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
  const year = new Date().getFullYear();

  return {
    from: `"Orbit" <${process.env.SMTP_FROM || "noreply@orbit.com"}>`,
    to,
    subject: `${otp} is your Orbit verification code`,
    text: [
      `Hey,`,
      ``,
      `Your Orbit verification code is: ${otp}`,
      ``,
      `It expires in ${OTP_VALIDITY_MINUTES} minutes.`,
      `If you didn't sign up for Orbit, you can safely ignore this.`,
      ``,
      `— Orbit`,
    ].join("\n"),
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your Orbit account</title>
</head>
<body style="margin:0;padding:0;background:#07050f;font-family:'Segoe UI',system-ui,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
    style="background:#07050f;padding:48px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0"
          style="width:100%;max-width:480px;">

          <!-- Logo row -->
          <tr>
            <td style="padding-bottom:32px;">
              <span style="font-size:18px;font-weight:700;color:#a78bfa;letter-spacing:-0.3px;">
                ✦ Orbit
              </span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#0f0b1e;border:1px solid rgba(255,255,255,0.07);
              border-radius:20px;padding:40px 36px;">

              <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#f0ebff;
                letter-spacing:-0.4px;">
                Here's your code
              </p>
              <p style="margin:0 0 32px;font-size:14px;color:#6b7280;line-height:1.65;">
                Use this to verify your Orbit account. It's only valid for
                <strong style="color:#9ca3af;">${OTP_VALIDITY_MINUTES} minutes</strong>, so use it soon.
              </p>

              <!-- OTP block -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center"
                    style="background:#13102a;border:1px solid rgba(167,139,250,0.15);
                    border-radius:14px;padding:28px 20px;">
                    <p style="margin:0 0 14px;font-size:10px;letter-spacing:0.2em;
                      text-transform:uppercase;color:#4b5563;">
                      Verification code
                    </p>
                    <div style="display:inline-block;">
                      ${otp.split("").map(d => `<span style="
                        display:inline-block;
                        width:40px;height:52px;line-height:52px;
                        text-align:center;
                        font-size:30px;font-weight:800;
                        color:#a78bfa;
                        background:rgba(139,92,246,0.08);
                        border:1px solid rgba(139,92,246,0.2);
                        border-radius:10px;
                        margin:0 3px;
                        font-family:'Courier New',monospace;
                      ">${d}</span>`).join("")}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Note -->
              <p style="margin:28px 0 0;font-size:13px;color:#4b5563;line-height:1.6;">
                Didn't sign up? No worries — just ignore this email and nothing will happen.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:28px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#374151;line-height:1.7;">
                © ${year} Orbit &nbsp;·&nbsp; This email was sent because an account was being created.
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