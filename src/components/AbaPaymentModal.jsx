import React, { useState, useEffect, useRef, useCallback } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  X,
  Copy,
  Check,
  Download,
  Smartphone,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck
} from "lucide-react";
import confetti from "canvas-confetti";
import toast from "react-hot-toast";
import {
  generateAbaQrApi,
  checkAbaStatusApi,
  simulateAbaPayApi
} from "../services/abaPaymentService";
import "./AbaPaymentModal.css";

export default function AbaPaymentModal({
  isOpen,
  onClose,
  orderId,
  amount = 0,
  orderNumber,
  onSuccess
}) {
  const [currency, setCurrency] = useState("USD");
  const [qrData, setQrData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds
  const [copied, setCopied] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [paidTxn, setPaidTxn] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const qrCanvasRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Generate ABA PayWay payload
  const fetchAbaQr = useCallback(async (curr = currency) => {
    setIsLoading(true);
    try {
      const res = await generateAbaQrApi({
        orderId: orderId,
        amount: parseFloat(amount),
        currency: curr
      });

      const data = res?.data?.data || res?.data || res;
      setQrData(data);
      setTimeLeft(900);
      setIsLoading(false);
    } catch (err) {
      console.error("ABA PayWay Generation Error:", err);
      const errMsg = err?.response?.data?.message || err?.message || "";
      if (typeof errMsg === "string" && errMsg.toLowerCase().includes("already been paid")) {
        setIsPaid(true);
        setIsLoading(false);
        confetti({
          particleCount: 85,
          spread: 75,
          origin: { y: 0.6 }
        });
        return;
      }
      toast.error(errMsg || "Failed to generate ABA PayWay QR");
      setIsLoading(false);
    }
  }, [orderId, amount, currency]);

  // Initial load on open
  useEffect(() => {
    if (isOpen && (orderId || amount > 0)) {
      setIsPaid(false);
      setPaidTxn(null);
      fetchAbaQr(currency);
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isOpen, orderId, amount, fetchAbaQr]);

  // Countdown Timer
  useEffect(() => {
    if (!isOpen || isPaid || !qrData) return;

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerIntervalRef.current);
  }, [isOpen, isPaid, qrData]);

  // Polling for Payment Confirmation
  useEffect(() => {
    if (!isOpen || isPaid) return;
    const queryKey = qrData?.tranId || qrData?.md5;
    if (!queryKey) return;

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await checkAbaStatusApi(queryKey);
        const result = res?.data?.data || res?.data || res;

        if (result?.isPaid || result?.status === "paid") {
          clearInterval(pollIntervalRef.current);
          clearInterval(timerIntervalRef.current);
          setIsPaid(true);
          setPaidTxn(result);

          // Trigger confetti celebration
          confetti({
            particleCount: 85,
            spread: 75,
            origin: { y: 0.6 }
          });

          toast.success("Payment Received via ABA PayWay!");

          if (onSuccess) {
            setTimeout(() => {
              onSuccess(result?.orderId || orderId);
            }, 2500);
          }
        }
      } catch (err) {
        console.debug("Status poll tick:", err.message);
      }
    }, 3000);

    return () => clearInterval(pollIntervalRef.current);
  }, [isOpen, isPaid, qrData, orderId, onSuccess]);

  // Format seconds to mm:ss
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Switch Currency
  const handleCurrencyChange = (newCurr) => {
    if (newCurr === currency || isLoading) return;
    setCurrency(newCurr);
    fetchAbaQr(newCurr);
  };

  // Copy raw QR payload string
  const handleCopyQr = () => {
    if (!qrData?.qrString) return;
    navigator.clipboard.writeText(qrData.qrString);
    setCopied(true);
    toast.success("ABA QR payload copied to clipboard");
    setTimeout(() => setCopied(false), 2500);
  };

  // Download QR Code image as PNG
  const handleDownloadQr = () => {
    const canvas = document.querySelector("#aba-payway-canvas");
    if (!canvas) return;

    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `ABA-PayWay-${orderNumber || orderId || "payment"}.png`;
    link.href = url;
    link.click();
    toast.success("ABA PayWay QR downloaded");
  };

  // Open ABA Mobile App on mobile or prompt scan on desktop
  const handleOpenAbaApp = (e) => {
    if (e) e.preventDefault();
    if (!qrData?.abaDeepLink) return;
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = qrData.abaDeepLink;
    } else {
      handleCopyQr();
      toast("📱 Please scan this QR code using the ABA Mobile App on your smartphone.", {
        icon: "ℹ️",
        duration: 4000
      });
    }
  };

  // Simulate Instant Payment (Sandbox Demo)
  const handleSimulatePayment = async () => {
    setIsSimulating(true);
    try {
      const res = await simulateAbaPayApi({
        tran_id: qrData?.tranId,
        md5: qrData?.md5,
        orderId: orderId
      });

      const result = res?.data?.data || res?.data || res;
      if (result?.isPaid || result?.status === "paid") {
        setIsPaid(true);
        setPaidTxn(result);

        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });

        toast.success("⚡ Instant ABA Payment Confirmed!");
        if (onSuccess) {
          setTimeout(() => {
            onSuccess(result?.orderId || orderId);
          }, 2500);
        }
      }
    } catch (err) {
      toast.error(err.message || "Simulation failed");
    } finally {
      setIsSimulating(false);
    }
  };

  if (!isOpen) return null;

  const displayAmount = currency === "KHR"
    ? `${(parseFloat(amount) * 4100).toLocaleString()} ៛`
    : `$${parseFloat(amount).toFixed(2)}`;

  return (
    <div className="aba-modal-backdrop" onClick={onClose}>
      <div className="aba-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* --- HEADER --- */}
        <div className="aba-header">
          <div className="aba-header-top">
            <div className="aba-branding-badge">
              <span className="aba-logo-pill">ABA</span>
              <span className="aba-payway-text">PAYWAY</span>
            </div>
            <button className="aba-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          <div className="aba-merchant-info">
            <h3 className="aba-merchant-name">
              {qrData?.merchantName || "Angkor Shopping Mall"}
            </h3>
            <span className="aba-order-tag">
              Order #{orderNumber || String(orderId).slice(-8).toUpperCase()}
            </span>
          </div>
        </div>

        {/* --- SUCCESS VIEW --- */}
        {isPaid ? (
          <div className="aba-success-view">
            <div className="aba-success-icon-wrap">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="aba-success-title">Payment Successful!</h3>
            <p className="aba-success-sub">
              Your payment has been verified via ABA PayWay.
            </p>

            <div className="aba-receipt-card">
              <div className="aba-receipt-row">
                <span>Amount Paid:</span>
                <strong>{displayAmount}</strong>
              </div>
              <div className="aba-receipt-row">
                <span>Payment Gateway:</span>
                <strong>ABA PayWay / KHQR</strong>
              </div>
              {paidTxn?.transactionHash && (
                <div className="aba-receipt-row">
                  <span>Txn Ref:</span>
                  <strong style={{ fontSize: "11px", wordBreak: "break-all" }}>
                    {paidTxn.transactionHash}
                  </strong>
                </div>
              )}
              <div className="aba-receipt-row">
                <span>Status:</span>
                <strong style={{ color: "#16a34a" }}>PAID & CONFIRMED</strong>
              </div>
            </div>

            <button
              className="aba-btn-primary"
              onClick={() => {
                if (onSuccess) onSuccess(orderId);
                onClose();
              }}
            >
              <Check size={16} /> Continue to Orders
            </button>
          </div>
        ) : (
          /* --- ACTIVE ABA QR VIEW --- */
          <>
            {/* Amount & Currency Switcher */}
            <div className="aba-amount-section">
              <div className="aba-currency-pills">
                <button
                  type="button"
                  className={`aba-curr-btn ${currency === "USD" ? "active" : ""}`}
                  onClick={() => handleCurrencyChange("USD")}
                >
                  USD ($)
                </button>
                <button
                  type="button"
                  className={`aba-curr-btn ${currency === "KHR" ? "active" : ""}`}
                  onClick={() => handleCurrencyChange("KHR")}
                >
                  KHR (៛)
                </button>
              </div>

              <div className="aba-amount-display">{displayAmount}</div>
              <span className="aba-amount-sub">
                Scan with ABA Mobile or any banking app supporting KHQR
              </span>
            </div>

            {/* QR Canvas */}
            <div className="aba-body">
              <div className="aba-qr-frame">
                {isLoading || !qrData?.qrString ? (
                  <div className="aba-qr-loading">
                    <div className="aba-qr-spinner" />
                    <span>Connecting to ABA PayWay...</span>
                  </div>
                ) : (
                  <QRCodeCanvas
                    id="aba-payway-canvas"
                    ref={qrCanvasRef}
                    value={qrData.qrString}
                    size={220}
                    level="M"
                    includeMargin={false}
                    imageSettings={{
                      src: "https://www.ababank.com/fileadmin/user_upload/ABA_Mobile/aba-mobile-app-icon.png",
                      x: undefined,
                      y: undefined,
                      height: 40,
                      width: 40,
                      excavate: true
                    }}
                  />
                )}
              </div>

              {/* Timer / Expiration */}
              <div className="aba-timer-bar">
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span className="aba-pulse-dot" />
                  <span>Waiting for scan...</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Clock size={13} />
                  <span>Expires in: {formatTimer(timeLeft)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="aba-actions-row">
                <button
                  type="button"
                  className="aba-btn-action"
                  onClick={handleCopyQr}
                  disabled={!qrData?.qrString}
                >
                  {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                  <span>{copied ? "Copied" : "Copy QR"}</span>
                </button>

                <button
                  type="button"
                  className="aba-btn-action"
                  onClick={handleDownloadQr}
                  disabled={!qrData?.qrString}
                >
                  <Download size={14} />
                  <span>Save Image</span>
                </button>
              </div>

              {/* Deep Link to ABA Mobile */}
              {qrData?.abaDeepLink && (
                <button
                  type="button"
                  onClick={handleOpenAbaApp}
                  className="aba-btn-primary"
                  style={{ cursor: "pointer", width: "100%", textDecoration: "none", border: "none" }}
                >
                  <Smartphone size={16} /> Open in ABA Mobile App
                </button>
              )}

              {/* Sandbox Instant Simulation Button */}
              <button
                type="button"
                className="aba-dev-simulate-btn"
                onClick={handleSimulatePayment}
                disabled={isSimulating || (!qrData?.tranId && !qrData?.md5)}
                title="Simulate instant payment completion for demo testing"
              >
                <Sparkles size={12} />
                <span>{isSimulating ? "Simulating..." : "⚡ Fast Test: Simulate Scan"}</span>
              </button>
            </div>

            {/* Supported Apps Footer */}
            <div className="aba-banks-footer">
              <div className="aba-banks-title">Supported Payment Apps</div>
              <div className="aba-banks-icons">
                <span className="aba-bank-tag aba-highlight">ABA Mobile</span>
                <span className="aba-bank-tag">KHQR</span>
                <span className="aba-bank-tag">ACLEDA</span>
                <span className="aba-bank-tag">Wing Bank</span>
                <span className="aba-bank-tag">Bakong</span>
                <span className="aba-bank-tag">Canadia</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
