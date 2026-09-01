import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Home,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Clock
} from "lucide-react";
import { useTranslation } from "../context/LanguageContext";
import "./MobileBottomNav.css";

function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useSelector((state) => state.auth);
  const { t } = useTranslation();
  const isLoggedIn = !!auth.token;

  const [cartCount, setCartCount] = useState(() => {
    return parseInt(localStorage.getItem("cartCount") || "0", 10);
  });

  useEffect(() => {
    const handleCartUpdate = () => {
      setCartCount(parseInt(localStorage.getItem("cartCount") || "0", 10));
    };

    window.addEventListener("cart-updated", handleCartUpdate);
    window.addEventListener("storage", handleCartUpdate);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdate);
      window.removeEventListener("storage", handleCartUpdate);
    };
  }, []);

  const currentPath = location.pathname;

  const handleOpenCart = () => {
    window.dispatchEvent(new Event("open-cart"));
  };

  return (
    <div className="mobile-bottom-nav-wrapper">
      <div className="mobile-bottom-nav-container">
        {/* Soft top accent strip */}
        <div className="nav-top-accent-strip" />

        <nav className="mobile-bottom-nav-bar" aria-label="Mobile Bottom Navigation">
          {/* 1. Home */}
          <button
            type="button"
            className={`bottom-nav-item ${currentPath === "/" ? "active" : ""}`}
            onClick={() => navigate("/")}
            aria-label="Home"
          >
            <div className="nav-icon-bubble">
              <Home size={20} className="nav-icon" />
            </div>
            <span className="nav-item-label">{t("nav.home", "Home")}</span>
            {currentPath === "/" && <span className="nav-active-pill" />}
          </button>

          {/* 2. Shop */}
          <button
            type="button"
            className={`bottom-nav-item ${currentPath === "/shop" || currentPath.startsWith("/product") ? "active" : ""}`}
            onClick={() => navigate("/shop")}
            aria-label="Shop"
          >
            <div className="nav-icon-bubble">
              <ShoppingBag size={20} className="nav-icon" />
            </div>
            <span className="nav-item-label">{t("nav.shop", "Shop")}</span>
            {(currentPath === "/shop" || currentPath.startsWith("/product")) && <span className="nav-active-pill" />}
          </button>

          {/* 3. Center Floating Cart Button */}
          <button
            type="button"
            className="bottom-nav-item bottom-nav-cart-btn"
            onClick={handleOpenCart}
            aria-label="Open Cart"
          >
            <div className="nav-icon-bubble cart-bubble">
              <ShoppingCart size={22} className="nav-icon cart-icon" />
              {cartCount > 0 && (
                <span className="mobile-nav-cart-badge">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </div>
            <span className="nav-item-label cart-label">{t("nav.cart", "Cart")}</span>
          </button>

          {/* 4. AI Picks */}
          <button
            type="button"
            className={`bottom-nav-item ${currentPath === "/recommendations" ? "active" : ""}`}
            onClick={() => navigate("/recommendations")}
            aria-label="AI Picks"
          >
            <div className="nav-icon-bubble">
              <Sparkles size={20} className="nav-icon" />
            </div>
            <span className="nav-item-label">{t("nav.aiRecommendations", "AI Picks")}</span>
            {currentPath === "/recommendations" && <span className="nav-active-pill" />}
          </button>

          {/* 5. Orders */}
          <button
            type="button"
            className={`bottom-nav-item ${currentPath === "/orders" ? "active" : ""}`}
            onClick={() => navigate(isLoggedIn ? "/orders" : "/auth/login")}
            aria-label="Orders"
          >
            <div className="nav-icon-bubble">
              <Clock size={20} className="nav-icon" />
            </div>
            <span className="nav-item-label">{t("nav.orders", "Orders")}</span>
            {currentPath === "/orders" && <span className="nav-active-pill" />}
          </button>
        </nav>
      </div>
    </div>
  );
}

export default MobileBottomNav;
