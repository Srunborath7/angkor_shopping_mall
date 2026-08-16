import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBell,
  FaSearch,
  FaBars,
  FaUserCircle,
  FaSignOutAlt,
  FaStore,
  FaChevronDown,
  FaEnvelope,
  FaClock,
  FaCheckDouble
} from "react-icons/fa";
import { Sparkles, MessageSquare, ExternalLink } from "lucide-react";
import Swal from "sweetalert2";
import {
  getSupportStatsApi,
  getAdminSupportMessagesApi
} from "../services/supportMessageService";
import "./style/Navbar.css";

function Navbar({ setOpen, user, logout }) {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentInquiries, setRecentInquiries] = useState([]);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  // Fetch real unread customer message count & recent notifications
  const fetchNotifications = async () => {
    try {
      const [statsRes, msgRes] = await Promise.all([
        getSupportStatsApi(),
        getAdminSupportMessagesApi({ limit: 5 })
      ]);

      const count = statsRes?.data?.unread || statsRes?.unread || 0;
      setUnreadCount(count);

      const list = msgRes?.data?.messages || msgRes?.messages || [];
      setRecentInquiries(list);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to logout?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#1c7e48",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Logout",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
      }
    });
  };

  const handleOpenMessages = () => {
    setNotifOpen(false);
    navigate("/admin/messages");
  };

  return (
    <header className="navbar container px-4">
      <button className="menu-button" onClick={() => setOpen(true)} aria-label="Open Sidebar">
        <FaBars />
      </button>

      <div className="search-box">
        <FaSearch />
        <input type="text" placeholder="Search products, orders, customers..." />
      </div>

      <div className="navbar-right">
        {/* Live Notification Bell Wrapper */}
        <div className="notification-wrapper" ref={notifRef}>
          <button
            className={`notification ${unreadCount > 0 ? "has-unread" : ""}`}
            title="Customer Support Notifications"
            onClick={() => setNotifOpen(!notifOpen)}
            aria-label="Notifications"
          >
            <FaBell />
            {unreadCount > 0 && <span>{unreadCount > 99 ? "99+" : unreadCount}</span>}
          </button>

          {/* Notification Dropdown Panel */}
          {notifOpen && (
            <div className="notif-dropdown-card">
              <div className="notif-dropdown-header">
                <div className="notif-header-title">
                  <MessageSquare size={16} />
                  <span>Customer Inquiries</span>
                </div>
                {unreadCount > 0 && <span className="notif-unread-pill">{unreadCount} New</span>}
              </div>

              <div className="notif-dropdown-list">
                {recentInquiries.length === 0 ? (
                  <div className="notif-empty-state">
                    <FaCheckDouble size={22} className="text-muted" />
                    <span>All caught up! No recent messages.</span>
                  </div>
                ) : (
                  recentInquiries.map((msg) => (
                    <div
                      key={msg.id}
                      className={`notif-item ${msg.status === "unread" ? "unread" : ""}`}
                      onClick={handleOpenMessages}
                    >
                      <div className="notif-item-avatar">
                        {msg.sender_name?.[0]?.toUpperCase() || "C"}
                      </div>
                      <div className="notif-item-body">
                        <div className="notif-item-row">
                          <strong className="notif-sender">{msg.sender_name}</strong>
                          <span className="notif-time">
                            {new Date(msg.created_at || msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>
                        <span className="notif-subject">{msg.subject}</span>
                        <p className="notif-preview">{msg.message}</p>
                      </div>
                      {msg.status === "unread" && <span className="notif-unread-dot" />}
                    </div>
                  ))
                )}
              </div>

              <div className="notif-dropdown-footer">
                <button type="button" className="btn-view-all-notifs" onClick={handleOpenMessages}>
                  <span>View All Inquiries in Inbox</span>
                  <ExternalLink size={13} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="profile-wrapper" ref={dropdownRef}>
          <div
            className="profile"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            title="Profile options"
          >
            <FaUserCircle className="profile-icon" />

            <div>
              <strong>{user?.name || "Super Admin"}</strong>
              <small>{user?.role || "Administrator"}</small>
            </div>

            <FaChevronDown className={`profile-arrow ${dropdownOpen ? "open" : ""}`} />
          </div>

          {dropdownOpen && (
            <div className="profile-dropdown-card">
              <div className="dropdown-user-info">
                <span className="info-name">{user?.name || "Super Admin"}</span>
                <span className="info-email">{user?.email || "admin@angkor.com"}</span>
                <span className="info-role">{user?.role?.toUpperCase() || "ADMINISTRATOR"}</span>
              </div>

              <button
                className="dropdown-item"
                onClick={() => {
                  setDropdownOpen(false);
                  navigate("/");
                }}
              >
                <FaStore className="dropdown-icon" />
                <span>Go to E-commerce</span>
              </button>

              <button
                className="dropdown-item"
                onClick={() => {
                  setDropdownOpen(false);
                  navigate("/admin/messages");
                }}
              >
                <FaEnvelope className="dropdown-icon" />
                <span>Customer Messages</span>
              </button>

              <button className="dropdown-item logout-item" onClick={handleLogout}>
                <FaSignOutAlt className="dropdown-icon" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>

        <button className="logout" onClick={handleLogout} title="Logout">
          <FaSignOutAlt className="logout-icon" />
          <span className="logout-text">Logout</span>
        </button>
      </div>
    </header>
  );
}

export default Navbar;