import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { api } from "../../api/api";
import "./style/ForgotPasswordPage.css";
import { useNavigate } from "react-router-dom";

function ForgotPassword() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [checking, setChecking] = useState(true);

  const checkTelegramLink = async () => {
    try {
      const res = await api(
        "/api/auth/telegram/check-link",
        "get"
      );

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

    window.open(
      "https://t.me/angkor_shopping_mall_bot",
      "_blank"
    );

  };
  const sendOTP = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api(
        "/api/auth/telegram/otp/send",
        "post",
        {
          phone
        }
      );
      Swal.fire({
        icon: "success",
        title: "OTP Sent",
        text: res.message || "OTP sent to Telegram"
      });
      setStep(2);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api(
        "/api/auth/telegram/otp/verify",
        "post",
        {
          phone,
          otp
        }
      );
      console.log(res);
      setResetToken(
        res.data.resetToken
      );
      Swal.fire({
        icon: "success",
        title: "Verified",
        text:
          res.data.message ||
          "OTP verified"
      });
      setStep(3);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Verification Failed",
        text: err.message
      });
    } finally {
      setLoading(false);
    }
  };
  const resetPassword = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api(
        "/api/auth/telegram/password/reset",
        "post",
        {
          resetToken,
          newPassword
        }
      );
      Swal.fire({
        icon: "success",
        title: "Success",
        text:
          res.message ||
          "Password reset successfully"
      });
      navigate("/auth/login");
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message
      });
    } finally {

      setLoading(false);

    }
  };

  return (

    <div className="forgot-container">


      <h2>
        Forgot Password
      </h2>



      {
        checking && (

          <p>
            Checking Telegram connection...
          </p>

        )
      }
      {step === 1 && !checking && (

        telegramLinked ? (

          <form onSubmit={sendOTP}>

            <input
              type="tel"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />

            <button disabled={loading}>
              {loading ? "Sending..." : "Send OTP"}
            </button>

          </form>
        )
          :
          (
            <div className="telegram-box">
              <h3>
                Connect Telegram
              </h3>
              <p>
                Link your phone number with our Telegram bot
                to receive OTP faster.
              </p>
              <button
                type="button"
                onClick={openTelegramBot}
              >
                Go To Telegram Bot
              </button>
              <button
                type="button"
                className="skip-btn"
                onClick={() => setTelegramLinked(true)}
              >
                Skip
              </button>
            </div>
          )
      )}
      {
        step === 2 && (
          <form onSubmit={verifyOTP}>
            <input
              type="text"
              placeholder="OTP Code"
              value={otp}
              onChange={
                e => setOtp(e.target.value)
              }
              required
            />
            <button disabled={loading}>
              {
                loading
                  ?
                  "Verifying..."
                  :
                  "Verify OTP"
              }
            </button>
          </form>
        )
      }
      {
        step === 3 && (

          <form onSubmit={resetPassword}>


            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={
                e => setNewPassword(e.target.value)
              }
              required
            />
            <button disabled={loading}>
              {
                loading
                  ?
                  "Saving..."
                  :
                  "Reset Password"
              }

            </button>
          </form>
        )
      }
    </div>

  );
}

export default ForgotPassword;