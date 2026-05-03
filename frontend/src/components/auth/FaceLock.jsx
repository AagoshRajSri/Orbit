/**
 * FaceLock Component
 * ────────────────────────────────────────────────
 * Biometric authentication using WebAuthn Face Recognition
 * Integrates with backend FaceLock API
 */

import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";

/**
 * FaceLock Component - Biometric face recognition authentication
 */
export default function FaceLock() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const { login } = useAuthStore();

  const [mode, setMode] = useState("register"); // "register" or "verify"
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [captureCount, setCaptureCount] = useState(0);
  const maxCaptures = 5;

  /**
   * Initialize camera stream
   */
  const initializeCamera = async () => {
    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (err) {
      setError(
        "Unable to access camera. Please check permissions and try again.",
      );
      console.error("Camera error:", err);
    }
  };

  /**
   * Stop camera stream
   */
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  /**
   * Capture face image and send to backend
   */
  const captureFace = async () => {
    if (!videoRef.current || !canvasRef.current) {
      setError("Camera not initialized");
      return;
    }

    try {
      setIsProcessing(true);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      // Draw video frame to canvas
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL("image/jpeg");

      if (mode === "register") {
        // Register new face
        const response = await fetch("/api/auth/facelock/register/challenge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            faceImage: imageData,
            captureSequence: captureCount + 1,
          }),
        });

        if (!response.ok) throw new Error("Failed to process face capture");

        const data = await response.json();
        const newCount = captureCount + 1;
        setCaptureCount(newCount);

        if (newCount >= maxCaptures) {
          // Complete registration
          await completeRegistration(imageData);
        } else {
          setSuccess(
            `Face captured (${newCount}/${maxCaptures}). Ready for next capture.`,
          );
        }
      } else {
        // Verify face
        const response = await fetch("/api/auth/facelock/login/challenge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ faceImage: imageData }),
        });

        const data = await response.json();

        if (data.verified) {
          setSuccess("Face verified successfully!");
          stopCamera();

          // Attempt login
          const loginResponse = await fetch("/api/auth/facelock/login/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ challengeId: data.challengeId }),
          });

          const loginData = await loginResponse.json();
          if (loginData.token) {
            await login(loginData.token);
            navigate("/");
          }
        } else {
          setError("Face not recognized. Try again.");
        }
      }
    } catch (err) {
      setError(err.message || "Failed to process face capture");
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Complete face registration
   */
  const completeRegistration = async (imageData) => {
    try {
      const response = await fetch("/api/auth/facelock/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faceImage: imageData }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Face registration completed successfully!");
        stopCamera();
        setTimeout(() => navigate("/login"), 2000);
      } else {
        throw new Error(data.message || "Registration failed");
      }
    } catch (err) {
      setError(err.message || "Failed to complete registration");
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-primary)",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(135deg, 
            rgba(0, 212, 255, 0.05) 0%, 
            rgba(198, 160, 110, 0.03) 50%,
            rgba(0, 212, 255, 0.05) 100%)`,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "90%",
          maxWidth: 600,
          backgroundColor: "var(--bg-elevation-2)",
          border: "1px solid var(--border-default)",
          borderRadius: "16px",
          padding: "40px",
          boxShadow: "var(--card-shadow)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1
            style={{
              color: "var(--text-primary)",
              fontSize: "28px",
              fontWeight: 700,
              margin: "0 0 12px 0",
            }}
          >
            🔐 FaceLock Authentication
          </h1>
          <p style={{ color: "var(--text-secondary)", margin: 0 }}>
            {mode === "register"
              ? "Enroll your face for secure login"
              : "Verify your face to login"}
          </p>
        </div>

        {/* Camera Feed */}
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "4/3",
            borderRadius: "12px",
            overflow: "hidden",
            backgroundColor: "var(--bg-elevation-1)",
            border: "2px solid var(--accent-primary)",
            marginBottom: "24px",
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          <canvas
            ref={canvasRef}
            style={{ display: "none" }}
            width={1280}
            height={720}
          />

          {/* Crosshair Overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                width: "200px",
                height: "280px",
                border: "3px solid var(--accent-primary)",
                borderRadius: "20px",
                boxShadow:
                  "inset 0 0 20px rgba(0, 212, 255, 0.3), 0 0 20px rgba(0, 212, 255, 0.2)",
              }}
            />
          </div>

          {/* Status Indicator */}
          {cameraActive && (
            <div
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                padding: "8px 12px",
                borderRadius: "20px",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#00ff88",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
              <span style={{ color: "var(--text-success)", fontSize: "12px" }}>
                Recording
              </span>
            </div>
          )}
        </div>

        {/* Capture Progress */}
        {mode === "register" && captureCount > 0 && (
          <div
            style={{
              marginBottom: "24px",
              padding: "12px",
              backgroundColor: "var(--bg-elevation-1)",
              borderRadius: "8px",
              border: "1px solid var(--border-default)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <span
                style={{ color: "var(--text-secondary)", fontSize: "14px" }}
              >
                Captures Progress
              </span>
              <span style={{ color: "var(--accent-primary)", fontWeight: 600 }}>
                {captureCount}/{maxCaptures}
              </span>
            </div>
            <div
              style={{
                width: "100%",
                height: "6px",
                backgroundColor: "var(--bg-elevation-2)",
                borderRadius: "3px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(captureCount / maxCaptures) * 100}%`,
                  backgroundColor: "var(--accent-primary)",
                  transition: "width 300ms ease",
                  boxShadow: "var(--shadows-glow-primary)",
                }}
              />
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "rgba(255, 45, 120, 0.1)",
              border: "1px solid var(--border-error)",
              borderRadius: "8px",
              color: "var(--text-error)",
              marginBottom: "16px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "rgba(0, 255, 136, 0.1)",
              border: "1px solid var(--border-success)",
              borderRadius: "8px",
              color: "var(--text-success)",
              marginBottom: "16px",
              fontSize: "14px",
            }}
          >
            {success}
          </div>
        )}

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          {!cameraActive ? (
            <button
              onClick={initializeCamera}
              disabled={isProcessing}
              style={{
                flex: 1,
                padding: "12px 16px",
                backgroundColor: "var(--button-bg)",
                color: "var(--button-text)",
                border: "1px solid var(--button-border)",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 600,
                transition: "all 200ms ease",
                opacity: isProcessing ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isProcessing)
                  e.target.style.backgroundColor = "var(--button-bg-hover)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "var(--button-bg)";
              }}
            >
              Start Camera
            </button>
          ) : (
            <>
              <button
                onClick={captureFace}
                disabled={isProcessing}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  backgroundColor: "rgba(0, 212, 255, 0.15)",
                  color: "var(--accent-primary)",
                  border: "1px solid rgba(0, 212, 255, 0.3)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                  transition: "all 200ms ease",
                  opacity: isProcessing ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isProcessing)
                    e.target.style.backgroundColor = "rgba(0, 212, 255, 0.25)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "rgba(0, 212, 255, 0.15)";
                }}
              >
                {isProcessing ? "Processing..." : "Capture Face"}
              </button>
              <button
                onClick={stopCamera}
                disabled={isProcessing}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  backgroundColor: "var(--button-bg)",
                  color: "var(--button-text)",
                  border: "1px solid var(--button-border)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                  transition: "all 200ms ease",
                  opacity: isProcessing ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isProcessing)
                    e.target.style.backgroundColor = "var(--button-bg-hover)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "var(--button-bg)";
                }}
              >
                Stop
              </button>
            </>
          )}
        </div>

        {/* Mode Toggle */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            padding: "12px",
            backgroundColor: "var(--bg-elevation-1)",
            borderRadius: "8px",
            border: "1px solid var(--border-default)",
          }}
        >
          {["register", "verify"].map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setCaptureCount(0);
                setError("");
                setSuccess("");
              }}
              disabled={cameraActive || isProcessing}
              style={{
                flex: 1,
                padding: "8px 12px",
                backgroundColor:
                  mode === m ? "rgba(0, 212, 255, 0.15)" : "transparent",
                color:
                  mode === m
                    ? "var(--accent-primary)"
                    : "var(--text-secondary)",
                border:
                  mode === m
                    ? "1px solid rgba(0, 212, 255, 0.3)"
                    : "1px solid var(--border-default)",
                borderRadius: "6px",
                cursor:
                  cameraActive || isProcessing ? "not-allowed" : "pointer",
                fontSize: "12px",
                fontWeight: 600,
                textTransform: "uppercase",
                transition: "all 200ms ease",
                opacity: cameraActive || isProcessing ? 0.5 : 1,
              }}
            >
              {m === "register" ? "📝 Register" : "✓ Verify"}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: "20px",
            padding: "16px",
            backgroundColor: "var(--bg-elevation-1)",
            borderRadius: "8px",
            border: "1px solid var(--border-default)",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "var(--text-tertiary)",
              fontSize: "12px",
              lineHeight: 1.5,
            }}
          >
            💡 Make sure you're in a well-lit area and your face is clearly
            visible. The system uses advanced face recognition to ensure secure
            authentication.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
