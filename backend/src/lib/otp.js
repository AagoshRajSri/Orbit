import OTP from "../models/otp.model.js";

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const storeOTP = async (email, otp) => {
  await OTP.deleteMany({ email });
  await OTP.create({ email, otp });
  console.log(`[Auth] OTP generated for user metadata flow`);
};

export const verifyOTP = async (email, otp) => {
  const record = await OTP.findOne({ email });
  if (!record) return false;
  if (record.otp === otp) {
    await OTP.deleteMany({ email });
    return true;
  }
  return false;
};

export const clearOTP = async (email) => {
  await OTP.deleteMany({ email });
};
