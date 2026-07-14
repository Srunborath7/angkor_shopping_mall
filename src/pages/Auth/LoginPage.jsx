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
} from "react-icons/fa";
import Swal from "sweetalert2";
import { api } from "../../api/api";
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
    <div className="login-container">
      {/* Floating Background */}
      <div className="circle circle1"></div>
      <div className="circle circle2"></div>
      <div className="circle circle3"></div>

      <motion.div
        className="login-card"
        initial={{
          opacity: 0,
          y: 60,
          scale: 0.9,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          duration: 0.8,
        }}
      >
        {/* Logo */}

        <motion.img
          src={logo}
          alt="Logo"
          className="logo"
          animate={{
            y: [0, -8, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
          }}
        />

        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Welcome Back
        </motion.h2>

        <p className="subtitle">
          Sign in to continue to your Admin Dashboard
        </p>

        <form onSubmit={handleLogin}>
          {/* Email */}

          <div className="input-group-login">
            <FaEnvelope className="input-icon" />

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email Address"
              autoComplete="email"
              required
            />
          </div>

          {/* Password */}

          <div className="input-group-login">
            <FaLock className="input-icon" />

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
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {/* Remember */}

          <div className="remember-row">
            <label className="remember-label">
              <input
                type="checkbox"
                name="remember"
                checked={form.remember}
                onChange={handleChange}
              />

              <span>Remember me</span>
            </label>

            <a href="/auth/forgot-password" className="forgot-link">
              Forgot Password?
            </a>
          </div>

          {/* Login Button */}

          <motion.button
            whileHover={{
              scale: 1.03,
            }}
            whileTap={{
              scale: 0.96,
            }}
            className="login-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
              </>
            ) : (
              <>
                <FaSignInAlt />

                Login
              </>
            )}
          </motion.button>
        </form>
        <div className="footerLinks">
          <div>
          <span>
            Don't have an account?
          </span>
          </div>
          <button
            type="button"
            onClick={() => navigate("/auth/register")}
          >
            Sign Up
          </button>
        </div>
        {/* Footer */}

        <div className="login-footer">
          <small>© 2026 Admin Dashboard. All rights reserved.</small>
        </div>
      </motion.div>
    </div>
  );
}

export default LoginAdmin;