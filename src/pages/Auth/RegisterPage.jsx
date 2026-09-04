import React, { useEffect, useState } from "react";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaUserTag,
  FaEye,
  FaEyeSlash,
  FaShieldAlt,
  FaGift,
  FaCheckCircle,
  FaTruck,
  FaUserPlus,
  FaExclamationCircle
} from "react-icons/fa";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { useGoogleLogin } from "@react-oauth/google";
import {
  registerApi,
  getRolesApi,
  googleLoginApi
} from "../../services/authService";
import { setAuth } from "../../store/authSlice";
import "./style/RegisterPage.css";
import logo from "../../assets/logo.jpg";

function RegisterPage() {
  const dispatch = useDispatch();
  const token = localStorage.getItem("token");
  const hasToken = !!token;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Field validation errors state
  const [fieldErrors, setFieldErrors] = useState({});

  const [roleId, setRoleId] = useState("");
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (hasToken) {
      loadRoles();
    }
  }, [hasToken]);

  const loadRoles = async () => {
    try {
      const res = await getRolesApi();
      setRoles(res.data || []);
    } catch (error) {
      console.error("Failed to load roles", error);
    }
  };

  const clearFieldError = (field) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    const clientErrors = {};

    const fullName = `${firstName} ${lastName}`.trim();
    if (!firstName.trim() && !lastName.trim()) {
      clientErrors.name = "First name and last name are required";
    } else if (fullName.length < 2) {
      clientErrors.name = "Full name must be at least 2 characters";
    }

    if (!email.trim()) {
      clientErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      clientErrors.email = "Please enter a valid email address";
    }

    if (!phone.trim()) {
      clientErrors.phone = "Phone number is required";
    } else if (!/^[0-9+()\-\s]{8,20}$/.test(phone.trim())) {
      clientErrors.phone = "Please enter a valid phone number";
    }

    if (!password) {
      clientErrors.password = "Password is required";
    } else if (password.length < 6) {
      clientErrors.password = "Password must be at least 6 characters long";
    }

    if (password !== confirmPassword) {
      clientErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      Swal.fire({
        icon: "warning",
        title: "Validation Error",
      });
      return;
    }

    if (!agreeTerms && !hasToken) {
      Swal.fire({
        icon: "warning",
        title: "Terms & Conditions",
        text: "Please agree to the Terms of Service & Privacy Policy to proceed.",
      });
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: fullName,
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
      };

      // Admin create user
      if (hasToken) {
        payload.role_id = roleId;
      }

      const res = await registerApi(payload);
      Swal.fire({
        icon: "success",
        title: "Account Created!",
        text: res.message || "Your account has been registered successfully. Welcome to Angkor Shopping Mall!",
        timer: 2000,
        showConfirmButton: false,
      });

      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setConfirmPassword("");
      setRoleId("");
      setFieldErrors({});
      navigate("/auth/login");
    } catch (error) {
      const errData = error.response?.data || error;
      const serverErrors = errData?.errors || {};
      const errorMessage = errData?.message || error?.message || "Registration failed. Please check your information.";

      if (Object.keys(serverErrors).length > 0) {
        setFieldErrors(serverErrors);
        Swal.fire({
          icon: "error",
          title: "Registration Failed",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Registration Failed",
          text: errorMessage,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth Handler for Register Page
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        const res = await googleLoginApi({
          access_token: tokenResponse.access_token,
        });

        const user = res.data?.user || res.data;
        const accessToken = res.data?.accessToken;
        const refreshToken = res.data?.refreshToken || null;
        const role = user?.roles?.[0]?.name || "customer";

        dispatch(
          setAuth({
            token: accessToken,
            refreshToken,
            role,
            user,
            remember: true,
          })
        );

        Swal.fire({
          icon: "success",
          title: "Welcome to Angkor Mall!",
          text: "Google sign-in successful.",
          timer: 1500,
          showConfirmButton: false,
        });

        navigate("/");
      } catch (error) {
        console.error("Google login error:", error);
        const errData = error.response?.data || error;
        Swal.fire({
          icon: "error",
          title: "Google Sign-In Failed",
          text: errData?.message || error.message || "Failed to sign up with Google.",
        });
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      Swal.fire({
        icon: "error",
        title: "Google Sign-In Cancelled",
        text: "Could not authenticate with Google.",
      });
    },
  });

  return (
    <div className="auth-page-container">
      {/* Left Split Banner (Desktop Only) */}
      <div className="auth-split-left">
        <div className="auth-left-content">
          <div className="auth-logo-brand" onClick={() => navigate("/")}>
            <div className="auth-logo-icon">
              <img src={logo} alt="Angkor Shopping Mall" />
            </div>
            <span className="auth-logo-text">Angkor Shopping Mall</span>
          </div>

          <h1 className="auth-left-heading">Join Thousands of Smart Shoppers in Cambodia</h1>
          <p className="auth-left-desc">
            Experience seamless e-commerce, instant KHQR payments, exclusive rewards,
            and fast nationwide delivery with a single account.
          </p>

          <div className="auth-features-list">
            <div className="auth-feature-pill">
              <FaGift className="feature-icon" />
              <span>Welcome Voucher Pack up to $10 off</span>
            </div>
            <div className="auth-feature-pill">
              <FaTruck className="feature-icon" />
              <span>Fast nationwide express delivery</span>
            </div>
            <div className="auth-feature-pill">
              <FaCheckCircle className="feature-icon" />
              <span>100% Genuine product warranty</span>
            </div>
          </div>

          <div className="auth-stats-grid">
            <div className="auth-stat-item">
              <span className="auth-stat-number">50K+</span>
              <span className="auth-stat-label">Active Users</span>
            </div>
            <div className="auth-stat-item">
              <span className="auth-stat-number">100%</span>
              <span className="auth-stat-label">Secure KHQR</span>
            </div>
            <div className="auth-stat-item">
              <span className="auth-stat-number">24/7</span>
              <span className="auth-stat-label">Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Split Panel */}
      <div className="auth-split-right">
        {/* Mobile Fluid Brand Hero */}
        <div className="auth-mobile-hero">
          <div className="auth-mobile-hero-orb orb-1" />
          <div className="auth-mobile-hero-orb orb-2" />
          <div className="auth-mobile-hero-content">
            <div className="auth-mobile-brand-pill" onClick={() => navigate("/")}>
              <img src={logo} alt="Angkor Shopping Mall" className="auth-mobile-brand-logo" />
              <div className="auth-mobile-brand-meta">
                <span className="auth-mobile-brand-name">Angkor Shopping Mall</span>
                <span className="auth-mobile-brand-badge">Cambodia's #1 Mall</span>
              </div>
            </div>
            <h2 className="auth-mobile-hero-title">Create Account</h2>
            <p className="auth-mobile-hero-sub">Sign up for rewards and fast checkout</p>
          </div>
        </div>

        {/* Auth Form Card */}
        <motion.div
          className="auth-form-card"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="auth-header">
            <h2>Sign Up</h2>
            <p>Fill in your details below to create your free account.</p>
          </div>

          <form onSubmit={handleRegister} className="auth-form" noValidate>
            {/* First Name & Last Name Row */}
            <div className="auth-row-2col">
              <div className="auth-input-wrapper">
                <label className="auth-input-label">First Name</label>
                <div className={`auth-input-group ${fieldErrors.name ? "has-error" : ""}`}>
                  <FaUser className="auth-field-icon" />
                  <input
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      clearFieldError("name");
                    }}
                    required
                  />
                </div>
              </div>

              <div className="auth-input-wrapper">
                <label className="auth-input-label">Last Name</label>
                <div className={`auth-input-group ${fieldErrors.name ? "has-error" : ""}`}>
                  <FaUser className="auth-field-icon" />
                  <input
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      clearFieldError("name");
                    }}
                    required
                  />
                </div>
              </div>
            </div>
            {fieldErrors.name && (
              <div className="auth-field-error-text">
                <FaExclamationCircle /> {fieldErrors.name}
              </div>
            )}

            {/* Email Field */}
            <div className="auth-input-wrapper">
              <label className="auth-input-label">Email Address</label>
              <div className={`auth-input-group ${fieldErrors.email ? "has-error" : ""}`}>
                <FaEnvelope className="auth-field-icon" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFieldError("email");
                  }}
                  autoComplete="email"
                  required
                />
              </div>
              {fieldErrors.email && (
                <div className="auth-field-error-text">
                  <FaExclamationCircle /> {fieldErrors.email}
                </div>
              )}
            </div>

            {/* Phone Field */}
            <div className="auth-input-wrapper">
              <label className="auth-input-label">Phone Number</label>
              <div className={`auth-input-group ${fieldErrors.phone ? "has-error" : ""}`}>
                <FaPhone className="auth-field-icon" />
                <input
                  type="tel"
                  placeholder="012 345 678"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    clearFieldError("phone");
                  }}
                  autoComplete="tel"
                  required
                />
              </div>
              {fieldErrors.phone && (
                <div className="auth-field-error-text">
                  <FaExclamationCircle /> {fieldErrors.phone}
                </div>
              )}
            </div>

            {/* Password & Confirm Password Row */}
            <div className="auth-row-2col">
              <div className="auth-input-wrapper">
                <label className="auth-input-label">Password</label>
                <div className={`auth-input-group ${fieldErrors.password ? "has-error" : ""}`}>
                  <FaLock className="auth-field-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 6 chars"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearFieldError("password");
                    }}
                    required
                  />
                  <span
                    className="auth-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
                {fieldErrors.password && (
                  <div className="auth-field-error-text">
                    <FaExclamationCircle /> {fieldErrors.password}
                  </div>
                )}
              </div>

              <div className="auth-input-wrapper">
                <label className="auth-input-label">Confirm Password</label>
                <div className={`auth-input-group ${fieldErrors.confirmPassword ? "has-error" : ""}`}>
                  <FaLock className="auth-field-icon" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      clearFieldError("confirmPassword");
                    }}
                    required
                  />
                  <span
                    className="auth-password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
                {fieldErrors.confirmPassword && (
                  <div className="auth-field-error-text">
                    <FaExclamationCircle /> {fieldErrors.confirmPassword}
                  </div>
                )}
              </div>
            </div>

            {/* Role Selection (Admin only) */}
            {hasToken && (
              <div className="auth-input-wrapper">
                <label className="auth-input-label">Assign Role</label>
                <div className="auth-input-group">
                  <FaUserTag className="auth-field-icon" />
                  <select
                    className="auth-select-control"
                    value={roleId}
                    onChange={(e) => setRoleId(e.target.value)}
                    required
                  >
                    <option value="">Select Role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Terms & Conditions Checkbox */}
            {!hasToken && (
              <div className="auth-options-row">
                <label className="auth-remember-checkbox">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                  />
                  <span>I agree to the Terms of Service & Privacy Policy</span>
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="auth-primary-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="auth-spinner"></span>
              ) : (
                <>
                  <FaUserPlus />
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="auth-divider">
            <span>or continue with</span>
          </div>

          {/* Full-width Branded Google Login Button */}
          <button
            type="button"
            className="auth-google-btn"
            onClick={() => loginWithGoogle()}
            disabled={loading}
          >
            <svg className="google-svg-icon" viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Footer Link */}
          <div className="auth-footer-link">
            <span>Already have an account? </span>
            <span
              className="auth-nav-link"
              onClick={() => navigate("/auth/login")}
            >
              Sign In
            </span>
          </div>

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

export default RegisterPage;
