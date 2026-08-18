import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Send,
  Search,
  RefreshCw,
  User,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Zap,
  Inbox,
  Filter
} from "lucide-react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import {
  getAdminSupportMessagesApi,
  getAdminSupportMessageByIdApi,
  replySupportMessageApi,
  generateAiDraftApi,
  getSupportStatsApi
} from "../../services/supportMessageService";
import "./style/MessagesPage.css";

function MessagesPage() {
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState({ total: 0, unread: 0, in_progress: 0, replied: 0 });
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);

  // Robust data extraction helpers
  const extractMessages = (res) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.messages)) return res.messages;
    if (Array.isArray(res.data?.messages)) return res.data.messages;
    if (Array.isArray(res.data)) return res.data;
    return [];
  };

  const extractStats = (res) => {
    if (!res) return { total: 0, unread: 0, in_progress: 0, replied: 0 };
    const src = res.data || res;
    return {
      total: Number(src.total ?? 0),
      unread: Number(src.unread ?? 0),
      in_progress: Number(src.in_progress ?? 0),
      replied: Number(src.replied ?? 0)
    };
  };

  // Fetch Stats & Message list
  const fetchMessagesAndStats = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const queryParams = {};
      if (selectedStatus && selectedStatus !== "all") {
        queryParams.status = selectedStatus;
      }
      if (searchQuery && searchQuery.trim()) {
        queryParams.search = searchQuery.trim();
      }

      const [msgRes, statsRes] = await Promise.all([
        getAdminSupportMessagesApi(queryParams),
        getSupportStatsApi()
      ]);

      const msgList = extractMessages(msgRes);
      setMessages(msgList);

      const statsData = extractStats(statsRes);
      setStats(statsData);

      // Auto-select first message if none selected
      if (msgList.length > 0 && !selectedMessage && !isBackground) {
        handleSelectMessage(msgList[0].id);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      if (!isBackground) toast.error("Failed to load customer messages.");
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessagesAndStats(false);

    // Live auto-polling every 8 seconds for real-time message delivery
    const interval = setInterval(() => {
      fetchMessagesAndStats(true);
    }, 8000);

    return () => clearInterval(interval);
  }, [selectedStatus]);

  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    fetchMessagesAndStats();
  };

  // Select message & fetch full thread + user's orders
  const handleSelectMessage = async (id) => {
    try {
      const res = await getAdminSupportMessageByIdApi(id);
      const data = res?.data || res || {};
      const msg = data.message || data;
      setSelectedMessage(msg);
      setRecentOrders(data.recentOrders || []);
      setReplyText(msg?.ai_suggested_reply || "");

      // Update in local list if status changed from unread to in_progress
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id && m.status === "unread" ? { ...m, status: "in_progress" } : m
        )
      );
    } catch (error) {
      console.error("Select error:", error);
      toast.error("Failed to fetch message details.");
    }
  };

  // Send Reply to Customer
  const handleSendReply = async () => {
    if (!selectedMessage || !replyText.trim()) {
      toast.error("Please enter a reply message.");
      return;
    }

    setIsReplying(true);
    try {
      const res = await replySupportMessageApi(selectedMessage.id, replyText);
      const updated = res?.data;

      toast.success("Reply successfully sent to customer!");
      setSelectedMessage(updated);

      // Update message list
      setMessages((prev) =>
        prev.map((m) => (m.id === updated.id ? { ...m, status: "replied", admin_reply: replyText } : m))
      );

      // Refresh stats
      const statsRes = await getSupportStatsApi();
      if (statsRes?.data) setStats(statsRes.data);
    } catch (error) {
      console.error("Reply error:", error);
      toast.error("Failed to send reply.");
    } finally {
      setIsReplying(false);
    }
  };

  // Generate / Re-generate AI draft with OpenAI
  const handleGenerateAiDraft = async () => {
    if (!selectedMessage) return;

    const { value: customInstruction } = await Swal.fire({
      title: "✨ AI Reply Assistant",
      text: "Enter specific instructions for the AI (e.g. 'Offer 10% discount code', 'Apologize and confirm replacement')",
      input: "text",
      inputPlaceholder: "Optional guidance for AI...",
      showCancelButton: true,
      confirmButtonText: "Generate Draft",
      confirmButtonColor: "#4f46e5"
    });

    if (customInstruction === undefined) return;

    setIsDrafting(true);
    try {
      const res = await generateAiDraftApi(selectedMessage.id, customInstruction);
      const draft = res?.data?.draft;
      if (draft) {
        setSelectedMessage((prev) => ({ ...prev, ai_suggested_reply: draft }));
        setReplyText(draft);
        toast.success("AI draft generated with OpenAI!");
      }
    } catch (error) {
      console.error("AI Draft error:", error);
      toast.error("Failed to generate AI draft.");
    } finally {
      setIsDrafting(false);
    }
  };

  return (
    <div className="messages-page container">
      {/* Header */}
      <div className="messages-header">
        <div className="messages-title-block">
          <h1>
            <MessageSquare className="text-primary" /> Customer Support & Inquiries
          </h1>
          <p>Manage customer tickets, live inquiries, and send AI-assisted replies</p>
        </div>

        <button
          type="button"
          className="btn btn-outline-primary d-inline-flex align-items-center gap-2"
          onClick={fetchMessagesAndStats}
        >
          <RefreshCw size={15} /> Refresh Inbox
        </button>
      </div>

      {/* Stats Cards */}
      <div className="messages-stats-grid">
        <div className="stat-card total-status">
          <div className="stat-info">
            <p>Total Messages</p>
            <h1>{stats.total}</h1>
          </div>
          <div className="icon-box">
            <Inbox size={20} />
          </div>
        </div>

        <div className="stat-card inactive-status">
          <div className="stat-info">
            <p>Unread Inquiries</p>
            <h1>{stats.unread}</h1>
          </div>
          <div className="icon-box">
            <AlertCircle size={20} />
          </div>
        </div>

        <div className="stat-card stock-warning">
          <div className="stat-info">
            <p>In Progress</p>
            <h1>{stats.in_progress}</h1>
          </div>
          <div className="icon-box">
            <Clock size={20} />
          </div>
        </div>

        <div className="stat-card active-status">
          <div className="stat-info">
            <p>Replied</p>
            <h1>{stats.replied}</h1>
          </div>
          <div className="icon-box">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* Main Inbox Workspace */}
      <div className="inbox-container">
        {/* Left Side: Messages List */}
        <div className="inbox-list-pane">
          <div className="inbox-search-bar">
            <form onSubmit={handleSearch} className="search-input-wrap">
              <Search size={15} />
              <input
                type="text"
                placeholder="Search messages, name, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            <div className="status-tabs">
              {[
                { key: "all", label: "All" },
                { key: "unread", label: `Unread (${stats.unread})` },
                { key: "in_progress", label: "In Progress" },
                { key: "replied", label: "Replied" }
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`status-tab ${selectedStatus === tab.key ? "active" : ""}`}
                  onClick={() => setSelectedStatus(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="messages-list-scroll">
            {loading ? (
              <div className="empty-list-state">
                <RefreshCw size={24} className="animate-spin text-muted" />
                <span>Loading messages...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="empty-list-state">
                <Inbox size={32} />
                <span>No messages found in this view.</span>
              </div>
            ) : (
              messages.map((msg) => {
                const isSelected = selectedMessage?.id === msg.id;
                const sentimentClass = (msg.sentiment || "general").toLowerCase();

                return (
                  <div
                    key={msg.id}
                    className={`message-item-card ${msg.status} ${isSelected ? "selected" : ""}`}
                    onClick={() => handleSelectMessage(msg.id)}
                  >
                    <div className="item-top-row">
                      <div className="item-sender-info">
                        <div className="item-avatar">
                          {msg.sender_name?.[0]?.toUpperCase() || "C"}
                        </div>
                        <span className="item-name">{msg.sender_name}</span>
                      </div>
                      <span className="item-date">
                        {new Date(msg.created_at || msg.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric"
                        })}
                      </span>
                    </div>

                    <div className="item-subject">{msg.subject}</div>
                    <div className="item-preview">{msg.message}</div>

                    <div className="item-bottom-row">
                      <span className={`badge-status ${msg.status}`}>{msg.status.replace("_", " ")}</span>
                      {msg.sentiment && (
                        <span className={`badge-sentiment ${sentimentClass}`}>
                          {msg.sentiment.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Message Thread & Reply Pane */}
        <div className="inbox-detail-pane">
          {selectedMessage ? (
            <>
              {/* Customer Header */}
              <div className="detail-header">
                <div className="detail-customer-block">
                  <div className="detail-avatar-large">
                    {selectedMessage.sender_name?.[0]?.toUpperCase() || "C"}
                  </div>
                  <div className="detail-customer-meta">
                    <h3>{selectedMessage.sender_name}</h3>
                    <div className="detail-contact-row">
                      {selectedMessage.sender_email && (
                        <span>
                          <Mail size={13} /> {selectedMessage.sender_email}
                        </span>
                      )}
                      {selectedMessage.sender_phone && (
                        <span>
                          <Phone size={13} /> {selectedMessage.sender_phone}
                        </span>
                      )}
                      <span>
                        <Clock size={13} />{" "}
                        {new Date(selectedMessage.created_at || selectedMessage.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <span className={`badge-status ${selectedMessage.status}`}>
                  {selectedMessage.status.toUpperCase().replace("_", " ")}
                </span>
              </div>

              {/* Message Details Body */}
              <div className="detail-body">
                {/* Customer Inquiry Bubble */}
                <div className="inquiry-bubble-card">
                  <div className="inquiry-subject-row">
                    <h4>Subject: {selectedMessage.subject}</h4>
                    {selectedMessage.sentiment && (
                      <span className={`badge-sentiment ${selectedMessage.sentiment.toLowerCase()}`}>
                        {selectedMessage.sentiment.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="inquiry-text">{selectedMessage.message}</div>
                </div>

                {/* Registered Customer Order Context */}
                {recentOrders.length > 0 && (
                  <div className="alert alert-light border p-3 rounded-3 d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <ShoppingBag size={18} className="text-primary" />
                      <span className="text-sm">
                        <strong>Customer Order History:</strong> {recentOrders.length} recent order(s). Latest:{" "}
                        <strong>#{recentOrders[0].id.slice(0, 8)}</strong> (${recentOrders[0].total_amount} -{" "}
                        {recentOrders[0].status.toUpperCase()})
                      </span>
                    </div>
                  </div>
                )}

                {/* AI Assistant Card (OpenAI / Gemini) */}
                {selectedMessage.ai_suggested_reply && (
                  <div className="ai-assistant-card">
                    <div className="ai-assistant-header">
                      <span className="ai-badge">
                        <Sparkles size={14} /> AI Suggested Response (OpenAI)
                      </span>
                      {selectedMessage.ai_summary && (
                        <small className="text-muted">
                          <strong>Summary:</strong> {selectedMessage.ai_summary}
                        </small>
                      )}
                    </div>
                    <div className="ai-draft-content">{selectedMessage.ai_suggested_reply}</div>
                    <div className="ai-actions-row">
                      <button
                        type="button"
                        className="btn-use-draft"
                        onClick={() => {
                          setReplyText(selectedMessage.ai_suggested_reply);
                          toast.success("AI Draft copied to reply box!");
                        }}
                      >
                        <Zap size={14} /> Insert Draft to Reply Box
                      </button>
                      <button
                        type="button"
                        className="btn-regen-draft"
                        onClick={handleGenerateAiDraft}
                        disabled={isDrafting}
                      >
                        <Sparkles size={14} /> {isDrafting ? "Generating..." : "Re-generate AI Draft"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Previous Admin Reply if already sent */}
                {selectedMessage.admin_reply && (
                  <div className="replied-message-card">
                    <div className="replied-header">
                      <span>✅ Admin Response Sent</span>
                      <span>
                        {selectedMessage.replied_at
                          ? new Date(selectedMessage.replied_at).toLocaleString()
                          : "Recently"}
                      </span>
                    </div>
                    <div className="replied-content">{selectedMessage.admin_reply}</div>
                  </div>
                )}

                {/* Reply Composer */}
                <div className="reply-composer-card">
                  <h4>Reply to {selectedMessage.sender_name}</h4>
                  <textarea
                    className="reply-textarea"
                    placeholder="Type your response to the customer here, or use the AI draft above..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <div className="reply-actions-row">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                      onClick={handleGenerateAiDraft}
                      disabled={isDrafting}
                    >
                      <Sparkles size={13} /> {isDrafting ? "Drafting..." : "Ask AI to Write"}
                    </button>
                    <button
                      type="button"
                      className="btn-send-reply"
                      onClick={handleSendReply}
                      disabled={isReplying || !replyText.trim()}
                    >
                      <Send size={15} /> {isReplying ? "Sending..." : "Send Reply to Customer"}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="detail-empty-prompt">
              <MessageSquare size={48} strokeWidth={1.5} />
              <h4>Select a message to view details</h4>
              <p>Choose an inquiry from the left to read customer messages and send replies.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MessagesPage;
