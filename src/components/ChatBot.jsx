import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  MessageCircle,
  Bot,
  Sparkles,
  X,
  Send,
  Trash2,
  Minimize2,
  ShoppingBag,
  Repeat,
  Flame,
  Package,
  HelpCircle,
  CreditCard,
  ChevronRight
} from "lucide-react";
import { getSearchRecommendationsApi } from "../services/recommendationService";
import "./ChatBot.css";

const QUICK_CHIPS = [
  { label: "⚡ Flash Sale", query: "What are today's flash sales and deals?" },
  { label: "📱 Buy Phones & Laptops", query: "Show me trending smartphones and laptops" },
  { label: "🔄 Trade-In Device", query: "How does device trade-in work?" },
  { label: "📦 Order & Shipping", query: "How to track order and delivery options?" },
  { label: "💳 Payment Methods", query: "What payment methods are supported?" },
  { label: "✨ AI Recommendations", query: "Recommend best products for me" }
];

const INITIAL_MESSAGES = [
  {
    id: 1,
    sender: "bot",
    text: "👋 Hello! Welcome to **Angkor Shopping Mall**! I'm your AI shopping assistant. How can I help you today?",
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    actions: [
      { label: "Browse Shop", path: "/shop", icon: ShoppingBag },
      { label: "Flash Sales", path: "/shop?flashSale=true", icon: Flame },
      { label: "Trade-In", path: "/trading", icon: Repeat }
    ]
  }
];

