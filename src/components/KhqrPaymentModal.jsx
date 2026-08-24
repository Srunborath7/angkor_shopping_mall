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
  RefreshCw,
  ExternalLink,
  ShieldCheck
} from "lucide-react";
import confetti from "canvas-confetti";
import toast from "react-hot-toast";
import {
  generateKhqrApi,
  checkKhqrStatusApi,
  simulateKhqrPayApi
} from "../services/khqrPaymentService";
import "./KhqrPaymentModal.css";

export default function KhqrPaymentModal({
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

  // Generate KHQR payload
  const fetchKhqr = useCallback(async (curr = currency) => {
    setIsLoading(true);
    try {
      const res = await generateKhqrApi({
        orderId: orderId,
        amount: parseFloat(amount),
        currency: curr
      });

      const data = res?.data?.data || res?.data || res;
      setQrData(data);
      setTimeLeft(900);
      setIsLoading(false);
    } catch (err) {
      console.error("KHQR Generation Error:", err);
      toast.error(err.message || "Failed to generate Bakong KHQR");
      setIsLoading(false);
    }
  }, [orderId, amount, currency]);

  // Initial load on open
  useEffect(() => {
    if (isOpen && (orderId || amount > 0)) {
      setIsPaid(false);
      setPaidTxn(null);
      fetchKhqr(currency);
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isOpen, orderId, amount, fetchKhqr]);

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
    if (!isOpen || isPaid || !qrData?.md5) return;

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await checkKhqrStatusApi(qrData.md5);
        const result = res?.data?.data || res?.data || res;

        if (result?.isPaid || result?.status === "paid") {
          clearInterval(pollIntervalRef.current);
          clearInterval(timerIntervalRef.current);
          setIsPaid(true);
          setPaidTxn(result);

          // Trigger festive confetti celebration
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });

          toast.success("Payment Received via Bakong KHQR!");

          if (onSuccess) {
            setTimeout(() => {
              onSuccess(result?.orderId || orderId);
            }, 3000);
          }
        }
      } catch (err) {
        // Silent poll error handling
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
    fetchKhqr(newCurr);
  };

  // Copy raw QR payload string
  const handleCopyQr = () => {
    if (!qrData?.qrString) return;
    navigator.clipboard.writeText(qrData.qrString);
    setCopied(true);
    toast.success("KHQR string copied to clipboard");
    setTimeout(() => setCopied(false), 2500);
  };

  // Download QR Code image as PNG
  const handleDownloadQr = () => {
    const canvas = document.querySelector("#bakong-khqr-canvas");
    if (!canvas) return;

    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `KHQR-AngkorMall-${orderNumber || orderId || "payment"}.png`;
    link.href = url;
    link.click();
    toast.success("KHQR image downloaded");
  };

  // Simulate Instant Payment (Sandbox Demo)
  const handleSimulatePayment = async () => {
    setIsSimulating(true);
    try {
      const res = await simulateKhqrPayApi({
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

        toast.success("Instant Test Payment Confirmed!");
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
    <div className="khqr-modal-backdrop" onClick={onClose}>
      <div className="khqr-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* --- HEADER --- */}
        <div className="khqr-header">
          <div className="khqr-header-top">
            <div className="khqr-branding-badge">
              <span className="khqr-text-tag">KHQR</span>
              <span>BAKONG</span>
            </div>
            <button className="khqr-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          <div className="khqr-merchant-info">
            <h3 className="khqr-merchant-name">
              {qrData?.merchantName || "Angkor Shopping Mall"}
            </h3>
            <span className="khqr-order-tag">
              Order #{orderNumber || String(orderId).slice(-8).toUpperCase()}
            </span>
          </div>
        </div>

        {/* --- SUCCESS VIEW --- */}
        {isPaid ? (
          <div className="khqr-success-view">
            <div className="khqr-success-icon-wrap">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="khqr-success-title">Payment Successful!</h3>
            <p className="khqr-success-sub">
              Your payment has been verified via Bakong KHQR.
            </p>

            <div className="khqr-receipt-card">
              <div className="khqr-receipt-row">
                <span>Amount Paid:</span>
                <strong>{displayAmount}</strong>
              </div>
              <div className="khqr-receipt-row">
                <span>Payment Method:</span>
                <strong>Bakong KHQR (NBC)</strong>
              </div>
              {paidTxn?.transactionHash && (
                <div className="khqr-receipt-row">
                  <span>Txn Ref:</span>
                  <strong style={{ fontSize: "11px", wordBreak: "break-all" }}>
                    {paidTxn.transactionHash}
                  </strong>
                </div>
              )}
              <div className="khqr-receipt-row">
                <span>Status:</span>
                <strong style={{ color: "#16a34a" }}>PAID & CONFIRMED</strong>
              </div>
            </div>

            <button
              className="khqr-btn-primary"
              onClick={() => {
                if (onSuccess) onSuccess(orderId);
                onClose();
              }}
            >
              <Check size={16} /> Continue to Orders
            </button>
          </div>
        ) : (
          /* --- ACTIVE KHQR VIEW --- */
          <>
            {/* Amount & Currency Switcher */}
            <div className="khqr-amount-section">
              <div className="khqr-currency-pills">
                <button
                  type="button"
                  className={`khqr-curr-btn ${currency === "USD" ? "active" : ""}`}
                  onClick={() => handleCurrencyChange("USD")}
                >
                  USD ($)
                </button>
                <button
                  type="button"
                  className={`khqr-curr-btn ${currency === "KHR" ? "active" : ""}`}
                  onClick={() => handleCurrencyChange("KHR")}
                >
                  KHR (៛)
                </button>
              </div>

              <div className="khqr-amount-display">{displayAmount}</div>
              <span className="khqr-amount-sub">
                Scan with ABA, ACLEDA, Bakong, or any Cambodian banking app
              </span>
            </div>

            {/* QR Canvas */}
            <div className="khqr-body">
              <div className="khqr-qr-frame">
                {isLoading || !qrData?.qrString ? (
                  <div className="khqr-qr-loading">
                    <div className="khqr-qr-spinner" />
                    <span>Generating NBC KHQR...</span>
                  </div>
                ) : (
                  <QRCodeCanvas
                    id="bakong-khqr-canvas"
                    ref={qrCanvasRef}
                    value={qrData.qrString}
                    size={220}
                    level="M"
                    includeMargin={false}
                    imageSettings={{
                      src: "https://bakong.nbc.gov.kh/images/logo.svg",
                      x: undefined,
                      y: undefined,
                      height: 38,
                      width: 38,
                      excavate: true
                    }}
                  />
                )}
              </div>

              {/* Timer / Expiration */}
              <div className="khqr-timer-bar">
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span className="khqr-pulse-dot" />
                  <span>Waiting for scan...</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Clock size={13} />
                  <span>Expires in: {formatTimer(timeLeft)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="khqr-actions-row">
                <button
                  type="button"
                  className="khqr-btn-action"
                  onClick={handleCopyQr}
                  disabled={!qrData?.qrString}
                >
                  {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                  <span>{copied ? "Copied" : "Copy QR"}</span>
                </button>

                <button
                  type="button"
                  className="khqr-btn-action"
                  onClick={handleDownloadQr}
                  disabled={!qrData?.qrString}
                >
                  <Download size={14} />
                  <span>Save Image</span>
                </button>
              </div>

              {/* Deep Link to Bakong / Banking App */}
              {qrData?.bakongDeepLink && (
                <a
                  href={qrData.bakongDeepLink}
                  className="khqr-btn-primary"
                  style={{ textDecoration: "none" }}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Smartphone size={16} /> Open in Bakong App
                </a>
              )}

              {/* Sandbox Instant Simulation Button */}
              <button
                type="button"
                className="khqr-dev-simulate-btn"
                onClick={handleSimulatePayment}
                disabled={isSimulating || !qrData?.md5}
                title="Simulate instant payment completion for demo testing"
              >
                <Sparkles size={12} />
                <span>{isSimulating ? "Simulating..." : "⚡ Fast Test: Simulate Scan"}</span>
              </button>
            </div>

            {/* Supported Banks Strip */}
            <div className="khqr-banks-footer">
              <div className="khqr-banks-title">Supported Mobile Banking Apps</div>
              <div className="khqr-banks-icons">
                <span className="khqr-bank-tag aba">ABA Mobile</span>
                <span className="khqr-bank-tag acleda">ACLEDA</span>
                <span className="khqr-bank-tag wing">Wing Bank</span>
                <span className="khqr-bank-tag bakong">Bakong</span>
                <span className="khqr-bank-tag">Canadia</span>
                <span className="khqr-bank-tag">Sathapana</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
