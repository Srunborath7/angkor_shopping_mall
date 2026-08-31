import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import Swal from "sweetalert2";
import {
  FaShieldAlt,
  FaLock,
  FaKey,
  FaEye,
  FaEyeSlash,
  FaSignOutAlt,
  FaQuestionCircle,
  FaStore,
  FaUserShield,
  FaBackspace,
  FaCheck
} from "react-icons/fa";
import { Sun, Moon, Laptop, Globe } from "lucide-react";
import { verifyPinSuccess, clearAuth } from "../../store/authSlice";
import { verify2FAApi } from "../../services/authService";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "../../context/LanguageContext";
import "./style/PinPage.css";
import logo from "../../assets/logo.jpg";

const PIN_LENGTH = 6; // Standard 6-digit Security PIN
const LOCKOUT_KEY = "angkor_pin_lockout_until";
const LOCKOUT_DURATION_SECONDS = 120; // 2 minutes (120s) lockout requirement

function PinPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const { theme, setTheme, resolvedTheme, isDark } = useTheme();
  const { language, setLanguage, isKhmer, t } = useTranslation();

  const auth = useSelector((state) => state.auth);
  const { user, role, token, isPinVerified } = auth;

  const [pin, setPin] = useState("");
  const [isMasked, setIsMasked] = useState(true);
  const [isShaking, setIsShaking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const cardRef = useRef(null);

  // Helper to retrieve saved PIN from admin settings or local profile
  const getExpectedPin = useCallback(() => {
    try {
      if (user?.pin) return String(user.pin);
      if (user?.security_pin) return String(user.security_pin);

      const savedSettings = localStorage.getItem("angkor_admin_settings_v1");
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.securityPin) return String(parsed.securityPin);
      }

      const staffPin = localStorage.getItem("angkor_staff_pin");
      if (staffPin) return String(staffPin);

      return null;
    } catch {
      return null;
    }
  }, [user]);

  // If user is not authenticated at all, redirect to login
  // If user has 2FA disabled or already verified, redirect to dashboard
  useEffect(() => {
    if (!token && !auth?.tempToken) {
      navigate("/auth/login", { replace: true });
      return;
    }

    const has2FA = Boolean(
      user?.two_fa_enabled === true ||
      user?.two_fa_enabled === 1 ||
      user?.two_fa_enabled === "1" ||
      user?.two_fa_enabled === "true" ||
      Boolean(auth?.tempToken)
    );

    // If already verified or 2FA not enabled, go to dashboard
    if ((isPinVerified || !has2FA) && token) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [token, auth?.tempToken, isPinVerified, user?.two_fa_enabled, navigate]);

  // Lockout countdown timer synced with localStorage
  useEffect(() => {
    const updateLockout = () => {
      try {
        const stored = localStorage.getItem(LOCKOUT_KEY);
        if (stored) {
          const diff = Math.ceil((parseInt(stored, 10) - Date.now()) / 1000);
          if (diff > 0) {
            setLockoutTime(diff);
          } else {
            setLockoutTime(0);
            localStorage.removeItem(LOCKOUT_KEY);
          }
        } else {
          setLockoutTime((prev) => (prev > 0 ? prev - 1 : 0));
        }
      } catch {
        setLockoutTime((prev) => (prev > 0 ? prev - 1 : 0));
      }
    };

    updateLockout();
    const timer = setInterval(updateLockout, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format lockout seconds into MM:SS
  const formatLockoutTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Sound & Haptic tick feedback
  const triggerHaptic = () => {
    if (navigator.vibrate) {
      navigator.vibrate(25);
    }
  };

  // Submit and verify PIN
  const handleVerify = useCallback(
    async (pinToTest) => {
      if (lockoutTime > 0) {
        Swal.fire({
          icon: "warning",
          title: isKhmer ? "ប្រព័ន្ធត្រូវបានផ្អាក" : "Terminal Locked",
          text: isKhmer
            ? `សូមរង់ចាំ ${formatLockoutTime(lockoutTime)} នាទី មុនពេលព្យាយាមម្តងទៀត។`
            : `Please wait ${formatLockoutTime(lockoutTime)} before trying again.`,
        });
        return;
      }

      const inputPin = pinToTest || pin;
      if (!inputPin || inputPin.length < 4) return;

      setIsVerifying(true);

      try {
        const expectedPin = getExpectedPin();

        let isValid = false;
        let verifiedPayload = null;

        if (auth?.tempToken && auth.tempToken !== "pending_2fa" && auth.tempToken !== "two_fa_challenge") {
          try {
            const apiRes = await verify2FAApi(auth.tempToken, inputPin);
            const resData = apiRes?.data || apiRes;
            const accessToken = resData?.accessToken || resData?.token;
            if (accessToken) {
              isValid = true;
              const resUser = resData?.user || user;
              const resRole =
                resUser?.roles?.[0]?.name ||
                resUser?.role ||
                resUser?.role_name ||
                (Array.isArray(resUser?.roles) ? resUser.roles.map((r) => r.name || r).join(" ") : "") ||
                role ||
                "admin";

              verifiedPayload = {
                token: accessToken,
                refreshToken: resData?.refreshToken || resData?.refresh_token || null,
                user: resUser,
                role: resRole,
              };
            }
          } catch (e) {
            console.warn("Backend 2FA verification response:", e);
            if (expectedPin && inputPin === expectedPin) {
              isValid = true;
            }
          }
        } else {
          isValid = expectedPin ? inputPin === expectedPin : true;
        }

        if (isValid) {
          // Success sequence!
          setIsSuccess(true);
          setIsShaking(false);
          localStorage.removeItem(LOCKOUT_KEY);

          // Launch festive confetti celebration
          try {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
              colors: ["#f59e0b", "#fbbf24", "#10b981", "#6366f1"],
            });
          } catch (e) {}

          setTimeout(() => {
            dispatch(verifyPinSuccess(verifiedPayload));
            Swal.fire({
              icon: "success",
              title: isKhmer ? "ផ្ទៀងផ្ទាត់ជោគជ័យ!" : "PIN Verified!",
              text: isKhmer
                ? `សូមស្វាគមន៍មកកាន់ផ្ទាំងគ្រប់គ្រង Admin, ${user?.name || "Staff"}`
                : `Welcome to Angkor Admin Portal, ${user?.name || "Staff"}`,
              timer: 1400,
              showConfirmButton: false,
            });
            navigate("/admin/dashboard", { replace: true });
          }, 600);
        } else {
          // Failed PIN
          setIsShaking(true);
          triggerHaptic();
          setTimeout(() => setIsShaking(false), 700);

          const remaining = attemptsLeft - 1;
          setAttemptsLeft(remaining);
          setPin("");

          if (remaining <= 0) {
            // Block for 2 minutes (120 seconds)
            const lockoutUntil = Date.now() + LOCKOUT_DURATION_SECONDS * 1000;
            try {
              localStorage.setItem(LOCKOUT_KEY, String(lockoutUntil));
            } catch (e) {}
            setLockoutTime(LOCKOUT_DURATION_SECONDS);
            setAttemptsLeft(5);
            Swal.fire({
              icon: "error",
              title: isKhmer ? "ការចូលត្រូវបានផ្អាក ២ នាទី" : "Terminal Locked (2 Minutes)",
              text: isKhmer
                ? "អ្នកបានបញ្ចូលកូដ PIN ខុសច្រើនដង។ ប្រព័ន្ធត្រូវបានបិទផ្អាករយៈពេល ២ នាទី (១២០ វិនាទី)។"
                : "Too many incorrect PIN attempts. Security lockout active for 2 minutes (120 seconds).",
            });
          } else {
            Swal.fire({
              icon: "error",
              title: isKhmer ? "កូដ PIN មិនត្រឹមត្រូវ" : "Incorrect PIN",
              text: isKhmer
                ? `នៅសល់ ${remaining} ដងទៀតមុនពេលប្រព័ន្ធផ្អាក ២ នាទី។`
                : `Incorrect PIN code. ${remaining} attempt${remaining > 1 ? "s" : ""} remaining before 2-minute lockout.`,
              timer: 2200,
              showConfirmButton: false,
            });
          }
        }
      } catch (err) {
        console.error("PIN verification error:", err);
      } finally {
        setIsVerifying(false);
      }
    },
    [lockoutTime, pin, getExpectedPin, auth?.tempToken, isKhmer, dispatch, user, role, navigate, attemptsLeft]
  );

  // Keypad click handler
  const handleKeyPress = (digit) => {
    if (isVerifying || isSuccess || lockoutTime > 0) return;
    if (pin.length >= PIN_LENGTH) return;

    triggerHaptic();
    const newPin = pin + digit;
    setPin(newPin);

    // Auto-verify if 6 digits entered
    if (newPin.length === PIN_LENGTH) {
      setTimeout(() => handleVerify(newPin), 250);
    }
  };

  // Backspace key
  const handleBackspace = () => {
    if (isVerifying || isSuccess || lockoutTime > 0) return;
    triggerHaptic();
    setPin((prev) => prev.slice(0, -1));
  };

  // Clear all digits
  const handleClear = () => {
    triggerHaptic();
    setPin("");
  };

  // Physical Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showForgotModal) return;

      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        handleKeyPress(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === "Enter" && pin.length >= 4) {
        e.preventDefault();
        handleVerify(pin);
      } else if (e.key === "Escape") {
        handleClear();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pin, showForgotModal, handleKeyPress, handleBackspace, handleVerify]);

  // Sign out / switch user
  const handleSwitchAccount = () => {
    Swal.fire({
      title: isKhmer ? "ប្តូរគណនី?" : "Switch Account?",
      text: isKhmer ? "តើអ្នកចង់ចាកចេញហើយចូលដោយគណនីផ្សេងមែនទេ?" : "Are you sure you want to sign out and log in with another account?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#f59e0b",
      cancelButtonColor: "#64748b",
      confirmButtonText: isKhmer ? "បាទ/ចាស ចាកចេញ" : "Yes, Switch Account",
      cancelButtonText: isKhmer ? "បោះបង់" : "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(clearAuth());
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/auth/login", { replace: true });
      }
    });
  };

  // Role display label
  const getRoleDisplayName = () => {
    const r = String(
      role ||
      user?.role ||
      user?.role_name ||
      user?.roles?.[0]?.name ||
      (Array.isArray(user?.roles) ? user.roles.map((item) => item.name || item).join(" ") : "") ||
      "Staff"
    ).toLowerCase();

    const userName = String(user?.name || "").toLowerCase();

    if (r.includes("super") || userName.includes("super") || r === "admin" || r.includes("admin")) {
      return isKhmer ? "🛡️ Super Administrator" : "🛡️ Super Administrator";
    }
    if (r.includes("manager")) return isKhmer ? "🏬 Store Manager" : "🏬 Store Manager";
    if (r.includes("sale") || r.includes("order")) return isKhmer ? "⚡ Orders & Sales Specialist" : "⚡ Sales Specialist";
    if (r.includes("inventory")) return isKhmer ? "📦 Warehouse & Inventory" : "📦 Inventory Clerk";
    if (r.includes("cashier")) return isKhmer ? "💳 Cashier & POS" : "💳 Terminal Cashier";
    return isKhmer ? "👤 បុគ្គលិកគ្រប់គ្រង (Staff)" : "👤 Portal Staff";
  };

  return (
    <div className="pin-page-container">
      {/* Ambient Orbs */}
      <div className="pin-ambient-orb orb-gold" />
      <div className="pin-ambient-orb orb-indigo" />
      <div className="pin-ambient-orb orb-cyan" />

      {/* Top Bar */}
      <header className="pin-topbar">
        <div className="pin-topbar-brand" onClick={() => navigate("/")} title="Go to Storefront">
          <img src={logo} alt="Angkor Mall" className="pin-topbar-logo" />
          <span className="pin-topbar-name">Angkor Shopping Mall</span>
          <span className="pin-topbar-badge">🇰🇭 Security Portal</span>
        </div>

        <div className="pin-topbar-actions">
          {/* Language Switch */}
          <button
            className="pin-icon-btn pin-lang-btn"
            onClick={() => setLanguage(language === "km" ? "en" : "km")}
            title="Switch Language"
          >
            <Globe size={15} />
            <span>{language === "km" ? "🇰🇭 KH" : "🇺🇸 EN"}</span>
          </button>

          {/* Theme Toggle */}
          <button
            className="pin-icon-btn"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            title="Toggle Dark/Light Mode"
          >
            {resolvedTheme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      {/* Main Glassmorphic PIN Card */}
      <motion.div
        className="pin-card-wrapper"
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div
          ref={cardRef}
          className={`pin-card ${isShaking ? "pin-shake" : ""} ${isSuccess ? "pin-success" : ""}`}
        >
          {/* Verifying Overlay */}
          {isVerifying && (
            <div className="pin-loading-overlay">
              <div className="pin-spinner" />
              <span className="pin-loading-text">
                {isKhmer ? "កំពុងផ្ទៀងផ្ទាត់កូដ PIN..." : "Authenticating Security PIN..."}
              </span>
            </div>
          )}

          {/* Security Shield Icon */}
          <div className="pin-shield-badge">
            <div className="pin-shield-pulse" />
            <FaShieldAlt />
          </div>

          {/* Header Title */}
          <div className="pin-header">
            <h1 className="pin-title">{isKhmer ? "បញ្ចូលកូដ PIN សុវត្ថិភាព" : "Enter Security PIN"}</h1>
            <p className="pin-subtitle">
              {isKhmer
                ? "សូមបញ្ចូលលេខកូដសម្ងាត់ ៦ ខ្ទង់ ដើម្បីចូលទៅកាន់ផ្ទាំងគ្រប់គ្រង"
                : "Enter your 6-digit PIN code to unlock staff terminal & admin portal"}
            </p>
          </div>

          {/* Staff Member Pill */}
          <div className="pin-staff-pill">
            <div className="pin-staff-avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt={user?.name || "Staff"} />
              ) : (
                <span>{(user?.name || "S").charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="pin-staff-info">
              <div className="pin-staff-name">{user?.name || "Staff Administrator"}</div>
              <div className="pin-staff-role">{getRoleDisplayName()}</div>
            </div>
            <button
              className="pin-staff-switch-btn"
              onClick={handleSwitchAccount}
              title={isKhmer ? "ប្តូរគណនី" : "Switch Account"}
            >
              {isKhmer ? "ប្តូរគណនី" : "Switch"}
            </button>
          </div>

          {/* 2-Minute Lockout Alert Banner */}
          {lockoutTime > 0 && (
            <motion.div
              className="pin-lockout-banner"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <FaLock className="lockout-banner-icon" />
              <div className="lockout-banner-text">
                <strong>
                  {isKhmer ? "🔒 ប្រព័ន្ធត្រូវបានផ្អាកបណ្តោះអាសន្ន ២ នាទី" : "🔒 Security Lockout Active (2 Minutes)"}
                </strong>
                <span>
                  {isKhmer
                    ? `សូមរង់ចាំ ${formatLockoutTime(lockoutTime)} នាទី មុនពេលព្យាយាមម្តងទៀត`
                    : `Too many wrong PIN attempts. Retry allowed in ${formatLockoutTime(lockoutTime)}`}
                </span>
              </div>
            </motion.div>
          )}

          {/* Attempts Warning Pill (when attempts left < 5 and not locked) */}
          {lockoutTime === 0 && attemptsLeft < 5 && (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              fontSize: "0.8rem",
              color: "#f59e0b",
              background: "rgba(245, 158, 11, 0.12)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              padding: "6px 12px",
              borderRadius: "999px",
              marginBottom: "14px",
              fontWeight: 600,
            }}>
              <span>⚠️ {isKhmer ? `នៅសល់ ${attemptsLeft} ដងទៀតមុនពេលផ្អាក ២ នាទី` : `${attemptsLeft} attempt${attemptsLeft > 1 ? "s" : ""} remaining before 2-minute block`}</span>
            </div>
          )}

          {/* PIN Dots Indicator (6 Digits) */}
          <div className="pin-display-wrapper">
            <div className="pin-dots-container">
              {[0, 1, 2, 3, 4, 5].map((index) => {
                const hasValue = pin.length > index;
                const isActive = pin.length === index;
                const char = pin[index];

                return (
                  <div
                    key={index}
                    className={`pin-dot ${hasValue ? (isMasked ? "filled-masked" : "filled") : ""} ${
                      isActive ? "active-cursor" : ""
                    }`}
                  >
                    {hasValue && !isMasked ? char : null}
                  </div>
                );
              })}
            </div>

            {/* Show/Hide PIN Toggle */}
            <button
              type="button"
              className="pin-mask-toggle"
              onClick={() => setIsMasked(!isMasked)}
              title={isMasked ? "Show digits" : "Mask digits"}
            >
              {isMasked ? <FaEye size={13} /> : <FaEyeSlash size={13} />}
              <span>{isMasked ? (isKhmer ? "បង្ហាញលេខ" : "Show PIN") : (isKhmer ? "លាក់លេខ" : "Hide PIN")}</span>
            </button>
          </div>

          {/* Numeric Keypad Grid */}
          <div className="pin-keypad">
            {[
              { num: "1", letters: "" },
              { num: "2", letters: "ABC" },
              { num: "3", letters: "DEF" },
              { num: "4", letters: "GHI" },
              { num: "5", letters: "JKL" },
              { num: "6", letters: "MNO" },
              { num: "7", letters: "PQRS" },
              { num: "8", letters: "TUV" },
              { num: "9", letters: "WXYZ" },
            ].map((k) => (
              <button
                key={k.num}
                type="button"
                className="pin-key"
                onClick={() => handleKeyPress(k.num)}
                disabled={isVerifying || lockoutTime > 0}
              >
                <span className="pin-key-number">{k.num}</span>
                {k.letters && <span className="pin-key-letters">{k.letters}</span>}
              </button>
            ))}

            {/* Bottom Row: Clear / 0 / Backspace */}
            <button
              type="button"
              className="pin-key action-key clear-key"
              onClick={handleClear}
              title={isKhmer ? "លុបទាំងអស់" : "Clear All"}
              disabled={isVerifying || lockoutTime > 0 || pin.length === 0}
            >
              <span className="pin-action-label">{isKhmer ? "លុប" : "Clear"}</span>
            </button>

            <button
              type="button"
              className="pin-key"
              onClick={() => handleKeyPress("0")}
              disabled={isVerifying || lockoutTime > 0}
            >
              <span className="pin-key-number">0</span>
              <span className="pin-key-letters">+</span>
            </button>

            <button
              type="button"
              className="pin-key action-key delete-key"
              onClick={handleBackspace}
              title={isKhmer ? "លុប" : "Delete"}
              disabled={isVerifying || lockoutTime > 0}
            >
              <FaBackspace size={22} />
              <span className="pin-action-label">{isKhmer ? "លុប" : "Del"}</span>
            </button>
          </div>

          {/* Footer Navigation Links */}
          <div className="pin-footer-links">
            <button
              type="button"
              className="pin-footer-btn"
              onClick={() => setShowForgotModal(true)}
            >
              <FaQuestionCircle size={14} />
              <span>{isKhmer ? "ភ្លេចលេខ PIN?" : "Forgot PIN?"}</span>
            </button>

            <button
              type="button"
              className="pin-footer-btn switch-btn"
              onClick={handleSwitchAccount}
            >
              <FaSignOutAlt size={14} />
              <span>{isKhmer ? "ចាកចេញ" : "Sign Out"}</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Forgot PIN / Help Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="pin-modal-backdrop" onClick={() => setShowForgotModal(false)}>
            <motion.div
              className="pin-modal-card"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="pin-modal-header">
                <div className="pin-modal-title">
                  <FaKey />
                  <span>{isKhmer ? "ជំនួយកូដ PIN សុវត្ថិភាព" : "Security PIN Assistance"}</span>
                </div>
                <button
                  type="button"
                  className="pin-modal-close"
                  onClick={() => setShowForgotModal(false)}
                >
                  ✕
                </button>
              </div>

              <div className="pin-modal-body">
                <p>
                  {isKhmer
                    ? "ប្រសិនបើអ្នកភ្លេចលេខកូដសម្ងាត់ សូមទាក់ទង Super Administrator ដើម្បីកំណត់លេខកូដថ្មី។"
                    : "If you forgot your staff Security PIN, please contact your Super Administrator to reset it."}
                </p>

                <p style={{ fontSize: "0.82rem", color: "#94a3b8" }}>
                  {isKhmer
                    ? "គណនីបច្ចុប្បន្ន៖ " + (user?.email || "staff@angkor.com")
                    : "Current Account: " + (user?.email || "staff@angkor.com")}
                </p>
              </div>

              <div className="pin-modal-footer">
                <button
                  type="button"
                  className="pin-modal-btn btn-primary"
                  onClick={() => setShowForgotModal(false)}
                >
                  {isKhmer ? "យល់ព្រម" : "Understood"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PinPage;
