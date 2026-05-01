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

// ─── Mailer Initialization ──────────────────────────────────────────────────────

let nodemailerInstance = null;

function getMailer() {
  // Use SMTP if configured
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    if (!nodemailerInstance) {
      nodemailerInstance = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587", 10),
        secure: process.env.SMTP_PORT == "465",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      console.log("[MAILER] 📧 Initialized Nodemailer (SMTP)");
    }
    return { type: "smtp", client: nodemailerInstance };
  }

  // Mock mode fallback
  if (process.env.NODE_ENV === "production") {
    console.error("[MAILER] ❌ No SMTP mailer configured.");
  } else {
    console.warn("[MAILER] ⚠️ No SMTP mailer configured in development. Using Mock Mailer.");
  }
  return null;
}

// ─── Email Template ───────────────────────────────────────────────────────────

function buildEmailPayload(to, otp, type = "verification") {
  const year = new Date().getFullYear();
  const subject = type === "reset" 
    ? `${otp} is your Orbit password reset code`
    : `${otp} is your Orbit verification code`;

  return {
    from: process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@orbit.com",
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
 * Send an OTP via Telegram.
 * @param {string} chatId - The recipient's Telegram Chat ID
 * @param {string} otp - The OTP code
 * @param {string} type - verification or reset
 */
async function sendTelegramOTP(chatId, otp, type = "verification") {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error("[MAILER] Telegram Bot Token is missing.");
    return { success: false, error: "Telegram configuration error" };
  }

  const message = type === "reset"
    ? `🔒 <b>Orbit Security Code</b>\n\nYour password reset code is: <code>${otp}</code>\n\nExpires in 5 minutes.`
    : `🚀 <b>Welcome to Orbit</b>\n\nYour verification code is: <code>${otp}</code>\n\nExpires in 5 minutes.`;

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });

    const data = await response.json();
    if (!data.ok) {
      throw new Error(data.description || "Telegram API error");
    }

    console.log("[MAILER] ✓ Message sent via TELEGRAM. ID:", data.result.message_id);
    return { success: true, messageId: data.result.message_id };
  } catch (error) {
    console.error("[MAILER] Telegram send failed:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send an OTP verification email or Telegram message.
 *
 * @param {string} to   - Recipient email address or Telegram ID
 * @param {string|number} otp - The one-time password to send
 * @param {string} type - The type of email (verification or reset)
 * @param {string} method - 'email' or 'telegram'
 * @returns {{ success: boolean, messageId?: string, error?: string }}
 */
export async function sendOTP(to, otp, type = "verification", method = "email") {
  // ── Input validation ──
  if (!to) {
    return { success: false, error: "Recipient is required." };
  }

  if (!otp) {
    return { success: false, error: "OTP is required." };
  }

  // ── Rate limiting ──
  if (isRateLimited(to)) {
    console.warn(`[MAILER] Rate limit exceeded for: ${to}`);
    return { success: false, error: "Too many OTP requests. Please wait." };
  }

  // ── Telegram Dispatch ──
  if (method === "telegram" || (!EMAIL_REGEX.test(to) && to.match(/^\d+$/))) {
    return await sendTelegramOTP(to, otp, type);
  }

  // ── Email Dispatch (Existing SMTP logic) ──
  try {
    const payload = buildEmailPayload(to, otp, type);
    const mailer = getMailer();

    if (!mailer) {
      console.log("\n───────────────────────────────────────────────────");
      console.log(`  📧 [MOCK EMAIL] To: ${to} | OTP: ${otp}`);
      console.log("───────────────────────────────────────────────────\n");
      return { success: true, messageId: "mock-" + Date.now() };
    }

    const response = await withRetry(async () => {
      if (mailer.type === "smtp") {
        const info = await mailer.client.sendMail({
          from: payload.from,
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
          text: payload.text
        });
        return { data: { id: info.messageId } };
      }
      throw new Error("Unsupported mailer type");
    });

    console.log(`[MAILER] ✓ Message sent via ${mailer.type.toUpperCase()}. ID:`, response.data.id);
    return { success: true, messageId: response.data.id };

  } catch (error) {
    console.error("[MAILER] Email failed:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Teardown function to clean up connections
 */
export function closeMailer() {
  if (nodemailerInstance) {
    nodemailerInstance.close();
    nodemailerInstance = null;
  }
}

/**
 * Generic email sender for admin broadcasts.
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML body
 */
export async function sendEmail(to, subject, html) {
  if (!to || !EMAIL_REGEX.test(to)) {
    return { success: false, error: "Invalid recipient email address." };
  }
  
  try {
    const mailer = getMailer();

    if (!mailer) {
      console.log(`[MAILER] [MOCK BROADCAST] To: ${to} | Subject: ${subject}`);
      return { success: true, messageId: "mock-" + Date.now() };
    }

    if (mailer.type === "smtp") {
      const info = await mailer.client.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        html
      });
      return { success: true, messageId: info.messageId };
    }
    throw new Error("Unsupported mailer type");
  } catch (error) {
    console.error("[MAILER] sendEmail failed:", error.message);
    return { success: false, error: error.message };
  }
}