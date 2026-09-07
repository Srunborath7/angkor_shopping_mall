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
  ShieldCheck,
  RefreshCw,
  CreditCard,
  QrCode,
  ExternalLink,
  AlertCircle,
  Zap
} from "lucide-react";
import confetti from "canvas-confetti";
import toast from "react-hot-toast";
import {
  generateAbaQrApi,
  checkAbaStatusApi,
  simulateAbaPayApi
} from "../services/abaPaymentService";
import "./AbaPaymentModal.css";

// Official ABA PayWay Sandbox Test Cards from Developer Suite
// https://developer.payway.com.kh/resources-3305682f0
export const ABA_TEST_CARDS = [
  {
    id: "mc-success",
    brand: "MasterCard",
    type: "MasterCard",
    cardNumber: "5156 8399 3770 6777",
    rawNumber: "5156839937706777",
    exp: "01/30",
    cvv: "993",
    status: "Success",
    threeDs: "No",
    threeDsDesc: "Direct Instant Approval (No 3DS)",
    bgGradient: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
    accentColor: "#f59e0b",
    isApproved: true,
    note: "Recommended for instant test approval. Enrolled in no 3DS."
  },
  {
    id: "visa-success",
    brand: "Visa Card",
    type: "Visa Card",
    cardNumber: "4286 0900 0000 0206",
    rawNumber: "4286090000000206",
    exp: "04/30",
    cvv: "777",
    status: "Success",
    threeDs: "Yes",
    threeDsDesc: "3DS Enrolled (Requires OTP)",
    bgGradient: "linear-gradient(135deg, #0369a1 0%, #0c4a6e 100%)",
    accentColor: "#38bdf8",
    isApproved: true,
    note: "Official test card for 3D Secure verified checkout."
  },
  {
    id: "mc-declined",
    brand: "MasterCard",
    type: "MasterCard",
    cardNumber: "5156 8302 7256 1029",
    rawNumber: "5156830272561029",
    exp: "04/30",
    cvv: "777",
    status: "Declined",
    threeDs: "Yes",
    threeDsDesc: "Declined (3DS Authentication)",
    bgGradient: "linear-gradient(135deg, #881337 0%, #4c0519 100%)",
    accentColor: "#f43f5e",
    isApproved: false,
    note: "Simulates card declined during 3DS security check."
  },
  {
    id: "visa-declined",
    brand: "Visa Card",
    type: "Visa Card",
    cardNumber: "4156 8399 3770 6777",
    rawNumber: "4156839937706777",
    exp: "01/30",
    cvv: "993",
    status: "Declined",
    threeDs: "No",
    threeDsDesc: "Declined by Issuer (No 3DS)",
    bgGradient: "linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%)",
    accentColor: "#ef4444",
    isApproved: false,
    note: "Simulates immediate rejection by card issuing bank."
  }
];

// Official Bakong KHQR Red Octagonal / Star Emblem in pure vector data URI
const BAKONG_EMBLEM_DATA_URI =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <circle cx="50" cy="50" r="49" fill="#ED1C24" stroke="#ffffff" stroke-width="2"/>
    <circle cx="50" cy="50" r="41" fill="none" stroke="#ffffff" stroke-width="2.5" opacity="0.6"/>
    <!-- 8-Pointed Star Motif -->
    <polygon points="50,18 58,35 76,28 69,45 86,50 69,55 76,72 58,65 50,82 42,65 24,72 31,55 14,50 31,45 24,28 42,35" 
      fill="none" stroke="#ffffff" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="50" cy="50" r="14" fill="none" stroke="#ffffff" stroke-width="4"/>
    <circle cx="50" cy="50" r="6" fill="#ffffff"/>
  </svg>
