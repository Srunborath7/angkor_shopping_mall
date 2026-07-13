import React, { useEffect, useState } from "react";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaUserTag
} from "react-icons/fa";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import {
  registerApi,
  getRolesApi
} from "../../services/authService";
import "./style/RegisterPage.css";
import logo from "../../assets/logo.jpg";

function RegisterPage({ onNavigate }) {
  const token = localStorage.getItem("token");
  const hasToken = !!token;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (hasToken) {
      loadRoles();
    }
  }, []);
  const loadRoles = async () => {
    try {
      const res = await getRolesApi();
      setRoles(
        res.data || []
      );
    } catch (error) {
      console.log(error);
    }
  };
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        name,
        email,
        password,
        phone
      };
      // Admin create user
      if (hasToken) {
        payload.role_id = roleId;
      }
      const res = await registerApi(payload);
      Swal.fire({
        icon: "success",
        title: "Register Success",
        text:
          res.message ||
          "Account created successfully",
        timer: 1800,
        showConfirmButton: false
      });
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setRoleId("");
      navigate("/auth/login");
    }
    catch (error) {
      Swal.fire({
        icon: "error",
        title: "Register Failed",
        text:
          error.message ||
          "Register failed"
      });
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      {/* Background */}
      <div className="circle circle1"></div>
      <div className="circle circle2"></div>
      <div className="circle circle3"></div>
      <div className="register-card">
        <img
          src={logo}
          alt="logo"
          className="logo"
        />
        <h2>
          Create Account
        </h2>
        <p className="register-subtitle">
          Join Angkor Shopping Mall today
        </p>
        <form onSubmit={handleRegister}>
          <div className="input-group">
            <FaUser className="input-icon" />
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <FaEnvelope className="input-icon" />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <FaPhone className="input-icon" />
            <input
              type="tel"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <FaLock className="input-icon" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {
            hasToken && (
              <div className="input-group">
                <FaUserTag className="input-icon" />
                <select
                  className="input-control"
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  required
                >
                  <option value="">
                    Select Role
                  </option>
                  {
                    roles.map((role) => (
                      <option
                        key={role.id}
                        value={role.id}
                      >
                        {role.name}
                      </option>
                    ))
                  }
                </select>

              </div>
            )
          }
          <button
            className="register-btn"
            disabled={loading}
          >
            {
              loading ?
                <div className="spinner"></div>
                :
                "Register Account"
            }
          </button>
        </form>
        <div className="footerLinks">
          <div>
            <span>
              Don't have an account?
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate("/auth/login")}
          >
            Sign In
          </button>
        </div>
         <div className="login-footer">
          <small>© 2026 Admin Dashboard. All rights reserved.</small>
        </div>
      </div>
      
    </div>
  );
}
export default RegisterPage;