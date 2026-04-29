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
  <style>
    @keyframes orbitSpin {
      to { transform: rotate(360deg); }
    }
    @keyframes auroraPulse {
      0%, 100% { opacity: 0.7; transform: scale(1) translate(0, 0); }
      50% { opacity: 1; transform: scale(1.15) translate(8px, -8px); }
    }
    @keyframes digitGlow {
      0%, 100% {
        box-shadow: none;
        border-color: rgba(139,92,246,0.2);
        color: #c4b5fd;
      }
      50% {
        box-shadow: 0 0 20px rgba(139,92,246,0.3), 0 0 6px rgba(139,92,246,0.15) inset;
        border-color: rgba(167,139,250,0.55);
        color: #ddd6fe;
      }
    }
    @keyframes twinkle {
      0%, 100% { opacity: 0.08; transform: scale(1); }
      50% { opacity: 0.65; transform: scale(1.6); }
    }
    @keyframes timerDrain {
      from { width: 100%; }
      to { width: 0%; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#060412;font-family:'Segoe UI',system-ui,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
    style="background:#060412;padding:48px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0"
          style="width:100%;max-width:480px;">

          <!-- Logo row -->
          <tr>
            <td style="padding-bottom:28px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:10px;">
                    <!-- Spinning orbit ring -->
                    <div style="
                      width:26px;height:26px;border-radius:50%;
                      background:conic-gradient(from 0deg,#7c3aed,#06b6d4,#7c3aed);
                      animation:orbitSpin 8s linear infinite;
                      position:relative;display:inline-block;
                    ">
                      <div style="
                        position:absolute;inset:3px;border-radius:50%;background:#060412;
                      "></div>
                    </div>
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="
                      font-size:18px;font-weight:800;letter-spacing:-0.5px;
                      background:linear-gradient(90deg,#a78bfa,#67e8f9);
                      -webkit-background-clip:text;-webkit-text-fill-color:transparent;
                      background-clip:text;
                    ">Orbit</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card (gradient border via wrapper) -->
          <tr>
            <td style="
              background:linear-gradient(135deg,rgba(167,139,250,0.4),rgba(6,182,212,0.15),rgba(167,139,250,0.05));
              border-radius:24px;padding:2px;
            ">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                style="background:#0c0820;border-radius:22px;overflow:hidden;">
                <tr>
                  <td style="padding:40px 36px;position:relative;">

                    <!-- Aurora glow top-right -->
                    <div style="
                      position:absolute;top:-60px;right:-60px;
                      width:280px;height:280px;border-radius:50%;
                      background:radial-gradient(ellipse,rgba(124,58,237,0.13) 0%,transparent 70%);
                      animation:auroraPulse 6s ease-in-out infinite;
                      pointer-events:none;
                    "></div>

                    <!-- Aurora glow bottom-left -->
                    <div style="
                      position:absolute;bottom:-80px;left:-40px;
                      width:280px;height:280px;border-radius:50%;
                      background:radial-gradient(ellipse,rgba(6,182,212,0.09) 0%,transparent 70%);
                      animation:auroraPulse 8s ease-in-out infinite reverse;
                      pointer-events:none;
                    "></div>

                    <!-- Twinkling stars -->
                    ${[
        [15, 20, 2.5, 0], [30, 75, 4, 1], [60, 10, 3, 0.5], [10, 55, 5, 2], [80, 85, 3.5, 1.5],
        [50, 90, 2, 0.8], [20, 42, 4.5, 0.3], [70, 35, 3, 2.5], [88, 60, 2.8, 0.6]
      ].map(([top, left, d, delay]) =>
        `<div style="
                        position:absolute;top:${top}%;left:${left}%;
                        width:2px;height:2px;border-radius:50%;background:white;
                        animation:twinkle ${d}s ease-in-out infinite ${delay}s;
                        pointer-events:none;
                      "></div>`
      ).join("")}

                    <!-- Heading -->
                    <p style="
                      margin:0 0 8px;font-size:24px;font-weight:800;
                      color:#f0ebff;letter-spacing:-0.6px;position:relative;z-index:1;
                    ">Here's your code</p>

                    <p style="
                      margin:0 0 28px;font-size:13.5px;color:#5b5475;line-height:1.7;
                      position:relative;z-index:1;
                    ">
                      Use this to verify your Orbit account. It's only valid for
                      <strong style="color:#7c6fa0;font-weight:600;">${OTP_VALIDITY_MINUTES} minutes</strong>,
                      so use it soon.
                    </p>

                    <!-- Gradient divider -->
                    <div style="
                      height:1px;
                      background:linear-gradient(90deg,transparent,rgba(167,139,250,0.2),transparent);
                      margin-bottom:28px;position:relative;z-index:1;
                    "></div>

                    <!-- OTP block (gradient border wrapper) -->
                    <div style="
                      background:linear-gradient(135deg,rgba(167,139,250,0.3),rgba(6,182,212,0.2));
                      border-radius:18px;padding:1.5px;
                      margin-bottom:24px;position:relative;z-index:1;
                    ">
                      <div style="
                        background:linear-gradient(160deg,#0e0a26,#130e2e);
                        border-radius:17px;padding:28px 20px;text-align:center;
                      ">
                        <p style="
                          margin:0 0 18px;font-size:9px;letter-spacing:0.22em;
                          text-transform:uppercase;color:#3d3558;font-weight:600;
                        ">Verification code</p>

                        <!-- Individual digit cells -->
                        <div style="display:inline-block;">
                          ${otp.split("").map((d, i) => `<span style="
                            display:inline-block;
                            width:44px;height:56px;line-height:56px;
                            text-align:center;
                            font-size:28px;font-weight:800;
                            color:#c4b5fd;
                            background:linear-gradient(160deg,rgba(124,58,237,0.1),rgba(124,58,237,0.04));
                            border:1px solid rgba(139,92,246,0.25);
                            border-radius:12px;
                            margin:0 4px;
                            font-family:'Courier New',monospace;
                            position:relative;
                            animation:digitGlow 4s ease-in-out infinite ${(i * 0.15).toFixed(2)}s;
                          ">${d}</span>`).join("")}
                        </div>

                        <p style="
                          margin:16px 0 0;font-size:11px;color:#3d3558;
                        ">Expires in ${OTP_VALIDITY_MINUTES} minutes</p>
                      </div>
                    </div>

                    <!-- Timer bar -->
                    <div style="
                      height:3px;background:rgba(255,255,255,0.04);
                      border-radius:2px;margin-bottom:28px;overflow:hidden;
                      position:relative;z-index:1;
                    ">
                      <div style="
                        height:100%;width:100%;border-radius:2px;
                        background:linear-gradient(90deg,#7c3aed,#06b6d4);
                        animation:timerDrain ${OTP_VALIDITY_MINUTES * 60}s linear forwards;
                      "></div>
                    </div>

                    <!-- Note -->
                    <p style="
                      margin:0;font-size:12.5px;color:#3d3558;line-height:1.7;
                      position:relative;z-index:1;
                      padding-left:14px;
                      border-left:2px solid rgba(167,139,250,0.12);
                    ">
                      Didn't sign up? No worries — just ignore this email and nothing will happen.
                    </p>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <!-- Three decorative dots -->
              <div style="margin-bottom:10px;">
                <span style="display:inline-block;width:4px;height:4px;border-radius:50%;background:rgba(167,139,250,0.2);margin:0 3px;"></span>
                <span style="display:inline-block;width:4px;height:4px;border-radius:50%;background:rgba(167,139,250,0.2);margin:0 3px;"></span>
                <span style="display:inline-block;width:4px;height:4px;border-radius:50%;background:rgba(167,139,250,0.2);margin:0 3px;"></span>
              </div>
              <p style="margin:0;font-size:10.5px;color:#2a2440;line-height:1.8;">
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