`);

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
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes countdown
  const [copied, setCopied] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [paidTxn, setPaidTxn] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  // Tab state: "khqr" or "cards"
  const [activeTab, setActiveTab] = useState("khqr");
  const [selectedCardId, setSelectedCardId] = useState("mc-success");
  const [cardCopiedField, setCardCopiedField] = useState(null);

  const selectedCard =
    ABA_TEST_CARDS.find((c) => c.id === selectedCardId) || ABA_TEST_CARDS[0];

  const qrCanvasRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Generate ABA PayWay Sandbox payload directly from backend API
  const fetchAbaQr = useCallback(async (curr = currency) => {
    setIsLoading(true);
    const currentBillNo = orderNumber || (orderId ? `ORD-${orderId}` : `ORD-${Date.now().toString().slice(-6)}`);
    const numAmount = parseFloat(amount) || 0;

    try {
      const res = await generateAbaQrApi({
        orderId: orderId,
        orderNumber: currentBillNo,
        amount: numAmount,
        currency: curr
      });
      const data = res?.data?.data || res?.data || res;

      const apiQr = data?.qrString || data?.qr_string || data?.abapay_qr || data?.qr;
      const merchantName = data?.merchantName || data?.merchant_name || "Angkor Shopping Mall";

      if (!apiQr) {
        throw new Error(data?.message || "Payment QR not returned by gateway API");
      }

      setQrData({
        ...data,
        qrString: apiQr,
        merchantName: merchantName,
        tranId: data?.tranId || data?.tran_id || `TXN-${Date.now()}`,
        md5: data?.md5 || `MD5-${Date.now()}`
      });
      setTimeLeft(120);
      setIsLoading(false);
    } catch (err) {
      console.error("Payment API Error:", err);
      const errMsg = err?.response?.data?.message || err?.message || "Failed to generate payment QR";
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
      toast.error(errMsg);
      setIsLoading(false);
    }
  }, [orderId, orderNumber, amount, currency]);

  // Initial load on open
  useEffect(() => {
    if (isOpen && (orderId || amount > 0)) {
      setIsPaid(false);
      setPaidTxn(null);
      setIsExpired(false);
      fetchAbaQr(currency);
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isOpen, orderId, amount, fetchAbaQr, currency]);

  // Countdown Timer
  useEffect(() => {
    if (!isOpen || isPaid || isExpired || !qrData) return;

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          setIsExpired(true);
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerIntervalRef.current);
  }, [isOpen, isPaid, isExpired, qrData]);

  // Polling for Payment Confirmation
  useEffect(() => {
    if (!isOpen || isPaid || isExpired) return;
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

          confetti({
            particleCount: 90,
            spread: 80,
            origin: { y: 0.6 }
          });

          toast.success("Payment Received via ABA KHQR!");

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
  }, [isOpen, isPaid, isExpired, qrData, orderId, onSuccess]);

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
    toast.success("ABA KHQR payload copied to clipboard");
    setTimeout(() => setCopied(false), 2500);
  };

  // Download QR Code image as PNG with the original standee design
  const handleDownloadQr = () => {
    const canvas = document.querySelector("#aba-payway-canvas");
    if (!canvas) return;

    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `ABA-KHQR-${orderNumber || orderId || "payment"}.png`;
    link.href = url;
    link.click();
    toast.success("ABA KHQR image downloaded");
  };

  // Check if current device is a mobile device
  const isMobileDevice = useCallback(() => {
    return (
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (typeof window !== "undefined" && window.innerWidth <= 768)
    );
  }, []);

  // Open ABA Mobile App directly on mobile or prompt scan on desktop
  const handleOpenAbaApp = (e) => {
    if (e) e.preventDefault();
    
    const deepLink =
      qrData?.abaDeepLink ||
      qrData?.abapay_deeplink ||
      qrData?.deep_link ||
      (qrData?.qrString
        ? `https://link.payway.com.kh/aba?qr=${encodeURIComponent(qrData.qrString)}`
        : `abamobilebank://`);

    const isMobile = isMobileDevice();

    if (isMobile) {
      toast.loading("Opening ABA Mobile...", { id: "aba-open", duration: 2000 });
      // Direct intent / deep-link to ABA Mobile
      window.location.href = deepLink;
    } else {
      handleCopyQr();
      toast("📱 On your phone, this opens ABA Mobile directly. On desktop, please scan the QR code.", {
        icon: "ℹ️",
        duration: 4500
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

        toast.success("⚡ Instant ABA KHQR Payment Confirmed!");
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

  // Copy individual card field
  const handleCopyCardField = (field, value) => {
    navigator.clipboard.writeText(value);
    setCardCopiedField(field);
    toast.success(`${field} copied: ${value}`);
    setTimeout(() => setCardCopiedField(null), 2000);
  };

  // Copy all details for the selected card
  const handleCopyAllCard = (card) => {
    const text = `Card Type: ${card.type}\nCard Number: ${card.cardNumber}\nExpiry: ${card.exp}\nCVV: ${card.cvv}\n3DS Enrolled: ${card.threeDs}\nExpected Status: ${card.status}`;
    navigator.clipboard.writeText(text);
    toast.success(`${card.brand} test credentials copied!`);
  };

  // Test Pay with this Card (Approved vs Declined simulation)
  const handlePayWithTestCard = async (card) => {
    if (!card.isApproved) {
      toast.error(
        `❌ Card Declined: ${card.brand} rejected by Sandbox Issuer (Error 51: Insufficient test funds or 3DS authentication blocked)`,
        { duration: 5000, icon: "⚠️" }
      );
      return;
    }

    setIsSimulating(true);
    try {
      const res = await simulateAbaPayApi({
        tran_id: qrData?.tranId,
        md5: qrData?.md5,
        orderId: orderId,
        payment_option: "cards",
        card_type: card.brand,
        card_number: card.rawNumber
      });

      const result = res?.data?.data || res?.data || res;
      setIsPaid(true);
      setPaidTxn({
        ...result,
        paymentMethod: `${card.brand} (PayWay Sandbox Card)`
      });

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });

      toast.success(`💳 Payment Approved with Sandbox ${card.brand}!`);
      if (onSuccess) {
        setTimeout(() => {
          onSuccess(result?.orderId || orderId);
        }, 2500);
      }
    } catch (err) {
      toast.error(err.message || "Card payment simulation failed");
    } finally {
      setIsSimulating(false);
    }
  };

  if (!isOpen) return null;

  const displayAmount =
    currency === "KHR"
      ? `${(parseFloat(amount) * 4100).toLocaleString()} ៛`
      : `$${parseFloat(amount).toFixed(2)}`;

  const accountOwner = qrData?.merchantName || qrData?.merchant_name || "Angkor Shopping Mall";

  return (
    <div className="aba-modal-backdrop" onClick={onClose}>
      <div className="aba-standee-container" onClick={(e) => e.stopPropagation()}>
        {/* Floating Close Button */}
        <button
          className="aba-standee-close-btn"
          onClick={onClose}
          aria-label="Close"
          title="Close"
        >
          <X size={18} />
        </button>

        {/* --- Top Navigation Tabs: KHQR vs Sandbox Test Cards --- */}
        {!isPaid && !isExpired && (
          <div className="aba-modal-nav-tabs">
            <button
              type="button"
              className={`aba-nav-tab ${activeTab === "khqr" ? "active" : ""}`}
              onClick={() => setActiveTab("khqr")}
            >
              <QrCode size={15} />
              <span>ABA' KHQR</span>
            </button>
            <button
              type="button"
              className={`aba-nav-tab ${activeTab === "cards" ? "active" : ""}`}
              onClick={() => setActiveTab("cards")}
            >
              <CreditCard size={15} />
              <span>Test Cards</span>
              <span className="aba-sandbox-badge">SANDBOX</span>
            </button>
          </div>
        )}

        {/* --- SUCCESS VIEW --- */}
        {isPaid ? (
          <div className="aba-success-view">
            <div className="aba-success-icon-wrap">
              <CheckCircle2 size={44} />
            </div>
            <h3 className="aba-success-title">Payment Successful!</h3>
            <p className="aba-success-sub">
              Your transaction has been verified via ABA Bank KHQR.
            </p>

            <div className="aba-receipt-card">
              <div className="aba-receipt-row">
                <span>Amount Paid:</span>
                <strong>{displayAmount}</strong>
              </div>
              <div className="aba-receipt-row">
                <span>Payment Method:</span>
                <strong>{paidTxn?.paymentMethod || "ABA Bank KHQR (Bakong)"}</strong>
              </div>
              <div className="aba-receipt-row">
                <span>Account Name:</span>
                <strong>{accountOwner}</strong>
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
                <strong style={{ color: "#16a34a" }}>PAID & VERIFIED</strong>
              </div>
            </div>

            <button
              className="aba-standee-primary-btn"
              onClick={() => {
                if (onSuccess) onSuccess(orderId);
                onClose();
              }}
            >
              <Check size={16} /> Continue to My Orders
            </button>
          </div>
        ) : isExpired ? (
          /* --- EXPIRED VIEW --- */
          <div className="aba-expired-view">
            <div className="aba-expired-icon-wrap">
              <Clock size={40} />
            </div>
            <h3 className="aba-expired-title">Payment QR Expired</h3>
            <p className="aba-expired-sub">
              The 2-minute QR payment session has expired.
            </p>

            <div className="aba-receipt-card" style={{ textAlign: "center" }}>
              <div className="aba-receipt-row">
                <span>Order:</span>
                <strong>#{orderNumber || String(orderId).slice(-8).toUpperCase()}</strong>
              </div>
              <div className="aba-receipt-row">
                <span>Amount:</span>
                <strong>{displayAmount}</strong>
              </div>
              <div className="aba-receipt-row">
                <span>Status:</span>
                <strong style={{ color: "#dc2626" }}>UNPAID / EXPIRED</strong>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", width: "100%" }}>
              <button
                className="aba-standee-primary-btn"
                onClick={() => fetchAbaQr(currency)}
                style={{ flex: 1 }}
              >
                <RefreshCw size={14} /> Refresh QR
              </button>
              <button
                className="aba-standee-secondary-btn"
                onClick={onClose}
                style={{ flex: 1 }}
              >
                Close
              </button>
            </div>
          </div>
        ) : activeTab === "cards" ? (
          /* --- SANDBOX TEST CARDS VIEW --- */
          <div className="aba-test-cards-body">
            {/* Top Info Banner with Developer Suite Link */}
            <div className="aba-test-cards-banner">
              <div className="aba-test-cards-banner-title">
                <ShieldCheck size={16} />
                <span>ABA PayWay Sandbox Cards</span>
              </div>
              <a
                href="https://developer.payway.com.kh/resources-3305682f0"
                target="_blank"
                rel="noreferrer"
                className="aba-test-cards-banner-link"
                title="View in PayWay Developer Suite"
              >
                <span>Developer Docs</span>
                <ExternalLink size={12} />
              </a>
            </div>

            {/* 4 Card Selector Buttons */}
            <div className="aba-cards-chips-row">
              {ABA_TEST_CARDS.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  className={`aba-card-chip-btn ${selectedCardId === card.id ? "active" : ""}`}
                  onClick={() => setSelectedCardId(card.id)}
                >
                  <div className="aba-card-chip-header">
                    <span className="aba-card-chip-name">{card.brand}</span>
                    <span className={`aba-card-chip-pill ${card.isApproved ? "success" : "declined"}`}>
                      {card.status}
                    </span>
                  </div>
                  <span className="aba-card-chip-sub">
                    {card.threeDs === "Yes" ? "3DS Enrolled" : "No 3DS"} • {card.cardNumber.slice(-4)}
                  </span>
                </button>
              ))}
            </div>

            {/* Realistic Virtual Credit Card Graphic */}
            <div className="aba-virtual-card-wrapper">
              <div
                className="aba-virtual-card"
                style={{ background: selectedCard.bgGradient }}
              >
                <div className="aba-card-top-row">
                  <div className="aba-card-chip-graphic" />
                  <div className="aba-card-brand-badge">
                    {selectedCard.brand === "MasterCard" ? (
                      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <svg width="32" height="20" viewBox="0 0 32 20" fill="none">
                          <circle cx="10" cy="10" r="10" fill="#EB001B" />
                          <circle cx="22" cy="10" r="10" fill="#F79E1B" fillOpacity="0.85" />
                        </svg>
                        <span style={{ fontSize: "12px", fontWeight: 800 }}>Mastercard</span>
                      </span>
                    ) : (
                      <span style={{ fontStyle: "italic", fontWeight: 900, letterSpacing: "1px", fontSize: "16px" }}>
                        VISA
                      </span>
                    )}
                  </div>
                </div>

                <div className="aba-card-number-wrap">
                  <span className="aba-card-number-text">{selectedCard.cardNumber}</span>
                  <button
                    type="button"
                    className="aba-card-copy-icon-btn"
                    onClick={() => handleCopyCardField("Card Number", selectedCard.rawNumber)}
                    title="Copy Card Number"
                  >
                    {cardCopiedField === "Card Number" ? <Check size={14} color="#4ade80" /> : <Copy size={14} />}
                  </button>
                </div>

                <div className="aba-card-meta-row">
                  <div className="aba-card-meta-col">
                    <span className="aba-card-meta-label">Cardholder</span>
                    <span className="aba-card-meta-value">VALUED CUSTOMER</span>
                  </div>

                  <div className="aba-card-meta-col">
                    <span className="aba-card-meta-label">Expires</span>
                    <span className="aba-card-meta-value">
                      {selectedCard.exp}
                      <button
                        type="button"
                        className="aba-card-copy-mini"
                        onClick={() => handleCopyCardField("Expiry", selectedCard.exp)}
                        title="Copy Expiry"
                      >
                        {cardCopiedField === "Expiry" ? <Check size={11} color="#4ade80" /> : <Copy size={11} />}
                      </button>
                    </span>
                  </div>

                  <div className="aba-card-meta-col">
                    <span className="aba-card-meta-label">CVV</span>
                    <span className="aba-card-meta-value">
                      {selectedCard.cvv}
                      <button
                        type="button"
                        className="aba-card-copy-mini"
                        onClick={() => handleCopyCardField("CVV", selectedCard.cvv)}
                        title="Copy CVV"
                      >
                        {cardCopiedField === "CVV" ? <Check size={11} color="#4ade80" /> : <Copy size={11} />}
                      </button>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Note regarding selected card behavior */}
            <div
              style={{
                fontSize: "12px",
                color: selectedCard.isApproved ? "#15803d" : "#b91c1c",
                background: selectedCard.isApproved ? "#f0fdf4" : "#fef2f2",
                padding: "9px 12px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                border: `1px solid ${selectedCard.isApproved ? "#bbf7d0" : "#fecaca"}`
              }}
            >
              {selectedCard.isApproved ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
              <span>
                <strong>{selectedCard.status} ({selectedCard.threeDsDesc}):</strong> {selectedCard.note}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="aba-card-actions-group">
              <button
                type="button"
                className={`aba-card-action-btn ${selectedCard.isApproved ? "primary" : "danger"}`}
                onClick={() => handlePayWithTestCard(selectedCard)}
                disabled={isSimulating}
              >
                {isSimulating ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Processing Sandbox Card...</span>
                  </>
                ) : selectedCard.isApproved ? (
                  <>
                    <Zap size={15} />
                    <span>Test Pay with this Card ({displayAmount})</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={15} />
                    <span>Simulate Card Decline Response</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="aba-card-action-btn secondary"
                onClick={() => handleCopyAllCard(selectedCard)}
              >
                <Copy size={14} />
                <span>Copy Full Card Details</span>
              </button>
            </div>

            {/* Quick Reference Table for all 4 cards */}
            <div className="aba-cards-table-card">
              <div className="aba-cards-table-head">
                <span>All Sandbox Test Cards (PayWay)</span>
                <span>Exp / CVV</span>
              </div>
              {ABA_TEST_CARDS.map((c) => (
                <div key={c.id} className="aba-cards-table-item">
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span className={`aba-card-chip-pill ${c.isApproved ? "success" : "declined"}`}>
                        {c.status}
                      </span>
                      <strong className="aba-table-card-num">{c.cardNumber}</strong>
                    </div>
                    <span className="aba-table-card-meta">{c.brand} ({c.threeDs === "Yes" ? "3DS" : "No 3DS"})</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#334155" }}>
                      {c.exp} • {c.cvv}
                    </span>
                    <button
                      type="button"
                      className="aba-card-copy-mini"
                      onClick={() => handleCopyCardField("Card Number", c.rawNumber)}
                      title="Copy Card Number"
                    >
                      {cardCopiedField === "Card Number" ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* --- ORIGINAL ABA KHQR STANDEE VIEW --- */
          <div className="aba-standee-body">
            {/* Top Brand Header: ABA' QR */}
            <div className="aba-standee-top-title">
              <span className="aba-text-main">ABA</span>
              <span className="aba-apostrophe">'</span>
              <span className="aba-text-qr">QR</span>
            </div>

            {/* Main White Standee Card */}
            <div className="aba-white-card">
              {/* Red KHQR Top Banner with Angled Corner */}
              <div className="aba-khqr-banner">
                <div className="aba-khqr-logo-wrap">
                  {/* Official stylized KHQR typography */}
                  <span className="khqr-logo-text">KHQR</span>
                </div>
              </div>

              {/* Account / Merchant Name */}
              <div className="aba-account-name">{accountOwner}</div>

              {/* Dashed Separator */}
              <div className="aba-card-dashed-line" />

              {/* QR Code Canvas (Clickable to open ABA on mobile) */}
              <div
                className="aba-qr-code-area"
                onClick={handleOpenAbaApp}
                title="Click or tap to open in ABA Mobile"
                style={{ cursor: "pointer" }}
              >
                {isLoading || !qrData?.qrString ? (
                  <div className="aba-qr-loading">
                    <div className="aba-qr-spinner" />
                    <span>Connecting to ABA PayWay...</span>
                  </div>
                ) : (
                  <div className="aba-qr-canvas-wrapper">
                    <QRCodeCanvas
                      id="aba-payway-canvas"
                      ref={qrCanvasRef}
                      value={qrData.qrString}
                      size={210}
                      level="M"
                      includeMargin={false}
                      imageSettings={{
                        src: BAKONG_EMBLEM_DATA_URI,
                        x: undefined,
                        y: undefined,
                        height: 42,
                        width: 42,
                        excavate: true
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Direct Open in ABA Mobile Button (Instant Deep Link) */}
            <button
              type="button"
              onClick={handleOpenAbaApp}
              className="aba-mobile-direct-btn"
            >
              <Smartphone size={16} />
              <span>Direct Pay with ABA Mobile App</span>
            </button>

            {/* Interactive Currency Switch & Order Amount Display */}
            <div className="aba-order-interactive-bar">
              <div className="aba-curr-pill-selector">
                <button
                  type="button"
                  className={`aba-curr-pill ${currency === "USD" ? "active" : ""}`}
                  onClick={() => handleCurrencyChange("USD")}
                >
                  $ USD
                </button>
                <button
                  type="button"
                  className={`aba-curr-pill ${currency === "KHR" ? "active" : ""}`}
                  onClick={() => handleCurrencyChange("KHR")}
                >
                  ៛ KHR
                </button>
              </div>

              <div className="aba-payable-amount">
                <span className="aba-payable-label">Total to Pay:</span>
                <span className="aba-payable-val">{displayAmount}</span>
              </div>
            </div>

            {/* Timer & Scan Status */}
            <div className="aba-scan-status-strip">
              <div className="aba-status-live">
                <span className="aba-live-pulse" />
                <span>Tap or scan with ABA Mobile / KHQR</span>
              </div>
              <div className="aba-status-timer">
                <Clock size={12} />
                <span>{formatTimer(timeLeft)}</span>
              </div>
            </div>

            {/* Action Bar (Copy, Download) */}
            <div className="aba-actions-grid">
              <button
                type="button"
                className="aba-mini-action-btn"
                onClick={handleCopyQr}
                disabled={!qrData?.qrString}
              >
                {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                <span>{copied ? "Copied" : "Copy QR"}</span>
              </button>

              <button
                type="button"
                className="aba-mini-action-btn"
                onClick={handleDownloadQr}
                disabled={!qrData?.qrString}
              >
                <Download size={14} />
                <span>Save Image</span>
              </button>
            </div>

            {/* Fast Test Simulation for Demo */}
            <button
              type="button"
              className="aba-simulation-button"
              onClick={handleSimulatePayment}
              disabled={isSimulating}
              title="Simulate instant payment completion for demo testing"
            >
              <Sparkles size={12} />
              <span>{isSimulating ? "Simulating..." : "⚡ Fast Demo: Simulate KHQR Scan"}</span>
            </button>

            {/* Switch to Test Cards Hint Button */}
            <button
              type="button"
              className="aba-test-cards-hint-btn"
              onClick={() => setActiveTab("cards")}
              title="Switch to ABA PayWay Sandbox Test Cards"
            >
              <CreditCard size={14} />
              <span>Need test cards? View ABA PayWay Sandbox Cards &rarr;</span>
            </button>

            {/* Official ABA Bank Footer Strip */}
            <div className="aba-standee-footer">
              <div className="aba-footer-left">
                <span className="aba-bank-name">ABA</span>
                <span className="aba-bank-apostrophe">'</span>
                <span className="aba-bank-suffix">BANK</span>
              </div>
              <div className="aba-footer-divider" />
              <div className="aba-footer-right">
                {/* Stylized Red Flag Motif */}
                <svg
                  className="aba-flag-icon"
                  viewBox="0 0 24 16"
                  width="18"
                  height="12"
                  fill="#ED1C24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M0 2h10l-2 6 2 6H0l2-6-2-6zm12 0h12l-2 6 2 6H12l2-6-2-6z" />
                </svg>
                <span className="aba-group-text">NATIONAL BANK OF CANADA GROUP</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

