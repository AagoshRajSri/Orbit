import React, { useState, useEffect, useRef } from "react";
import { 
  Shield, 
  Copy, 
  Check, 
  QrCode, 
  FileText, 
  AlertTriangle, 
  Smartphone, 
  Trash2, 
  Lock, 
  Unlock, 
  ArrowRight,
  Eye,
  EyeOff,
  RefreshCw,
  Info
} from "lucide-react";

// Simplified BIP39 English Word List for autocomplete (contains common/representative words to keep the bundle size small)
const BIP39_WORDS = [
  "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract", "absurd", "abuse", "access", "accident", 
  "account", "accuse", "achieve", "acid", "acoustic", "acquire", "across", "act", "action", "actor", "actress", "actual", 
  "adapt", "add", "addict", "address", "adjust", "admit", "adult", "advance", "advice", "advise", "aerobic", "affair", 
  "afford", "afraid", "again", "age", "agent", "agree", "ahead", "aim", "air", "airport", "aisle", "alarm", "album", 
  "alcohol", "alert", "alien", "all", "alley", "allow", "almost", "alone", "alpha", "already", "also", "alter", 
  "always", "amateur", "amazing", "among", "amount", "amuse", "analyst", "anchor", "ancient", "anger", "angle", "angry", 
  "animal", "ankle", "announce", "annual", "another", "answer", "antenna", "antique", "anxiety", "any", "apart", "apology", 
  "appear", "apple", "approve", "april", "arch", "arctic", "area", "arena", "argue", "arm", "armed", "armor", "army", 
  "around", "arrange", "arrest", "arrive", "arrow", "art", "artefact", "artist", "artwork", "ask", "aspect", "assault", 
  "asset", "assist", "assume", "asthma", "athlete", "atom", "attack", "attend", "attitude", "attract", "uncle", "under", 
  "uncover", "unfold", "unhappy", "uniform", "unique", "unit", "universe", "unknown", "unlock", "until", "unusual", "unveil", 
  "update", "upgrade", "uphold", "upon", "upper", "upset", "urban", "urge", "usage", "use", "used", "useful", "useless", 
  "usual", "utility", "vacant", "vacuum", "vague", "valid", "valley", "valve", "van", "vanish", "vapor", "various", "vast", 
  "vault", "vector", "vegetable", "vehicle", "velvet", "vendor", "venture", "venue", "verb", "verify", "version", "very", 
  "vessel", "veteran", "viable", "vibrant", "vicious", "victory", "video", "view", "village", "vintage", "violin", "virtual", 
  "virus", "visa", "visit", "visual", "vital", "vivid", "vocal", "voice", "void", "volcano", "volume", "vote", "voyage", 
  "planet", "lemon", "guitar", "orbit", "shadow", "coffee", "tunnel", "crystal", "mango", "velvet", "oxygen", "drift"
];

// Placeholder Example Phrase
const PLACEHOLDER_PHRASE = "planet lemon guitar orbit shadow coffee tunnel crystal mango velvet oxygen drift";

