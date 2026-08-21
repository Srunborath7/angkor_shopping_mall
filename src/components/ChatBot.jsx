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
import { useTheme } from "../context/ThemeContext";
import "./ChatBot.css";

const DEFAULT_QUICK_CHIPS_EN = [
  { label: "⚡ Flash Sales", query: "What are today's flash sales and deals?" },
  { label: "📱 Phones under $500", query: "Show me smartphones under $500" },
  { label: "💻 Laptops & PC", query: "Find top performance laptops" },
  { label: "🔄 Device Trade-In", query: "How does device trade-in work?" },
  { label: "✉️ Message Admin", query: "I want to contact admin and support" },
  { label: "📦 Track My Order", query: "Where is my order?" },
  { label: "💳 Payment Methods", query: "What payment methods are supported?" }
];

const DEFAULT_QUICK_CHIPS_KM = [
  { label: "⚡ Flash Sales បញ្ចុះតម្លៃ", query: "តើថ្ងៃនេះមានប្រូម៉ូសិនពិសេស ឬ Flash Sale អ្វីខ្លះ?" },
  { label: "📱 ទូរស័ព្ទក្រោម $500", query: "សូមបង្ហាញទូរស័ព្ទដៃទំនើបតម្លៃក្រោម 500 ដុល្លារ" },
  { label: "💻 កុំព្យូទ័រ & Laptops", query: "ស្វែងរកកុំព្យូទ័រយួរដៃ Laptop គុណភាពខ្ពស់" },
  { label: "🔄 ប្តូរសេរីទូរស័ព្ទ (Trade-In)", query: "តើការប្តូរសេរីទូរស័ព្ទ (Trade-In) ដំណើរការដូចម្តេច?" },
  { label: "✉️ ផ្ញើសារទៅ Admin", query: "ខ្ញុំចង់ទាក់ទង Admin និងផ្នែកបម្រើអតិថិជន" },
  { label: "📦 តាមដានការបញ្ជាទិញ", query: "តើទំនិញដែលខ្ញុំបានកម្ម៉ង់នៅឯណា?" },
  { label: "💳 វិធីទូទាត់ប្រាក់", query: "តើហាងទទួលការទូទាត់តាមវិធីណាខ្លះ (ABA, KHQR, វីសា)?" }
];

const INITIAL_MESSAGES_EN = [
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
    ]
  }
];

const INITIAL_MESSAGES_KM = [
  {
    id: 1,
    sender: "bot",
    text: "👋 សួស្តី! សូមស្វាគមន៍មកកាន់ **Angkor Shopping Mall**! ខ្ញុំជា **ជំនួយការឆ្លាតវៃ AI (Smart AI Assistant)** របស់អ្នក។\n\nតើខ្ញុំអាចជួយអ្វីដល់លោកអ្នកបានថ្ងៃនេះ? លោកអ្នកអាចស្វែងរកទំនិញ មើលការបញ្ចុះតម្លៃ Flash Sale តាមដានការបញ្ជាទិញ ឬផ្ញើសារផ្ទាល់ទៅកាន់ Admin របស់ហាងយើងខ្ញុំ។",
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    actions: [
      { label: "⚡ Flash Sales បញ្ចុះតម្លៃ", path: "/shop?flashSale=true", icon: Flame },
      { label: "🛍️ ទិញទំនិញទាំងអស់", path: "/shop", icon: ShoppingBag },
      { label: "✉️ ផ្ញើសារទៅ Admin", actionType: "contact_admin", icon: Headphones },
      { label: "🔄 សេវាកម្មប្តូរសេរី (Trade-In)", path: "/trading", icon: Repeat },
      { label: "✨ ផលិតផលណែនាំដោយ AI", path: "/recommendations", icon: Sparkles }
    ]
  }
];

