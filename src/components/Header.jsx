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
  Sparkles,
  Home,
  Grid,
  ChevronRight,
  Repeat
} from "lucide-react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { clearAuth } from "../store/authSlice";
import CartDrawer from "./CartDrawer";
import "./Header.css";
import logo from "../assets/logo.jpg";

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
        <div className="home-logo-brand" onClick={() => navigate("/")}>
          <span className="home-logo-icon">
            <img src={logo} alt="AngkorMall Logo" />
          </span>
          <span className="auth-logo-text">AngkorMall</span>
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
            className={`nav-item ai-badge-nav ${currentPath === "/recommendations" ? "active" : ""}`}
            onClick={() => navigate("/recommendations")}
          >
            AI Recommendations <Sparkles size={12} className="sparkle-icon" />
          </span>
          <span
            className={`nav-item ${currentPath === "/trading" ? "active" : ""}`}
            onClick={() => navigate("/trading")}
          >
            Trade & Exchange
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
            onClick={() => navigate("/wishlist")}
            title="View My Wishlist"
            style={{ cursor: "pointer" }}
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
                <span className="profile-username mobile-hide-username">{user?.name?.split(" ")[0]}</span>
                <ChevronDown size={14} className={`arrow-icon mobile-hide-arrow ${profileDropdownOpen ? "open" : ""}`} />
              </div>
            ) : (
              <button className="login-trigger-btn" onClick={() => navigate("/auth/login")}>
                <User size={16} />
                <span className="mobile-hide-username">Sign In</span>
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
            aria-label="Toggle Mobile Navigation Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Backdrop & Professional Animated Drawer */}
      {mobileMenuOpen && (
        <>
          <div
            className="mobile-nav-backdrop"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="mobile-nav-panel">
            {/* User Account Brief Card inside Mobile Drawer */}
            {isLoggedIn && (
              <div className="mobile-user-card">
                <div className="avatar-circle">
                  {user?.name ? user.name[0].toUpperCase() : <User size={16} />}
                </div>
                <div className="mobile-user-info">
                  <span className="info-name">{user?.name || "Member User"}</span>
                  <span className="info-email">{user?.email || ""}</span>
                  <span className="info-role-badge">{role ? role.toUpperCase() : "CUSTOMER"}</span>
                </div>
              </div>
            )}

            <div className="mobile-nav-links-list">
              <div
                className={`mobile-nav-item ${currentPath === "/" ? "active" : ""}`}
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/");
                }}
              >
                <div className="nav-item-left">
                  <Home size={18} />
                  <span>Home</span>
                </div>
                <ChevronRight size={16} className="arrow-dim" />
              </div>

              <div
                className={`mobile-nav-item ${currentPath === "/shop" ? "active" : ""}`}
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/shop");
                }}
              >
                <div className="nav-item-left">
                  <ShoppingBag size={18} />
                  <span>Shop Catalog</span>
                </div>
                <ChevronRight size={16} className="arrow-dim" />
              </div>

              <div
                className="mobile-nav-item"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/shop");
                }}
              >
                <div className="nav-item-left">
                  <Grid size={18} />
                  <span>Categories</span>
                </div>
                <ChevronRight size={16} className="arrow-dim" />
              </div>

              <div
                className={`mobile-nav-item ai-badge-mobile ${currentPath === "/recommendations" ? "active" : ""}`}
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/recommendations");
                }}
              >
                <div className="nav-item-left">
                  <Sparkles size={18} className="text-green-icon" />
                  <span>AI Recommendations</span>
                </div>
                <ChevronRight size={16} className="arrow-dim" />
              </div>

              <div
                className={`mobile-nav-item ${currentPath === "/trading" ? "active" : ""}`}
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/trading");
                }}
              >
                <div className="nav-item-left">
                  <Repeat size={18} />
                  <span>Trade & Exchange</span>
                </div>
                <ChevronRight size={16} className="arrow-dim" />
              </div>

              <div
                className={`mobile-nav-item ${currentPath === "/orders" ? "active" : ""}`}
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/orders");
                }}
              >
                <div className="nav-item-left">
                  <ShoppingBag size={18} />
                  <span>My Orders</span>
                </div>
                <ChevronRight size={16} className="arrow-dim" />
              </div>

              {(role === "admin" || role === "sale") && (
                <div
                  className="mobile-nav-item admin-link"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/admin/dashboard");
                  }}
                >
                  <div className="nav-item-left">
                    <LayoutDashboard size={18} />
                    <span>Admin Dashboard</span>
                  </div>
                  <ChevronRight size={16} />
                </div>
              )}
            </div>

            {/* Bottom Actions inside Mobile Drawer */}
            <div className="mobile-drawer-footer">
              {isLoggedIn ? (
                <button
                  className="mobile-logout-btn"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                >
                  <LogOut size={16} /> Logout Account
                </button>
              ) : (
                <button
                  className="mobile-login-btn"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/auth/login");
                  }}
                >
                  <User size={16} /> Sign In / Register
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Render shared Cart slide-out Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  );
}

export default Header;
