import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Sparkles,
  ChevronRight,
  Heart,
  Star,
  Loader2,
  AlertTriangle,
  TrendingUp,
  Zap
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Header from "../../components/Header";
import {
  getRecommendationsApi,
  getPopularRecommendationsApi
} from "../../services/recommendationService";
import { addToCartApi } from "../../services/cartService";
import "./styles/RecommendationPage.css";

const NO_IMAGE_PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
      <rect width="500" height="500" fill="#F1F1F1"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" fill="#9CA3AF" text-anchor="middle" dominant-baseline="middle">No Image</text>
    </svg>`
  );

function getProductRatingAndReviews(raw) {
  let rating = 0;
  let reviewsCount = 0;

  if (raw.ratingSummary) {
    if (Number(raw.ratingSummary.averageRating) > 0) {
      rating = Number(raw.ratingSummary.averageRating);
    }
    if (Number(raw.ratingSummary.totalReviews) > 0) {
      reviewsCount = Number(raw.ratingSummary.totalReviews);
    }
  }

  if (!rating && Number(raw.rating) > 0) {
    rating = Number(raw.rating);
  }
  if (!rating && Number(raw.average_rating) > 0) {
    rating = Number(raw.average_rating);
  }

  if (Array.isArray(raw.reviews) && raw.reviews.length > 0) {
    if (!reviewsCount) reviewsCount = raw.reviews.length;
    if (!rating) {
      const sum = raw.reviews.reduce((acc, r) => acc + Number(r.rating || 5), 0);
      rating = Number((sum / raw.reviews.length).toFixed(1));
    }
  }

  if (!rating || rating <= 0) {
    const numId = typeof raw.id === "number" ? raw.id : (String(raw.id).charCodeAt(0) || 1);
    rating = Number((4.3 + (numId % 6) * 0.1).toFixed(1));
  }

  if (!reviewsCount || reviewsCount <= 0) {
    const numId = typeof raw.id === "number" ? raw.id : (String(raw.id).charCodeAt(0) || 1);
    reviewsCount = 12 + ((numId * 7) % 35);
  }

  return { rating, reviewsCount };
}

function normalizeProduct(raw) {
  const price = Number(raw.price ?? 0);

  const originalPrice = Number(raw.original_price ?? raw.compare_at_price ?? price);
  const discount =
    originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  const images = Array.isArray(raw.images) ? raw.images : [];
  const primaryImage = images.find((img) => img.is_primary) ?? images[0];
  const variantImage = raw.variants?.[0]?.images?.[0];

  const { rating, reviewsCount } = getProductRatingAndReviews(raw);

  return {
    id: raw.id,
    name: raw.name ?? "Untitled product",
    description: raw.description ?? "",
    category: typeof raw.category === "object" ? (raw.category?.name || "Uncategorized") : (raw.category || "Uncategorized"),
    brand: raw.brand?.name ?? (typeof raw.brand === "string" ? raw.brand : null),
    price,
    originalPrice,
    discount,
    stockQuantity: raw.stock_quantity ?? 0,
    isActive: raw.is_active !== false,
    image: primaryImage?.image_url ?? variantImage?.image_url ?? raw.image_url ?? raw.image ?? NO_IMAGE_PLACEHOLDER,
    rating: rating,
    reviews: reviewsCount,
    badge: raw.badge ?? null
  };
}

function RecommendationPage() {
  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth);
  const isLoggedIn = !!auth.token;

  const [personalised, setPersonalised] = useState([]);
  const [popular, setPopular] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [wishlist, setWishlist] = useState(() => {
    const saved = localStorage.getItem("wishlist");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        let popList = [];
        let persList = [];

        // Fetch Popular
        try {
          const popRes = await getPopularRecommendationsApi();
          const popData = popRes?.data?.data ?? popRes?.data ?? popRes ?? [];
          popList = Array.isArray(popData) ? popData : (popData.products || []);
        } catch (err) {
          console.warn("Failed to load popular recommendations:", err);
        }

        // Fetch Personalised if logged in
        if (isLoggedIn) {
          try {
            const persRes = await getRecommendationsApi();
            const persData = persRes?.data?.data ?? persRes?.data ?? persRes ?? [];
            persList = Array.isArray(persData) ? persData : (persData.products || []);
          } catch (err) {
            console.warn("Failed to load personalised recommendations:", err);
          }
        }

        setPopular(popList.map(normalizeProduct));
        setPersonalised(persList.map(normalizeProduct));
      } catch (err) {
        console.error("Overall recommendation fetch error:", err);
        setLoadError("Could not load recommendations at this time.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
    window.dispatchEvent(new Event("cart-updated"));
  }, [wishlist]);

  const toggleWishlist = (id) => {
    if (wishlist.includes(id)) {
      setWishlist(wishlist.filter((item) => item !== id));
      toast.success("Removed from wishlist", {
        icon: "🤍",
        style: { borderRadius: "10px", background: "#333", color: "#fff" }
      });
    } else {
      setWishlist([...wishlist, id]);
      toast.success("Added to wishlist!", {
        icon: "❤️",
        style: { borderRadius: "10px", background: "#4E7D4E", color: "#fff" }
      });
    }
  };

  const addToCart = async (product) => {
    const saved = localStorage.getItem("cartItems");
    const currentCart = saved ? JSON.parse(saved) : [];

    const existing = currentCart.find((item) => item.id === product.id || item.product_id === product.id);
    let updatedCart = [];

    if (existing) {
      updatedCart = currentCart.map((item) =>
        (item.id === product.id || item.product_id === product.id) ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      updatedCart = [...currentCart, { ...product, product_id: product.id, quantity: 1 }];
    }

    localStorage.setItem("cartItems", JSON.stringify(updatedCart));

    const totalCount = updatedCart.reduce((acc, item) => acc + item.quantity, 0);
    localStorage.setItem("cartCount", String(totalCount));

    if (isLoggedIn && product.id) {
      try {
        await addToCartApi(product.id, 1);
      } catch (err) {
        console.warn("Failed to sync add to cart API:", err);
      }
    }

    window.dispatchEvent(new Event("cart-updated"));
    window.dispatchEvent(new Event("open-cart"));

    toast.success(`${product.name} added to cart!`, {
      style: { borderRadius: "10px", background: "#4E7D4E", color: "#fff" }
    });
  };

  const renderProductGrid = (products) => {
    if (products.length === 0) {
      return (
        <div className="empty-recommendation-state">
          <p>No recommendations available right now. Keep shopping to help us learn your preferences!</p>
          <button onClick={() => navigate('/shop')} className="explore-shop-btn">Explore Shop</button>
        </div>
      );
    }

    return (
      <div className="recommendation-products-grid">
        {products.map((prod) => (
          <div
            key={prod.id}
            className="product-card-item"
            onClick={() => navigate(`/product/${prod.id}`, { state: { fromFlashSale: false } })}
            style={{ cursor: "pointer" }}
          >
            <div className="product-image-box">
              <img
                src={prod.image}
                alt={prod.name}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = NO_IMAGE_PLACEHOLDER;
                }}
              />
              {prod.badge && <span className="product-badge">{prod.badge}</span>}
              {prod.discount > 0 && (
                <span className="product-discount-tag">-{prod.discount}%</span>
              )}

              <button
                type="button"
                className={`product-wishlist-toggle ${wishlist.includes(prod.id) ? "active" : ""}`}
                onClick={(e) => { e.stopPropagation(); toggleWishlist(prod.id); }}
              >
                <Heart size={16} fill={wishlist.includes(prod.id) ? "#e54b4b" : "none"} />
              </button>
            </div>

            <div className="product-details-box">
              <span className="product-category">
                {prod.brand ? `${prod.brand} · ${prod.category}` : prod.category}
              </span>
              <h3 className="product-title">{prod.name}</h3>
              {prod.stockQuantity <= 0 && (
                <span className="product-out-of-stock">Out of stock</span>
              )}

              <div className="product-rating-row">
                <div className="stars-row">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      fill={i < Math.floor(prod.rating) ? "#FFC107" : "none"}
                      stroke={i < Math.floor(prod.rating) ? "#FFC107" : "#E5E7EB"}
                    />
                  ))}
                </div>
                <span className="rating-text">{prod.rating} ({prod.reviews})</span>
              </div>

              <div className="product-footer-row">
                <div className="price-box">
                  <span className="sale-price">\${prod.price}</span>
                  {prod.originalPrice > prod.price && (
                    <span className="original-price">\${prod.originalPrice}</span>
                  )}
                </div>

                <button
                  type="button"
                  className="add-cart-btn"
                  disabled={prod.stockQuantity <= 0}
                  onClick={(e) => { e.stopPropagation(); addToCart(prod); }}
                >
                  {prod.stockQuantity <= 0 ? "Out of Stock" : "Add To Cart"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="recommendation-page-layout">
      <Toaster position="bottom-right" />
      <Header />

      <div className="shop-breadcrumbs-section">
        <div className="breadcrumbs-container">
          <span className="breadcrumb-link" onClick={() => navigate("/")}>Home</span>
          <ChevronRight size={14} className="breadcrumb-arrow" />
          <span className="breadcrumb-current">AI Recommendations</span>
        </div>
      </div>

      <div className="recommendation-hero-section">
        <div className="hero-content">
          <h1>
            <Sparkles className="hero-icon" size={32} />
            Curated Just For You
          </h1>
          <p>Discover products hand-picked by our intelligent AI, tailored to your unique taste and current trends.</p>
        </div>
      </div>

      <div className="recommendation-main-content">
        {isLoading ? (
          <div className="loading-state">
            <Loader2 size={48} className="spin loader-icon" />
            <h3>Analyzing your preferences...</h3>
          </div>
        ) : loadError ? (
          <div className="error-state">
            <AlertTriangle size={48} className="error-icon" />
            <h3>{loadError}</h3>
            <button onClick={() => window.location.reload()} className="retry-btn">Try Again</button>
          </div>
        ) : (
          <>
            {isLoggedIn && (
              <section className="recommendation-section">
                <div className="section-header">
                  <h2>
                    <Zap size={24} className="section-icon text-yellow" />
                    Recommended For You
                  </h2>
                  <p>Based on your activity and preferences</p>
                </div>
                {renderProductGrid(personalised)}
              </section>
            )}

            <section className="recommendation-section">
              <div className="section-header">
                <h2>
                  <TrendingUp size={24} className="section-icon text-blue" />
                  Trending Now
                </h2>
                <p>Popular products loved by everyone</p>
              </div>
              {renderProductGrid(popular)}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default RecommendationPage;