function ChatBot() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useSelector((state) => state.auth);
  const isLoggedIn = !!auth?.token;
  const user = auth?.user;
  const themeContext = useTheme();
  const isDark = Boolean(themeContext?.isDark);
  const resolvedTheme = themeContext?.resolvedTheme || (isDark ? "dark" : "light");

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

  const [preferredVoiceLang, setPreferredVoiceLang] = useState(() => {
    return localStorage.getItem("angkor_preferred_voice_lang") || "km";
  });

  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem("angkor_ai_chat_history");
      const initialLang = localStorage.getItem("angkor_preferred_voice_lang") || "km";
      return saved ? JSON.parse(saved) : (initialLang === "km" ? INITIAL_MESSAGES_KM : INITIAL_MESSAGES_EN);
    } catch {
      return INITIAL_MESSAGES_KM;
    }
  });

  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chips, setChips] = useState(() => {
    const initialLang = localStorage.getItem("angkor_preferred_voice_lang") || "km";
    return initialLang === "km" ? DEFAULT_QUICK_CHIPS_KM : DEFAULT_QUICK_CHIPS_EN;
  });
  const [isListening, setIsListening] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(() => {
    const saved = localStorage.getItem("angkor_voice_enabled");
    return saved !== null ? saved === "true" : true;
  });
  const [addingCartId, setAddingCartId] = useState(null);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const currentAudioRef = useRef(null);

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
      productId: productId,
      lang: preferredVoiceLang
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

      // Calculate unread admin replies count (filtered by already-read IDs)
      const readReplyIds = JSON.parse(localStorage.getItem("angkor_read_reply_ids") || "[]");
      if (activeTab === "tickets") {
        const allRepliedIds = tickets.filter((t) => t.status === "replied" || t.admin_reply).map((t) => t.id);
        const updated = Array.from(new Set([...readReplyIds, ...allRepliedIds]));
        localStorage.setItem("angkor_read_reply_ids", JSON.stringify(updated));
        setNewRepliesCount(0);
      } else {
        const unread = tickets.filter(
          (t) => (t.status === "replied" || t.admin_reply) && !readReplyIds.includes(t.id)
        ).length;
        setNewRepliesCount(unread);
      }
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

  // Listen to support-replies-read event across components
  useEffect(() => {
    const handleRepliesRead = () => {
      const readReplyIds = JSON.parse(localStorage.getItem("angkor_read_reply_ids") || "[]");
      const unread = myTickets.filter(
        (t) => (t.status === "replied" || t.admin_reply) && !readReplyIds.includes(t.id)
      ).length;
      setNewRepliesCount(unread);
    };
    window.addEventListener("support-replies-read", handleRepliesRead);
    return () => window.removeEventListener("support-replies-read", handleRepliesRead);
  }, [myTickets]);

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

  // Initialize Speech Recognition matching selected language
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = preferredVoiceLang === "km" ? "km-KH" : "en-US";

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
  }, [preferredVoiceLang]);

  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const [speakingLang, setSpeakingLang] = useState(null);

  // Stop currently playing voice
  const stopSpeaking = () => {
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.src = "";
      } catch (e) {
        // ignore
      }
      currentAudioRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMsgId(null);
    setSpeakingLang(null);
  };

  // Web Speech API fallback runner (Used primarily for English or devices with native Khmer voice)
  const playWebSpeech = (id, text, langCode) => {
    if (!window.speechSynthesis) {
      setSpeakingMsgId(null);
      setSpeakingLang(null);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode;
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      if (langCode.startsWith("km")) {
        const khVoice = voices.find(
          (v) =>
            v.lang.includes("km") ||
            v.lang.includes("kh") ||
            v.name.toLowerCase().includes("khmer")
        );
        if (khVoice) {
          utterance.voice = khVoice;
        } else {
          // If no Khmer voice is installed in the browser/OS, do NOT allow
          // an English voice to read Khmer text (which would sound like English gibberish)
          console.warn("No native Khmer speech voice found in browser Web Speech API.");
          setSpeakingMsgId(null);
          setSpeakingLang(null);
          return;
        }
      } else {
        const enVoice = voices.find(
          (v) =>
            v.lang.startsWith("en") &&
            (v.name.includes("Natural") ||
              v.name.includes("Google") ||
              v.name.includes("Samantha") ||
              v.name.includes("David") ||
              v.name.includes("Jenny"))
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
      console.warn("Web Speech error:", e);
      setSpeakingMsgId(null);
      setSpeakingLang(null);
    }
  };

  // Helper to split text into short sentences/chunks (<= 110 chars) so Google TTS never returns 400 Bad Request
  const splitIntoSpeechChunks = (text, maxLen = 110) => {
    if (!text) return [];
    // Split on sentence terminators: periods, exclamation, question, Khmer punctuation '។' and newlines
    const rawSentences = text.split(/(?<=[.!?។\n])\s+/);
    const chunks = [];
    let currentChunk = "";

    for (let s of rawSentences) {
      s = s.trim();
      if (!s) continue;

      if ((currentChunk + " " + s).trim().length <= maxLen) {
        currentChunk = currentChunk ? currentChunk + " " + s : s;
      } else {
        if (currentChunk) chunks.push(currentChunk);
        if (s.length <= maxLen) {
          currentChunk = s;
        } else {
          let remaining = s;
          while (remaining.length > maxLen) {
            let splitAt = remaining.lastIndexOf(" ", maxLen);
            if (splitAt <= 20) splitAt = maxLen;
            chunks.push(remaining.slice(0, splitAt).trim());
            remaining = remaining.slice(splitAt).trim();
          }
          currentChunk = remaining;
        }
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks.filter(Boolean);
  };

  // Translation helper for dual voice playback (translates English to Khmer and vice versa on-the-fly)
  const translateForVoice = async (text, targetLang = "km") => {
    if (!text || !text.trim()) return text;

    let clean = text
      .replace(/[*#_`~•🏢👋🛍️✨🔄📦💳📱💻⚡✉️]/g, "")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/[\n\r]+/g, " ")
      .trim();

    const hasEnglish = /[a-zA-Z]{2,}/.test(clean);
    const hasKhmer = /[\u1780-\u17FF]/.test(clean);

    if (targetLang === "km" && hasEnglish) {
      try {
        const encoded = encodeURIComponent(clean.slice(0, 400));
        const res = await fetch(
          `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=km&dt=t&q=${encoded}`
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && Array.isArray(data[0])) {
            const translated = data[0]
              .map((item) => item[0])
              .filter(Boolean)
              .join("");
            if (translated && translated.trim()) {
              return translated.trim();
            }
          }
        }
      } catch (err) {
        console.warn("Khmer translation for voice failed, using original:", err);
      }
    } else if (targetLang === "en" && hasKhmer) {
      try {
        const encoded = encodeURIComponent(clean.slice(0, 400));
        const res = await fetch(
          `https://translate.googleapis.com/translate_a/single?client=gtx&sl=km&tl=en&dt=t&q=${encoded}`
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && Array.isArray(data[0])) {
            const translated = data[0]
              .map((item) => item[0])
              .filter(Boolean)
              .join("");
            if (translated && translated.trim()) {
              return translated.trim();
            }
          }
        }
      } catch (err) {
        console.warn("English translation for voice failed, using original:", err);
      }
    }

    return clean;
  };

  // Dual-Engine Speech Synthesis (Translates & Speaks in Natural Khmer Audio Stream + Web Speech Fallback)
  const speakTextDual = async (id, text, lang = "km") => {
    if (speakingMsgId === id && speakingLang === lang) {
      stopSpeaking();
      return;
    }

    stopSpeaking();

    if (!text) return;

    setSpeakingMsgId(id);
    setSpeakingLang(lang);

    // If English text is played with Khmer voice (🇰🇭 ស្តាប់), translate to Khmer first so it speaks natural Khmer!
    // And if Khmer text is played with English voice (🇺🇸 Listen), translate to English first!
    const voiceText = await translateForVoice(text, lang);

    if (!voiceText) {
      setSpeakingMsgId(null);
      setSpeakingLang(null);
      return;
    }

    if (lang === "km") {
      // Split into small speech-friendly chunks (<= 110 chars) so Google TTS never returns 400 Bad Request
      const chunks = splitIntoSpeechChunks(voiceText, 110);
      if (chunks.length === 0) {
        setSpeakingMsgId(null);
        setSpeakingLang(null);
        return;
      }

      let chunkIdx = 0;

      const playNextChunk = () => {
        if (chunkIdx >= chunks.length) {
          setSpeakingMsgId(null);
          setSpeakingLang(null);
          currentAudioRef.current = null;
          return;
        }

        const chunkText = chunks[chunkIdx];
        chunkIdx++;

        const encoded = encodeURIComponent(chunkText);
        const sources = [
          `/tts-proxy?ie=UTF-8&tl=km&client=tw-ob&q=${encoded}`,
          `https://translate.google.com/translate_tts?ie=UTF-8&tl=km&client=tw-ob&q=${encoded}`,
          `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=km&q=${encoded}`,
          `https://translate.google.com.kh/translate_tts?ie=UTF-8&tl=km&client=tw-ob&q=${encoded}`
        ];

        let sourceIndex = 0;

        const tryPlaySource = () => {
          if (sourceIndex >= sources.length) {
            // Fallback to Web Speech if online audio fails
            playWebSpeech(id, chunkText, "km-KH");
            return;
          }

          const url = sources[sourceIndex];
          sourceIndex++;

          const audio = document.createElement("audio");
          audio.referrerPolicy = "no-referrer";
          audio.src = url;
          currentAudioRef.current = audio;

          audio.onended = () => {
            playNextChunk();
          };

          audio.onerror = () => {
            tryPlaySource();
          };

          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch((err) => {
              console.warn(`Audio stream failed for source ${sourceIndex}:`, err);
              tryPlaySource();
            });
          }
        };

        tryPlaySource();
      };

      playNextChunk();
    } else {
      playWebSpeech(id, voiceText.slice(0, 300), "en-US");
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  // Switch tab and automatically clear unread replies count
  const handleSwitchTab = (tab) => {
    setActiveTab(tab);
    if (tab === "tickets") {
      const readReplyIds = JSON.parse(localStorage.getItem("angkor_read_reply_ids") || "[]");
      const allRepliedIds = myTickets.filter((t) => t.status === "replied" || t.admin_reply).map((t) => t.id);
      const updated = Array.from(new Set([...readReplyIds, ...allRepliedIds]));
      localStorage.setItem("angkor_read_reply_ids", JSON.stringify(updated));
      setNewRepliesCount(0);
      window.dispatchEvent(new Event("support-replies-read"));
    }
  };

  // Switch voice language with immediate Khmer spoken greeting for Cambodians
  const handleSelectVoiceLanguage = (nextLang) => {
    setPreferredVoiceLang(nextLang);
    localStorage.setItem("angkor_preferred_voice_lang", nextLang);
    localStorage.setItem("angkor_language", nextLang);
    setIsVoiceEnabled(true);

    // Dispatch global website language change
    window.dispatchEvent(new CustomEvent("angkor-language-change", { detail: nextLang }));

    if (recognitionRef.current) {
      recognitionRef.current.lang = nextLang === "km" ? "km-KH" : "en-US";
    }

    setChips(nextLang === "km" ? DEFAULT_QUICK_CHIPS_KM : DEFAULT_QUICK_CHIPS_EN);

    if (nextLang === "km") {
      toast.success("🇰🇭 បានជ្រើសរើសសំឡេងខ្មែរ (Khmer AI Voice Active)");
      speakTextDual(
        "lang_switch_km",
        "សូមស្វាគមន៍មកកាន់ Angkor Shopping Mall! ខ្ញុំអាចជួយបងប្អូនជាភាសាខ្មែរបាន។ តើលោកអ្នកចង់ស្វែងរកអ្វីដែរ?",
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

  // Sync with global website language change event
  useEffect(() => {
    const handleGlobalLangChange = (e) => {
      const lang = e.detail;
      if (lang && (lang === "km" || lang === "en") && lang !== preferredVoiceLang) {
        setPreferredVoiceLang(lang);
        setChips(lang === "km" ? DEFAULT_QUICK_CHIPS_KM : DEFAULT_QUICK_CHIPS_EN);
        if (recognitionRef.current) {
          recognitionRef.current.lang = lang === "km" ? "km-KH" : "en-US";
        }
      }
    };
    window.addEventListener("angkor-language-change", handleGlobalLangChange);
    return () => window.removeEventListener("angkor-language-change", handleGlobalLangChange);
  }, [preferredVoiceLang]);

  // Toggle voice playback mute/unmute
  const handleToggleVoicePlayback = () => {
    const next = !isVoiceEnabled;
    setIsVoiceEnabled(next);
    localStorage.setItem("angkor_voice_enabled", String(next));
    if (!next) {
      stopSpeaking();
      toast("🔇 Voice output muted", { icon: "🔇" });
    } else {
      toast.success(preferredVoiceLang === "km" ? "🔊 បានបើកសំឡេង AI" : "🔊 Voice output enabled");
      if (preferredVoiceLang === "km") {
        speakTextDual("voice_on_km", "បានបើកសំឡេង AI ជំនួយការជាភាសាខ្មែរ។", "km");
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
        recognitionRef.current.lang = preferredVoiceLang === "km" ? "km-KH" : "en-US";
        recognitionRef.current.start();
      } catch (e) {
        recognitionRef.current.stop();
      }
    }
  };

  const handleClearHistory = () => {
    const initial = preferredVoiceLang === "km" ? INITIAL_MESSAGES_KM : INITIAL_MESSAGES_EN;
    setMessages(initial);
    sessionStorage.removeItem("angkor_ai_chat_history");
    toast.success(preferredVoiceLang === "km" ? "បានសម្អាតប្រវត្តិសន្ទនា" : "Chat history cleared");
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

      const defaultReplyText = preferredVoiceLang === "km"
        ? "ខ្ញុំនៅទីនេះដើម្បីជួយលោកអ្នកទិញទំនិញ! សូមប្រាប់ខ្ញុំនូវអ្វីដែលលោកអ្នកត្រូវការ។"
        : "I'm here to help you shop! Let me know what you need.";

      const botReply = {
        id: Date.now() + 1,
        sender: "bot",
        text: data.replyText || defaultReplyText,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actions: data.actions || [],
        products: data.products || [],
        orders: data.orders || []
      };

      setMessages((prev) => [...prev, botReply]);

      if (isVoiceEnabled) {
        speakTextDual(botReply.id, botReply.text, preferredVoiceLang);
      }
    } catch (err) {
      console.error("Chatbot API error:", err);
      const fallbackReply = {
        id: Date.now() + 1,
        sender: "bot",
        text: preferredVoiceLang === "km"
          ? `🔍 ខ្ញុំកំពុងស្វែងរកទំនិញ "${text}" នៅក្នុងហាង។ លោកអ្នកអាចពិនិត្យមើលប្រូម៉ូសិនពិសេស ស្វែងរកទំនិញ ឬទាក់ទង Admin ខាងក្រោម៖`
          : `🔍 I'm searching our store for "${text}". You can explore active deals, view product catalog, or contact admin below:`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actions: preferredVoiceLang === "km"
          ? [
              { label: "✉️ ផ្ញើសារទៅ Admin", actionType: "contact_admin", icon: Headphones },
              { label: "🛍️ មើលទំនិញទាំងអស់", path: `/shop?search=${encodeURIComponent(text)}`, icon: ShoppingBag },
              { label: "⚡ Flash Sales បញ្ចុះតម្លៃ", path: "/shop?flashSale=true", icon: Flame }
            ]
          : [
              { label: "✉️ Message Admin", actionType: "contact_admin", icon: Headphones },
              { label: "Browse Shop", path: `/shop?search=${encodeURIComponent(text)}`, icon: ShoppingBag },
              { label: "Flash Sales", path: "/shop?flashSale=true", icon: Flame }
            ]
      };
      setMessages((prev) => [...prev, fallbackReply]);

      if (isVoiceEnabled) {
        speakTextDual(fallbackReply.id, fallbackReply.text, preferredVoiceLang);
      }
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

  // Do not show chatbot on authentication pages
  const isAuthPage = location.pathname?.startsWith("/auth");
  if (isAuthPage) return null;

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
              <span>
                {preferredVoiceLang === "km"
                  ? "👋 សួស្តី! សួរអ្វីក៏បាន ឬផ្ញើសារទៅ Admin"
                  : "👋 Ask me anything or message admin!"}
              </span>
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

        {/* Floating Action Button (Only shown when chat is closed) */}
        {!isOpen && (
          <button
            type="button"
            className="chatbot-fab-btn"
            onClick={() => {
              setIsOpen(true);
              setShowCallout(false);
            }}
            aria-label="Open AI Chatbot"
            title="Angkor AI Shopping Assistant"
          >
            <div className="chatbot-fab-pulse" />
            <Bot size={26} />
            {newRepliesCount > 0 && (
              <span className="chatbot-fab-reply-pill">{newRepliesCount}</span>
            )}
            <span className="chatbot-online-dot" />
          </button>
        )}
      </div>

      {/* Main Interactive Chatbot Window */}
      {isOpen && (
        <div
          className={`chatbot-window ${isExpanded ? "expanded" : ""} ${isDark ? "dark-mode" : ""}`}
          data-theme={isDark ? "dark" : "light"}
          role="dialog"
          aria-modal="true"
          aria-label="AI Shopping Assistant"
        >
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-glow-bg" />
            
            <div className="chatbot-header-info">
              <div className="chatbot-avatar-wrapper">
                <div className="chatbot-avatar-container">
                  <Bot size={19} className="chatbot-bot-icon" />
                </div>
                <span className="chatbot-header-pulse-dot" />
              </div>
              <div className="chatbot-header-text">
                <div className="chatbot-header-title-row">
                  <h3 className="chatbot-header-title">Angkor AI</h3>
                  <span className="chatbot-badge-smart">
                    <Sparkles size={10} className="chatbot-sparkle-icon" />
                    Smart 2.0
                  </span>
                </div>
                <div className="chatbot-status-row">
                  <span className="chatbot-live-dot" />
                  <span className="chatbot-status-text">
                    {preferredVoiceLang === "km"
                      ? "សកម្ម ២៤/៧ • ឆ្លើយតបរហ័ស"
                      : "Online 24/7 • Instant Reply"}
                  </span>
                </div>
              </div>
            </div>

            <div className="chatbot-header-actions">
              {/* Voice playback toggle */}
              <button
                type="button"
                className={`chatbot-header-btn ${isVoiceEnabled ? "active-tool" : ""}`}
                onClick={handleToggleVoicePlayback}
                title={isVoiceEnabled ? "Mute Bot Voice" : "Enable Bot Voice"}
                aria-label="Toggle voice"
              >
                {isVoiceEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>

              {/* Clear History */}
              <button
                type="button"
                className="chatbot-header-btn"
                onClick={handleClearHistory}
                title="Clear Chat History"
                aria-label="Clear chat"
              >
                <Trash2 size={15} />
              </button>

              {/* Expand / Minimize toggle */}
              <button
                type="button"
                className="chatbot-header-btn chatbot-expand-btn"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Standard View" : "Expand Window"}
                aria-label="Resize"
              >
                {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>

              {/* Close */}
              <button
                type="button"
                className="chatbot-header-btn close-btn"
                onClick={() => setIsOpen(false)}
                title="Close Chat"
                aria-label="Close"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Sub Navigation & Language Strip */}
          <div className="chatbot-tab-nav">
            <div className="chatbot-tab-group">
              <button
                type="button"
                className={`chatbot-tab-btn ${activeTab === "chat" ? "active" : ""}`}
                onClick={() => handleSwitchTab("chat")}
              >
                <Sparkles size={12} />
                <span>{preferredVoiceLang === "km" ? "ជំនួយការ AI" : "AI Assistant"}</span>
              </button>
              <button
                type="button"
                className={`chatbot-tab-btn ${activeTab === "tickets" ? "active" : ""}`}
                onClick={() => handleSwitchTab("tickets")}
              >
                <Headphones size={12} />
                <span>{preferredVoiceLang === "km" ? "សារពី Admin" : "Admin Messages"}</span>
                {newRepliesCount > 0 && (
                  <span className="chatbot-tab-reply-count">{newRepliesCount}</span>
                )}
              </button>
            </div>

            {/* Language Capsule Switcher */}
            <div className="chatbot-lang-segmented-control" title="Change Language / ប្តូរភាសា">
              <button
                type="button"
                className={`btn-lang-segment ${preferredVoiceLang === "km" ? "active" : ""}`}
                onClick={() => handleSelectVoiceLanguage("km")}
                aria-label="Khmer Language"
              >
                <span className="lang-flag">🇰🇭</span>
                <span className="lang-text">KH</span>
              </button>
              <button
                type="button"
                className={`btn-lang-segment ${preferredVoiceLang === "en" ? "active" : ""}`}
                onClick={() => handleSelectVoiceLanguage("en")}
                aria-label="English Language"
              >
                <span className="lang-flag">🇺🇸</span>
                <span className="lang-text">EN</span>
              </button>
            </div>
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
                            <Volume2 size={12} />
                            <span>🇰🇭 ស្តាប់</span>
                            {speakingMsgId === msg.id && speakingLang === "km" && (
                              <span className="btn-voice-wave-mini">
                                <span /><span /><span />
                              </span>
                            )}
                          </button>
                          <button
                            type="button"
                            className={`btn-voice-lang ${speakingMsgId === msg.id && speakingLang === "en" ? "speaking" : ""}`}
                            onClick={() => speakTextDual(msg.id, msg.text, "en")}
                            title="Listen in English"
                          >
                            <Volume2 size={12} />
                            <span>🇺🇸 Listen</span>
                            {speakingMsgId === msg.id && speakingLang === "en" && (
                              <span className="btn-voice-wave-mini">
                                <span /><span /><span />
                              </span>
                            )}
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

              {/* Live Status Bar when User is Speaking (Khmer / English Speech-to-Text) */}
              {isListening && (
                <div className="chatbot-voice-active-bar listening">
                  <div className="chatbot-voice-status-info">
                    <Mic size={14} className="text-red-500 animate-pulse" />
                    <span>
                      {preferredVoiceLang === "km"
                        ? "🎙️ កំពុងស្តាប់ជាភាសាខ្មែរ... សូមនិយាយសំណួររបស់អ្នក"
                        : "🎙️ Listening in English... Speak your question"}
                    </span>
                    <div className="chatbot-voice-wave">
                      <span /><span /><span /><span /><span />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="chatbot-voice-stop-btn"
                    onClick={handleToggleVoiceMic}
                    title="Stop Voice Input"
                  >
                    <MicOff size={12} /> {preferredVoiceLang === "km" ? "បញ្ឈប់" : "Stop"}
                  </button>
                </div>
              )}

              {/* Live Status Bar when AI is Speaking (Khmer / English Text-to-Speech Output) */}
              {speakingMsgId && !isListening && (
                <div className="chatbot-voice-active-bar">
                  <div className="chatbot-voice-status-info">
                    <Volume2 size={14} className="text-emerald-600 animate-pulse" />
                    <span>
                      {speakingLang === "km"
                        ? "🔊 AI កំពុងនិយាយជាភាសាខ្មែរ..."
                        : "🔊 AI is speaking in English..."}
                    </span>
                    <div className="chatbot-voice-wave">
                      <span /><span /><span /><span /><span />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="chatbot-voice-stop-btn"
                    onClick={stopSpeaking}
                    title="Stop Voice Output"
                  >
                    <VolumeX size={12} /> {preferredVoiceLang === "km" ? "បញ្ឈប់សំឡេង" : "Stop Voice"}
                  </button>
                </div>
              )}

              {/* Chat Input Bar with Input Voice (Mic) & Output Voice (Speaker) Controls */}
              <div className="chatbot-input-bar">
                <button
                  type="button"
                  className={`chatbot-mic-btn ${isListening ? "listening" : ""}`}
                  onClick={handleToggleVoiceMic}
                  title={
                    isListening
                      ? "Stop Listening"
                      : preferredVoiceLang === "km"
                      ? "និយាយជាភាសាខ្មែរ (Voice Input Khmer)"
                      : "Voice Input (Speech-to-Text)"
                  }
                  aria-label="Voice input"
                >
                  {isListening ? <MicOff size={17} /> : <Mic size={17} />}
                </button>

                <input
                  type="text"
                  className="chatbot-input-field"
                  placeholder={
                    preferredVoiceLang === "km"
                      ? "សួរអ្វីក៏បាន (ឧ. ទូរស័ព្ទក្រោម $500, ផ្ញើសារទៅ Admin, កាតបញ្ជាទិញ)..."
                      : "Ask anything (e.g. phones under $500, contact admin, order #)..."
                  }
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={handleKeyDown}
                  aria-label="Type your message"
                  disabled={isTyping}
                />

                <button
                  type="button"
                  className={`chatbot-voice-quick-toggle ${isVoiceEnabled ? "active" : ""}`}
                  onClick={handleToggleVoicePlayback}
                  title={isVoiceEnabled ? "Turn off AI Voice Output" : "Turn on AI Voice Output"}
                  aria-label="Toggle AI Voice Output"
                >
                  {isVoiceEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
                </button>

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
                <h4>{preferredVoiceLang === "km" ? "សារពី Admin & ជំនួយ" : "Support Messages"}</h4>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <button
                    type="button"
                    className="btn-new-ticket"
                    onClick={() => setShowContactModal(true)}
                  >
                    <Mail size={12} /> {preferredVoiceLang === "km" ? "+ សារថ្មី" : "+ New Message"}
                  </button>
                  <button
                    type="button"
                    className="btn-refresh-tickets"
                    onClick={fetchUserTickets}
                    disabled={loadingTickets}
                    title="Refresh"
                  >
                    <RefreshCw size={12} className={loadingTickets ? "animate-spin" : ""} />
                  </button>
                </div>
              </div>

              {loadingTickets && myTickets.length === 0 ? (
                <div className="chatbot-tickets-empty">
                  <RefreshCw size={24} className="animate-spin text-muted" />
                  <span>{preferredVoiceLang === "km" ? "កំពុងទាញយកសារ..." : "Loading your messages..."}</span>
                </div>
              ) : myTickets.length === 0 ? (
                <div className="chatbot-tickets-empty">
                  <Mail size={32} />
                  <p>
                    {preferredVoiceLang === "km"
                      ? "លោកអ្នកមិនទាន់មានសារសាកសួរទៅកាន់ Admin នៅឡើយទេ។"
                      : "You haven't sent any support inquiries yet."}
                  </p>
                  <button
                    type="button"
                    className="chatbot-action-btn"
                    onClick={() => setShowContactModal(true)}
                  >
                    <Mail size={13} /> {preferredVoiceLang === "km" ? "ផ្ញើសារទៅ Admin ឥឡូវនេះ" : "Send Message to Admin"}
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
                        {new Date(t.created_at || t.createdAt).toLocaleDateString([], {
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
                              {preferredVoiceLang === "km" ? "ឆ្លើយតបបន្ត / Follow up" : "Reply Back / Follow up"}
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
                    <span>{preferredVoiceLang === "km" ? "ផ្ញើសារទៅកាន់ Store Admin" : "Message Store Admin"}</span>
                  </div>
                  <button
                    type="button"
                    className="contact-modal-close"
                    onClick={() => setShowContactModal(false)}
                    aria-label="Close modal"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleSubmitSupport} className="contact-modal-form">
                  <div className="contact-form-group">
                    <label>{preferredVoiceLang === "km" ? "ឈ្មោះរបស់អ្នក *" : "Your Name *"}</label>
                    <input
                      type="text"
                      required
                      placeholder={preferredVoiceLang === "km" ? "ឧ. ចាន់ សុខា" : "e.g. Sokha Chan"}
                      value={contactForm.sender_name}
                      onChange={(e) => setContactForm({ ...contactForm, sender_name: e.target.value })}
                    />
                  </div>

                  <div className="contact-form-row">
                    <div className="contact-form-group">
                      <label>{preferredVoiceLang === "km" ? "អ៊ីមែល (Email)" : "Email Address"}</label>
                      <input
                        type="email"
                        placeholder="you@email.com"
                        value={contactForm.sender_email}
                        onChange={(e) => setContactForm({ ...contactForm, sender_email: e.target.value })}
                      />
                    </div>
                    <div className="contact-form-group">
                      <label>{preferredVoiceLang === "km" ? "លេខទូរស័ព្ទ / Telegram" : "Phone / Telegram"}</label>
                      <input
                        type="text"
                        placeholder="+855 12 345 678"
                        value={contactForm.sender_phone}
                        onChange={(e) => setContactForm({ ...contactForm, sender_phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="contact-form-group">
                    <label>{preferredVoiceLang === "km" ? "ប្រធានបទសាកសួរ *" : "Inquiry Topic *"}</label>
                    <select
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    >
                      <option value="Product Inquiry">
                        {preferredVoiceLang === "km" ? "📱 សាកសួរព័ត៌មាន និងតម្លៃផលិតផល" : "📱 Product & Specs Question"}
                      </option>
                      <option value="Order & Delivery Tracking">
                        {preferredVoiceLang === "km" ? "📦 តាមដានការដឹកជញ្ជូន និងបញ្ជាទិញ" : "📦 Order & Delivery Tracking"}
                      </option>
                      <option value="Device Trade-In Valuation">
                        {preferredVoiceLang === "km" ? "🔄 សេវាកម្មប្តូរសេរីទូរស័ព្ទ (Trade-In)" : "🔄 Device Trade-In / Swap"}
                      </option>
                      <option value="Warranty & Replacement">
                        {preferredVoiceLang === "km" ? "🛡️ ការធានា និងការប្តូរទំនិញ" : "🛡️ Warranty & Replacement"}
                      </option>
                      <option value="Payment & Invoicing">
                        {preferredVoiceLang === "km" ? "💳 ជំនួយការទូទាត់ប្រាក់ (ABA, KHQR, Visa)" : "💳 Payment & Checkout Help"}
                      </option>
                      <option value="General Support">
                        {preferredVoiceLang === "km" ? "💬 សំណួរទូទៅផ្សេងៗ" : "💬 Other General Question"}
                      </option>
                    </select>
                  </div>

                  <div className="contact-form-group">
                    <label>{preferredVoiceLang === "km" ? "ខ្លឹមសារសារ ឬសំណួររបស់អ្នក *" : "Your Message / Question *"}</label>
                    <textarea
                      required
                      rows={4}
                      placeholder={
                        preferredVoiceLang === "km"
                          ? "សូមរៀបរាប់ព័ត៌មានលម្អិតដែលលោកអ្នកចង់សាកសួរទៅកាន់ Admin..."
                          : "Type your message to store administrators in detail..."
                      }
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
                      {preferredVoiceLang === "km" ? "បោះបង់" : "Cancel"}
                    </button>
                    <button
                      type="submit"
                      className="btn-submit-contact"
                      disabled={sendingSupport || !contactForm.message.trim()}
                    >
                      <Send size={14} />{" "}
                      {sendingSupport
                        ? preferredVoiceLang === "km"
                          ? "កំពុងផ្ញើ..."
                          : "Sending..."
                        : preferredVoiceLang === "km"
                        ? "ផ្ញើសារទៅ Admin"
                        : "Send Message to Admin"}
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
