import React from "react";
import { Sparkles, ShoppingBag, Loader2 } from "lucide-react";
import "./LoadingSkeleton.css";

/**
 * Base generic skeleton box with configurable width, height, and border radius
 */
export function SkeletonBox({ width, height, borderRadius, circle = false, pill = false, className = "", style = {} }) {
  return (
    <span
      className={`skeleton-box ${circle ? "skeleton-circle" : ""} ${pill ? "skeleton-pill" : ""} ${className}`}
      style={{
        width: width !== undefined ? width : "100%",
        height: height !== undefined ? height : "16px",
        borderRadius: borderRadius,
        ...style
      }}
    />
  );
}

/**
 * Ecommerce Product Card Skeleton
 */
export function ProductCardSkeleton({ count = 8, gridClassName = "product-skeleton-grid" }) {
  return (
    <div className={gridClassName}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="product-skeleton-card">
          <div className="product-skeleton-image-wrap">
            <SkeletonBox className="product-skeleton-image" height="100%" borderRadius="12px" />
            <SkeletonBox className="product-skeleton-badge" pill />
          </div>
          <div className="product-skeleton-body">
            <SkeletonBox className="product-skeleton-category" height="12px" pill />
            <SkeletonBox className="product-skeleton-title" height="16px" />
            <SkeletonBox className="product-skeleton-title-sub" height="14px" />
            <SkeletonBox className="product-skeleton-rating" height="12px" pill />
            <div className="product-skeleton-footer">
              <SkeletonBox className="product-skeleton-price" height="20px" />
              <SkeletonBox className="product-skeleton-btn" width="36px" height="36px" borderRadius="10px" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Single Ecommerce Product Detail View Skeleton
 */
export function ProductDetailSkeleton() {
  return (
    <div className="product-detail-skeleton-wrap">
      <div className="product-detail-skeleton-grid">
        {/* Left Gallery */}
        <div className="product-detail-skeleton-gallery">
          <SkeletonBox className="product-detail-skeleton-main-img" />
          <div className="product-detail-skeleton-thumbs">
            {Array.from({ length: 4 }).map((_, idx) => (
              <SkeletonBox key={idx} className="product-detail-skeleton-thumb" />
            ))}
          </div>
        </div>

        {/* Right Info */}
        <div className="product-detail-skeleton-info">
          <SkeletonBox className="product-detail-skeleton-tag" pill />
          <SkeletonBox className="product-detail-skeleton-h1" />
          <SkeletonBox className="product-detail-skeleton-h1-sub" />
          <SkeletonBox className="product-detail-skeleton-stars" pill />
          <SkeletonBox className="product-detail-skeleton-price-box" borderRadius="8px" />
          
          <div className="product-detail-skeleton-desc">
            <SkeletonBox height="14px" width="100%" />
            <SkeletonBox height="14px" width="95%" />
            <SkeletonBox height="14px" width="80%" />
          </div>

          <div style={{ marginTop: "1rem", display: "flex", gap: "10px" }}>
            <SkeletonBox width="80px" height="36px" pill />
            <SkeletonBox width="80px" height="36px" pill />
            <SkeletonBox width="80px" height="36px" pill />
          </div>

          <div className="product-detail-skeleton-actions">
            <SkeletonBox className="product-detail-skeleton-btn-main" />
            <SkeletonBox className="product-detail-skeleton-btn-icon" />
            <SkeletonBox className="product-detail-skeleton-btn-icon" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Admin Table Skeleton for dynamic column counts and rows
 */
export function TableSkeleton({
  rows = 5,
  cols = 6,
  hasImage = false,
  hasAvatar = false,
  hasActions = true
}) {
  return (
    <div className="table-skeleton-wrap">
      <table className="table-skeleton">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, idx) => (
              <th key={idx}>
                <SkeletonBox height="14px" width={idx === 0 ? "30px" : idx === cols - 1 ? "60px" : "80px"} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rIdx) => (
            <tr key={rIdx}>
              {Array.from({ length: cols }).map((_, cIdx) => {
                // First column: Hash or Checkbox
                if (cIdx === 0) {
                  return (
                    <td key={cIdx}>
                      <SkeletonBox width="24px" height="16px" pill />
                    </td>
                  );
                }

                // Second column with Image or Avatar
                if (cIdx === 1 && (hasImage || hasAvatar)) {
                  return (
                    <td key={cIdx}>
                      <div className="table-skeleton-row-avatar-wrap">
                        {hasAvatar ? (
                          <SkeletonBox className="table-skeleton-avatar" circle />
                        ) : (
                          <SkeletonBox className="table-skeleton-thumb" />
                        )}
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                          <SkeletonBox height="14px" width="120px" />
                          <SkeletonBox height="11px" width="80px" />
                        </div>
                      </div>
                    </td>
                  );
                }

                // Last column: Actions
                if (cIdx === cols - 1 && hasActions) {
                  return (
                    <td key={cIdx}>
                      <div className="table-skeleton-actions">
                        <SkeletonBox className="table-skeleton-action-btn" />
                        <SkeletonBox className="table-skeleton-action-btn" />
                      </div>
                    </td>
                  );
                }

                // Status or Tag column (typically 2nd to last)
                if (cIdx === cols - 2) {
                  return (
                    <td key={cIdx}>
                      <SkeletonBox className="table-skeleton-badge" pill />
                    </td>
                  );
                }

                // Normal Data Cell
                const randomWidths = ["70%", "85%", "60%", "90%", "75%"];
                const width = randomWidths[(rIdx + cIdx) % randomWidths.length];
                return (
                  <td key={cIdx}>
                    <SkeletonBox height="15px" width={width} />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * KPI Metric Cards Skeleton (Admin Dashboards)
 */
export function KpiCardSkeleton({ count = 3 }) {
  return (
    <div className="kpi-skeleton-grid">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="kpi-skeleton-card">
          <div className="kpi-skeleton-content">
            <SkeletonBox className="kpi-skeleton-title" />
            <SkeletonBox className="kpi-skeleton-val" />
            <SkeletonBox className="kpi-skeleton-trend" pill />
          </div>
          <SkeletonBox className="kpi-skeleton-icon" />
        </div>
      ))}
    </div>
  );
}

/**
 * Trade Card Skeleton
 */
export function TradeCardSkeleton({ count = 6 }) {
  return (
    <div className="trade-skeleton-grid">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="trade-skeleton-card">
          <SkeletonBox className="trade-skeleton-image" />
          <SkeletonBox height="14px" width="40%" pill />
          <SkeletonBox height="18px" width="85%" />
          <SkeletonBox height="14px" width="60%" />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <SkeletonBox height="24px" width="45%" pill />
            <SkeletonBox height="24px" width="30%" pill />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Message Inbox List Skeleton
 */
export function MessageListSkeleton({ count = 5 }) {
  return (
    <div className="message-skeleton-list">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="message-skeleton-item">
          <div className="message-skeleton-top">
            <div className="message-skeleton-user">
              <SkeletonBox width="34px" height="34px" circle />
              <SkeletonBox width="110px" height="14px" />
            </div>
            <SkeletonBox width="60px" height="12px" pill />
          </div>
          <SkeletonBox width="80%" height="15px" />
          <SkeletonBox width="95%" height="13px" />
        </div>
      ))}
    </div>
  );
}

/**
 * Professional Shopping Animation Page & Section Loader
 */
export function ShoppingAnimationLoader({
  title = "Preparing Your Shopping Experience...",
  subtitle = "Loading catalog items, promotions and store inventory",
  fullscreen = false,
  compact = false
}) {
  return (
    <div className={`shopping-loader-container ${fullscreen ? "shopping-loader-fullscreen" : ""} ${compact ? "shopping-loader-compact" : ""}`}>
      <div className="shopping-anim-backdrop" />
      
      <div className="shopping-anim-card">
        {/* Shimmering Brand Logo Tag */}
        <div className="shopping-brand-badge">
          <Sparkles size={13} className="sparkle-spin" />
          <span>ANGKOR SHOPPING MALL</span>
        </div>

        {/* Animated Shopping Cart & Flying Items Scene */}
        <div className="shopping-scene">
          {/* Glowing Aura Rings */}
          <div className="shopping-aura-ring ring-outer" />
          <div className="shopping-aura-ring ring-inner" />

          {/* Flying Product Drops into Cart */}
          <div className="flying-item item-1">
            <ShoppingBag size={15} />
          </div>
          <div className="flying-item item-2">
            <Sparkles size={14} />
          </div>
          <div className="flying-item item-3">
            <span className="mini-gift-emoji">🎁</span>
          </div>

          {/* Main Animated Shopping Cart */}
          <div className="shopping-cart-rig">
            <div className="cart-basket">
              <div className="cart-content-glow" />
              <ShoppingBag size={34} className="cart-bag-icon" />
            </div>
            <div className="cart-wheels">
              <span className="cart-wheel wheel-left" />
              <span className="cart-wheel wheel-right" />
            </div>
          </div>

          {/* Road / Track with moving speed dashes */}
          <div className="shopping-track">
            <span className="track-dash dash-1" />
            <span className="track-dash dash-2" />
            <span className="track-dash dash-3" />
          </div>
        </div>

        {/* Dynamic Text & Animated Gradient Progress */}
        <div className="shopping-loader-text">
          <h3 className="shopping-loader-title">
            {title}
            <span className="shopping-dots-pulse">
              <span>.</span><span>.</span><span>.</span>
            </span>
          </h3>
          {subtitle && <p className="shopping-loader-sub">{subtitle}</p>}
        </div>

        {/* Animated Progress Bar */}
        <div className="shopping-progress-bar">
          <div className="shopping-progress-fill" />
        </div>
      </div>
    </div>
  );
}

/**
 * High-Visibility Circular Shopping Animation Spinner
 */
export function CircularShoppingLoader({
  title = "Loading...",
  size = "default",
  className = ""
}) {
  return (
    <div className={`circular-shopping-loader size-${size} ${className}`}>
      <div className="circular-loader-rings">
        <div className="circular-orbit-outer" />
        <div className="circular-orbit-inner" />
        <div className="circular-center-bag">
          <ShoppingBag className="circular-bag-svg" />
          <span className="circular-sparkle-dot" />
        </div>
      </div>
      {title && (
        <span className="circular-loader-title">
          {title}
          <span className="shopping-dots-pulse">
            <span>.</span><span>.</span><span>.</span>
          </span>
        </span>
      )}
    </div>
  );
}

/**
 * Modern Orbital Neon Page / Section Loader (Backward compatible wrapper)
 */
export function PageLoader({
  title = "Loading data...",
  subtitle = "Please hold on while we sync with the server",
  fullscreen = false,
  icon: Icon = ShoppingBag
}) {
  return (
    <ShoppingAnimationLoader
      title={title}
      subtitle={subtitle}
      fullscreen={fullscreen}
    />
  );
}

/**
 * Section / Box Loader with Shopping Animation
 */
export function SectionLoader({
  title = "Loading shopping items...",
  height = "240px",
  icon = Sparkles
}) {
  return (
    <div style={{ height, width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <CircularShoppingLoader
        title={title}
        size="default"
      />
    </div>
  );
}

/**
 * Inline Micro Spinner for buttons & form inputs
 */
export function InlineSpinner({ text = "Loading...", size = 16, color = "currentColor" }) {
  return (
    <span className="inline-spinner">
      <Loader2 className="inline-spinner-svg" size={size} style={{ color }} />
      {text && <span>{text}</span>}
    </span>
  );
}

export default {
  SkeletonBox,
  ProductCardSkeleton,
  ProductDetailSkeleton,
  TableSkeleton,
  KpiCardSkeleton,
  TradeCardSkeleton,
  MessageListSkeleton,
  ShoppingAnimationLoader,
  CircularShoppingLoader,
  PageLoader,
  SectionLoader,
  InlineSpinner
};