export const SecurityRecoveryManager = ({ 
  mode = "locked-history-interstitial", // "onboarding-generate", "onboarding-verify", "locked-history-interstitial", "recovery-entry", "linked-devices"
  onComplete,
  onCancel 
}) => {
  const [currentMode, setCurrentMode] = useState(mode);
  
  // Localized state for generated recovery phrase (BIP39 12 words)
  const [generatedPhrase, setGeneratedPhrase] = useState([]);
  const [copied, setCopied] = useState(false);
  const [verificationAnswers, setVerificationAnswers] = useState({ word1: "", word2: "", word3: "" });
  const [verificationIndices, setVerificationIndices] = useState([2, 7, 10]); // e.g. Word 3, 8, 11 (0-indexed: 2, 7, 10)
  
  // Localized state for recovery entry
  const [enteredWords, setEnteredWords] = useState(Array(12).fill(""));
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState(Array(12).fill([]));
  const [activeInputIndex, setActiveInputIndex] = useState(null);
  
  // Devices state
  const [devices, setDevices] = useState([
    { id: "1", name: "iPhone 15 Pro", location: "San Francisco, CA", lastActive: "Active Now", isCurrent: true },
    { id: "2", name: "MacBook Pro M3", location: "San Francisco, CA", lastActive: "2 hours ago", isCurrent: false },
    { id: "3", name: "Windows Desktop PC", location: "Seattle, WA", lastActive: "May 15, 2026", isCurrent: false }
  ]);
  
  // QR Linking state
  const [qrStep, setQrStep] = useState("display"); // "display", "verifying", "success"
  const [sasCode, setSasCode] = useState("8492");
  
  // Clipboard cleanup timer
  const clipboardTimerRef = useRef(null);

  useEffect(() => {
    // Generate a secure mock recovery phrase if in generation mode
    if (currentMode === "onboarding-generate" && generatedPhrase.length === 0) {
      generateNewPhrase();
    }
    return () => {
      if (clipboardTimerRef.current) clearTimeout(clipboardTimerRef.current);
    };
  }, [currentMode]);

  const generateNewPhrase = () => {
    const randomWords = [];
    for (let i = 0; i < 12; i++) {
      const idx = Math.floor(Math.random() * BIP39_WORDS.length);
      randomWords.push(BIP39_WORDS[idx]);
    }
    setGeneratedPhrase(randomWords);
  };

  const handleCopyToClipboard = () => {
    const fullText = generatedPhrase.join(" ");
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    
    // Automatically clear clipboard after 60 seconds for security
    if (clipboardTimerRef.current) clearTimeout(clipboardTimerRef.current);
    clipboardTimerRef.current = setTimeout(() => {
      navigator.clipboard.writeText("");
      setCopied(false);
    }, 60000);
    
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerificationSubmit = (e) => {
    e.preventDefault();
    const ans1 = verificationAnswers.word1.trim().toLowerCase();
    const ans2 = verificationAnswers.word2.trim().toLowerCase();
    const ans3 = verificationAnswers.word3.trim().toLowerCase();

    const expected1 = generatedPhrase[verificationIndices[0]];
    const expected2 = generatedPhrase[verificationIndices[1]];
    const expected3 = generatedPhrase[verificationIndices[2]];

    if (ans1 === expected1 && ans2 === expected2 && ans3 === expected3) {
      if (onComplete) onComplete(generatedPhrase.join(" "));
    } else {
      alert("Verification failed. Please check the spelling of your recovery words.");
    }
  };

  const handleWordInput = (index, value) => {
    // If user pasted a full sentence, distribute it across all inputs
    if (value.includes(" ") || value.includes("\n")) {
      const words = value.trim().split(/[\s,]+/);
      const newWords = [...enteredWords];
      for (let i = 0; i < 12; i++) {
        if (words[i]) newWords[i] = words[i].toLowerCase().replace(/[^a-z]/g, "");
      }
      setEnteredWords(newWords);
      // Autofocus next empty or the last input
      const nextEmpty = newWords.findIndex((w) => w === "");
      const focusIndex = nextEmpty !== -1 ? nextEmpty : 11;
      const element = document.getElementById(`word-input-${focusIndex}`);
      if (element) element.focus();
      return;
    }

    const cleanVal = value.toLowerCase().replace(/[^a-z]/g, "");
    const newWords = [...enteredWords];
    newWords[index] = cleanVal;
    setEnteredWords(newWords);

    // Provide autocomplete suggestions
    if (cleanVal.length >= 2) {
      const matches = BIP39_WORDS.filter(w => w.startsWith(cleanVal)).slice(0, 4);
      const newSuggestions = [...autocompleteSuggestions];
      newSuggestions[index] = matches;
      setAutocompleteSuggestions(newSuggestions);
    } else {
      const newSuggestions = [...autocompleteSuggestions];
      newSuggestions[index] = [];
      setAutocompleteSuggestions(newSuggestions);
    }
  };

  const selectSuggestion = (index, word) => {
    const newWords = [...enteredWords];
    newWords[index] = word;
    setEnteredWords(newWords);

    const newSuggestions = [...autocompleteSuggestions];
    newSuggestions[index] = [];
    setAutocompleteSuggestions(newSuggestions);

    // Move focus to next input field
    if (index < 11) {
      const nextInput = document.getElementById(`word-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && enteredWords[index] === "" && index > 0) {
      const prevInput = document.getElementById(`word-input-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
        const newWords = [...enteredWords];
        newWords[index - 1] = "";
        setEnteredWords(newWords);
      }
    }
  };

  const handleRecoverySubmit = (e) => {
    e.preventDefault();
    const incomplete = enteredWords.some(w => w === "");
    if (incomplete) {
      alert("Please fill out all 12 words of your recovery phrase.");
      return;
    }
    
    // Check if words exist in wordlist
    const invalidWords = enteredWords.filter(w => !BIP39_WORDS.includes(w));
    if (invalidWords.length > 0) {
      alert(`The following words are not valid recovery words: ${invalidWords.join(", ")}`);
      return;
    }

    if (onComplete) onComplete(enteredWords.join(" "));
  };

  const handleRevokeDevice = (id) => {
    if (window.confirm("Are you sure you want to revoke trust for this device? It will be logged out immediately.")) {
      setDevices(devices.filter(d => d.id !== id));
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-base-100 border border-base-300 rounded-3xl overflow-hidden shadow-2xl p-6 lg:p-8 text-base-content font-sans transition-all duration-300">
      
      {/* ── INTERSTITIAL: ENC HISTORY LOCKED ────────────────────────────────── */}
      {currentMode === "locked-history-interstitial" && (
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 animate-pulse">
            <Lock className="size-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Encrypted History Locked</h2>
            <p className="text-sm text-base-content/65 mt-2 max-w-sm mx-auto leading-relaxed">
              This device is not yet trusted. Orbit utilizes end-to-end encryption to protect your privacy. To decrypt and restore your historical conversations, authorize this session.
            </p>
          </div>

          <div className="w-full space-y-3 pt-4">
            <button 
              onClick={() => setCurrentMode("qr-linking")}
              className="w-full py-3.5 px-4 bg-primary text-primary-content hover:bg-primary/95 transition-all duration-200 rounded-xl font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-primary/20"
            >
              <QrCode className="size-5" />
              Scan QR from Trusted Device
            </button>
            <button 
              onClick={() => setCurrentMode("recovery-entry")}
              className="w-full py-3.5 px-4 bg-base-200 border border-base-300 hover:bg-base-300/80 text-white transition-all duration-200 rounded-xl font-semibold flex items-center justify-center gap-2.5"
            >
              <FileText className="size-5" />
              Enter 12-Word Recovery Phrase
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2 text-xs text-base-content/40">
            <Shield className="size-3.5" />
            Zero-Knowledge Cryptographic Lock
          </div>
        </div>
      )}

      {/* ── ONBOARDING: GENERATE 12 WORDS ───────────────────────────────────── */}
      {currentMode === "onboarding-generate" && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Shield className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Security Key Mnemonic</h2>
              <p className="text-xs text-base-content/65">Save your 12-word account recovery phrase securely.</p>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4 flex gap-3 text-left">
            <AlertTriangle className="size-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-bold text-rose-500">CRITICAL BACKUP REQUIRED</h3>
              <p className="text-xs text-base-content/65 mt-1 leading-relaxed">
                This recovery phrase is the only way to restore your encrypted history on a new device. Orbit cannot recover it for you.
              </p>
            </div>
          </div>

          {/* CSS Watermarked 12-Word Grid */}
          <div className="relative rounded-2xl border border-base-300 bg-base-200/30 overflow-hidden p-5">
            {/* Screenshot Protection Cues */}
            <div className="absolute inset-0 bg-diagonal-watermark pointer-events-none opacity-5" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 relative z-10">
              {generatedPhrase.map((word, idx) => (
                <div key={idx} className="flex items-center gap-2.5 bg-base-200 border border-base-300/60 rounded-xl px-3.5 py-2.5 select-none">
                  <span className="text-xs font-bold text-base-content/30 w-4">{idx + 1}</span>
                  <span className="text-sm font-semibold text-white tracking-wide">{word}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button 
              onClick={handleCopyToClipboard}
              className="flex-1 py-3 px-4 bg-base-200 hover:bg-base-300 border border-base-300 text-white transition-all rounded-xl font-bold flex items-center justify-center gap-2"
            >
              {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
              {copied ? "Copied Mnemonic" : "Copy to Clipboard"}
            </button>
            <button 
              onClick={() => setCurrentMode("onboarding-verify")}
              className="flex-1 py-3 px-4 bg-primary text-primary-content hover:bg-primary/95 transition-all rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              Verify Backup Mnemonic
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── ONBOARDING: VERIFY WORDS ────────────────────────────────────────── */}
      {currentMode === "onboarding-verify" && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setCurrentMode("onboarding-generate")}
              className="text-xs text-base-content/65 hover:text-white transition-colors"
            >
              ← Back
            </button>
            <h2 className="text-lg font-bold text-white">Confirm Verification</h2>
          </div>

          <p className="text-sm text-base-content/65 leading-relaxed">
            Prove you have securely stored your recovery phrase by entering the requested words below.
          </p>

          <form onSubmit={handleVerificationSubmit} className="space-y-5">
            {verificationIndices.map((origIdx, idx) => (
              <div key={idx} className="space-y-2">
                <label className="block text-xs font-bold text-base-content/60 tracking-wider">
                  ENTER WORD #{origIdx + 1}
                </label>
                <input 
                  type="text" 
                  value={idx === 0 ? verificationAnswers.word1 : idx === 1 ? verificationAnswers.word2 : verificationAnswers.word3}
                  onChange={(e) => {
                    const clean = e.target.value.toLowerCase().replace(/[^a-z]/g, "");
                    if (idx === 0) setVerificationAnswers({ ...verificationAnswers, word1: clean });
                    if (idx === 1) setVerificationAnswers({ ...verificationAnswers, word2: clean });
                    if (idx === 2) setVerificationAnswers({ ...verificationAnswers, word3: clean });
                  }}
                  required
                  placeholder={`Word #${origIdx + 1}`}
                  className="w-full bg-base-200 border border-base-300 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-all"
                />
              </div>
            ))}

            <button 
              type="submit" 
              className="w-full py-3.5 px-4 bg-primary text-primary-content hover:bg-primary/95 transition-all rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              Complete Safe Registration
            </button>
          </form>
        </div>
      )}

      {/* ── RECOVERY ENTRY GRID (BIP39 WITH AUTOCOMPLETE) ───────────────────── */}
      {currentMode === "recovery-entry" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setCurrentMode("locked-history-interstitial")}
                className="text-xs text-base-content/65 hover:text-white transition-colors"
              >
                ← Back
              </button>
              <h2 className="text-lg font-bold text-white">Enter Recovery Phrase</h2>
            </div>
            <Info className="size-4.5 text-base-content/40 cursor-help" title="Input must be exactly 12 space-separated BIP39 words." />
          </div>

          <form onSubmit={handleRecoverySubmit} className="space-y-6">
            {/* Interactive Grid Input */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {enteredWords.map((word, idx) => (
                <div key={idx} className="relative">
                  <label className="absolute left-3 top-2.5 text-[10px] font-bold text-base-content/30 select-none">
                    {idx + 1}
                  </label>
                  <input 
                    id={`word-input-${idx}`}
                    type="text" 
                    value={word}
                    onChange={(e) => handleWordInput(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onFocus={() => setActiveInputIndex(idx)}
                    onBlur={() => setTimeout(() => setActiveInputIndex(null), 200)}
                    placeholder={idx === 0 ? "planet" : idx === 1 ? "lemon" : ""}
                    className={`w-full bg-base-200 border rounded-xl pl-8 pr-3 py-3 text-sm text-white focus:outline-none focus:border-primary transition-all tracking-wide ${
                      word && !BIP39_WORDS.includes(word) ? "border-rose-500/50 focus:border-rose-500" : "border-base-300"
                    }`}
                  />
                  {/* Autocomplete Popup */}
                  {activeInputIndex === idx && autocompleteSuggestions[idx].length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-base-300 border border-base-300 rounded-xl overflow-hidden shadow-2xl z-50">
                      {autocompleteSuggestions[idx].map((suggestion, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          onMouseDown={() => selectSuggestion(idx, suggestion)}
                          className="w-full text-left px-3 py-2 text-xs text-white hover:bg-primary hover:text-primary-content transition-colors font-semibold"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Verification Checklist */}
            <div className="bg-base-200/50 border border-base-300/60 rounded-2xl p-4 space-y-2 text-xs">
              <h3 className="font-bold text-base-content/85">VALIDATION CHECKS</h3>
              <ul className="space-y-1.5 text-base-content/65">
                <li className="flex items-center gap-2">
                  <span className={enteredWords.every(w => w !== "") ? "text-green-500 font-bold" : "text-base-content/30"}>✓</span>
                  All 12 words entered
                </li>
                <li className="flex items-center gap-2">
                  <span className={enteredWords.every(w => w === "" || BIP39_WORDS.includes(w)) ? "text-green-500 font-bold" : "text-rose-500 font-bold"}>✓</span>
                  No spelling/typo errors
                </li>
              </ul>
            </div>

            <button 
              type="submit"
              className="w-full py-3.5 px-4 bg-primary text-primary-content hover:bg-primary/95 transition-all rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              Verify and Decrypt History
            </button>
          </form>
        </div>
      )}

      {/* ── QR CODE LINKING FLOW ────────────────────────────────────────────── */}
      {currentMode === "qr-linking" && (
        <div className="space-y-6 flex flex-col items-center text-center">
          <div className="w-full flex items-center justify-between">
            <button 
              onClick={() => setCurrentMode("locked-history-interstitial")}
              className="text-xs text-base-content/65 hover:text-white transition-colors"
            >
              ← Back
            </button>
            <h2 className="text-lg font-bold text-white">Device Link Activation</h2>
            <div className="w-6" /> {/* Spacer */}
          </div>

          <p className="text-sm text-base-content/65 leading-relaxed max-w-sm">
            Scan the QR code below from an active, already-trusted device running Orbit to securely sync keys.
          </p>

          {/* QR Scan Sandbox UI */}
          <div className="relative rounded-2xl border border-base-300 bg-white p-4 flex items-center justify-center shadow-xl">
            <div className="w-44 h-44 bg-slate-100 rounded-xl flex items-center justify-center border border-dashed border-slate-300">
              <QrCode className="size-20 text-slate-800" />
            </div>
          </div>

          {/* SAS Security PIN */}
          <div className="bg-base-200 border border-base-300 rounded-2xl p-4 w-full">
            <span className="text-[10px] font-bold text-base-content/50 tracking-widest block mb-1">
              SHORT AUTHENTICATION STRING (SAS)
            </span>
            <span className="text-2xl font-black tracking-[8px] text-white">
              {sasCode}
            </span>
            <p className="text-xs text-base-content/40 mt-1 max-w-xs mx-auto leading-relaxed">
              Verify that the security pin above matches exactly on both devices to prevent intercept attacks.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-base-content/60 bg-primary/10 border border-primary/20 rounded-xl px-4 py-2">
            <Smartphone className="size-4 text-primary" />
            Waiting for secure peer authorization...
          </div>
        </div>
      )}

      {/* ── LINKED DEVICES DASHBOARD ────────────────────────────────────────── */}
      {currentMode === "linked-devices" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Device Security Registry</h2>
              <p className="text-xs text-base-content/65 mt-0.5">Manage and revoke trust for linked clients.</p>
            </div>
            <Shield className="size-5 text-primary" />
          </div>

          <div className="space-y-3.5">
            {devices.map((device) => (
              <div 
                key={device.id} 
                className="flex items-center justify-between bg-base-200 border border-base-300/80 rounded-2xl p-4 transition-all hover:border-base-300"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${device.isCurrent ? "bg-primary/10 text-primary" : "bg-base-300 text-base-content/60"}`}>
                    <Smartphone className="size-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      {device.name}
                      {device.isCurrent && (
                        <span className="bg-primary/10 text-primary text-[9px] font-bold px-2 py-0.5 rounded-full border border-primary/30">
                          THIS DEVICE
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-base-content/60 mt-0.5">
                      {device.location} • <span className="opacity-80">{device.lastActive}</span>
                    </p>
                  </div>
                </div>

                {!device.isCurrent && (
                  <button 
                    onClick={() => handleRevokeDevice(device.id)}
                    className="w-8 h-8 rounded-lg hover:bg-rose-500/10 hover:text-rose-500 text-base-content/40 flex items-center justify-center transition-colors"
                    title="Revoke trust"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              onClick={() => setCurrentMode("onboarding-generate")}
              className="flex-1 py-3 px-4 bg-base-200 hover:bg-base-300 border border-base-300 text-white transition-all rounded-xl font-bold flex items-center justify-center gap-2"
            >
              Export Recovery Phrase
            </button>
            <button 
              onClick={() => setCurrentMode("qr-linking")}
              className="flex-1 py-3 px-4 bg-primary text-primary-content hover:bg-primary/95 transition-all rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              Link New Device
            </button>
          </div>
        </div>
      )}
      
    </div>
  );
};
