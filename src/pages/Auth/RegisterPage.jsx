import React, { useEffect, useState } from "react";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaUserTag,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  registerApi,
  getRolesApi
} from "../../services/authService";
import "./style/RegisterPage.css";

function RegisterPage() {
  const token = localStorage.getItem("token");
  const hasToken = !!token;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

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

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      Swal.fire({
        icon: "warning",
        title: "Validation Error",
        text: "Passwords do not match!",
      });
      return;
    }

    if (!agreeTerms && !hasToken) {
      Swal.fire({
        icon: "warning",
        title: "Terms & Conditions",
        text: "Please agree to the Terms & Conditions to proceed.",
      });
      return;
    }

    try {
      setLoading(true);
      const fullName = `${firstName} ${lastName}`.trim();
      const payload = {
        name: fullName,
        email,
        password,
        phone,
      };

      // Admin create user
      if (hasToken) {
        payload.role_id = roleId;
      }

      const res = await registerApi(payload);
      Swal.fire({
        icon: "success",
        title: "Register Success",
        text: res.message || "Account created successfully",
        timer: 1800,
        showConfirmButton: false,
      });

      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setConfirmPassword("");
      setRoleId("");
      navigate("/auth/login");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Register Failed",
        text: error.message || "Registration failed",
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
            <span className="auth-logo-icon">🌿</span>
            <span className="auth-logo-text">AngkorMall</span>
          </div>

          <h1 className="auth-left-heading">Cambodia's #1 Shopping Experience</h1>
          <p className="auth-left-desc">
            Discover thousands of products with AI-powered recommendations, fast delivery, and secure payments — all in one beautiful place.
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
          className="auth-form-card register-card-wide"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="auth-header">
            <h2>Create Account</h2>
            <p>Join Angkor Shopping Mall today</p>
          </div>

          <form onSubmit={handleRegister} className="auth-form">
            {/* First Name & Last Name Row */}
            <div className="auth-row-2col">
              <div className="auth-input-wrapper">
                <label className="auth-input-label">First Name</label>
                <div className="auth-input-group">
                  <FaUser className="auth-field-icon" />
                  <input
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="auth-input-wrapper">
                <label className="auth-input-label">Last Name</label>
                <div className="auth-input-group">
                  <FaUser className="auth-field-icon" />
                  <input
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Email Field */}
            <div className="auth-input-wrapper">
              <label className="auth-input-label">Email Address</label>
              <div className="auth-input-group">
                <FaEnvelope className="auth-field-icon" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Phone Field */}
            <div className="auth-input-wrapper">
              <label className="auth-input-label">Phone Number</label>
              <div className="auth-input-group">
                <FaPhone className="auth-field-icon" />
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password & Confirm Password Row */}
            <div className="auth-row-2col">
              <div className="auth-input-wrapper">
                <label className="auth-input-label">Password</label>
                <div className="auth-input-group">
                  <FaLock className="auth-field-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                <label className="auth-input-label">Confirm Password</label>
                <div className="auth-input-group">
                  <FaLock className="auth-field-icon" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm password"
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
                  <span>I agree to the Terms & Conditions</span>
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
                "Sign Up"
              )}
            </button>
          </form>

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
        </motion.div>
      </div>
    </div>
  );
}

export default RegisterPage;