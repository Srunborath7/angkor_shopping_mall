import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaEnvelope,
  FaPhone,
  FaKey,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaArrowLeft,
  FaTelegramPlane,
  FaShieldAlt,
  FaCheckCircle,
  FaRedo,
  FaCheck,
  FaTimes
} from "react-icons/fa";
import Swal from "sweetalert2";
import confetti from "canvas-confetti";
import {
  sendForgotPasswordEmailApi,
  verifyResetOtpEmailApi,
  resetPasswordEmailApi,
  sendResetOtpTelegramApi,
  verifyResetOtpTelegramApi,
  resetPasswordTelegramApi
} from "../../services/authService";
import "./style/ForgotPasswordPage.css";
import logo from "../../assets/logo.jpg";

function ForgotPassword() {
  const navigate = useNavigate();
  
  // State
  const [method, setMethod] = useState("email"); // "email" | "telegram"
  const [step, setStep] = useState(1); // 1: Input | 2: OTP | 3: New Password
  
  // Inputs
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  // Open Telegram Bot
  const openTelegramBot = () => {
    window.open("https://t.me/angkor_shopping_mall_bot", "_blank");
  };

  // Switch Recovery Method
  const handleMethodChange = (newMethod) => {
    if (step > 1) {
      Swal.fire({
        title: "Change Recovery Method?",
        text: "Switching methods will restart the verification process.",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, switch",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#10b981",
      }).then((result) => {
        if (result.isConfirmed) {
          setMethod(newMethod);
          setStep(1);
          setOtp("");
          setResetToken("");
        }
      });
    } else {
      setMethod(newMethod);
    }
  };

  // Password Strength Calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, text: "", color: "" };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 1, text: "Weak", color: "#ef4444" };
    if (score <= 3) return { score: 2, text: "Medium", color: "#f59e0b" };
    return { score: 3, text: "Strong", color: "#10b981" };
  };

  const strength = getPasswordStrength(newPassword);

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();

    if (method === "email") {
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail || !trimmedEmail.includes("@") || !trimmedEmail.includes(".")) {
        Swal.fire({
          icon: "warning",
          title: "Invalid Email",
          text: "Please enter a valid email address associated with your account.",
          confirmButtonColor: "#10b981"
        });
        return;
      }

      try {
        setLoading(true);
        const res = await sendForgotPasswordEmailApi(trimmedEmail);
        Swal.fire({
          icon: "success",
          title: "Verification Code Sent!",
          text: res?.message || `A 6-digit OTP code was sent to ${trimmedEmail}.`,
          confirmButtonColor: "#10b981"
        });
        setTimer(60); // 60s cooldown
        setStep(2);
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Email Not Found",
          text: err?.response?.data?.message || err?.message || "No account found with this email address.",
          confirmButtonColor: "#10b981"
        });
      } finally {
        setLoading(false);
      }
    } else {
      // Telegram method
      const trimmedPhone = phone.trim();
      if (!trimmedPhone || trimmedPhone.length < 8) {
        Swal.fire({
          icon: "warning",
          title: "Phone Required",
          text: "Please enter a valid phone number linked to your Telegram account.",
          confirmButtonColor: "#10b981"
        });
        return;
      }

      try {
        setLoading(true);
        const res = await sendResetOtpTelegramApi(trimmedPhone);
        Swal.fire({
          icon: "success",
          title: "OTP Dispatched",
          text: res?.message || "OTP code sent to your Telegram!",
          confirmButtonColor: "#10b981"
        });
        setTimer(60);
        setStep(2);
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Unable to Send OTP",
          text: err?.response?.data?.message || err?.message || "Could not send OTP. Ensure your Telegram bot is linked.",
          confirmButtonColor: "#10b981"
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length < 4) {
      Swal.fire({
        icon: "warning",
        title: "Enter OTP Code",
        text: "Please enter the 6-digit verification code you received.",
        confirmButtonColor: "#10b981"
      });
      return;
    }

    try {
      setLoading(true);
      let res;
      if (method === "email") {
        res = await verifyResetOtpEmailApi(email.trim().toLowerCase(), cleanOtp);
      } else {
        res = await verifyResetOtpTelegramApi(phone.trim(), cleanOtp);
      }

      const token = res?.data?.resetToken || res?.resetToken || res?.data?.token;
      if (!token) {
        throw new Error("Failed to receive reset authorization token.");
      }

      setResetToken(token);
      Swal.fire({
        icon: "success",
        title: "Code Verified!",
        text: "Your identity has been verified. You may now choose a new password.",
        timer: 1600,
        showConfirmButton: false
      });
      setStep(3);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Verification Failed",
        text: err?.response?.data?.message || err?.message || "Invalid or expired OTP code. Please check and try again.",
        confirmButtonColor: "#10b981"
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      Swal.fire({
        icon: "warning",
        title: "Password Too Short",
        text: "Password must be at least 6 characters long.",
        confirmButtonColor: "#10b981"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: "warning",
        title: "Password Mismatch",
        text: "The new password and confirmation password do not match.",
        confirmButtonColor: "#10b981"
      });
      return;
    }

    try {
      setLoading(true);
      let res;
      if (method === "email") {
        res = await resetPasswordEmailApi(resetToken, newPassword);
      } else {
        res = await resetPasswordTelegramApi(resetToken, newPassword);
      }

      // Trigger Confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (cErr) {}

      Swal.fire({
        icon: "success",
        title: "Password Changed!",
        text: res?.message || "Your password has been reset successfully. Please sign in with your new credentials.",
        confirmButtonColor: "#10b981",
        timer: 2500,
        showConfirmButton: true,
        confirmButtonText: "Sign In Now"
      }).then(() => {
        navigate("/auth/login");
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Reset Failed",
        text: err?.response?.data?.message || err?.message || "Unable to reset password. Please try the recovery flow again.",
        confirmButtonColor: "#10b981"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      {/* Left Split Panel (Desktop Branding) */}
      <div className="auth-split-left">
        <div className="auth-left-content">
          <div className="auth-logo-brand" onClick={() => navigate("/")}>
            <span className="auth-logo-icon">
              <img src={logo} alt="Angkor Shopping Mall Logo" />
            </span>
            <span className="auth-logo-text">Angkor Shopping Mall</span>
          </div>

          <h1 className="auth-left-heading">Fast & Secure Account Recovery</h1>
          <p className="auth-left-desc">
            Regain access to your shopping account with instant verification codes delivered straight to your email or Telegram.
          </p>

          <div className="auth-features-list">
            <div className="auth-feature-pill">
              <FaEnvelope className="feature-icon" />
              <span>Instant Email OTP Code Dispatch</span>
            </div>
            <div className="auth-feature-pill">
              <FaShieldAlt className="feature-icon" />
              <span>256-Bit SSL Encrypted Recovery</span>
            </div>
            <div className="auth-feature-pill">
              <FaCheckCircle className="feature-icon" />
              <span>Direct Telegram Bot Support</span>
            </div>
            <div className="auth-feature-pill">
              <FaRedo className="feature-icon" />
              <span>Instant Safe Password Reset</span>
            </div>
          </div>

          <div className="auth-stats-grid">
            <div className="auth-stat-item">
              <span className="auth-stat-number">50K+</span>
              <span className="auth-stat-label">Products</span>
            </div>
            <div className="auth-stat-item">
              <span className="auth-stat-number">120K+</span>
              <span className="auth-stat-label">Happy Users</span>
            </div>
            <div className="auth-stat-item">
              <span className="auth-stat-number">99%</span>
              <span className="auth-stat-label">Satisfaction</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Split Panel */}
      <div className="auth-split-right">
        {/* Mobile Hero Header */}
        <div className="auth-mobile-hero">
          <div className="auth-mobile-hero-orb orb-1" />
          <div className="auth-mobile-hero-orb orb-2" />
          <div className="auth-mobile-hero-content">
            <div className="auth-mobile-brand-pill" onClick={() => navigate("/")}>
              <img src={logo} alt="Angkor Shopping Mall" className="auth-mobile-brand-logo" />
              <div className="auth-mobile-brand-meta">
                <span className="auth-mobile-brand-name">Angkor Shopping Mall</span>
                <span className="auth-mobile-brand-badge">🔐 Account Recovery</span>
              </div>
            </div>
            <h2 className="auth-mobile-hero-title">Reset Password</h2>
            <p className="auth-mobile-hero-sub">Fast, secure verification via Email or Telegram</p>
          </div>
        </div>

        {/* Form Card */}
        <motion.div
          className="auth-form-card"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          {/* Back to Sign In */}
          <button
            type="button"
            className="auth-back-btn"
            onClick={() => navigate("/auth/login")}
          >
            <FaArrowLeft />
            <span>Back to Sign In</span>
          </button>

          {/* Stepper Progress Header */}
          <div className="auth-stepper-bar">
            <div className={`stepper-step ${step >= 1 ? "active" : ""} ${step > 1 ? "completed" : ""}`}>
              <div className="stepper-dot">
                {step > 1 ? <FaCheck style={{ fontSize: 10 }} /> : "1"}
              </div>
              <span>{method === "email" ? "Email" : "Phone"}</span>
            </div>
            <div className={`stepper-line ${step >= 2 ? "active" : ""}`} />
            <div className={`stepper-step ${step >= 2 ? "active" : ""} ${step > 2 ? "completed" : ""}`}>
              <div className="stepper-dot">
                {step > 2 ? <FaCheck style={{ fontSize: 10 }} /> : "2"}
              </div>
              <span>OTP</span>
            </div>
            <div className={`stepper-line ${step >= 3 ? "active" : ""}`} />
            <div className={`stepper-step ${step >= 3 ? "active" : ""}`}>
              <div className="stepper-dot">3</div>
              <span>Reset</span>
            </div>
          </div>

          {/* Method Selector Tabs (Only active in step 1) */}
          {step === 1 && (
            <div className="auth-method-tabs">
              <button
                type="button"
                className={`auth-method-tab ${method === "email" ? "active" : ""}`}
                onClick={() => handleMethodChange("email")}
              >
                <FaEnvelope className="tab-icon" />
                <span>Email Recovery</span>
              </button>
              <button
                type="button"
                className={`auth-method-tab ${method === "telegram" ? "active" : ""}`}
                onClick={() => handleMethodChange("telegram")}
              >
                <FaTelegramPlane className="tab-icon" />
                <span>Telegram Bot</span>
              </button>
            </div>
          )}

          {/* STEP 1: Identification */}
          {step === 1 && (
            <AnimatePresence mode="wait">
              <motion.div
                key={method}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="auth-header">
                  <h2>
                    {method === "email" ? "Forgot Your Password?" : "Telegram Recovery"}
                  </h2>
                  <p>
                    {method === "email"
                      ? "Enter your registered email address and we'll send you a 6-digit verification code."
                      : "Enter your registered phone number to receive an instant verification code on Telegram."}
                  </p>
                </div>

                {method === "email" ? (
                  <form onSubmit={handleSendOtp} className="auth-form">
                    <div className="auth-input-wrapper">
                      <label className="auth-input-label">Email Address</label>
                      <div className="auth-input-group">
                        <FaEnvelope className="auth-field-icon" />
                        <input
                          type="email"
                          placeholder="e.g. yourname@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          autoComplete="email"
                          autoFocus
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="auth-primary-btn"
                      disabled={loading || !email.trim()}
                    >
                      {loading ? (
                        <>
                          <span className="auth-spinner" />
                          <span>Sending Verification Code...</span>
                        </>
                      ) : (
                        <>
                          <FaEnvelope />
                          <span>Send Email OTP</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <div>
                    <div className="telegram-connect-card">
                      <div className="telegram-icon-wrapper">
                        <FaTelegramPlane />
                      </div>
                      <h3>Connect Angkor Mall Bot</h3>
                      <p>
                        Ensure your Telegram account is connected to our verification bot before requesting a code.
                      </p>
                      <button
                        type="button"
                        className="telegram-action-btn"
                        onClick={openTelegramBot}
                      >
                        <FaTelegramPlane />
                        <span>Open Telegram Bot</span>
                      </button>
                    </div>

                    <form onSubmit={handleSendOtp} className="auth-form">
                      <div className="auth-input-wrapper">
                        <label className="auth-input-label">Registered Phone Number</label>
                        <div className="auth-input-group">
                          <FaPhone className="auth-field-icon" />
                          <input
                            type="tel"
                            placeholder="e.g. 012 345 678"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            autoComplete="tel"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="auth-primary-btn"
                        disabled={loading || !phone.trim()}
                      >
                        {loading ? (
                          <>
                            <span className="auth-spinner" />
                            <span>Sending Telegram OTP...</span>
                          </>
                        ) : (
                          <>
                            <FaTelegramPlane />
                            <span>Send Telegram OTP</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}

          {/* STEP 2: Enter Verification Code */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="auth-header">
                <h2>Enter Verification Code</h2>
                <p>
                  We have sent a 6-digit OTP code to{" "}
                  <strong className="auth-highlight-dest">
                    {method === "email" ? email : phone}
                  </strong>
                  .
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="auth-form">
                <div className="auth-input-wrapper">
                  <div className="auth-input-label-row">
                    <label className="auth-input-label">6-Digit Code</label>
                    <span className="auth-label-tag">Valid for 5 min</span>
                  </div>
                  <div className="auth-input-group">
                    <FaKey className="auth-field-icon" />
                    <input
                      type="text"
                      className="auth-otp-input"
                      placeholder="• • • • • •"
                      value={otp}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                        setOtp(val);
                      }}
                      maxLength={6}
                      autoFocus
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="auth-primary-btn"
                  disabled={loading || otp.trim().length < 4}
                >
                  {loading ? (
                    <>
                      <span className="auth-spinner" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <>
                      <FaCheckCircle />
                      <span>Verify & Continue</span>
                    </>
                  )}
                </button>

                <div className="auth-resend-row">
                  <button
                    type="button"
                    className="auth-resend-btn"
                    onClick={handleSendOtp}
                    disabled={loading || timer > 0}
                  >
                    {timer > 0 ? (
                      `Resend Code in ${timer}s`
                    ) : (
                      "Didn't receive code? Resend"
                    )}
                  </button>

                  <button
                    type="button"
                    className="auth-change-dest-btn"
                    onClick={() => {
                      setStep(1);
                      setOtp("");
                    }}
                  >
                    {method === "email" ? "Change Email" : "Change Phone"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* STEP 3: Create New Password */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="auth-header">
                <h2>Set New Password</h2>
                <p>Choose a secure, strong password for your Angkor Shopping Mall account.</p>
              </div>

              <form onSubmit={handleResetPassword} className="auth-form">
                {/* New Password */}
                <div className="auth-input-wrapper">
                  <label className="auth-input-label">New Password</label>
                  <div className="auth-input-group">
                    <FaLock className="auth-field-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoFocus
                      required
                    />
                    <span
                      className="auth-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                  </div>

                  {/* Password Strength Meter */}
                  {newPassword.length > 0 && (
                    <div className="auth-strength-meter">
                      <div className="strength-bars">
                        <div
                          className="strength-bar"
                          style={{
                            backgroundColor: strength.score >= 1 ? strength.color : "#e2e8f0"
                          }}
                        />
                        <div
                          className="strength-bar"
                          style={{
                            backgroundColor: strength.score >= 2 ? strength.color : "#e2e8f0"
                          }}
                        />
                        <div
                          className="strength-bar"
                          style={{
                            backgroundColor: strength.score >= 3 ? strength.color : "#e2e8f0"
                          }}
                        />
                      </div>
                      <span className="strength-text" style={{ color: strength.color }}>
                        {strength.text}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="auth-input-wrapper">
                  <label className="auth-input-label">Confirm New Password</label>
                  <div className="auth-input-group">
                    <FaLock className="auth-field-icon" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <span
                      className="auth-password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                  </div>

                  {/* Password Match Status */}
                  {confirmPassword.length > 0 && (
                    <div className="auth-match-status">
                      {newPassword === confirmPassword ? (
                        <span className="match-success">
                          <FaCheck /> Passwords match
                        </span>
                      ) : (
                        <span className="match-error">
                          <FaTimes /> Passwords do not match
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="auth-primary-btn"
                  disabled={
                    loading ||
                    newPassword.length < 6 ||
                    newPassword !== confirmPassword
                  }
                >
                  {loading ? (
                    <>
                      <span className="auth-spinner" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <FaShieldAlt />
                      <span>Save & Update Password</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {/* Trust Security Footer */}
          <div className="auth-trust-footer">
            <FaShieldAlt className="trust-icon" />
            <span>256-Bit SSL End-to-End Encryption Protected</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default ForgotPassword;