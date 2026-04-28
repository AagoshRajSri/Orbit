import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Mail, ArrowRight, RefreshCw, Loader2 } from "lucide-react";

const VerifyEmailPage = () => {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  
  const { verifyEmail, resendVerification, authUser } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get email from location state or authUser
  const email = location.state?.email || authUser?.email;

  // If no email is available and not logged in, redirect to login
  if (!email && !authUser) return <Navigate to="/login" />;
  
  // If already verified, go home
  if (authUser?.isEmailVerified) return <Navigate to="/" />;

  const handleChange = (index, value) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Move to next input
    if (value && index < 5) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const otp = code.join("");
    if (otp.length !== 6) return;

    setIsSubmitting(true);
    const success = await verifyEmail(email, otp);
    setIsSubmitting(false);
    
    if (success) {
      navigate("/");
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    await resendVerification(email);
    setIsResending(false);
  };

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (code.every(digit => digit !== "")) {
      handleSubmit();
    }
  }, [code]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080611] p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 mb-6">
            <ShieldCheck className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Verify Identity</h1>
          <p className="text-gray-400 text-sm">
            We've sent a 6-digit transmission to <br />
            <span className="text-purple-300 font-medium">{email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex justify-between gap-2">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 bg-white/5 border border-white/10 rounded-xl text-center text-2xl font-bold text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || code.some(d => !d)}
            className="w-full h-14 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/20 group"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Initiate Sequence
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={handleResend}
            disabled={isResending}
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-purple-400 transition-colors disabled:opacity-50"
          >
            {isResending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Resend transmission
          </button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-gray-600">
          <div className="w-1 h-1 rounded-full bg-gray-600" />
          Secure Encryption Active
          <div className="w-1 h-1 rounded-full bg-gray-600" />
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmailPage;
