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
  Filter,
  ChevronRight,
  ArrowUp,
  Star,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  Plus,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  Globe
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
import {
  getAllTestimonialsApi,
  togglePublishTestimonialApi,
  updateTestimonialApi,
  deleteTestimonialApi,
  submitTestimonialApi
} from "../../services/testimonialService";
import Modal from "../../components/Modal";
import { MessageListSkeleton, KpiCardSkeleton } from "../../components/loading/LoadingSkeleton";
import { usePermissions, AccessDeniedView } from "../../hooks/usePermissions.jsx";
import "./style/MessagesPage.css";

function MessagesPage() {
  const { can } = usePermissions();
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
  const [mobileView, setMobileView] = useState("list");

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
      setMobileView("detail");

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

  const handleBackToList = () => {
    setMobileView("list");
    setSelectedMessage(null);
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

  // Page Navigation Tab: 'support' vs 'testimonials'
  const [pageTab, setPageTab] = useState("support");

  // Testimonials State
  const [testimonials, setTestimonials] = useState([]);
  const [testimonialFilter, setTestimonialFilter] = useState("all");
  const [testimonialSearch, setTestimonialSearch] = useState("");
  const [testimonialLoading, setTestimonialLoading] = useState(false);
  const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [modalFormData, setModalFormData] = useState({
    author_name: "",
    location: "Phnom Penh",
    rating: 5,
    message: "",
    is_published: true,
    avatar_color: "green"
  });

  const fetchTestimonials = async () => {
    setTestimonialLoading(true);
    try {
      const params = {};
      if (testimonialFilter !== "all") params.status = testimonialFilter;
      if (testimonialSearch.trim()) params.search = testimonialSearch.trim();
      const data = await getAllTestimonialsApi(params);
      setTestimonials(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Testimonials fetch error:", err);
      toast.error("Failed to load testimonials.");
    } finally {
      setTestimonialLoading(false);
    }
  };

  useEffect(() => {
    if (pageTab === "testimonials") {
      fetchTestimonials();
    }
  }, [pageTab, testimonialFilter]);

  const handleTogglePublish = async (id, currentPublished) => {
    try {
      // Optimistic update
      setTestimonials((prev) =>
        prev.map((t) => (t.id === id ? { ...t, is_published: !currentPublished } : t))
      );
      const res = await togglePublishTestimonialApi(id);
      const newStatus = res?.data?.data?.is_published ?? !currentPublished;
      toast.success(
        newStatus
          ? "✅ Review is now PUBLISHED on the website homepage!"
          : "🔒 Review is now UNPUBLISHED (hidden from website)."
      );
    } catch (err) {
      toast.error(err?.message || "Failed to update publish status.");
      fetchTestimonials();
    }
  };

  const handleOpenAddTestimonial = () => {
    setEditingTestimonial(null);
    setModalFormData({
      author_name: "",
      location: "Phnom Penh",
      rating: 5,
      message: "",
      is_published: true,
      avatar_color: "green"
    });
    setIsTestimonialModalOpen(true);
  };

  const handleOpenEditTestimonial = (item) => {
    setEditingTestimonial(item);
    setModalFormData({
      author_name: item.author_name || "",
      location: item.location || "Phnom Penh",
      rating: Number(item.rating || 5),
      message: item.message || "",
      is_published: item.is_published !== undefined ? item.is_published : true,
      avatar_color: item.avatar_color || "green"
    });
    setIsTestimonialModalOpen(true);
  };

  const handleSaveTestimonial = async (e) => {
    e.preventDefault();
    if (!modalFormData.message.trim()) {
      return toast.error("Please enter a review message.");
    }
    try {
      if (editingTestimonial) {
        await updateTestimonialApi(editingTestimonial.id, modalFormData);
        toast.success("Testimonial updated successfully!");
      } else {
        await submitTestimonialApi(modalFormData);
        toast.success("Testimonial added successfully!");
      }
      setIsTestimonialModalOpen(false);
      fetchTestimonials();
    } catch (err) {
      toast.error(err?.message || "Failed to save testimonial.");
    }
  };

  const handleDeleteTestimonial = async (id) => {
    const result = await Swal.fire({
      title: "Delete this testimonial?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, delete it"
    });

    if (result.isConfirmed) {
      try {
        await deleteTestimonialApi(id);
        toast.success("Testimonial deleted.");
        fetchTestimonials();
      } catch (err) {
        toast.error(err?.message || "Failed to delete testimonial.");
      }
    }
  };

  if (!can("messages", "view")) {
    return <AccessDeniedView moduleName="Customer Support & Chat" />;
  }

  const publishedCount = testimonials.filter((t) => t.is_published).length;
  const pendingCount = testimonials.filter((t) => !t.is_published).length;

  return (
    <div className="messages-page container">
      {/* Header */}
      <div className="messages-header" style={{ marginBottom: "1rem" }}>
        <div className="messages-title-block">
          <h1>
            <MessageSquare className="text-primary" /> Customer Communications & Reviews
          </h1>
          <p>Manage customer tickets, live inquiries, and publish customer testimonials on the website</p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          {pageTab === "testimonials" && (
            <button
              type="button"
              className="btn btn-primary d-inline-flex align-items-center gap-2"
              onClick={handleOpenAddTestimonial}
              style={{ background: "#166534", borderColor: "#166534" }}
            >
              <Plus size={15} /> Add Testimonial
            </button>
          )}

          <button
            type="button"
            className="btn btn-outline-primary d-inline-flex align-items-center gap-2"
            onClick={pageTab === "support" ? fetchMessagesAndStats : fetchTestimonials}
          >
            <RefreshCw size={15} /> Refresh {pageTab === "support" ? "Inbox" : "Reviews"}
          </button>
        </div>
      </div>

      {/* Top Navigation Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "2px solid #e2e8f0",
          marginBottom: "20px",
          overflowX: "auto"
        }}
      >
        <button
          type="button"
          onClick={() => setPageTab("support")}
          style={{
            padding: "10px 18px",
            fontWeight: 700,
            fontSize: "0.95rem",
            color: pageTab === "support" ? "#166534" : "#64748b",
            background: pageTab === "support" ? "#f0fdf4" : "transparent",
            border: "none",
            borderBottom: pageTab === "support" ? "3px solid #166534" : "3px solid transparent",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            borderRadius: "8px 8px 0 0",
            transition: "all 0.2s"
          }}
        >
          <Inbox size={18} /> Customer Support Tickets
          {stats.unread > 0 && (
            <span style={{ background: "#ef4444", color: "#fff", padding: "1px 7px", borderRadius: "10px", fontSize: "0.75rem" }}>
              {stats.unread}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setPageTab("testimonials")}
          style={{
            padding: "10px 18px",
            fontWeight: 700,
            fontSize: "0.95rem",
            color: pageTab === "testimonials" ? "#166534" : "#64748b",
            background: pageTab === "testimonials" ? "#f0fdf4" : "transparent",
            border: "none",
            borderBottom: pageTab === "testimonials" ? "3px solid #166534" : "3px solid transparent",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            borderRadius: "8px 8px 0 0",
            transition: "all 0.2s"
          }}
        >
          <Star size={18} fill={pageTab === "testimonials" ? "#FFC107" : "none"} stroke={pageTab === "testimonials" ? "#FFC107" : "currentColor"} />
          "What Our Customers Say" (Website Publish Control)
          <span style={{ background: "#10b981", color: "#fff", padding: "1px 7px", borderRadius: "10px", fontSize: "0.75rem" }}>
            {publishedCount} Live
          </span>
          {pendingCount > 0 && (
            <span style={{ background: "#f59e0b", color: "#fff", padding: "1px 7px", borderRadius: "10px", fontSize: "0.75rem" }}>
              {pendingCount} Pending
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SUPPORT INBOX VIEW                                                 */}
      {/* ========================================================================= */}
      {pageTab === "support" && (
        <>
          {/* Stats Cards */}
          <div className="stats-grid" style={{ marginBottom: "24px" }}>
            <div
              className={`stat-card ${selectedStatus === "all" ? "active-kpi" : ""}`}
              onClick={() => setSelectedStatus("all")}
              role="button"
              tabIndex={0}
            >
              <div className="stat-card-header">
                <div className="stat-icon-wrapper blue-bg">
                  <Inbox size={20} />
                </div>
                <span className="growth-tag positive"><ArrowUp size={12} /> 100%</span>
              </div>
              <div className="stat-card-body">
                <h4>Total Messages</h4>
                <h2 className="stat-value">{stats.total}</h2>
                <div className="stat-footer-row">
                  <small>All customer support tickets</small>
                  <span className="kpi-click-hint"><ChevronRight size={11} /></span>
                </div>
              </div>
            </div>

            <div
              className={`stat-card ${selectedStatus === "unread" ? "active-kpi" : ""}`}
              onClick={() => setSelectedStatus(selectedStatus === "unread" ? "all" : "unread")}
              role="button"
              tabIndex={0}
            >
              <div className="stat-card-header">
                <div className="stat-icon-wrapper red-bg" style={{ background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", color: "#fff" }}>
                  <AlertCircle size={20} />
                </div>
                <span className="growth-tag warning">{stats.unread} new</span>
              </div>
              <div className="stat-card-body">
                <h4>Unread Inquiries</h4>
                <h2 className="stat-value">{stats.unread}</h2>
                <div className="stat-footer-row">
                  <small>Requires agent response</small>
                  <span className="kpi-click-hint"><ChevronRight size={11} /></span>
                </div>
              </div>
            </div>

            <div
              className={`stat-card ${selectedStatus === "in_progress" ? "active-kpi" : ""}`}
              onClick={() => setSelectedStatus(selectedStatus === "in_progress" ? "all" : "in_progress")}
              role="button"
              tabIndex={0}
            >
              <div className="stat-card-header">
                <div className="stat-icon-wrapper orange-bg">
                  <Clock size={20} />
                </div>
                <span className="growth-tag warning">{stats.in_progress} active</span>
              </div>
              <div className="stat-card-body">
                <h4>In Progress</h4>
                <h2 className="stat-value">{stats.in_progress}</h2>
                <div className="stat-footer-row">
                  <small>Open support dialogues</small>
                  <span className="kpi-click-hint"><ChevronRight size={11} /></span>
                </div>
              </div>
            </div>

            <div
              className={`stat-card ${selectedStatus === "replied" ? "active-kpi" : ""}`}
              onClick={() => setSelectedStatus(selectedStatus === "replied" ? "all" : "replied")}
              role="button"
              tabIndex={0}
            >
              <div className="stat-card-header">
                <div className="stat-icon-wrapper green-bg">
                  <CheckCircle2 size={20} />
                </div>
                <span className="growth-tag positive">Resolved</span>
              </div>
              <div className="stat-card-body">
                <h4>Replied Tickets</h4>
                <h2 className="stat-value">{stats.replied}</h2>
                <div className="stat-footer-row">
                  <small>Completed inquiries</small>
                  <span className="kpi-click-hint"><ChevronRight size={11} /></span>
                </div>
              </div>
            </div>
          </div>

          {/* Main 2-Column Split Workspace */}
          <div className="messages-workspace">
            {/* Left Column: Messages List */}
            <div className={`messages-list-pane ${mobileView === "detail" ? "hide-on-mobile" : ""}`}>
              <div className="pane-header">
                <form onSubmit={handleSearch} className="search-form-group">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search by customer name, phone, subject..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="search-clear-btn"
                      onClick={() => {
                        setSearchQuery("");
                        fetchMessagesAndStats();
                      }}
                    >
                      ×
                    </button>
                  )}
                </form>

                {/* Filter Pills */}
                <div className="filter-chips-row">
                  {["all", "unread", "in_progress", "replied", "closed"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      className={`filter-chip ${selectedStatus === st ? "active" : ""}`}
                      onClick={() => setSelectedStatus(st)}
                    >
                      {st.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Cards Scroll Area */}
              <div className="messages-scroll-area">
                {loading ? (
                  <MessageListSkeleton count={5} />
                ) : messages.length === 0 ? (
                  <div className="empty-inbox">
                    <Inbox size={40} strokeWidth={1.5} />
                    <p>No customer messages found.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isSelected = selectedMessage?.id === msg.id;
                    const isUnread = msg.status === "unread";
                    return (
                      <div
                        key={msg.id}
                        className={`message-item-card ${isSelected ? "selected" : ""} ${isUnread ? "unread" : ""}`}
                        onClick={() => handleSelectMessage(msg.id)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="msg-card-top">
                          <div className="sender-avatar">
                            {msg.sender_name?.charAt(0)?.toUpperCase() || "C"}
                          </div>
                          <div className="sender-details">
                            <h4>{msg.sender_name}</h4>
                            <span className="msg-time">
                              {msg.created_at
                                ? new Date(msg.created_at).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })
                                : "Just now"}
                            </span>
                          </div>
                          <span className={`status-pill ${msg.status || "unread"}`}>
                            {msg.status}
                          </span>
                        </div>

                        <div className="msg-subject-row">
                          <strong>{msg.subject || "General Inquiry"}</strong>
                        </div>

                        <p className="msg-snippet">{msg.message}</p>

                        <div className="msg-card-footer">
                          {msg.sender_phone && (
                            <span className="footer-meta-item">
                              <Phone size={12} /> {msg.sender_phone}
                            </span>
                          )}
                          {msg.sentiment && (
                            <span className={`sentiment-badge ${msg.sentiment}`}>
                              {msg.sentiment}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Message Detail & Response */}
            <div className={`message-detail-pane ${mobileView === "list" ? "hide-on-mobile" : ""}`}>
              {selectedMessage ? (
                <>
                  <div className="detail-pane-header">
                    <button
                      type="button"
                      className="btn-back-to-list"
                      onClick={() => setMobileView("list")}
                    >
                      ← Back to messages
                    </button>

                    <div className="sender-profile-flex">
                      <div className="sender-big-avatar">
                        {selectedMessage.sender_name?.charAt(0)?.toUpperCase() || "C"}
                      </div>
                      <div>
                        <h3>{selectedMessage.sender_name}</h3>
                        <div className="sender-meta-chips">
                          {selectedMessage.sender_phone && (
                            <span>
                              <Phone size={12} /> {selectedMessage.sender_phone}
                            </span>
                          )}
                          {selectedMessage.sender_email && (
                            <span>
                              <Mail size={12} /> {selectedMessage.sender_email}
                            </span>
                          )}
                          <span>
                            <Clock size={12} />{" "}
                            {selectedMessage.created_at
                              ? new Date(selectedMessage.created_at).toLocaleString()
                              : "Recently"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="detail-scroll-body">
                    {/* Inquiry Card */}
                    <div className="inquiry-message-card">
                      <div className="inquiry-header">
                        <h4>{selectedMessage.subject || "Customer Inquiry"}</h4>
                        <span className={`status-pill ${selectedMessage.status}`}>
                          {selectedMessage.status}
                        </span>
                      </div>
                      <p className="inquiry-text">{selectedMessage.message}</p>
                    </div>

                    {/* AI Draft Box */}
                    {selectedMessage.ai_suggested_reply && (
                      <div className="ai-suggestion-card">
                        <div className="ai-header">
                          <span>
                            <Sparkles size={16} className="text-primary" /> AI Suggested Reply
                          </span>
                          <span className="ai-tag">OpenAI</span>
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
                    {can("messages", "reply") ? (
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
                    ) : (
                      <div style={{ padding: "16px", background: "rgba(100, 116, 139, 0.08)", borderRadius: "8px", color: "#64748b", fontSize: "0.9rem", textAlign: "center", marginTop: "16px" }}>
                        🔒 You have view-only access to customer support messages. Replying is restricted for your role.
                      </div>
                    )}
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
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: "WHAT OUR CUSTOMERS SAY" (WEBSITE TESTIMONIALS PUBLISH CONTROL)   */}
      {/* ========================================================================= */}
      {pageTab === "testimonials" && (
        <div>
          {/* Testimonial KPI Cards */}
          <div className="stats-grid" style={{ marginBottom: "24px" }}>
            <div
              className={`stat-card ${testimonialFilter === "all" ? "active-kpi" : ""}`}
              onClick={() => setTestimonialFilter("all")}
              role="button"
              tabIndex={0}
            >
              <div className="stat-card-header">
                <div className="stat-icon-wrapper blue-bg">
                  <Star size={20} />
                </div>
                <span className="growth-tag positive">Total</span>
              </div>
              <div className="stat-card-body">
                <h4>Total Reviews</h4>
                <h2 className="stat-value">{testimonials.length}</h2>
                <div className="stat-footer-row">
                  <small>All customer feedback</small>
                </div>
              </div>
            </div>

            <div
              className={`stat-card ${testimonialFilter === "published" ? "active-kpi" : ""}`}
              onClick={() => setTestimonialFilter(testimonialFilter === "published" ? "all" : "published")}
              role="button"
              tabIndex={0}
            >
              <div className="stat-card-header">
                <div className="stat-icon-wrapper green-bg">
                  <Globe size={20} />
                </div>
                <span className="growth-tag positive">🟢 Live on Home</span>
              </div>
              <div className="stat-card-body">
                <h4>Published on Website</h4>
                <h2 className="stat-value">{publishedCount}</h2>
                <div className="stat-footer-row">
                  <small>Displayed to all visitors</small>
                </div>
              </div>
            </div>

            <div
              className={`stat-card ${testimonialFilter === "pending" ? "active-kpi" : ""}`}
              onClick={() => setTestimonialFilter(testimonialFilter === "pending" ? "all" : "pending")}
              role="button"
              tabIndex={0}
            >
              <div className="stat-card-header">
                <div className="stat-icon-wrapper orange-bg">
                  <Clock size={20} />
                </div>
                <span className="growth-tag warning">Needs Review</span>
              </div>
              <div className="stat-card-body">
                <h4>Pending Approval</h4>
                <h2 className="stat-value">{pendingCount}</h2>
                <div className="stat-footer-row">
                  <small>Submitted by website users</small>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-icon-wrapper purple-bg">
                  <CheckCircle size={20} />
                </div>
                <span className="growth-tag positive">100% Real</span>
              </div>
              <div className="stat-card-body">
                <h4>Verified Rating</h4>
                <h2 className="stat-value">5.0 ⭐</h2>
                <div className="stat-footer-row">
                  <small>Across Cambodia</small>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonial Filter & Search Bar */}
          <div
            style={{
              background: "#ffffff",
              padding: "16px 20px",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              marginBottom: "20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px"
            }}
          >
            <div style={{ display: "flex", gap: "10px", alignItems: "center", flex: "1 1 300px" }}>
              <div style={{ position: "relative", width: "100%", maxWidth: "380px" }}>
                <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input
                  type="text"
                  placeholder="Search reviewer name, city, message quote..."
                  value={testimonialSearch}
                  onChange={(e) => setTestimonialSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchTestimonials()}
                  style={{
                    width: "100%",
                    padding: "8px 12px 8px 36px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem"
                  }}
                />
              </div>
              <button
                type="button"
                onClick={fetchTestimonials}
                className="btn btn-sm btn-outline-secondary"
                style={{ padding: "8px 14px", borderRadius: "8px" }}
              >
                Search
              </button>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              {[
                { id: "all", label: "All Reviews" },
                { id: "published", label: "🟢 Published on Website" },
                { id: "pending", label: "🟡 Pending Approval" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTestimonialFilter(tab.id)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "20px",
                    fontSize: "0.825rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    border: testimonialFilter === tab.id ? "1px solid #166534" : "1px solid #e2e8f0",
                    background: testimonialFilter === tab.id ? "#166534" : "#f8fafc",
                    color: testimonialFilter === tab.id ? "#ffffff" : "#475569"
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Testimonial Table */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              overflow: "hidden",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.02)"
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ padding: "14px 18px", fontSize: "0.825rem", color: "#64748b", textTransform: "uppercase" }}>Author & Location</th>
                    <th style={{ padding: "14px 18px", fontSize: "0.825rem", color: "#64748b", textTransform: "uppercase" }}>Rating</th>
                    <th style={{ padding: "14px 18px", fontSize: "0.825rem", color: "#64748b", textTransform: "uppercase" }}>Review Quote / Message</th>
                    <th style={{ padding: "14px 18px", fontSize: "0.825rem", color: "#64748b", textTransform: "uppercase" }}>Website Status</th>
                    <th style={{ padding: "14px 18px", fontSize: "0.825rem", color: "#64748b", textTransform: "uppercase", textAlign: "center" }}>Publish Toggle</th>
                    <th style={{ padding: "14px 18px", fontSize: "0.825rem", color: "#64748b", textTransform: "uppercase", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {testimonialLoading ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                        Loading customer testimonials...
                      </td>
                    </tr>
                  ) : testimonials.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                        No testimonials found matching current filter.
                      </td>
                    </tr>
                  ) : (
                    testimonials.map((item) => (
                      <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div
                              style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "50%",
                                background: item.avatar_color === "blue" ? "#3b82f6" : item.avatar_color === "purple" ? "#8b5cf6" : "#10b981",
                                color: "#ffffff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 800,
                                fontSize: "0.85rem"
                              }}
                            >
                              {item.author_name?.charAt(0)?.toUpperCase() || "C"}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.925rem" }}>
                                {item.author_name}
                              </div>
                              <small style={{ color: "#64748b" }}>📍 {item.location || "Cambodia"}</small>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                fill={i < Number(item.rating || 5) ? "#FFC107" : "none"}
                                stroke={i < Number(item.rating || 5) ? "#FFC107" : "#CBD5E1"}
                              />
                            ))}
                            <span style={{ fontWeight: 700, fontSize: "0.825rem", color: "#b45309", marginLeft: "4px" }}>
                              {item.rating}.0
                            </span>
                          </div>
                        </td>

                        <td style={{ padding: "14px 18px", maxWidth: "380px" }}>
                          <p style={{ margin: 0, fontSize: "0.875rem", color: "#334155", lineHeight: 1.5 }}>
                            "{item.message}"
                          </p>
                          <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                            {item.created_at ? new Date(item.created_at).toLocaleDateString() : "Recently"}
                          </small>
                        </td>

                        <td style={{ padding: "14px 18px" }}>
                          {item.is_published ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "4px 10px",
                                borderRadius: "20px",
                                fontSize: "0.78rem",
                                fontWeight: 700,
                                background: "#ecfdf5",
                                color: "#047857",
                                border: "1px solid #a7f3d0"
                              }}
                            >
                              <CheckCircle2 size={12} /> Published (Live)
                            </span>
                          ) : (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "4px 10px",
                                borderRadius: "20px",
                                fontSize: "0.78rem",
                                fontWeight: 700,
                                background: "#fffbeb",
                                color: "#b45309",
                                border: "1px solid #fef3c7"
                              }}
                            >
                              <Clock size={12} /> Pending / Hidden
                            </span>
                          )}
                        </td>

                        <td style={{ padding: "14px 18px", textAlign: "center" }}>
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(item.id, item.is_published)}
                            title={item.is_published ? "Click to Unpublish from Website" : "Click to Publish on Website"}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: item.is_published ? "#10b981" : "#94a3b8",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontWeight: 700,
                              fontSize: "0.85rem"
                            }}
                          >
                            {item.is_published ? (
                              <>
                                <ToggleRight size={28} />
                                <span style={{ color: "#047857" }}>Live</span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft size={28} />
                                <span style={{ color: "#64748b" }}>Hidden</span>
                              </>
                            )}
                          </button>
                        </td>

                        <td style={{ padding: "14px 18px", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleOpenEditTestimonial(item)}
                              title="Edit Review"
                              style={{ padding: "5px 9px", borderRadius: "8px" }}
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteTestimonial(item.id)}
                              title="Delete Review"
                              style={{ padding: "5px 9px", borderRadius: "8px" }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Admin Add / Edit Testimonial Modal */}
      {isTestimonialModalOpen && (
        <Modal
          title={editingTestimonial ? "Edit Website Testimonial" : "Add New Customer Testimonial"}
          isOpen={isTestimonialModalOpen}
          onClose={() => setIsTestimonialModalOpen(false)}
        >
          <form onSubmit={handleSaveTestimonial} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="form-group">
              <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>
                Customer / Reviewer Name *
              </label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. Sok Dara"
                value={modalFormData.author_name}
                onChange={(e) => setModalFormData({ ...modalFormData, author_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>
                Province / City *
              </label>
              <select
                className="form-select"
                value={modalFormData.location}
                onChange={(e) => setModalFormData({ ...modalFormData, location: e.target.value })}
              >
                <option value="Phnom Penh">Phnom Penh (ភ្នំពេញ)</option>
                <option value="Siem Reap">Siem Reap (សៀមរាប)</option>
                <option value="Battambang">Battambang (បាត់ដំបង)</option>
                <option value="Sihanoukville">Sihanoukville (ព្រះសីហនុ)</option>
                <option value="Kampot">Kampot (កំពត)</option>
                <option value="Kandal">Kandal (កណ្តាល)</option>
                <option value="Takeo">Takeo (តាកែវ)</option>
                <option value="Kampong Cham">Kampong Cham (កំពង់ចាម)</option>
                <option value="Banteay Meanchey">Banteay Meanchey (បន្ទាយមានជ័យ)</option>
                <option value="Other Province">Other Province (ខេត្តផ្សេងទៀត)</option>
              </select>
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>
                Star Rating (1 to 5 Stars)
              </label>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setModalFormData({ ...modalFormData, rating: star })}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: "2px" }}
                  >
                    <Star
                      size={24}
                      fill={star <= modalFormData.rating ? "#FFC107" : "none"}
                      stroke={star <= modalFormData.rating ? "#FFC107" : "#CBD5E1"}
                    />
                  </button>
                ))}
                <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#166534", marginLeft: "8px" }}>
                  {modalFormData.rating} / 5 Stars
                </span>
              </div>
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>
                Customer Quote / Review Message *
              </label>
              <textarea
                required
                rows={4}
                className="form-control"
                placeholder="Enter the customer review quote..."
                value={modalFormData.message}
                onChange={(e) => setModalFormData({ ...modalFormData, message: e.target.value })}
              />
            </div>

            <div className="form-check form-switch" style={{ marginTop: "4px" }}>
              <input
                className="form-check-input"
                type="checkbox"
                id="publishSwitchModal"
                checked={modalFormData.is_published}
                onChange={(e) => setModalFormData({ ...modalFormData, is_published: e.target.checked })}
              />
              <label className="form-check-label" htmlFor="publishSwitchModal" style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                Publish Immediately on Website Homepage (What Our Customers Say)
              </label>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "14px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsTestimonialModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ background: "#166534", borderColor: "#166534" }}
              >
                {editingTestimonial ? "Save Changes" : "Create Testimonial"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default MessagesPage;
