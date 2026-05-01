import twilio from "twilio";

let client;

export const initSMSClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (accountSid && authToken) {
    try {
      client = twilio(accountSid, authToken);
      console.log("[SMS] Twilio client initialized ✓");
    } catch (error) {
      console.error("[SMS] Failed to init Twilio:", error.message);
    }
  } else {
    console.warn("\n[SMS] ⚠️  No TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN found in .env.");
    console.warn("[SMS] Falling back to developer console mock mode for SMS.\n");
  }
};

/**
 * Send an OTP via SMS
 * @param {string} to   - Recipient phone number (e.g., +1234567890)
 * @param {string} otp  - The 6-digit OTP
 * @returns {boolean}   - Success status
 */
export const sendSMSOTP = async (to, otp) => {
  if (!to) {
    console.error("[SMS] No recipient phone number provided.");
    return false;
  }

  // Ensure it starts with + if missing (basic normalization)
  let formattedNumber = to.trim();
  if (!formattedNumber.startsWith("+")) {
    formattedNumber = `+${formattedNumber}`; // Default assumes international format
  }

  const messageText = `Orbit Auth: Your verification code is ${otp}. It expires in 5 minutes. Do not share it with anyone.`;

  if (client && process.env.TWILIO_PHONE_NUMBER) {
    try {
      const message = await client.messages.create({
        body: messageText,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedNumber,
      });
      console.log(`[SMS] ✓ Sent SMS to ${formattedNumber} (SID: ${message.sid})`);
      return true;
    } catch (error) {
      console.error(`[SMS] Failed to send SMS to ${formattedNumber}:`, error.message);
      return false;
    }
  }

  // ── Mock Mode for Local Development ──
  console.log("\n───────────────────────────────────────────────────");
  console.log("  📱 VIEW YOUR TEST SMS TO " + formattedNumber + ":");
  console.log(`  👉 💬 [Orbit Auth]`);
  console.log(`      Your verification code is [REDACTED].`);
  console.log(`      It expires in 5 minutes. Do not share it.`);
  console.log("───────────────────────────────────────────────────\n");
  return true; // We pretend it succeeded so the frontend flow works
};
