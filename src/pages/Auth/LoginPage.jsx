import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaSignInAlt,
  FaGoogle,
  FaFacebookF,
} from "react-icons/fa";
import Swal from "sweetalert2";
import { api } from "../../api/api";
import { setAuth } from "../../store/authSlice";
import "./style/LoginPage.css";
import  logo  from "../../assets/logo.jpg";

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

      const role = user.roles?.[0]?.name || "customer";

      dispatch(
        setAuth({
          token: accessToken,
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
      } else if (role === "customer") {
        navigate("/");
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

  return (
    <div className="auth-page-container">
      {/* Left Split Panel */}
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
            Discover thousands of products with AI-powered recommendations, fast delivery, and secure payments all in one beautiful place.
          </p>

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
        <motion.div
          className="auth-form-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="auth-header">
            <h2>Welcome Back</h2>
            <p>Sign in to your account</p>
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
                  placeholder="Email address"
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
                  placeholder="Password"
                  autoComplete="current-password"
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

            {/* Divider */}
            <div className="auth-divider">
              <span>or continue with</span>
            </div>

            {/* Social Logins */}
            <div className="auth-social-row">
              <button
                type="button"
                className="auth-social-btn"
                onClick={() => Swal.fire("Social Sign In", "Google integration coming soon", "info")}
              >
                <FaGoogle className="google-icon" />
                <span>Google</span>
              </button>
              <button
                type="button"
                className="auth-social-btn"
                onClick={() => Swal.fire("Social Sign In", "Facebook integration coming soon", "info")}
              >
                <FaFacebookF className="facebook-icon" />
                <span>Facebook</span>
              </button>
            </div>
          </form>

          {/* Footer Link */}
          <div className="auth-footer-link">
            <span>Don't have an account? </span>
            <span
              className="auth-nav-link"
              onClick={() => navigate("/auth/register")}
            >
              Register
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default LoginAdmin;