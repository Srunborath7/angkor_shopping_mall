import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Heart,
  ShoppingBag,
  User,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  Sparkles
} from "lucide-react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { clearAuth } from "../store/authSlice";
import CartDrawer from "./CartDrawer";
import "./Header.css";

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);

  const isLoggedIn = !!auth.token;
  const user = auth.user;
  const role = auth.role;

  // Header Interactive UI States
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Read Cart & Wishlist counters from localStorage (reactive to event updates)
  const [cartCount, setCartCount] = useState(() => {
    return parseInt(localStorage.getItem("cartCount") || "0", 10);
  });

  const [wishlistCount, setWishlistCount] = useState(() => {
    try {
      const items = JSON.parse(localStorage.getItem("wishlist") || "[]");
      return items.length;
    } catch {
      return 0;
    }
  });

  // Listen to custom window events for synchronized count updates
  useEffect(() => {
    const handleCartUpdate = () => {
      setCartCount(parseInt(localStorage.getItem("cartCount") || "0", 10));
      try {
        const items = JSON.parse(localStorage.getItem("wishlist") || "[]");
        setWishlistCount(items.length);
      } catch {
        setWishlistCount(0);
      }
    };

    const handleOpenCart = () => {
      setProfileDropdownOpen(false);
      setIsCartOpen(true);
    };

    window.addEventListener("cart-updated", handleCartUpdate);
    window.addEventListener("open-cart", handleOpenCart);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdate);
      window.removeEventListener("open-cart", handleOpenCart);
    };
  }, []);

  const handleLogout = () => {
    dispatch(clearAuth());
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setProfileDropdownOpen(false);
    Swal.fire({
      icon: "success",
      title: "Logged Out",
      text: "You have been logged out successfully.",
      timer: 1500,
      showConfirmButton: false
    });
    navigate("/auth/login");
  };

  const currentPath = location.pathname;

  return (
    <header className="home-header">
      <div className="header-container">
        {/* Logo Section */}
        <div className="logo-section" onClick={() => navigate("/")}>
          <span className="logo-icon">🌿</span>
          <span className="logo-text">Angkor Mall</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          <span
            className={`nav-item ${currentPath === "/" ? "active" : ""}`}
            onClick={() => navigate("/")}
          >
            Home
          </span>
          <span
            className={`nav-item ${currentPath === "/shop" ? "active" : ""}`}
            onClick={() => navigate("/shop")}
          >
            Shop
          </span>
          <span
            className="nav-item"
            onClick={() => {
              if (currentPath !== "/shop") {
                navigate("/shop");
              } else {
                toast("Scroll down or use categories filter in sidebar!");
              }
            }}
          >
            Categories
          </span>
          <span
            className="nav-item ai-badge-nav"
            onClick={() => toast("AI recommendations are active in our Shop!")}
          >
            AI Recommendations <Sparkles size={12} className="sparkle-icon" />
          </span>
          <span
            className={`nav-item ${currentPath === "/orders" ? "active" : ""}`}
            onClick={() => navigate("/orders")}
          >
            Orders
          </span>
        </nav>

        {/* Nav Actions (Wishlist, Cart, Profile) */}
        <div className="header-actions">
          <div
            className="icon-wrapper"
            onClick={() => {
              if (currentPath !== "/shop") {
                navigate("/shop");
                toast("Showing all wishlist items in your catalog!");
              } else {
                toast("Use filters or click heart buttons to manage wishlist!");
              }
            }}
          >
            <Heart size={20} className={wishlistCount > 0 ? "heart-active" : ""} />
            {wishlistCount > 0 && <span className="action-badge bg-red">{wishlistCount}</span>}
          </div>

          <div
            className="icon-wrapper"
            onClick={() => setIsCartOpen(true)}
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && <span className="action-badge bg-green">{cartCount}</span>}
          </div>

          {/* Profile Dropdown */}
          <div className="profile-menu-container">
            {isLoggedIn ? (
              <div
                className="profile-logged-trigger"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              >
                <div className="avatar-circle">
                  {user?.name ? user.name[0].toUpperCase() : <User size={16} />}
                </div>
                <span className="profile-username">{user?.name?.split(" ")[0]}</span>
                <ChevronDown size={14} className={`arrow-icon ${profileDropdownOpen ? "open" : ""}`} />
              </div>
            ) : (
              <button className="login-trigger-btn" onClick={() => navigate("/auth/login")}>
                <User size={16} />
                <span>Sign In</span>
              </button>
            )}

            {profileDropdownOpen && isLoggedIn && (
              <div className="profile-dropdown-card">
                <div className="dropdown-user-info">
                  <span className="info-name">{user?.name || "Member User"}</span>
                  <span className="info-email">{user?.email || ""}</span>
                  <span className="info-role">{role ? role.toUpperCase() : "CUSTOMER"}</span>
                </div>

                {(role === "admin" || role === "sale") && (
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate("/admin/dashboard");
                    }}
                  >
                    <LayoutDashboard size={16} />
                    <span>Admin Dashboard</span>
                  </button>
                )}

                <button className="dropdown-item logout-item" onClick={handleLogout}>
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-panel">
          <span
            className={`mobile-nav-item ${currentPath === "/" ? "active" : ""}`}
            onClick={() => {
              setMobileMenuOpen(false);
              navigate("/");
            }}
          >
            Home
          </span>
          <span
            className={`mobile-nav-item ${currentPath === "/shop" ? "active" : ""}`}
            onClick={() => {
              setMobileMenuOpen(false);
              navigate("/shop");
            }}
          >
            Shop
          </span>
          <span
            className="mobile-nav-item"
            onClick={() => {
              setMobileMenuOpen(false);
              navigate("/shop");
            }}
          >
            Categories
          </span>
          <span
            className="mobile-nav-item"
            onClick={() => {
              setMobileMenuOpen(false);
              toast("AI Recommendations are active!");
            }}
          >
            AI Recommendations
          </span>
          <span
            className={`mobile-nav-item ${currentPath === "/orders" ? "active" : ""}`}
            onClick={() => {
              setMobileMenuOpen(false);
              navigate("/orders");
            }}
          >
            Orders
          </span>
        </div>
      )}

      {/* Render shared Cart slide-out Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  );
}

export default Header;
