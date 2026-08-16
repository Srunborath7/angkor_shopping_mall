import React, { useEffect, useRef, useState } from "react";
import {
  FaTachometerAlt,
  FaBox,
  FaBoxes,
  FaTh,
  FaUsers,
  FaShoppingCart,
  FaChartBar,
  FaCog,
  FaBookmark,
  FaTruck,
  FaFileInvoiceDollar,
  FaBolt,
  FaExchangeAlt,
  FaEnvelope,
  FaHeadset
} from "react-icons/fa";
import logo from "../assets/logo.jpg";
import { NavLink, useLocation } from "react-router-dom";
import { X, Sparkles } from "lucide-react";
import { getSupportStatsApi } from "../services/supportMessageService";
import "./style/Sidebar.css";

function Sidebar({ open, setOpen }) {
  const sidebarRef = useRef(null);
  const menuRef = useRef(null);
  const location = useLocation();
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Fetch unread customer messages count
  const fetchUnreadCount = async () => {
    try {
      const res = await getSupportStatsApi();
      const unread = res?.data?.unread || res?.unread || 0;
      setUnreadMessages(unread);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    // Poll unread support count every 10 seconds
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, []);

  // Refresh count when navigating to/from messages
  useEffect(() => {
    fetchUnreadCount();
  }, [location.pathname]);

  // Lock body scroll on mobile when sidebar drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // COMPLETE SCROLL ISOLATION:
  // Ensures scrolling inside the sidebar NEVER propagates or scrolls the main admin page
  useEffect(() => {
    const sidebarEl = sidebarRef.current;
    const menuEl = menuRef.current;
    if (!sidebarEl || !menuEl) return;

    const handleWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Scroll menu smoothly with wheel delta
      menuEl.scrollTop += e.deltaY;
    };

    sidebarEl.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      sidebarEl.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // Menu structure grouped with headers for best-in-class UX
  const menuSections = [
    {
      title: "OVERVIEW",
      items: [
        {
          name: "Dashboard",
          icon: <FaTachometerAlt />,
          path: "/admin/dashboard"
        }
      ]
    },
    {
      title: "SALES & COMMERCE",
      items: [
        {
          name: "Flash Sale",
          icon: <FaBolt />,
          path: "/admin/flash-sale",
          badge: "HOT"
        },
        {
          name: "Products",
          icon: <FaBox />,
          path: "/admin/products"
        },
        {
          name: "Trading / Trade-In",
          icon: <FaExchangeAlt />,
          path: "/admin/trading"
        },
        {
          name: "Orders",
          icon: <FaShoppingCart />,
          path: "/admin/orders"
        },
        {
          name: "Customer Messages",
          icon: <FaEnvelope />,
          path: "/admin/messages",
          badgeCount: unreadMessages
        }
      ]
    },
    {
      title: "INVENTORY & SUPPLY",
      items: [
        {
          name: "Inventory",
          icon: <FaBoxes />,
          path: "/admin/inventory"
        },
        {
          name: "Purchases",
          icon: <FaFileInvoiceDollar />,
          path: "/admin/purchases"
        },
        {
          name: "Suppliers",
          icon: <FaTruck />,
          path: "/admin/suppliers"
        }
      ]
    },
    {
      title: "ORGANIZATION",
      items: [
        {
          name: "Categories",
          icon: <FaTh />,
          path: "/admin/categories"
        },
        {
          name: "Brands",
          icon: <FaBookmark />,
          path: "/admin/brands"
        },
        {
          name: "Customers",
          icon: <FaUsers />,
          path: "/admin/customers"
        }
      ]
    },
    {
      title: "SYSTEM",
      items: [
        {
          name: "Reports",
          icon: <FaChartBar />,
          path: "/admin/reports"
        },
        {
          name: "Settings",
          icon: <FaCog />,
          path: "/admin/settings"
        }
      ]
    }
  ];

  return (
    <>
      {open && (
        <div
          className="sidebar-overlay"
          onClick={() => setOpen(false)}
        />
      )}
      <aside ref={sidebarRef} className={`sidebar ${open ? "show" : ""}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-icon">
              <img src={logo} alt="AngkorMall Logo" />
            </div>
            <div className="brand-text-block">
              <h2>Angkor Mall</h2>
              <div className="brand-status-pill">
                <span className="live-status-dot" />
                <span>Admin Suite</span>
              </div>
            </div>
          </div>
          <button
            className="close-sidebar"
            onClick={() => setOpen(false)}
            aria-label="Close Sidebar"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Scrollable Navigation List */}
        <div ref={menuRef} className="sidebar-menu-wrapper">
          <ul className="sidebar-menu">
            {menuSections.map((section, sIdx) => (
              <li key={sIdx} className="sidebar-section">
                <span className="sidebar-section-title">{section.title}</span>
                <ul className="sidebar-section-items">
                  {section.items.map((item, index) => (
                    <li key={index} className="sidebar-item">
                      <NavLink
                        to={item.path}
                        onClick={() => setOpen(false)}
                        className={({ isActive }) =>
                          isActive ? "menu-link active" : "menu-link"
                        }
                      >
                        <span className="menu-icon">{item.icon}</span>
                        <span className="menu-text">{item.name}</span>

                        {/* Unread Customer Messages Badge */}
                        {item.badgeCount > 0 && (
                          <span className="menu-badge unread-badge animate-pulse">
                            {item.badgeCount > 99 ? "99+" : item.badgeCount}
                          </span>
                        )}

                        {/* Hot Promo Tag */}
                        {item.badge && !item.badgeCount && (
                          <span className="menu-badge hot-badge">
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>

        {/* Sidebar Footer Card */}
        <div className="sidebar-footer">
          <div className="footer-support-hint">
            <Sparkles size={14} className="sparkle-icon" />
            <span>AI Assistant & Store Live</span>
          </div>
          <p>© 2026 Angkor Shopping Mall</p>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
