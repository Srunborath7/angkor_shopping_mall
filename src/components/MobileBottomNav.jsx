import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Home,
  ShoppingBag,
  Sparkles,
  Repeat,
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

  const currentPath = location.pathname;

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
              <Home size={22} className="nav-icon" />
            </div>
            <span className="nav-item-label">{t("nav.home", "Home")}</span>
          </button>

          {/* 2. Shopping */}
          <button
            type="button"
            className={`bottom-nav-item ${currentPath === "/shop" ? "active" : ""}`}
            onClick={() => navigate("/shop")}
            aria-label="Shopping"
          >
            <div className="nav-icon-bubble">
              <ShoppingBag size={22} className="nav-icon" />
            </div>
            <span className="nav-item-label">{t("nav.shop", "Shop")}</span>
          </button>

          {/* 3. AI */}
          <button
            type="button"
            className={`bottom-nav-item ${currentPath === "/recommendations" ? "active" : ""}`}
            onClick={() => navigate("/recommendations")}
            aria-label="AI Picks"
          >
            <div className="nav-icon-bubble">
              <Sparkles size={22} className="nav-icon" />
            </div>
            <span className="nav-item-label">{t("nav.aiRecommendations", "AI")}</span>
          </button>

          {/* 4. Trade */}
          <button
            type="button"
            className={`bottom-nav-item ${currentPath === "/trading" ? "active" : ""}`}
            onClick={() => navigate("/trading")}
            aria-label="Trade"
          >
            <div className="nav-icon-bubble">
              <Repeat size={22} className="nav-icon" />
            </div>
            <span className="nav-item-label">{t("nav.tradeIn", "Trade")}</span>
          </button>

          {/* 5. Order */}
          <button
            type="button"
            className={`bottom-nav-item ${currentPath === "/orders" ? "active" : ""}`}
            onClick={() => navigate(isLoggedIn ? "/orders" : "/auth/login")}
            aria-label="Orders"
          >
            <div className="nav-icon-bubble">
              <Clock size={22} className="nav-icon" />
            </div>
            <span className="nav-item-label">{t("nav.orders", "Orders")}</span>
          </button>
        </nav>
      </div>
    </div>
  );
}

export default MobileBottomNav;
