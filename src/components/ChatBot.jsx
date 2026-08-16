import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  MessageCircle,
  Bot,
  Sparkles,
  X,
  Send,
  Trash2,
  Minimize2,
  Maximize2,
  ShoppingBag,
  Repeat,
  Flame,
  Package,
  HelpCircle,
  CreditCard,
  ChevronRight,
  ShoppingCart,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Star,
  CheckCircle2,
  Clock,
  Truck,
  ExternalLink,
  RefreshCw,
  Mail,
  Phone,
  User as UserIcon,
  Headphones,
  Check,
  AlertCircle
} from "lucide-react";
import { sendChatMessageApi, getChatbotPromptsApi } from "../services/chatbotService";
import { addToCartApi } from "../services/cartService";
import {
  sendSupportMessageApi,
  getMySupportMessagesApi,
  trackSupportMessagesApi
} from "../services/supportMessageService";
import "./ChatBot.css";

const DEFAULT_QUICK_CHIPS = [
  { label: "⚡ Flash Sales", query: "What are today's flash sales and deals?" },
  { label: "📱 Phones under $500", query: "Show me smartphones under $500" },
  { label: "💻 Laptops & PC", query: "Find top performance laptops" },
  { label: "🔄 Device Trade-In", query: "How does device trade-in work?" },
  { label: "✉️ Message Admin", query: "I want to contact admin and support" },
  { label: "📦 Track My Order", query: "Where is my order?" },
  { label: "💳 Payment Methods", query: "What payment methods are supported?" }
];

const INITIAL_MESSAGES = [
  {
    id: 1,
    sender: "bot",
    text: "👋 Hello! Welcome to **Angkor Shopping Mall**! I'm your **Smart AI Shopping Assistant**.\n\nHow can I help you today? You can search for products, check flash deals, track your orders, or send a direct message to our store admins.",
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    actions: [
      { label: "⚡ Flash Sales", path: "/shop?flashSale=true", icon: Flame },
      { label: "🛍️ Browse Shop", path: "/shop", icon: ShoppingBag },
      { label: "✉️ Message Admin", actionType: "contact_admin", icon: Headphones },
      { label: "🔄 Trade-In Hub", path: "/trading", icon: Repeat },
      { label: "✨ AI Recommendations", path: "/recommendations", icon: Sparkles }
    ],
    suggestedPrompts: [
      "What are today's flash sales?",
      "Find smartphones under $500",
      "How to contact store admin?",
      "Where is my order?"
    ]
  }
];

