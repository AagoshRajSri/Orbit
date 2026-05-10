import crypto from "crypto";
import OTP from "../models/otp.model.js";

import crypto from "crypto";

export const generateOTP = () => {
  return crypto.randomInt(100000, 1000000).toString();
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
