import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaPhone,
  FaKey,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaArrowLeft,
  FaTelegramPlane,
  FaShieldAlt,
  FaCheckCircle,
  FaRedo
} from "react-icons/fa";
import Swal from "sweetalert2";
import { api } from "../../api/api";
import "./style/ForgotPasswordPage.css";
import logo from "../../assets/logo.jpg";

function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [checking, setChecking] = useState(true);

  const checkTelegramLink = async () => {
    try {
      const res = await api("/api/auth/telegram/check-link", "get");
      if (res.data?.linked) {
        setTelegramLinked(true);
      } else {
        setTelegramLinked(false);
      }
    } catch (error) {
      setTelegramLinked(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkTelegramLink();
  }, []);

  const openTelegramBot = () => {
    window.open("https://t.me/angkor_shopping_mall_bot", "_blank");
  };

  const sendOTP = async (e) => {
    e.preventDefault();
    if (!phone || phone.trim().length < 8) {
      Swal.fire({
        icon: "warning",
        title: "Phone Required",
        text: "Please enter a valid phone number registered with your account."
      });
      return;
    }

    try {
      setLoading(true);
      const res = await api("/api/auth/telegram/otp/send", "post", { phone });
      Swal.fire({
        icon: "success",
        title: "OTP Dispatched",
        text: res.message || "OTP security code sent to your Telegram!"
      });
      setStep(2);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Unable to Send OTP",
        text: err.message || "Could not send OTP to this phone number."
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length < 4) {
      Swal.fire({
        icon: "warning",
        title: "OTP Required",
        text: "Please enter the verification code received on Telegram."
      });
      return;
    }

    try {
      setLoading(true);
      const res = await api("/api/auth/telegram/otp/verify", "post", {
        phone,
        otp: otp.trim()
      });
      setResetToken(res.data?.resetToken || res.data?.token || "");
      Swal.fire({
        icon: "success",
        title: "Code Verified",
        text: res.data?.message || "OTP verified successfully. You can now set a new password."
      });
      setStep(3);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Verification Failed",
        text: err.message || "Invalid or expired OTP code."
      });
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      Swal.fire({
        icon: "warning",
        title: "Password Too Short",
        text: "Password must be at least 6 characters long."
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: "warning",
        title: "Mismatch",
        text: "New Password and Confirm Password do not match!"
      });
      return;
    }

    try {
      setLoading(true);
      const res = await api("/api/auth/telegram/password/reset", "post", {
        resetToken,
        newPassword
      });
      Swal.fire({
        icon: "success",
        title: "Password Reset Successful",
        text: res.message || "Your password has been changed. Please sign in with your new password.",
        timer: 2000,
        showConfirmButton: false
      });
      navigate("/auth/login");
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Reset Failed",
        text: err.message || "Could not reset password. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      {/* Left Split Panel (Desktop) */}
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
            Recover your account quickly with instant Telegram OTP verification and end-to-end encrypted security.
          </p>

          <div className="auth-features-list">
            <div className="auth-feature-pill">
              <FaShieldAlt className="feature-icon" />
              <span>Instant Telegram OTP Verification</span>
            </div>
            <div className="auth-feature-pill">
              <FaCheckCircle className="feature-icon" />
              <span>256-Bit SSL Encrypted Recovery</span>
            </div>
            <div className="auth-feature-pill">
              <FaRedo className="feature-icon" />
              <span>Zero Downtime Password Reset</span>
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
        {/* Mobile Hero Header (Visible on Mobile & Tablet) */}
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
            <p className="auth-mobile-hero-sub">Quick recovery via Telegram OTP verification</p>
          </div>
        </div>

        {/* Auth Form Card */}
        <motion.div
          className="auth-form-card"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Back to Login Button */}
          <button
            type="button"
            className="auth-back-btn"
            onClick={() => navigate("/auth/login")}
          >
            <FaArrowLeft />
            <span>Back to Sign In</span>
          </button>

          {/* Stepper Header */}
          <div className="auth-stepper-bar">
            <div className={`stepper-step ${step >= 1 ? "active" : ""} ${step > 1 ? "completed" : ""}`}>
              <div className="stepper-dot">1</div>
              <span>Phone</span>
            </div>
            <div className={`stepper-line ${step >= 2 ? "active" : ""}`} />
            <div className={`stepper-step ${step >= 2 ? "active" : ""} ${step > 2 ? "completed" : ""}`}>
              <div className="stepper-dot">2</div>
              <span>OTP</span>
            </div>
            <div className={`stepper-line ${step >= 3 ? "active" : ""}`} />
            <div className={`stepper-step ${step >= 3 ? "active" : ""}`}>
              <div className="stepper-dot">3</div>
              <span>Reset</span>
            </div>
          </div>

          {/* Step 1: Phone / Telegram Link */}
          {step === 1 && (
            <>
              <div className="auth-header">
                <h2>Forgot Password</h2>
                <p>Enter your phone number to receive a secure Telegram OTP code.</p>
              </div>

              {checking ? (
                <div className="auth-checking-box">
                  <span className="auth-spinner" />
                  <span>Checking Telegram connection...</span>
                </div>
              ) : !telegramLinked ? (
                <div className="telegram-connect-card">
                  <div className="telegram-icon-wrapper">
                    <FaTelegramPlane />
                  </div>
                  <h3>Connect Telegram Bot</h3>
                  <p>
                    Link your phone number with our Telegram Bot to receive one-time verification codes instantly.
                  </p>
                  <button
                    type="button"
                    className="telegram-action-btn"
                    onClick={openTelegramBot}
                  >
                    <FaTelegramPlane />
                    <span>Open Telegram Bot</span>
                  </button>
                  <button
                    type="button"
                    className="auth-skip-btn"
                    onClick={() => setTelegramLinked(true)}
                  >
                    Skip & Enter Phone Directly
                  </button>
                </div>
              ) : (
                <form onSubmit={sendOTP} className="auth-form">
                  <div className="auth-input-wrapper">
                    <label className="auth-input-label">Phone Number</label>
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
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="auth-spinner" />
                    ) : (
                      "Send Telegram OTP"
                    )}
                  </button>
                </form>
              )}
            </>
          )}

          {/* Step 2: Verify OTP */}
          {step === 2 && (
            <>
              <div className="auth-header">
                <h2>Enter Verification Code</h2>
                <p>We've sent a 6-digit OTP code to your Telegram account for <strong>{phone}</strong>.</p>
              </div>

              <form onSubmit={verifyOTP} className="auth-form">
                <div className="auth-input-wrapper">
                  <label className="auth-input-label">Telegram OTP Code</label>
                  <div className="auth-input-group">
                    <FaKey className="auth-field-icon" />
                    <input
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={10}
                      autoFocus
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="auth-primary-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="auth-spinner" />
                  ) : (
                    "Verify & Proceed"
                  )}
                </button>

                <div className="auth-resend-row">
                  <button
                    type="button"
                    className="auth-resend-btn"
                    onClick={sendOTP}
                    disabled={loading}
                  >
                    Resend Code
                  </button>
                  <button
                    type="button"
                    className="auth-change-phone-btn"
                    onClick={() => setStep(1)}
                  >
                    Change Phone Number
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Step 3: Set New Password */}
          {step === 3 && (
            <>
              <div className="auth-header">
                <h2>Create New Password</h2>
                <p>Your identity is verified. Choose a strong, secure password for your account.</p>
              </div>

              <form onSubmit={resetPassword} className="auth-form">
                <div className="auth-input-wrapper">
                  <label className="auth-input-label">New Password</label>
                  <div className="auth-input-group">
                    <FaLock className="auth-field-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <span
                      className="auth-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                  </div>
                </div>

                <div className="auth-input-wrapper">
                  <label className="auth-input-label">Confirm New Password</label>
                  <div className="auth-input-group">
                    <FaLock className="auth-field-icon" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-type new password"
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
                </div>

                <button
                  type="submit"
                  className="auth-primary-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="auth-spinner" />
                  ) : (
                    "Save & Update Password"
                  )}
                </button>
              </form>
            </>
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