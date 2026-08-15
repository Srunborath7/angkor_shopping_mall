import React, { useEffect, useRef } from "react";
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
  FaExchangeAlt
} from "react-icons/fa";
import logo from "../assets/logo.jpg";
import { NavLink } from "react-router-dom";
import { X } from "lucide-react";
import "./style/Sidebar.css";

function Sidebar({ open, setOpen }) {
  const sidebarRef = useRef(null);
  const menuRef = useRef(null);

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

  // Isolate mouse wheel scroll so scrolling in sidebar NEVER scrolls the admin page behind it
  useEffect(() => {
    const sidebarEl = sidebarRef.current;
    const menuEl = menuRef.current;
    if (!sidebarEl || !menuEl) return;

    const handleWheel = (e) => {
      // Check if menu can be scrolled
      const { scrollTop, scrollHeight, clientHeight } = menuEl;
      const isScrollable = scrollHeight > clientHeight;

      if (isScrollable) {
        // Manually apply scroll delta to menu
        menuEl.scrollTop += e.deltaY;
      }
      // Stop the scroll from propagating to window/admin page
      e.preventDefault();
      e.stopPropagation();
    };

    sidebarEl.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      sidebarEl.removeEventListener("wheel", handleWheel);
    };
  }, []);

  const menus = [
    {
      name: "Dashboard",
      icon: <FaTachometerAlt />,
      path: "/admin/dashboard"
    },
    {
      name: "Flash Sale",
      icon: <FaBolt />,
      path: "/admin/flash-sale"
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
    },
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
    },
    {
      name: "Orders",
      icon: <FaShoppingCart />,
      path: "/admin/orders"
    },
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
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-icon">
              <img src={logo} alt="AngkorMall Logo" />
            </div>
            <div>
              <h2>Angkor Shopping Mall</h2>
              <span>Admin Panel</span>
            </div>
          </div>
          <button
            className="close-sidebar"
            onClick={() => setOpen(false)}
            aria-label="Close Sidebar"
          >
            <X size={22} strokeWidth={3} />
          </button>
        </div>
        <ul ref={menuRef} className="sidebar-menu">
          {menus.map((item, index) => (
            <li key={index}>
              <NavLink
                to={item.path}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  isActive ? "menu-link active" : "menu-link"
                }
              >
                <span className="menu-icon">{item.icon}</span>
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="sidebar-footer">
          <p>© 2026 Angkor Shopping Mall</p>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
