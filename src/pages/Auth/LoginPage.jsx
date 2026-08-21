import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { useGoogleLogin } from "@react-oauth/google";
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaSignInAlt,
  FaShieldAlt,
  FaTruck,
  FaCheckCircle
} from "react-icons/fa";
import Swal from "sweetalert2";
import { api } from "../../api/api";
import { googleLoginApi } from "../../services/authService";
import { setAuth } from "../../store/authSlice";
import "./style/LoginPage.css";
import logo from "../../assets/logo.jpg";

function LoginAdmin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: true,
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]:
        e.target.type === "checkbox"
          ? e.target.checked
          : e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await api("/api/auth/login", "post", {
        email: form.email,
        password: form.password,
      });

      const user = res.data.user;
      const accessToken = res.data.accessToken;
      const refreshToken = res.data.refreshToken || res.data.refresh_token || null;

      const role = user.roles?.[0]?.name || "customer";

      dispatch(
        setAuth({
          token: accessToken,
          refreshToken,
          role,
          user,
          remember: form.remember,
        })
      );
      Swal.fire({
        icon: "success",
        title: "Login Successful",
        text: `Welcome ${user.name}`,
        timer: 1800,
        showConfirmButton: false,
      });

      // Redirect by role
      if (role === "admin" || role === "sale") {
        navigate("/admin/dashboard");
      } else {
        navigate("/");
      }

    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: error?.message || "Invalid email or password",
      });
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth Handler
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
          title: "Google Login Successful",
          text: `Welcome ${user.name}!`,
          timer: 1800,
          showConfirmButton: false,
        });

        if (role === "admin" || role === "sale") {
          navigate("/admin/dashboard");
        } else {
          navigate("/");
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Google Sign-In Failed",
          text: error?.message || "Could not complete Google authentication.",
        });
      } finally {
        setLoading(false);
      }
    },
    onError: (error) => {
      console.warn("Google OAuth popup closed or error:", error);
    },
  });

  return (
    <div className="auth-page-container">
      {/* Left Split Panel (Desktop) */}
      <div className="auth-split-left">
        <div className="auth-left-content">
          <div className="auth-logo-brand" onClick={() => navigate("/")}>
            <span className="auth-logo-icon">
              <img src={logo} alt="AngkorMall Logo" />
            </span>
            <span className="auth-logo-text">Angkor Shopping Mall</span>
          </div>

          <h1 className="auth-left-heading">Cambodia's #1 Shopping Experience</h1>
          <p className="auth-left-desc">
            Discover thousands of products with AI-powered recommendations, fast delivery, and secure payments — all in one beautiful place.
          </p>

          <div className="auth-features-list">
            <div className="auth-feature-pill">
              <FaCheckCircle className="feature-icon" />
              <span>24/7 AI Smart Shopping Assistant</span>
            </div>
            <div className="auth-feature-pill">
              <FaTruck className="feature-icon" />
              <span>Fast Doorstep Delivery Nationwide</span>
            </div>
            <div className="auth-feature-pill">
              <FaShieldAlt className="feature-icon" />
              <span>100% Secure & Verified Payments</span>
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
                <span className="auth-mobile-brand-badge">🇰🇭 Cambodia's #1 Mall</span>
              </div>
            </div>
            <h2 className="auth-mobile-hero-title">Welcome Back 👋</h2>
            <p className="auth-mobile-hero-sub">Sign in to access your orders & member discounts</p>
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
            <h2>Sign In</h2>
            <p>Welcome back! Please enter your details to access your account.</p>
          </div>

          <form onSubmit={handleLogin} className="auth-form">
            {/* Email Field */}
            <div className="auth-input-wrapper">
              <label className="auth-input-label">Email Address</label>
              <div className="auth-input-group">
                <FaEnvelope className="auth-field-icon" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="auth-input-wrapper">
              <label className="auth-input-label">Password</label>
              <div className="auth-input-group">
                <FaLock className="auth-field-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <span
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="auth-options-row">
              <label className="auth-remember-checkbox">
                <input
                  type="checkbox"
                  name="remember"
                  checked={form.remember}
                  onChange={handleChange}
                />
                <span>Remember me</span>
              </label>

              <span
                onClick={() => navigate("/auth/forgot-password")}
                className="auth-forgot-link"
              >
                Forgot Password?
              </span>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              className="auth-primary-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="auth-spinner"></span>
              ) : (
                <>
                  <FaSignInAlt />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="auth-divider">
            <span>or continue with</span>
          </div>

          {/* Full-width Branded Google Login Button (UNDER Button Sign In) */}
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
            <span>Don't have an account? </span>
            <span
              className="auth-nav-link"
              onClick={() => navigate("/auth/register")}
            >
              Register now
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

export default LoginAdmin;