function ChatBot() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [showCallout, setShowCallout] = useState(true);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem("angkor_chat_history");
      return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
    } catch {
      return INITIAL_MESSAGES;
    }
  });
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  // Persist messages in session
  useEffect(() => {
    try {
      sessionStorage.setItem("angkor_chat_history", JSON.stringify(messages));
    } catch (e) {
      console.error(e);
    }
  }, [messages]);

  // Hide callout after 12 seconds automatically if not clicked
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCallout(false);
    }, 12000);
    return () => clearTimeout(timer);
  }, []);

  const handleClearHistory = () => {
    setMessages(INITIAL_MESSAGES);
    sessionStorage.removeItem("angkor_chat_history");
  };

  const handleActionClick = (path) => {
    navigate(path);
    if (window.innerWidth <= 640) {
      setIsOpen(false);
    }
  };

  // Smart AI Engine Logic
  const processQuery = async (queryText) => {
    const q = queryText.toLowerCase().trim();
    let replyText = "";
    let actions = [];

    // 1. Flash Sales & Deals
    if (q.includes("flash") || q.includes("deal") || q.includes("discount") || q.includes("sale") || q.includes("promo") || q.includes("offer")) {
      replyText = "🔥 **Exclusive Flash Sales & Discounts are LIVE!**\n\nYou can discover incredible discounts up to **50% OFF** on phones, accessories, and electronics right now.";
      actions = [
        { label: "View Flash Sales", path: "/shop", icon: Flame },
        { label: "Explore Recommendations", path: "/recommendations", icon: Sparkles }
      ];
    }
    // 2. Trade-in program
    else if (q.includes("trade") || q.includes("exchange") || q.includes("swap") || q.includes("sell phone") || q.includes("old device")) {
      replyText = "🔄 **Angkor Device Trade-in Program**\n\nUpgrade to your dream phone or laptop easily! Submit your old device specifications and get an instant valuation + discount code toward your new purchase.";
      actions = [
        { label: "Start Trade-In Now", path: "/trading", icon: Repeat },
        { label: "Browse New Phones", path: "/shop", icon: ShoppingBag }
      ];
    }
    // 3. AI Recommendations
    else if (q.includes("recommend") || q.includes("suggest") || q.includes("best product") || q.includes("trending")) {
      replyText = "✨ **Personalized AI Recommendations**\n\nOur smart algorithm analyzes trending items, best sellers, and top-rated gadgets tailored just for you.";
      actions = [
        { label: "Open AI Recommendations", path: "/recommendations", icon: Sparkles },
        { label: "Shop Top Brands", path: "/shop", icon: ShoppingBag }
      ];
    }
    // 4. Orders & Tracking & Delivery
    else if (q.includes("order") || q.includes("track") || q.includes("shipping") || q.includes("deliver") || q.includes("province")) {
      replyText = "📦 **Order Tracking & Delivery Information**\n\n• **Phnom Penh**: Express 1-2 day delivery.\n• **Provinces**: Standard reliable delivery within 2-4 business days.\n• Check your real-time invoice and dispatch status under **My Orders**.";
      actions = [
        { label: "View My Orders", path: "/orders", icon: Package },
        { label: "Track Cart", path: "/shop", icon: ShoppingBag }
      ];
    }
    // 5. Payment Methods
    else if (q.includes("payment") || q.includes("aba") || q.includes("pay") || q.includes("wing") || q.includes("cash") || q.includes("cod") || q.includes("card")) {
      replyText = "💳 **Supported Payment Methods:**\n\n1. **ABA KHQR & PayWay** (Instant & Secure)\n2. **Wing Bank & Mobile Wallets**\n3. **Credit / Debit Cards** (Visa, MasterCard)\n4. **Cash on Delivery (COD)** available in select areas.";
      actions = [
        { label: "Browse & Checkout", path: "/shop", icon: ShoppingBag }
      ];
    }
    // 6. Warranty & Contact & Location
    else if (q.includes("contact") || q.includes("location") || q.includes("store") || q.includes("warranty") || q.includes("return") || q.includes("support")) {
      replyText = "🛡️ **Customer Care & Warranty**\n\n• **Official 1-Year Warranty** on all electronic products.\n• **7-Day Replacement** for manufacturing defects.\n• **Location**: Phnom Penh, Cambodia.\n• **Support Line**: +855 23 888 999 (8:00 AM - 9:00 PM)";
      actions = [
        { label: "Visit Shop", path: "/shop", icon: ShoppingBag }
      ];
    }
    // 7. Dynamic Product Search via API
    else {
      try {
        const res = await getSearchRecommendationsApi(queryText, 5);
        const data = res?.data || {};
        const products = data.products || [];

        if (products.length > 0) {
          const names = products.slice(0, 3).map(p => `• **${p.name || p.title}** - $${p.price || ""}`).join("\n");
          replyText = `🔍 Found matching items for "${queryText}":\n\n${names}\n\nWould you like to explore full details in the store?`;
          actions = [
            { label: `View "${queryText}" in Shop`, path: `/shop?search=${encodeURIComponent(queryText)}`, icon: ShoppingBag }
          ];
        } else {
          replyText = `I found helpful options for "${queryText}". You can browse our store categories or explore smart AI recommendations.`;
          actions = [
            { label: "Browse All Products", path: "/shop", icon: ShoppingBag },
            { label: "Explore AI Recommendations", path: "/recommendations", icon: Sparkles }
          ];
        }
      } catch {
        replyText = `I can help you find products, check order status, or explore trade-ins at Angkor Shopping Mall. What would you like to do?`;
        actions = [
          { label: "Browse Shop", path: "/shop", icon: ShoppingBag },
          { label: "Explore Trade-in", path: "/trading", icon: Repeat }
        ];
      }
    }

    return { replyText, actions };
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

    setMessages(prev => [...prev, userMsg]);
    if (!customQuery) setInputVal("");
    setIsTyping(true);

    // Realistic typing delay
    setTimeout(async () => {
      const { replyText, actions } = await processQuery(text);
      const botMsg = {
        id: Date.now() + 1,
        sender: "bot",
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actions: actions
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 700);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Trigger Container */}
      <div className="chatbot-trigger-container" aria-label="Angkor AI Assistant">
        {/* First-visit Greeting Speech Bubble */}
        {!isOpen && showCallout && (
          <div className="chatbot-greeting-callout" onClick={() => { setIsOpen(true); setShowCallout(false); }}>
            <span>👋 Need help? Ask Angkor AI</span>
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
          className="chatbot-fab-btn"
          onClick={() => {
            setIsOpen(!isOpen);
            setShowCallout(false);
          }}
          aria-label={isOpen ? "Close AI Chatbot" : "Open AI Chatbot"}
          title="Angkor AI Assistant"
        >
          <div className="chatbot-fab-pulse" />
          {isOpen ? <X size={24} /> : <Bot size={26} />}
          <span className="chatbot-online-dot" />
        </button>
      </div>

      {/* Main Interactive Chatbot Window */}
      {isOpen && (
        <div className="chatbot-window" role="dialog" aria-modal="true" aria-label="AI Shopping Assistant">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar-container">
                <Bot size={22} />
              </div>
              <div className="chatbot-header-text">
                <h3>Angkor AI Assistant</h3>
                <div className="chatbot-status-row">
                  <span className="chatbot-live-dot" />
                  <span>Online • Instant Help</span>
                </div>
              </div>
            </div>
            <div className="chatbot-header-actions">
              <button
                type="button"
                className="chatbot-header-btn"
                onClick={handleClearHistory}
                title="Clear Chat History"
                aria-label="Clear chat"
              >
                <Trash2 size={16} />
              </button>
              <button
                type="button"
                className="chatbot-header-btn"
                onClick={() => setIsOpen(false)}
                title="Minimize Chat"
                aria-label="Minimize"
              >
                <Minimize2 size={16} />
              </button>
            </div>
          </div>

          {/* Quick Suggestions Horizontal Scroll Bar */}
          <div className="chatbot-chips-bar">
            {QUICK_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                className="chatbot-chip"
                onClick={() => handleSend(chip.query)}
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
                  {/* Formatted Message Content */}
                  <div style={{ whiteSpace: "pre-line" }}>
                    {msg.text.split("\n").map((line, lIdx) => {
                      // Basic bold parsing: **text**
                      const parts = line.split(/(\*\*.*?\*\*)/g);
                      return (
                        <div key={lIdx}>
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

                  {/* Interactive Action Links if provided */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="chatbot-msg-actions">
                      {msg.actions.map((act, aIdx) => {
                        const IconComp = act.icon || ChevronRight;
                        return (
                          <button
                            key={aIdx}
                            type="button"
                            className="chatbot-action-btn"
                            onClick={() => handleActionClick(act.path)}
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
                  <div className="chatbot-typing-dot" />
                  <div className="chatbot-typing-dot" />
                  <div className="chatbot-typing-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="chatbot-input-bar">
            <input
              type="text"
              className="chatbot-input-field"
              placeholder="Ask anything about products, deals, trade-in..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Type your message"
            />
            <button
              type="button"
              className="chatbot-send-btn"
              onClick={() => handleSend()}
              disabled={!inputVal.trim()}
              aria-label="Send Message"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatBot;