function ChatBot() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useSelector((state) => state.auth);
  const isLoggedIn = !!auth?.token;
  const user = auth?.user;

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCallout, setShowCallout] = useState(true);
  const [showContactModal, setShowContactModal] = useState(false);
  const [activeTab, setActiveTab] = useState("chat"); // "chat" | "tickets"
  const [myTickets, setMyTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Contact Admin Form State
  const [contactForm, setContactForm] = useState({
    sender_name: user?.name || "",
    sender_email: user?.email || "",
    sender_phone: user?.phone || "",
    subject: "Product Inquiry",
    message: ""
  });
  const [sendingSupport, setSendingSupport] = useState(false);

  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem("angkor_ai_chat_history");
      return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
    } catch {
      return INITIAL_MESSAGES;
    }
  });

  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chips, setChips] = useState(DEFAULT_QUICK_CHIPS);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [addingCartId, setAddingCartId] = useState(null);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Update contact form when user logs in
  useEffect(() => {
    if (user) {
      setContactForm((prev) => ({
        ...prev,
        sender_name: prev.sender_name || user.name || "",
        sender_email: prev.sender_email || user.email || "",
        sender_phone: prev.sender_phone || user.phone || ""
      }));
    }
  }, [user]);

  // Extract contextual product ID if viewing /product/:id
  const getContext = () => {
    const match = location.pathname.match(/\/product\/([a-zA-Z0-9_-]+)/);
    const productId = match ? match[1] : null;
    return {
      page: location.pathname,
      productId: productId
    };
  };

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && activeTab === "chat") {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping, activeTab]);

  // Persist messages in session
  useEffect(() => {
    try {
      sessionStorage.setItem("angkor_ai_chat_history", JSON.stringify(messages));
    } catch (e) {
      console.error(e);
    }
  }, [messages]);

  // Fetch dynamic quick prompts on mount
  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const res = await getChatbotPromptsApi();
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          setChips(res.data);
        }
      } catch (err) {
        // use default chips
      }
    };
    fetchPrompts();
  }, []);

  const [newRepliesCount, setNewRepliesCount] = useState(0);

  // Fetch user's support tickets (both logged-in user & guest tracked IDs)
  const fetchUserTickets = async () => {
    setLoadingTickets(true);
    try {
      let tickets = [];
      const storedIds = JSON.parse(localStorage.getItem("angkor_guest_ticket_ids") || "[]");

      if (isLoggedIn) {
        try {
          const res = await getMySupportMessagesApi();
          const list = res?.data || res || [];
          if (Array.isArray(list)) tickets = [...list];
        } catch (e) {
          // ignore
        }
      }

      if (storedIds.length > 0) {
        try {
          const trackRes = await trackSupportMessagesApi({ ids: storedIds });
          const trackList = trackRes?.data || trackRes || [];
          if (Array.isArray(trackList)) {
            const existingIds = new Set(tickets.map((t) => t.id));
            for (const t of trackList) {
              if (!existingIds.has(t.id)) {
                tickets.push(t);
                existingIds.add(t.id);
              }
            }
          }
        } catch (e) {
          // ignore
        }
      }

      // Sort newest first
      tickets.sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt));
      setMyTickets(tickets);

      // Calculate new admin replies count
      const replied = tickets.filter((t) => t.status === "replied" && t.admin_reply).length;
      setNewRepliesCount(replied);
    } catch (err) {
      console.error("Tickets fetch error:", err);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    fetchUserTickets();
    // Live polling every 10 seconds so user receives admin replies in real time
    const interval = setInterval(fetchUserTickets, 10000);
    return () => clearInterval(interval);
  }, [isLoggedIn, activeTab]);

  // Listen to open-chatbot-tickets trigger from Header notification dropdown
  useEffect(() => {
    const handleOpenTickets = () => {
      setIsOpen(true);
      setActiveTab("tickets");
      fetchUserTickets();
    };
    window.addEventListener("open-chatbot-tickets", handleOpenTickets);
    return () => window.removeEventListener("open-chatbot-tickets", handleOpenTickets);
  }, []);

  // Hide callout after 15s automatically
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCallout(false);
    }, 15000);
    return () => clearTimeout(timer);
  }, []);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputVal(transcript);
          handleSend(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = (err) => {
        console.warn("Speech recognition error:", err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const [preferredVoiceLang, setPreferredVoiceLang] = useState(() => {
    return localStorage.getItem("angkor_preferred_voice_lang") || "km";
  });

  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const [speakingLang, setSpeakingLang] = useState(null);

  // Stop currently playing voice
  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMsgId(null);
    setSpeakingLang(null);
  };

  // Dual-Language Speech Synthesis (Khmer and English)
  const speakTextDual = (id, text, lang = "en") => {
    if (!window.speechSynthesis) {
      toast.error("Speech synthesis is not supported in this browser.");
      return;
    }

    if (speakingMsgId === id && speakingLang === lang) {
      stopSpeaking();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(id);
      setSpeakingLang(lang);

      let clean = text
        .replace(/[*#_`~]/g, "")
        .replace(/https?:\/\/\S+/g, "")
        .replace(/[\n\r]+/g, " ");

      const utterance = new SpeechSynthesisUtterance(clean.slice(0, 350));
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();

      if (lang === "km") {
        utterance.lang = "km-KH";
        const khVoice = voices.find(
          (v) =>
            v.lang.includes("km") ||
            v.lang.includes("kh") ||
            v.name.toLowerCase().includes("khmer")
        );
        if (khVoice) utterance.voice = khVoice;
      } else {
        utterance.lang = "en-US";
        const enVoice = voices.find(
          (v) =>
            v.lang.startsWith("en") &&
            (v.name.includes("Natural") ||
              v.name.includes("Google") ||
              v.name.includes("Samantha") ||
              v.name.includes("David"))
        );
        if (enVoice) utterance.voice = enVoice;
      }

      utterance.onend = () => {
        setSpeakingMsgId(null);
        setSpeakingLang(null);
      };

      utterance.onerror = () => {
        setSpeakingMsgId(null);
        setSpeakingLang(null);
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech error:", e);
      setSpeakingMsgId(null);
      setSpeakingLang(null);
    }
  };

  // Switch tab and automatically clear unread replies count
  const handleSwitchTab = (tab) => {
    setActiveTab(tab);
    if (tab === "tickets" && myTickets.length > 0) {
      const readReplyIds = JSON.parse(localStorage.getItem("angkor_read_reply_ids") || "[]");
      const allIds = myTickets.map((t) => t.id);
      const updated = Array.from(new Set([...readReplyIds, ...allIds]));
      localStorage.setItem("angkor_read_reply_ids", JSON.stringify(updated));
      setNewRepliesCount(0);
      window.dispatchEvent(new Event("support-replies-read"));
    }
  };

  // Switch voice language with immediate sound feedback in that language
  const handleSelectVoiceLanguage = (nextLang) => {
    setPreferredVoiceLang(nextLang);
    localStorage.setItem("angkor_preferred_voice_lang", nextLang);
    setIsVoiceEnabled(true);

    if (nextLang === "km") {
      toast.success("🇰🇭 បានជ្រើសរើសសំឡេងខ្មែរ (Khmer Voice)");
      speakTextDual(
        "lang_switch_km",
        "សូមស្វាគមន៍មកកាន់ Angkor Shopping Mall! តើខ្ញុំអាចជួយអ្វីដល់លោកអ្នកបានថ្ងៃនេះ?",
        "km"
      );
    } else {
      toast.success("🇺🇸 English Voice Activated");
      speakTextDual(
        "lang_switch_en",
        "Welcome to Angkor Shopping Mall! How can I assist you today?",
        "en"
      );
    }
  };

  // Toggle voice playback mute/unmute
  const handleToggleVoicePlayback = () => {
    const next = !isVoiceEnabled;
    setIsVoiceEnabled(next);
    if (!next) {
      stopSpeaking();
      toast("🔇 Voice output muted", { icon: "🔇" });
    } else {
      toast.success("🔊 Voice output enabled");
      if (preferredVoiceLang === "km") {
        speakTextDual("voice_on_km", "បានបើកសំឡេង AI ជាភាសាខ្មែរ។", "km");
      } else {
        speakTextDual("voice_on_en", "AI Voice output is now enabled in English.", "en");
      }
    }
  };

  const handleToggleVoiceMic = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        recognitionRef.current.stop();
      }
    }
  };

  const handleClearHistory = () => {
    setMessages(INITIAL_MESSAGES);
    sessionStorage.removeItem("angkor_ai_chat_history");
    toast.success("Chat history cleared");
  };

  const handleActionClick = (act) => {
    if (typeof act === "string") {
      navigate(act);
      if (window.innerWidth <= 640) setIsOpen(false);
      return;
    }

    if (act.actionType === "contact_admin") {
      const lastUserMsg = [...messages].reverse().find((m) => m.sender === "user");
      if (lastUserMsg && lastUserMsg.text && !contactForm.message) {
        setContactForm((prev) => ({
          ...prev,
          message: lastUserMsg.text
        }));
      }
      setShowContactModal(true);
      return;
    }

    if (act.path) {
      navigate(act.path);
      if (window.innerWidth <= 640) {
        setIsOpen(false);
      }
    }
  };

  // Add product to cart directly from chatbot product card
  const handleQuickAddToCart = async (product) => {
    setAddingCartId(product.id);
    try {
      if (isLoggedIn) {
        await addToCartApi(product.id, 1);
        window.dispatchEvent(new Event("cart-updated"));
        toast.success(`"${product.name}" added to cart!`);
      } else {
        const guestCart = JSON.parse(localStorage.getItem("guestCart") || "[]");
        const existingIdx = guestCart.findIndex((item) => item.product_id === product.id);

        if (existingIdx > -1) {
          guestCart[existingIdx].quantity += 1;
        } else {
          guestCart.push({
            id: `guest_${Date.now()}`,
            product_id: product.id,
            quantity: 1,
            product: {
              id: product.id,
              name: product.name,
              price: product.price,
              images: product.image_url ? [{ image_url: product.image_url }] : []
            }
          });
        }
        localStorage.setItem("guestCart", JSON.stringify(guestCart));
        localStorage.setItem("cartCount", guestCart.reduce((sum, i) => sum + i.quantity, 0).toString());
        window.dispatchEvent(new Event("cart-updated"));
        toast.success(`"${product.name}" added to cart!`);
      }
    } catch (error) {
      console.error("Cart error:", error);
      toast.error("Failed to add product to cart.");
    } finally {
      setAddingCartId(null);
    }
  };

  const handleSend = async (customQuery = null) => {
    const text = (customQuery || inputVal).trim();
    if (!text) return;

    const userMsg = {
      id: Date.now(),
      sender: "user",
      text: text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customQuery) setInputVal("");
    setIsTyping(true);

    try {
      const context = getContext();
      const res = await sendChatMessageApi(text, context);
      const data = res?.data || {};

      const botReply = {
        id: Date.now() + 1,
        sender: "bot",
        text: data.replyText || "I'm here to help you shop! Let me know what you need.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actions: data.actions || [],
        products: data.products || [],
        orders: data.orders || []
      };

      if (isVoiceEnabled) {
        speakTextDual(botReply.id, botReply.text, preferredVoiceLang);
      }
    } catch (err) {
      console.error("Chatbot API error:", err);
      const fallbackReply = {
        id: Date.now() + 1,
        sender: "bot",
        text: `🔍 I'm searching our store for "${text}". You can explore active deals, view product catalog, or contact admin below:`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actions: [
          { label: "✉️ Message Admin", actionType: "contact_admin", icon: Headphones },
          { label: "Browse Shop", path: `/shop?search=${encodeURIComponent(text)}`, icon: ShoppingBag },
          { label: "Flash Sales", path: "/shop?flashSale=true", icon: Flame }
        ]
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setIsTyping(false);
    }
  };

  // Submit Contact Admin Form
  const handleSubmitSupport = async (e) => {
    e.preventDefault();
    if (!contactForm.message.trim()) {
      toast.error("Please describe your message or question.");
      return;
    }

    setSendingSupport(true);
    try {
      const res = await sendSupportMessageApi(contactForm);
      const newTicketId = res?.data?.id || res?.id;
      if (newTicketId) {
        const stored = JSON.parse(localStorage.getItem("angkor_guest_ticket_ids") || "[]");
        if (!stored.includes(newTicketId)) {
          stored.push(newTicketId);
          localStorage.setItem("angkor_guest_ticket_ids", JSON.stringify(stored));
        }
      }

      toast.success("Message sent to Admin successfully!");
      setShowContactModal(false);

      // Post notification bubble into chat
      const confirmMsg = {
        id: Date.now(),
        sender: "bot",
        text: `✅ **Support Ticket Delivered to Admin!**\n\n• **Subject**: ${contactForm.subject}\n• **From**: ${contactForm.sender_name} (${contactForm.sender_email || contactForm.sender_phone || "Store Guest"})\n\nOur store support team has received your message and will reply promptly. You can track admin replies in the **Admin Messages** tab!`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actions: [
          { label: "🛍️ Continue Shopping", path: "/shop", icon: ShoppingBag },
          { label: "📦 My Orders", path: "/orders", icon: Package }
        ]
      };

      setMessages((prev) => [...prev, confirmMsg]);
      setContactForm((prev) => ({ ...prev, message: "" }));
      fetchUserTickets();
    } catch (error) {
      console.error("Support send error:", error);
      toast.error("Failed to send message to admin.");
    } finally {
      setSendingSupport(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Render Order Card
  const renderOrderCard = (order) => {
    const status = (order.status || "pending").toLowerCase();
    const steps = [
      { key: "placed", label: "Placed", done: true },
      { key: "paid", label: "Paid", done: ["paid", "shipped", "completed"].includes(status) },
      { key: "shipped", label: "Shipped", done: ["shipped", "completed"].includes(status) },
      { key: "completed", label: "Delivered", done: status === "completed" }
    ];

    return (
      <div key={order.id} className="chatbot-order-card">
        <div className="chatbot-order-header">
          <div className="chatbot-order-id-block">
            <span className="chatbot-order-badge">{status.toUpperCase()}</span>
            <strong>Order #{order.short_id || order.id?.slice(0, 8)}</strong>
          </div>
          <span className="chatbot-order-price">${order.total_amount}</span>
        </div>

        <div className="chatbot-stepper">
          {steps.map((s, idx) => (
            <div key={s.key} className={`chatbot-step-item ${s.done ? "active" : ""}`}>
              <div className="chatbot-step-circle">
                {s.done ? <CheckCircle2 size={12} /> : <Clock size={12} />}
              </div>
              <span className="chatbot-step-label">{s.label}</span>
              {idx < steps.length - 1 && (
                <div className={`chatbot-step-line ${steps[idx + 1].done ? "filled" : ""}`} />
              )}
            </div>
          ))}
        </div>

        <div className="chatbot-order-footer">
          <span className="chatbot-order-info">
            {order.item_count} item(s) • {order.shipping_address || "Phnom Penh"}
          </span>
          <button
            type="button"
            className="chatbot-order-view-btn"
            onClick={() => handleActionClick("/orders")}
          >
            Track in Orders <ExternalLink size={12} />
          </button>
        </div>
      </div>
    );
  };

  // Render Product Card
  const renderProductCard = (product) => {
    const isFlash = product.is_flash_sale || product.discount_percentage > 0;
    const isAdding = addingCartId === product.id;

    return (
      <div key={product.id} className="chatbot-product-card">
        <div className="chatbot-product-img-wrap" onClick={() => handleActionClick(`/product/${product.id}`)}>
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="chatbot-product-img" />
          ) : (
            <div className="chatbot-product-img-placeholder">
              <ShoppingBag size={28} />
            </div>
          )}
          {isFlash && (
            <span className="chatbot-product-discount-tag">
              {product.badge || `${product.discount_percentage}% OFF`}
            </span>
          )}
        </div>

        <div className="chatbot-product-details">
          <h4
            className="chatbot-product-title"
            title={product.name}
            onClick={() => handleActionClick(`/product/${product.id}`)}
          >
            {product.name}
          </h4>

          <div className="chatbot-product-meta-row">
            <span className="chatbot-product-brand">{product.brand_name || product.category_name || "Official"}</span>
            {product.rating && (
              <span className="chatbot-product-rating">
                <Star size={11} fill="#f59e0b" color="#f59e0b" /> {product.rating}
              </span>
            )}
          </div>

          <div className="chatbot-product-price-row">
            <div className="chatbot-product-prices">
              <span className="chatbot-product-current-price">
                ${typeof product.price === "number" ? product.price.toFixed(2) : product.price}
              </span>
              {product.original_price > product.price && (
                <span className="chatbot-product-old-price">${product.original_price.toFixed(2)}</span>
              )}
            </div>

            <button
              type="button"
              className="chatbot-card-add-cart-btn"
              onClick={() => handleQuickAddToCart(product)}
              disabled={isAdding || product.in_stock === false}
              title={product.in_stock === false ? "Out of Stock" : "Add to Cart"}
            >
              <ShoppingCart size={13} />
              {isAdding ? "Adding..." : "Add"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Floating Trigger Container */}
      <div className="chatbot-trigger-container" aria-label="Angkor AI Assistant">
        {!isOpen && showCallout && (
          <div
            className="chatbot-greeting-callout"
            onClick={() => {
              setIsOpen(true);
              setShowCallout(false);
            }}
          >
            <div className="chatbot-callout-avatar">
              <Bot size={16} />
            </div>
            <div className="chatbot-callout-content">
              <strong>Angkor AI Assistant</strong>
              <span>👋 Ask me anything or message admin!</span>
            </div>
            <button
              type="button"
              className="chatbot-greeting-close"
              onClick={(e) => {
                e.stopPropagation();
                setShowCallout(false);
              }}
              aria-label="Close message"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Floating Action Button */}
        <button
          type="button"
          className={`chatbot-fab-btn ${isOpen ? "active" : ""}`}
          onClick={() => {
            setIsOpen(!isOpen);
            setShowCallout(false);
          }}
          aria-label={isOpen ? "Close AI Chatbot" : "Open AI Chatbot"}
          title="Angkor AI Shopping Assistant"
        >
          <div className="chatbot-fab-pulse" />
          {isOpen ? <X size={24} /> : <Bot size={26} />}
          {newRepliesCount > 0 && !isOpen && (
            <span className="chatbot-fab-reply-pill">{newRepliesCount}</span>
          )}
          <span className="chatbot-online-dot" />
        </button>
      </div>

      {/* Main Interactive Chatbot Window */}
      {isOpen && (
        <div
          className={`chatbot-window ${isExpanded ? "expanded" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label="AI Shopping Assistant"
        >
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar-container">
                <Bot size={22} />
              </div>
              <div className="chatbot-header-text">
                <div className="chatbot-header-title-row">
                  <h3>Angkor AI Assistant</h3>
                  <span className="chatbot-badge-smart">OpenAI 2.0</span>
                </div>
                <div className="chatbot-status-row">
                  <span className="chatbot-live-dot" />
                  <span>Smart Assistant • Active 24/7</span>
                </div>
              </div>
            </div>
            <div className="chatbot-header-actions">
              {/* Message Admin Direct Button */}
              <button
                type="button"
                className={`chatbot-header-btn ${showContactModal ? "active-tool" : ""}`}
                onClick={() => setShowContactModal(!showContactModal)}
                title="Message Admin / Customer Support"
                aria-label="Message admin"
              >
                <Headphones size={16} />
              </button>

              {/* Language Selector for Voice with Spoken Sound Feedback */}
              <div className="chatbot-lang-segmented-control" title="Choose AI Voice Language (Khmer / English)">
                <button
                  type="button"
                  className={`btn-lang-segment ${preferredVoiceLang === "km" ? "active" : ""}`}
                  onClick={() => handleSelectVoiceLanguage("km")}
                  aria-label="Khmer Voice"
                >
                  🇰🇭 ខ្មែរ
                </button>
                <button
                  type="button"
                  className={`btn-lang-segment ${preferredVoiceLang === "en" ? "active" : ""}`}
                  onClick={() => handleSelectVoiceLanguage("en")}
                  aria-label="English Voice"
                >
                  🇺🇸 ENG
                </button>
              </div>

              {/* Voice playback toggle */}
              <button
                type="button"
                className={`chatbot-header-btn ${isVoiceEnabled ? "active-tool" : ""}`}
                onClick={handleToggleVoicePlayback}
                title={isVoiceEnabled ? "Mute Bot Voice" : "Enable Bot Voice"}
                aria-label="Toggle voice"
              >
                {isVoiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>

              {/* Expand / Minimize toggle */}
              <button
                type="button"
                className="chatbot-header-btn"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Standard View" : "Expand Window"}
                aria-label="Resize"
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>

              {/* Clear History */}
              <button
                type="button"
                className="chatbot-header-btn"
                onClick={handleClearHistory}
                title="Clear Chat History"
                aria-label="Clear chat"
              >
                <Trash2 size={16} />
              </button>

              {/* Close */}
              <button
                type="button"
                className="chatbot-header-btn close-btn"
                onClick={() => setIsOpen(false)}
                title="Close Chat"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Sub Navigation Bar for Chat vs My Tickets */}
          <div className="chatbot-tab-nav">
            <button
              type="button"
              className={`chatbot-tab-btn ${activeTab === "chat" ? "active" : ""}`}
              onClick={() => handleSwitchTab("chat")}
            >
              <Sparkles size={13} /> AI Assistant
            </button>
            <button
              type="button"
              className={`chatbot-tab-btn ${activeTab === "tickets" ? "active" : ""}`}
              onClick={() => handleSwitchTab("tickets")}
            >
              <Headphones size={13} /> Admin Messages
              {newRepliesCount > 0 && (
                <span className="chatbot-tab-reply-count">{newRepliesCount}</span>
              )}
            </button>
            <button
              type="button"
              className="chatbot-tab-btn highlight"
              onClick={() => setShowContactModal(true)}
            >
              <Mail size={13} /> + Contact Admin
            </button>
          </div>

          {/* Tab 1: AI Chat Assistant */}
          {activeTab === "chat" && (
            <>
              {/* Quick Suggestions Chips Bar */}
              <div className="chatbot-chips-bar">
                {chips.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="chatbot-chip"
                    onClick={() => handleSend(chip.query || chip.label)}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Messages Stream */}
              <div className="chatbot-messages">
                {messages.map((msg) => (
                  <div key={msg.id} className={`chatbot-message-row ${msg.sender}`}>
                    {msg.sender === "bot" && (
                      <div className="chatbot-msg-avatar">
                        <Sparkles size={14} />
                      </div>
                    )}

                    <div className="chatbot-bubble">
                      <div className="chatbot-text-content">
                        {msg.text.split("\n").map((line, lIdx) => {
                          if (!line.trim()) return <div key={lIdx} style={{ height: "6px" }} />;

                          const parts = line.split(/(\*\*.*?\*\*)/g);
                          return (
                            <div key={lIdx} className="chatbot-text-line">
                              {parts.map((p, pIdx) => {
                                if (p.startsWith("**") && p.endsWith("**")) {
                                  return <strong key={pIdx}>{p.slice(2, -2)}</strong>;
                                }
                                return p;
                              })}
                            </div>
                          );
                        })}
                      </div>

                      {/* Dual-Language Voice Playback Bar (Khmer & English) */}
                      {msg.sender === "bot" && (
                        <div className="chatbot-voice-lang-bar">
                          <button
                            type="button"
                            className={`btn-voice-lang ${speakingMsgId === msg.id && speakingLang === "km" ? "speaking" : ""}`}
                            onClick={() => speakTextDual(msg.id, msg.text, "km")}
                            title="ស្តាប់ជាភាសាខ្មែរ (Listen in Khmer)"
                          >
                            <Volume2 size={11} />
                            <span>🇰🇭 ស្តាប់ (Khmer)</span>
                          </button>
                          <button
                            type="button"
                            className={`btn-voice-lang ${speakingMsgId === msg.id && speakingLang === "en" ? "speaking" : ""}`}
                            onClick={() => speakTextDual(msg.id, msg.text, "en")}
                            title="Listen in English"
                          >
                            <Volume2 size={11} />
                            <span>🇺🇸 Listen (EN)</span>
                          </button>
                        </div>
                      )}

                      {/* Rich Product Cards Carousel */}
                      {msg.products && msg.products.length > 0 && (
                        <div className="chatbot-products-carousel">
                          {msg.products.map((prod) => renderProductCard(prod))}
                        </div>
                      )}

                      {/* Order Tracking Cards */}
                      {msg.orders && msg.orders.length > 0 && (
                        <div className="chatbot-orders-list">
                          {msg.orders.map((ord) => renderOrderCard(ord))}
                        </div>
                      )}

                      {/* Interactive Action Links */}
                      {msg.actions && msg.actions.length > 0 && (
                        <div className="chatbot-msg-actions">
                          {msg.actions.map((act, aIdx) => {
                            let IconComp = ChevronRight;
                            if (act.icon === "Flame" || act.icon === Flame) IconComp = Flame;
                            else if (act.icon === "ShoppingBag" || act.icon === ShoppingBag) IconComp = ShoppingBag;
                            else if (act.icon === "Repeat" || act.icon === Repeat) IconComp = Repeat;
                            else if (act.icon === "Package" || act.icon === Package) IconComp = Package;
                            else if (act.icon === "Sparkles" || act.icon === Sparkles) IconComp = Sparkles;
                            else if (act.icon === "Headphones" || act.icon === Headphones) IconComp = Headphones;
                            else if (act.icon === "HelpCircle" || act.icon === HelpCircle) IconComp = HelpCircle;

                            return (
                              <button
                                key={aIdx}
                                type="button"
                                className="chatbot-action-btn"
                                onClick={() => handleActionClick(act)}
                              >
                                <IconComp size={13} />
                                <span>{act.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <span className="chatbot-time">{msg.time}</span>
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="chatbot-message-row bot">
                    <div className="chatbot-msg-avatar">
                      <Sparkles size={14} />
                    </div>
                    <div className="chatbot-typing-bubble">
                      <span className="chatbot-typing-dot" />
                      <span className="chatbot-typing-dot" />
                      <span className="chatbot-typing-dot" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="chatbot-input-bar">
                <button
                  type="button"
                  className={`chatbot-mic-btn ${isListening ? "listening" : ""}`}
                  onClick={handleToggleVoiceMic}
                  title={isListening ? "Stop Listening" : "Voice Input (Speech-to-Text)"}
                  aria-label="Voice input"
                >
                  {isListening ? <MicOff size={17} /> : <Mic size={17} />}
                </button>

                <input
                  type="text"
                  className="chatbot-input-field"
                  placeholder="Ask anything (e.g. phones under $500, contact admin, order #)..."
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={handleKeyDown}
                  aria-label="Type your message"
                  disabled={isTyping}
                />

                <button
                  type="button"
                  className="chatbot-send-btn"
                  onClick={() => handleSend()}
                  disabled={!inputVal.trim() || isTyping}
                  aria-label="Send Message"
                >
                  <Send size={16} />
                </button>
              </div>
            </>
          )}

          {/* Tab 2: User Support Tickets & Admin Replies */}
          {activeTab === "tickets" && (
            <div className="chatbot-tickets-view">
              <div className="chatbot-tickets-header">
                <h4>My Support Messages</h4>
                <button
                  type="button"
                  className="btn-refresh-tickets"
                  onClick={fetchUserTickets}
                  disabled={loadingTickets}
                >
                  <RefreshCw size={13} /> Refresh
                </button>
              </div>

              {loadingTickets && myTickets.length === 0 ? (
                <div className="chatbot-tickets-empty">
                  <RefreshCw size={24} className="animate-spin text-muted" />
                  <span>Loading your messages...</span>
                </div>
              ) : myTickets.length === 0 ? (
                <div className="chatbot-tickets-empty">
                  <Mail size={32} />
                  <p>You haven't sent any support inquiries yet.</p>
                  <button
                    type="button"
                    className="chatbot-action-btn"
                    onClick={() => setShowContactModal(true)}
                  >
                    Send Message to Admin
                  </button>
                </div>
              ) : (
                <div className="chatbot-tickets-list">
                  {myTickets.map((t) => (
                    <div
                      key={t.id}
                      className={`chatbot-ticket-card ${t.status === "replied" ? "has-admin-reply" : ""}`}
                    >
                      <div className="ticket-card-top">
                        <strong>{t.subject}</strong>
                        <span className={`badge-status ${t.status}`}>
                          {t.status === "replied" ? "✓ Admin Replied" : t.status === "in_progress" ? "In Progress" : "Sent to Admin"}
                        </span>
                      </div>
                      <p className="ticket-card-msg">{t.message}</p>
                      <small className="ticket-card-time">
                        Sent on {new Date(t.created_at || t.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </small>

                      {/* Admin Reply Block with verified badge & dual voice audio */}
                      {t.admin_reply && (
                        <div className="ticket-admin-reply">
                          <div className="reply-author">
                            <Headphones size={14} className="text-emerald-500" />
                            <strong>Angkor Mall Support Admin:</strong>
                            <span className="reply-verified-pill">Official Reply</span>
                          </div>
                          <p className="reply-text-body">{t.admin_reply}</p>

                          {/* Dual-Language Voice for Admin Reply */}
                          <div className="ticket-voice-row">
                            <button
                              type="button"
                              className={`btn-ticket-voice ${speakingMsgId === t.id && speakingLang === "km" ? "speaking" : ""}`}
                              onClick={() => speakTextDual(t.id, t.admin_reply, "km")}
                              title="ស្តាប់ជាភាសាខ្មែរ"
                            >
                              <Volume2 size={11} /> 🇰🇭 ស្តាប់ (Khmer)
                            </button>
                            <button
                              type="button"
                              className={`btn-ticket-voice ${speakingMsgId === t.id && speakingLang === "en" ? "speaking" : ""}`}
                              onClick={() => speakTextDual(t.id, t.admin_reply, "en")}
                              title="Listen in English"
                            >
                              <Volume2 size={11} /> 🇺🇸 Listen (EN)
                            </button>
                          </div>

                          <div className="reply-footer-row">
                            <small className="reply-time">
                              {t.replied_at
                                ? new Date(t.replied_at).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })
                                : "Just now"}
                            </small>
                            <button
                              type="button"
                              className="btn-reply-followup"
                              onClick={() => {
                                setContactForm((prev) => ({
                                  ...prev,
                                  subject: `Re: ${t.subject}`,
                                  message: ""
                                }));
                                setShowContactModal(true);
                              }}
                            >
                              Reply Back / Follow up
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Contact Admin Modal / Drawer */}
          {showContactModal && (
            <div className="chatbot-contact-overlay">
              <div className="chatbot-contact-modal">
                <div className="contact-modal-header">
                  <div className="contact-modal-title">
                    <Headphones size={18} />
                    <span>Message Store Admin</span>
                  </div>
                  <button
                    type="button"
                    className="contact-modal-close"
                    onClick={() => setShowContactModal(false)}
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleSubmitSupport} className="contact-modal-form">
                  <div className="contact-form-group">
                    <label>Your Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sokha Chan"
                      value={contactForm.sender_name}
                      onChange={(e) => setContactForm({ ...contactForm, sender_name: e.target.value })}
                    />
                  </div>

                  <div className="contact-form-row">
                    <div className="contact-form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        placeholder="you@email.com"
                        value={contactForm.sender_email}
                        onChange={(e) => setContactForm({ ...contactForm, sender_email: e.target.value })}
                      />
                    </div>
                    <div className="contact-form-group">
                      <label>Phone / Telegram</label>
                      <input
                        type="text"
                        placeholder="+855 12 345 678"
                        value={contactForm.sender_phone}
                        onChange={(e) => setContactForm({ ...contactForm, sender_phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="contact-form-group">
                    <label>Inquiry Topic *</label>
                    <select
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    >
                      <option value="Product Inquiry">📱 Product & Specs Question</option>
                      <option value="Order & Delivery Tracking">📦 Order & Delivery Tracking</option>
                      <option value="Device Trade-In Valuation">🔄 Device Trade-In / Swap</option>
                      <option value="Warranty & Replacement">🛡️ Warranty & Replacement</option>
                      <option value="Payment & Invoicing">💳 Payment & Checkout Help</option>
                      <option value="General Support">💬 Other General Question</option>
                    </select>
                  </div>

                  <div className="contact-form-group">
                    <label>Your Message / Question *</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Type your message to store administrators in detail..."
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    />
                  </div>

                  <div className="contact-form-actions">
                    <button
                      type="button"
                      className="btn-cancel-contact"
                      onClick={() => setShowContactModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-submit-contact"
                      disabled={sendingSupport || !contactForm.message.trim()}
                    >
                      <Send size={14} /> {sendingSupport ? "Sending..." : "Send Message to Admin"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default ChatBot;
