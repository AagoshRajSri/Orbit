// In-memory OTP storage for development
// In production, use Redis or a database
const otpStore = new Map();

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const storeOTP = (email, otp) => {
  // OTP valid for 5 minutes
  const expiry = Date.now() + 5 * 60 * 1000;
  otpStore.set(email, { otp, expiry });
  console.log(`[DEV] OTP stored for ${email} (valid for 5 mins)`);
};

export const verifyOTP = (email, otp) => {
  const stored = otpStore.get(email);
  if (!stored) return false;
  if (Date.now() > stored.expiry) {
    otpStore.delete(email);
    return false;
  }
  return stored.otp === otp;
};

export const clearOTP = (email) => {
  otpStore.delete(email);
};
