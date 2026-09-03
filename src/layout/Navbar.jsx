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

  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);

  // Global searchable admin pages
  const searchablePages = [
    { nameEn: "Dashboard", nameKm: "ផ្ទាំងគ្រប់គ្រងទូទៅ", path: "/admin/dashboard", icon: "📊", category: "Overview" },
    { nameEn: "Live Order Prep Monitor", nameKm: "ផ្ទាំងតាមដានការរៀបចំបញ្ជាទិញ Live", path: "/admin/order-monitor", icon: "📺", category: "Sales" },
    { nameEn: "Orders Management", nameKm: "ការគ្រប់គ្រងការបញ្ជាទិញ", path: "/admin/orders", icon: "🛒", category: "Sales" },
    { nameEn: "Flash Sales & Promotions", nameKm: "ប្រូម៉ូសិនពិសេស Flash Sale", path: "/admin/flash-sale", icon: "⚡", category: "Sales" },
    { nameEn: "Products Catalog", nameKm: "បញ្ជីផលិតផលទំនិញទាំងអស់", path: "/admin/products", icon: "📦", category: "Inventory" },
    { nameEn: "Inventory Stock Tracking", nameKm: "ការគ្រប់គ្រងស្តុកទំនិញ", path: "/admin/inventory", icon: "🏢", category: "Inventory" },
    { nameEn: "Purchase Orders", nameKm: "ការទិញទំនិញចូល (PO)", path: "/admin/purchases", icon: "📑", category: "Inventory" },
    { nameEn: "Suppliers Directory", nameKm: "បញ្ជីអ្នកផ្គត់ផ្គង់ទំនិញ", path: "/admin/suppliers", icon: "🚚", category: "Inventory" },
    { nameEn: "Product Categories", nameKm: "ប្រភេទផលិតផលទំនិញ", path: "/admin/categories", icon: "🗂️", category: "Organization" },
    { nameEn: "Brands Management", nameKm: "ម៉ាកយីហោទំនិញ", path: "/admin/brands", icon: "🏷️", category: "Organization" },
    { nameEn: "Staff Directory & Roles", nameKm: "ព័ត៌មានបុគ្គលិក & តួនាទី", path: "/admin/staff", icon: "👔", category: "Organization" },
    { nameEn: "Staff Attendance & Time Clock", nameKm: "វត្តមានបុគ្គលិក & ម៉ោងធ្វើការ", path: "/admin/attendance", icon: "⏰", category: "Organization" },
    { nameEn: "Customer Messages & AI Inquiries", nameKm: "សារពីអតិថិជន & ប្រអប់សំបុត្រ", path: "/admin/messages", icon: "💬", category: "Support" },
    { nameEn: "Customers List", nameKm: "បញ្ជីអតិថិជនទាំងអស់", path: "/admin/customers", icon: "👥", category: "Organization" },
    { nameEn: "Sales & Finance Reports", nameKm: "របាយការណ៍លក់ & ចំណូល", path: "/admin/reports", icon: "📈", category: "Reports" },
    { nameEn: "System Settings & Permissions", nameKm: "ការកំណត់ប្រព័ន្ធ & សុវត្ថិភាព", path: "/admin/settings", icon: "⚙️", category: "System" }
  ];

  const filteredSearchResults = searchQuery.trim()
    ? searchablePages.filter((item) => {
        const q = searchQuery.toLowerCase();
        return (
          item.nameEn.toLowerCase().includes(q) ||
          item.nameKm.includes(q) ||
          item.category.toLowerCase().includes(q)
        );
      })
    : [];

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const input = searchRef.current?.querySelector("input");
        if (input) {
          input.focus();
          setSearchOpen(true);
        }
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchResultClick = (path) => {
    setSearchOpen(false);
    setSearchQuery("");
    navigate(path);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (filteredSearchResults.length > 0) {
      handleSearchResultClick(filteredSearchResults[0].path);
    } else if (searchQuery.trim()) {
      // Default to searching in products
      navigate(`/admin/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

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
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchNotifications();
      }
    }, 60000);
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

      {/* Global Quick Search Component */}
      <div className="search-box-container" ref={searchRef}>
        <form className="search-box" onSubmit={handleSearchSubmit}>
          <FaSearch className="search-icon-left" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder={isKhmer ? "ស្វែងរកទំព័រ, បញ្ជាទិញ, ផលិតផល..." : "Search pages, orders, products..."}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => {
                setSearchQuery("");
                setSearchOpen(false);
              }}
              title="Clear"
            >
              ×
            </button>
          )}
          <kbd className="search-kbd-hint" title="Press Ctrl+K to search">⌘K</kbd>
        </form>

        {/* Live Search Quick Results Dropdown */}
        {searchOpen && searchQuery.trim().length > 0 && (
          <div className="search-results-dropdown">
            <div className="search-results-header">
              <span>{isKhmer ? "លទ្ធផលស្វែងរករហ័ស" : "Quick Navigation Results"}</span>
              <small>{filteredSearchResults.length} {isKhmer ? "ទំព័ររកឃើញ" : "pages found"}</small>
            </div>

            <div className="search-results-list">
              {filteredSearchResults.length === 0 ? (
                <div className="search-no-results">
                  <span>{isKhmer ? `គ្មានទំព័រឈ្មោះ "${searchQuery}" ទេ` : `No admin pages matching "${searchQuery}"`}</span>
                  <button
                    type="button"
                    className="search-fallback-btn"
                    onClick={() => {
                      navigate(`/admin/products?search=${encodeURIComponent(searchQuery.trim())}`);
                      setSearchOpen(false);
                    }}
                  >
                    📦 {isKhmer ? "ស្វែងរកក្នុងផលិតផល" : "Search in Products Catalog"}
                  </button>
                </div>
              ) : (
                filteredSearchResults.map((page, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="search-result-item"
                    onClick={() => handleSearchResultClick(page.path)}
                  >
                    <span className="search-item-icon">{page.icon}</span>
                    <div className="search-item-info">
                      <strong>{isKhmer ? page.nameKm : page.nameEn}</strong>
                      <small>{page.category} • {page.path}</small>
                    </div>
                    <span className="search-item-arrow">↵</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
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
                <div className="profile-avatar-wrap" style={{ position: "relative", display: "inline-flex" }}>
                  <FaUserCircle className="profile-icon" />
                  <span className="presence-dot-bubble online" title="Online Active" />
                </div>

                <div className="profile-text-info">
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <strong>{user?.name || "Administrator"}</strong>
                    <span className="online-mini-chip">🟢 Live</span>
                  </div>
                  <small>{currentRoleName}</small>
                </div>

                <FaChevronDown className={`profile-arrow ${dropdownOpen ? "open" : ""}`} />
              </div>

              {dropdownOpen && (
                <div className="profile-dropdown-card">
                  <div className="dropdown-user-info">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="info-name">{user?.name || "Administrator"}</span>
                      <span className="online-mini-chip">🟢 Online</span>
                    </div>
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