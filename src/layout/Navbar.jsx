import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
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
  FaCheckDouble,
  FaCog,
  FaTachometerAlt,
  FaLock
} from "react-icons/fa";
import { lockPin } from "../store/authSlice";
import {
  Sparkles,
  MessageSquare,
  ExternalLink,
  Sun,
  Moon,
  Laptop,
  Globe,
  Palette,
  Check
} from "lucide-react";
import Swal from "sweetalert2";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "../context/LanguageContext";
import {
  getSupportStatsApi,
  getAdminSupportMessagesApi
} from "../services/supportMessageService";
import "./style/Navbar.css";

function Navbar({ setOpen, user, logout }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { theme, setTheme, resolvedTheme, isDark } = useTheme();
  const { language, setLanguage, isKhmer, t } = useTranslation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const [unreadCount, setUnreadCount] = useState(0);
  const [recentInquiries, setRecentInquiries] = useState([]);

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const themeRef = useRef(null);
  const langRef = useRef(null);

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
    const interval = setInterval(fetchNotifications, 30000);
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
      if (themeRef.current && !themeRef.current.contains(event.target)) {
        setThemeDropdownOpen(false);
      }
      if (langRef.current && !langRef.current.contains(event.target)) {
        setLangDropdownOpen(false);
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
      title: isKhmer ? "ចាកចេញពីប្រព័ន្ធ?" : "Logout?",
      text: isKhmer ? "តើអ្នកពិតជាចង់ចាកចេញពីផ្ទាំងគ្រប់គ្រង Admin មែនទេ?" : "Are you sure you want to logout from Admin Panel?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#1c7e48",
      cancelButtonColor: "#d33",
      confirmButtonText: isKhmer ? "បាទ/ចាស ចាកចេញ" : "Yes, Logout",
      cancelButtonText: isKhmer ? "បោះបង់" : "Cancel",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
      }
    });
  };

  const handleLockTerminal = () => {
    setDropdownOpen(false);
    dispatch(lockPin());
    Swal.fire({
      icon: "info",
      title: isKhmer ? "បានចាក់សោ Terminal" : "Terminal Locked",
      text: isKhmer ? "សូមបញ្ចូលកូដ PIN ដើម្បីដោះសោផ្ទាំងគ្រប់គ្រង" : "Please enter your Security PIN to unlock",
      timer: 1200,
      showConfirmButton: false,
    });
    navigate("/auth/pin");
  };

  const handleOpenMessages = () => {
    setNotifOpen(false);
    navigate("/admin/messages");
  };

  // Quick toggle theme between Light & Dark
  const handleQuickThemeToggle = (e) => {
    e.stopPropagation();
    if (theme === "dark") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme(resolvedTheme === "dark" ? "light" : "dark");
    }
  };

  // Quick toggle language
  const handleQuickLangToggle = (e) => {
    e.stopPropagation();
    setLanguage(language === "km" ? "en" : "km");
  };

  return (
    <header className="navbar container px-4">
      <button className="menu-button" onClick={() => setOpen(true)} aria-label="Open Sidebar">
        <FaBars />
      </button>

      <div className="search-box">
        <FaSearch />
        <input
          type="text"
          placeholder={isKhmer ? "ស្វែងរកផលិតផល ការបញ្ជាទិញ អតិថិជន..." : "Search products, orders, customers..."}
        />
      </div>

      <div className="navbar-right">
        {/* Language Switcher Dropdown / Quick Toggle */}
        <div className="nav-control-wrapper" ref={langRef}>
          <button
            type="button"
            className="navbar-lang-pill-btn"
            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
            title={isKhmer ? "ប្តូរភាសា / Change Language" : "Change Language"}
          >
            <span className="lang-flag">{language === "km" ? "🇰🇭" : "🇺🇸"}</span>
            <span className="lang-code">{language === "km" ? "ខ្មែរ" : "EN"}</span>
            <FaChevronDown size={10} className={`control-chevron ${langDropdownOpen ? "open" : ""}`} />
          </button>

          {langDropdownOpen && (
            <div className="nav-dropdown-menu lang-dropdown-card">
              <div className="dropdown-menu-header">
                <Globe size={14} />
                <span>{isKhmer ? "ជ្រើសរើសភាសា" : "Select Language"}</span>
              </div>
              <button
                type="button"
                className={`dropdown-menu-item ${language === "km" ? "active" : ""}`}
                onClick={() => {
                  setLanguage("km");
                  setLangDropdownOpen(false);
                }}
              >
                <div className="menu-item-left">
                  <span className="item-flag">🇰🇭</span>
                  <div className="item-labels">
                    <strong>ភាសាខ្មែរ (Khmer)</strong>
                    <small>Native Khmer display</small>
                  </div>
                </div>
                {language === "km" && <Check size={14} className="item-check" />}
              </button>

              <button
                type="button"
                className={`dropdown-menu-item ${language === "en" ? "active" : ""}`}
                onClick={() => {
                  setLanguage("en");
                  setLangDropdownOpen(false);
                }}
              >
                <div className="menu-item-left">
                  <span className="item-flag">🇺🇸</span>
                  <div className="item-labels">
                    <strong>English (US)</strong>
                    <small>International English</small>
                  </div>
                </div>
                {language === "en" && <Check size={14} className="item-check" />}
              </button>
            </div>
          )}
        </div>

        {/* Theme Switcher Dropdown */}
        <div className="nav-control-wrapper" ref={themeRef}>
          <button
            type="button"
            className={`navbar-theme-btn ${isDark ? "is-dark" : "is-light"}`}
            onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
            title={isKhmer ? `ស្បែកពណ៌ (${theme}) - ចុចដើម្បីប្តូរ` : `Theme: ${theme} - Click to switch`}
            aria-label="Theme mode"
          >
            {theme === "dark" ? (
              <Moon size={17} className="theme-nav-icon dark" />
            ) : theme === "light" ? (
              <Sun size={17} className="theme-nav-icon light" />
            ) : (
              <Laptop size={17} className="theme-nav-icon system" />
            )}
          </button>

          {themeDropdownOpen && (
            <div className="nav-dropdown-menu theme-dropdown-card">
              <div className="dropdown-menu-header">
                <Palette size={14} />
                <span>{isKhmer ? "ស្បែកពណ៌ (Theme Mode)" : "Theme Mode"}</span>
              </div>

              <button
                type="button"
                className={`dropdown-menu-item ${theme === "light" ? "active" : ""}`}
                onClick={() => {
                  setTheme("light");
                  setThemeDropdownOpen(false);
                }}
              >
                <div className="menu-item-left">
                  <span className="item-theme-icon light"><Sun size={15} /></span>
                  <div className="item-labels">
                    <strong>{isKhmer ? "ពន្លឺ (Light)" : "Light Mode"}</strong>
                    <small>{isKhmer ? "ផ្ទៃសភ្លឺច្បាស់" : "Bright clean UI"}</small>
                  </div>
                </div>
                {theme === "light" && <Check size={14} className="item-check" />}
              </button>

              <button
                type="button"
                className={`dropdown-menu-item ${theme === "dark" ? "active" : ""}`}
                onClick={() => {
                  setTheme("dark");
                  setThemeDropdownOpen(false);
                }}
              >
                <div className="menu-item-left">
                  <span className="item-theme-icon dark"><Moon size={15} /></span>
                  <div className="item-labels">
                    <strong>{isKhmer ? "ងងឹត (Dark)" : "Dark Mode"}</strong>
                    <small>{isKhmer ? "ផ្ទៃខ្មៅប្រណិត" : "Luxury dark UI"}</small>
                  </div>
                </div>
                {theme === "dark" && <Check size={14} className="item-check" />}
              </button>

              <button
                type="button"
                className={`dropdown-menu-item ${theme === "system" ? "active" : ""}`}
                onClick={() => {
                  setTheme("system");
                  setThemeDropdownOpen(false);
                }}
              >
                <div className="menu-item-left">
                  <span className="item-theme-icon system"><Laptop size={15} /></span>
                  <div className="item-labels">
                    <strong>{isKhmer ? "តាមឧបករណ៍ (System)" : "System Default"}</strong>
                    <small>{isKhmer ? "ស្វ័យប្រវត្តិ" : "Auto match OS"}</small>
                  </div>
                </div>
                {theme === "system" && <Check size={14} className="item-check" />}
              </button>
            </div>
          )}
        </div>

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
                  <span>{isKhmer ? "សារពីអតិថិជន" : "Customer Inquiries"}</span>
                </div>
                {unreadCount > 0 && <span className="notif-unread-pill">{unreadCount} {isKhmer ? "ថ្មី" : "New"}</span>}
              </div>

              <div className="notif-dropdown-list">
                {recentInquiries.length === 0 ? (
                  <div className="notif-empty-state">
                    <FaCheckDouble size={22} className="text-muted" />
                    <span>{isKhmer ? "គ្មានសារថ្មីដែលមិនទាន់អាននោះទេ!" : "All caught up! No recent messages."}</span>
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
                  <span>{isKhmer ? "មើលសារទាំងអស់ក្នុងប្រអប់ទទួល" : "View All Inquiries in Inbox"}</span>
                  <ExternalLink size={13} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        {(() => {
          const currentRoleName =
            user?.role_name ||
            (Array.isArray(user?.roles) ? user.roles.map((r) => r.name || r).join(", ") : null) ||
            (typeof user?.role === "string" ? user.role : null) ||
            (user?.role_id === "1" || user?.role_id === 1 ? "Super Administrator" : null) ||
            "Administrator";

          return (
            <div className="profile-wrapper" ref={dropdownRef}>
              <div
                className="profile"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                title="Profile options"
              >
                <FaUserCircle className="profile-icon" />

                <div>
                  <strong>{user?.name || "Administrator"}</strong>
                  <small>{currentRoleName}</small>
                </div>

                <FaChevronDown className={`profile-arrow ${dropdownOpen ? "open" : ""}`} />
              </div>

              {dropdownOpen && (
                <div className="profile-dropdown-card">
                  <div className="dropdown-user-info">
                    <span className="info-name">{user?.name || "Administrator"}</span>
                    <span className="info-email">{user?.email || "admin@angkor.com"}</span>
                    <span className="info-role">{currentRoleName.toUpperCase()}</span>
                  </div>

                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate("/admin/dashboard");
                    }}
                  >
                    <FaTachometerAlt className="dropdown-icon" />
                    <span>{isKhmer ? "ផ្ទាំងគ្រប់គ្រង Admin" : "Admin Dashboard"}</span>
                  </button>

                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate("/");
                    }}
                  >
                    <FaStore className="dropdown-icon" />
                    <span>{isKhmer ? "ទៅកាន់គេហទំព័រទិញទំនិញ" : "Go to E-commerce"}</span>
                  </button>

                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate("/admin/settings");
                    }}
                  >
                    <FaCog className="dropdown-icon" />
                    <span>{isKhmer ? "ការកំណត់ Admin Settings" : "Admin Settings"}</span>
                  </button>

                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate("/admin/messages");
                    }}
                  >
                    <FaEnvelope className="dropdown-icon" />
                    <span>{isKhmer ? "សារពីអតិថិជន" : "Customer Messages"}</span>
                  </button>

                  <button
                    className="dropdown-item"
                    onClick={handleLockTerminal}
                    style={{ color: "#f59e0b" }}
                  >
                    <FaLock className="dropdown-icon" style={{ color: "#f59e0b" }} />
                    <span>{isKhmer ? "ចាក់សោអេក្រង់ (PIN)" : "Lock Screen (PIN)"}</span>
                  </button>

                  <button className="dropdown-item logout-item" onClick={handleLogout}>
                    <FaSignOutAlt className="dropdown-icon" />
                    <span>{isKhmer ? "ចាកចេញពីប្រព័ន្ធ" : "Logout"}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        <button className="logout" onClick={handleLogout} title={isKhmer ? "ចាកចេញ" : "Logout"}>
          <FaSignOutAlt className="logout-icon" />
          <span className="logout-text">{isKhmer ? "ចាកចេញ" : "Logout"}</span>
        </button>
      </div>
    </header>
  );
}

export default Navbar;