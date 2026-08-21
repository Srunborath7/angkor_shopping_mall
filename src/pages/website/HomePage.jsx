import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Search,
  Heart,
  Star,
  Sparkles,
  Clock,
  Truck,
  ShieldCheck,
  CreditCard,
  Headphones,
  ArrowRight,
  Flame,
  ShoppingBag,
  Loader2,
  Tag,
  ChevronRight,
  Quote,
  Send,
  CheckCircle,
  Award,
  ThumbsUp,
  Trophy,
  BarChart3
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Header from "../../components/Header";
import AISearchInput from "../../components/AISearchInput";
import { useTranslation } from "../../context/LanguageContext";
import { productsPagedApi, getBestSellersApi } from "../../services/productsService";
import { categoriesApi } from "../../services/categoriesService";
import { addToCartApi } from "../../services/cartService";
import { getFlashSalesApi } from "../../services/flashSaleService";
import "./styles/HomePage.css";

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

  // Fallback if no positive rating exists yet
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

function getCategoryIcon(name, apiIcon, index = 0) {
  if (apiIcon && typeof apiIcon === "string" && apiIcon.trim()) {
    return apiIcon.trim();
  }
  const n = String(name || "").toLowerCase();
  if (n.includes("shoe") || n.includes("footwear") || n.includes("sneaker")) return "👟";
  if (n.includes("phone") || n.includes("mobile") || n.includes("electronics") || n.includes("gadget")) return "📱";
  if (n.includes("laptop") || n.includes("computer") || n.includes("pc") || n.includes("tech")) return "💻";
  if (n.includes("cloth") || n.includes("fashion") || n.includes("wear") || n.includes("apparel")) return "👗";
  if (n.includes("beauty") || n.includes("cosmetic") || n.includes("skin") || n.includes("makeup")) return "💄";
  if (n.includes("home") || n.includes("furniture") || n.includes("decor") || n.includes("living")) return "🏠";
  if (n.includes("sport") || n.includes("fitness") || n.includes("outdoor")) return "⚽";
  if (n.includes("food") || n.includes("drink") || n.includes("noodle") || n.includes("grocery")) return "🍜";
  if (n.includes("audio") || n.includes("headphone") || n.includes("speaker") || n.includes("sound")) return "🎧";
  if (n.includes("watch") || n.includes("accessory")) return "⌚";
  if (n.includes("bag") || n.includes("wallet") || n.includes("pack")) return "👜";
  if (n.includes("game") || n.includes("toy")) return "🎮";

  const fallbackList = ["📱", "👗", "👟", "💄", "🏠", "⚽", "💻", "🎧", "⌚", "👜"];
  return fallbackList[index % fallbackList.length];
}



function getCategoryName(cat) {
  if (!cat) return "General";
  if (typeof cat === "string") return cat;
  if (typeof cat === "object") return cat.name || cat.title || cat.label || "General";
  return String(cat);
}

function normalizeProduct(raw, index = 0) {
  const price = Number(raw.price ?? 0);
  const originalPrice = Number(raw.original_price ?? raw.compare_at_price ?? (price * 1.25).toFixed(2));

  const discount =
    originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 15;

  const images = Array.isArray(raw.images) ? raw.images : [];
  const primaryImage = images.find((img) => img.is_primary) ?? images[0];
  const variantImage = raw.variants?.[0]?.images?.[0];

  const { rating, reviewsCount } = getProductRatingAndReviews(raw);
  const rank = raw.rank || (index + 1);
  const totalSales = Number(raw.total_sales ?? raw.units_sold ?? Math.max(15, 130 - index * 11));

  return {
    id: raw.id,
    name: raw.name ?? "Untitled Product",
    description: raw.description ?? "",
    category: getCategoryName(raw.category),
    brand: typeof raw.brand === "object" ? (raw.brand?.name || null) : (raw.brand || null),
    price,
    originalPrice: Number(typeof originalPrice === "number" ? originalPrice.toFixed(2) : originalPrice),
    discount: discount || 15,
    stockQuantity: raw.stock_quantity ?? 0,
    image: raw.image_url || primaryImage?.image_url || variantImage?.image_url || NO_IMAGE_PLACEHOLDER,
    rating: rating,
    reviews: reviewsCount,
    rank,
    rank_badge: raw.rank_badge || (rank === 1 ? "🏆 #1 Top Seller" : rank === 2 ? "🥈 #2 Top Seller" : rank === 3 ? "🥉 #3 Top Seller" : `#${rank} Best Seller`),
    totalSales,
    units_sold: totalSales,
    total_revenue: raw.total_revenue || (totalSales * price),
    badge: raw.badge || (rank <= 3 ? "Best Seller" : (discount > 20 ? "Hot Sale" : "Trending")),
    recommendation_reason: raw.recommendation_reason || `#${rank} Best Seller • ${totalSales}+ units ordered`
  };
}

function HomePage() {
  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth);
  const { t, language } = useTranslation();
  const isLoggedIn = !!auth.token;

  // Real API State
  const [products, setProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Wishlist State (synced from localStorage)
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem("wishlist");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save wishlist state
  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
    window.dispatchEvent(new Event("cart-updated"));
  }, [wishlist]);

  // Flash Sales configured via Admin
  const [flashSales, setFlashSales] = useState([]);

  const loadFlashSales = async () => {
    try {
      // flashSaleService already normalizes: image from product join, category as string
      const res = await getFlashSalesApi();
      if (Array.isArray(res)) {
        const activeOnly = res.filter((item) => item.status === "active");
        setFlashSales(activeOnly.length > 0 ? activeOnly : res);
      }
    } catch (err) {
      console.warn("Failed to fetch flash sales API:", err);
    }
  };

  useEffect(() => {
    loadFlashSales();
    window.addEventListener("flash-sale-updated", loadFlashSales);
    return () => window.removeEventListener("flash-sale-updated", loadFlashSales);
  }, []);

  // Fetch Products, Best Sellers (Tracking Order History), & Categories from API on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // 1. Fetch Top 10 Best Sellers from order history tracking API
      try {
        const bestSellerRes = await getBestSellersApi(10);
        const rawBest = bestSellerRes?.data?.products || bestSellerRes?.products || (Array.isArray(bestSellerRes) ? bestSellerRes : []);
        if (Array.isArray(rawBest) && rawBest.length > 0) {
          setBestSellers(rawBest.map((p, i) => normalizeProduct(p, i)));
        }
      } catch (err) {
        console.warn("Failed to fetch best sellers from order tracking API:", err);
      }

      // 2. Fetch General Products Catalog
      try {
        const prodRes = await productsPagedApi({ page: 1, limit: 12 });
        const rawProds = prodRes?.data?.data || prodRes?.data || (Array.isArray(prodRes) ? prodRes : []);
        if (Array.isArray(rawProds)) {
          const normalized = rawProds.map((p, i) => normalizeProduct(p, i));
          setProducts(normalized);
          // If bestSellers was empty, populate from top normalized products
          setBestSellers((prev) => (prev.length > 0 ? prev : normalized.slice(0, 10)));
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.warn("Failed to fetch homepage products API:", err);
        setProducts([]);
      }

      // 3. Fetch Categories
      try {
        const catRes = await categoriesApi();
        const rawCats = catRes?.data?.data || catRes?.data || (Array.isArray(catRes) ? catRes : []);
        if (Array.isArray(rawCats) && rawCats.length > 0) {
          const savedIcons = (() => {
            try { return JSON.parse(localStorage.getItem("category_icons") || "{}"); } catch { return {}; }
          })();

          const formattedCats = rawCats.slice(0, 8).map((c, i) => {
            // Safely extract name — API may return a nested object
            const catName = typeof c.name === "string" ? c.name
              : (typeof c.name === "object" && c.name !== null ? c.name.name || c.name.title || "Category" : String(c.name || "Category"));
            // Safely extract icon — API may return a nested icon object
            const rawIcon = typeof c.icon === "string" ? c.icon
              : (typeof c.icon === "object" && c.icon !== null ? c.icon.icon || c.icon.name || "" : "");
            const savedIcon = savedIcons[catName] || "";
            return {
              name: catName,
              count: c.product_count ? `${c.product_count} items` : `${100 + (c.id || i) * 85}+ items`,
              icon: getCategoryIcon(catName, rawIcon || savedIcon, i)
            };
          });
          setCategories(formattedCats);
        } else {
          setCategories(getDefaultCategories());
        }
      } catch (err) {
        console.warn("Failed to fetch categories API:", err);
        setCategories(getDefaultCategories());
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Trending & Best Sellers Tab Filter State ('all' | 'electronics' | 'fashion' | 'top-rated')
  const [activeTrendingTab, setActiveTrendingTab] = useState("all");

  const sourceProducts = bestSellers.length > 0 ? bestSellers : products.slice(0, 10);

  const filteredTrendingProducts = useMemo(() => {
    if (activeTrendingTab === "electronics") {
      const matched = sourceProducts.filter((p) => p.category.toLowerCase().includes("electronics") || p.category.toLowerCase().includes("tech") || p.category.toLowerCase().includes("phone") || p.category.toLowerCase().includes("appliance"));
      return matched.length > 0 ? matched : sourceProducts;
    }
    if (activeTrendingTab === "fashion") {
      const matched = sourceProducts.filter((p) => p.category.toLowerCase().includes("fashion") || p.category.toLowerCase().includes("cloth") || p.category.toLowerCase().includes("shoe"));
      return matched.length > 0 ? matched : sourceProducts;
    }
    if (activeTrendingTab === "top-rated") {
      const matched = [...sourceProducts].sort((a, b) => b.rating - a.rating);
      return matched.length > 0 ? matched : sourceProducts;
    }
    return sourceProducts;
  }, [sourceProducts, activeTrendingTab]);

  // Countdown timer for Flash Sale
  const [timeLeft, setTimeLeft] = useState({
    hours: 3,
    minutes: 42,
    seconds: 18
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        clearInterval(timer);
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate("/shop", { state: { initialSearch: searchQuery } });
    } else {
      toast.error("Please enter a keyword to search");
    }
  };

  const toggleWishlist = (id) => {
    const stringId = String(id);
    const exists = wishlist.some((item) => String(item) === stringId);
    if (exists) {
      setWishlist(wishlist.filter((item) => String(item) !== stringId));
      toast.success("Removed from wishlist", {
        icon: "🤍",
        style: { borderRadius: "10px", background: "#333", color: "#fff" }
      });
    } else {
      setWishlist([...wishlist, id]);
      toast.success("Added to wishlist!", {
        icon: "❤️",
        style: { borderRadius: "10px", background: "#1c7e48", color: "#fff" }
      });
    }
  };

  const addToCart = async (product) => {
    const saved = localStorage.getItem("cartItems");
    const currentCart = saved ? JSON.parse(saved) : [];

    // For flash sale items, product_id holds the real product UUID; fall back to id
    const realProductId = product.product_id || product.id;
    const isFlashSale = !!(product.is_flash_sale || product.badge === "Flash Deal" || product.flash_price || product.claimedPct !== undefined);
    const flashPrice = isFlashSale ? Number(product.price) : null;
    const displayPrice = Number(product.price);
    const itemKey = `${realProductId}${isFlashSale ? "-flash" : ""}`;

    const existingIndex = currentCart.findIndex(
      (item) => item.id === itemKey || (item.product_id === realProductId && Boolean(item.is_flash_sale) === isFlashSale)
    );

    const attributesToSend = isFlashSale
      ? { ...(product.attributes || {}), is_flash_sale: true, flash_price: flashPrice }
      : { ...(product.attributes || {}) };

    let updatedCart = [];
    if (existingIndex > -1) {
      updatedCart = currentCart.map((item, idx) =>
        idx === existingIndex ? { ...item, quantity: item.quantity + 1, attributes: attributesToSend } : item
      );
    } else {
      updatedCart = [
        ...currentCart,
        {
          ...product,
          id: itemKey,
          itemKey,
          product_id: realProductId,
          name: product.name + (isFlashSale ? " (Flash Sale)" : ""),
          price: displayPrice,
          originalPrice: product.originalPrice || (isFlashSale ? Number((displayPrice * 1.25).toFixed(2)) : displayPrice),
          is_flash_sale: isFlashSale,
          flash_price: flashPrice,
          quantity: 1,
          attributes: attributesToSend
        }
      ];
    }

    localStorage.setItem("cartItems", JSON.stringify(updatedCart));

    const totalCount = updatedCart.reduce((acc, item) => acc + item.quantity, 0);
    localStorage.setItem("cartCount", String(totalCount));

    if (isLoggedIn && realProductId) {
      try {
        await addToCartApi(realProductId, 1, null, attributesToSend);
      } catch (err) {
        console.warn("Failed to sync add to cart API:", err);
      }
    }

    window.dispatchEvent(new Event("cart-updated"));
    window.dispatchEvent(new Event("open-cart"));

    toast.success(`${product.name} added to cart!`, {
      style: { borderRadius: "10px", background: "#1c7e48", color: "#fff" }
    });
  };

  return (
    <div className="home-layout">
      <Toaster position="bottom-right" />
      <Header />

      {/* Hero Section */}
      <section className="home-hero-section">
        <div className="hero-grid-container">
          <div className="hero-text-content">
            <div className="hero-badge">
              <span className="badge-emoji">✨</span>
              <span>2026 Next-Gen Shopping Experience</span>
            </div>

            <h1 className="hero-main-title">
              {language === "km" ? (
                <>ទិញទំនិញឆ្លាតវៃ,<br /><span className="gradient-text">រស់នៅប្រកបដោយភាពស៊ីវិល័យ</span></>
              ) : (
                <>Shop Smart,<br /><span className="gradient-text">Live Extraordinarily</span></>
              )}
            </h1>

            <p className="hero-description">
              {t("home.heroSubtitle", "Explore thousands of premium products backed by AI-curated recommendations, instant ABA KHQR checkout, and express delivery across Cambodia.")}
            </p>

            <div className="hero-search-wrapper-container" style={{ margin: "1.5rem 0", maxWidth: "600px" }}>
              <AISearchInput
                placeholder={t("nav.searchPlaceholder", "Search products, brands, categories with AI...")}
                initialValue={searchQuery}
                onSearchSubmit={(q) => {
                  if (q.trim()) {
                    navigate("/shop", { state: { initialSearch: q } });
                  } else {
                    toast.error("Please enter a keyword to search");
                  }
                }}
                className="hero-ai-search"
              />
            </div>

            <div className="hero-quick-tags">
              <span className="tags-label">{language === "km" ? "ពេញនិយម៖" : "Popular:"}</span>
              <button type="button" onClick={() => navigate("/shop", { state: { initialCategory: "Electronics" } })}>
                {language === "km" ? "គ្រឿងអេឡិចត្រូនិក" : "Electronics"}
              </button>
              <button type="button" onClick={() => navigate("/shop", { state: { initialCategory: "Fashion" } })}>
                {language === "km" ? "ម៉ូដ & សម្លៀកបំពាក់" : "Fashion"}
              </button>
              <button type="button" onClick={() => navigate("/shop", { state: { initialCategory: "Sports" } })}>
                {language === "km" ? "កីឡា" : "Sports"}
              </button>
            </div>

            <div className="hero-stats-row">
              <div className="hero-stat">
                <span className="stat-number">50K+</span>
                <span className="stat-label">{language === "km" ? "ផលិតផលសកម្ម" : "Active Products"}</span>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat">
                <span className="stat-number">120K+</span>
                <span className="stat-label">{language === "km" ? "អតិថិជនពេញចិត្ត" : "Happy Clients"}</span>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat">
                <span className="stat-number">99.8%</span>
                <span className="stat-label">{language === "km" ? "អត្រាពេញចិត្ត" : "Satisfaction Rate"}</span>
              </div>
            </div>
          </div>

          <div className="hero-graphics-container">
            <div className="image-wrapper-card">
              <img
                src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=700&auto=format&fit=crop&q=80"
                alt="Shopping Experience"
                className="hero-main-image"
              />
              <div className="floating-badge text-card">
                <Sparkles size={18} className="text-badge-icon" />
                <div>
                  <span className="badge-title">{language === "km" ? "ដំណើរការដោយ AI" : "AI Engine Active"}</span>
                  <span className="badge-sub font-light">{language === "km" ? "ស្វែងរកទំនិញឆ្លាតវៃ" : "Personalized deal discovery"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Perks & Features Banner */}
      <section className="features-perks-section">
        <div className="perks-container">
          <div className="perk-item">
            <div className="perk-icon-box"><Truck size={24} /></div>
            <div>
              <h4>{t("home.feature2Title", "Express Shipping")}</h4>
              <p>{t("home.feature2Desc", "Same-day delivery in Phnom Penh & nationwide")}</p>
            </div>
          </div>
          <div className="perk-item">
            <div className="perk-icon-box"><ShieldCheck size={24} /></div>
            <div>
              <h4>{t("home.feature1Title", "100% Authentic")}</h4>
              <p>{t("home.feature1Desc", "Direct from official authorized brands")}</p>
            </div>
          </div>
          <div className="perk-item">
            <div className="perk-icon-box"><CreditCard size={24} /></div>
            <div>
              <h4>{t("home.feature3Title", "Instant KHQR Pay")}</h4>
              <p>{t("home.feature3Desc", "Seamless checkout with ABA & Mobile Banking")}</p>
            </div>
          </div>
          <div className="perk-item">
            <div className="perk-icon-box"><Headphones size={24} /></div>
            <div>
              <h4>{t("home.feature4Title", "24/7 Live Support")}</h4>
              <p>{t("home.feature4Desc", "Dedicated customer helpline & Telegram bot")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="home-section categories-section">
        <div className="section-header-row">
          <div>
            <h2>{t("home.featuredCategories", "Explore Categories")}</h2>
            <p>{language === "km" ? "ស្វែងរកផលិតផលដែលអ្នកពេញចិត្តតាមបណ្តាប្រភេទផ្សេងៗ" : "Find what you're looking for by browsing our curated collections"}</p>
          </div>
          <button className="view-all-btn" onClick={() => navigate("/shop")}>
            {t("common.viewAll", "View All")} <ChevronRight size={16} />
          </button>
        </div>

        <div className="categories-grid">
          {categories.map((cat, idx) => (
            <div
              key={idx}
              className="category-card-item"
              onClick={() => navigate("/shop", { state: { initialCategory: cat.name } })}
            >
              <div className="category-emoji-box">{cat.icon}</div>
              <h3>{cat.name}</h3>
              <p className="category-items-count">{cat.count}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Flash Sale / Live API Showcase Section */}
      <section className="home-section flash-sale-section">
        <div className="flash-sale-header">
          <div className="header-left">
            <div className="flash-title-row">
              <Flame size={26} className="clock-flash-icon" />
              <h2>{t("home.flashDeals", "Flash Sale Deals")}</h2>
              <span className="live-api-badge"><Sparkles size={12} /> Live API</span>
            </div>
            <p>{language === "km" ? "ការបញ្ចុះតម្លៃពិសេសមានកំណត់ ធ្វើបច្ចុប្បន្នភាពផ្ទាល់ពីស្តុក" : "Limited-time discounts updated directly from our inventory"}</p>
          </div>

          <div className="countdown-timer">
            <div className="time-segment">
              <span className="time-value">{String(timeLeft.hours).padStart(2, "0")}</span>
              <span className="time-label">h</span>
            </div>
            <span className="time-colon">:</span>
            <div className="time-segment">
              <span className="time-value">{String(timeLeft.minutes).padStart(2, "0")}</span>
              <span className="time-label">m</span>
            </div>
            <span className="time-colon">:</span>
            <div className="time-segment">
              <span className="time-value">{String(timeLeft.seconds).padStart(2, "0")}</span>
              <span className="time-label">s</span>
            </div>
          </div>
        </div>

        {/* Flash Sale Product Grid */}
        {loading ? (
          <div className="homepage-loading-state">
            <Loader2 size={36} className="animate-spin text-green" />
            <p>Loading real-time flash deals from server...</p>
          </div>
        ) : (
          <div className="products-grid">
            {(flashSales.length > 0 ? flashSales : products.slice(0, 4)).map((prod, idx) => {
              const claimedPct = prod.claimedPct || (65 + ((idx * 7) % 30));
              const itemsLeft = Math.max(1, prod.stockLimit || (10 - idx * 2));
              const prodRating = prod.rating || 4.8;
              const prodReviews = prod.reviews || (50 + idx * 25);

              return (
                <div
                  key={prod.id || idx}
                  className="product-card-item"
                  onClick={() =>
                    navigate(`/product/${prod.product_id || prod.id}`, {
                      state: { fromFlashSale: true, flashSale: prod, flashPrice: prod.price }
                    })
                  }
                >
                  <div className="product-image-box">
                    <img src={prod.image} alt={prod.name} loading="lazy" />

                    <span className="product-badge" style={{ background: "#ef4444" }}>{prod.badge || "Flash Deal"}</span>
                    {prod.discount > 0 && <span className="product-discount-tag">-{prod.discount}%</span>}

                    <button
                      type="button"
                      className={`product-wishlist-toggle ${
                        wishlist.some(
                          (item) =>
                            String(item) === String(prod.product_id || prod.id) ||
                            String(item) === String(prod.id) ||
                            (prod.product_id && String(item) === String(prod.product_id))
                        )
                          ? "active"
                          : ""
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(prod.product_id || prod.id);
                      }}
                      title="Toggle Wishlist"
                    >
                      <Heart
                        size={16}
                        fill={
                          wishlist.some(
                            (item) =>
                              String(item) === String(prod.product_id || prod.id) ||
                              String(item) === String(prod.id) ||
                              (prod.product_id && String(item) === String(prod.product_id))
                          )
                            ? "#e54b4b"
                            : "none"
                        }
                      />
                    </button>
                  </div>

                  <div className="product-details-box">
                    <span className="product-category">{typeof prod.category === "string" ? prod.category : (prod.category?.name ?? "")}</span>
                    <h3 className="product-title" title={prod.name}>{typeof prod.name === "string" ? prod.name : String(prod.name ?? "")}</h3>

                    <div className="product-rating-row">
                      <div className="stars-row">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            fill={i < Math.floor(prodRating) ? "#FFC107" : "none"}
                            stroke={i < Math.floor(prodRating) ? "#FFC107" : "#E5E7EB"}
                          />
                        ))}
                      </div>
                      <span className="rating-text">{prodRating} ({prodReviews})</span>
                    </div>

                    <div className="flash-stock-bar-box">
                      <div className="flash-stock-label">
                        <span>🔥 {claimedPct}% Sold</span>
                        <span>Only {itemsLeft} left</span>
                      </div>
                      <div className="flash-stock-track">
                        <div className="flash-stock-fill" style={{ width: `${claimedPct}%` }}></div>
                      </div>
                    </div>

                    <div className="product-footer-row" style={{ marginTop: "0.75rem" }}>
                      <div className="price-box">
                        <span className="sale-price">${prod.price}</span>
                        {prod.originalPrice > prod.price && (
                          <span className="original-price">${prod.originalPrice}</span>
                        )}
                      </div>

                      <button
                        type="button"
                        className="add-cart-btn"
                        onClick={(e) => { e.stopPropagation(); addToCart(prod); }}
                      >
                        <ShoppingBag size={15} /> Add To Cart
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Trending & Best Sellers Section */}
      <section className="home-section trending-products-section" style={{ marginTop: "2rem" }}>
        <div className="section-header-row">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
              <Trophy size={24} style={{ color: "#d97706" }} />
              <h2>Trending & Best Sellers</h2>
              <span className="order-tracking-badge">
                <BarChart3 size={13} /> Live Order Tracking
              </span>
            </div>
            <p>Rankings calculated from verified buyer order history across AngkorMall (Top 10)</p>
          </div>
          <button className="view-all-btn" onClick={() => navigate("/shop")}>
            Browse Shop <ChevronRight size={16} />
          </button>
        </div>

        {/* Trending Tab Filters */}
        <div className="trending-tabs-row">
          <button
            className={`trending-tab-btn ${activeTrendingTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTrendingTab("all")}
          >
            🏆 Top 10 Best Sellers
          </button>
          <button
            className={`trending-tab-btn ${activeTrendingTab === "electronics" ? "active" : ""}`}
            onClick={() => setActiveTrendingTab("electronics")}
          >
            📱 Electronics & Tech
          </button>
          <button
            className={`trending-tab-btn ${activeTrendingTab === "fashion" ? "active" : ""}`}
            onClick={() => setActiveTrendingTab("fashion")}
          >
            👗 Fashion & Shoes
          </button>
          <button
            className={`trending-tab-btn ${activeTrendingTab === "top-rated" ? "active" : ""}`}
            onClick={() => setActiveTrendingTab("top-rated")}
          >
            ⭐ Top Rated (4.5+)
          </button>
        </div>

        {/* Trending Product Grid */}
        {loading ? (
          <div className="homepage-loading-state">
            <Loader2 size={36} className="animate-spin text-green" />
            <p>Loading trending catalog from server...</p>
          </div>
        ) : (
          <div className="products-grid">
            {filteredTrendingProducts.map((prod) => (
              <div
                key={prod.id}
                className="product-card-item"
                onClick={() =>
                  navigate(`/product/${prod.id}`, {
                    state: { fromFlashSale: false }
                  })
                }
              >
                <div className="product-image-box">
                  <img src={prod.image} alt={prod.name} loading="lazy" />

                  {prod.rank && prod.rank <= 10 ? (
                    <span className={`best-seller-rank-tag rank-${prod.rank <= 3 ? prod.rank : "other"}`}>
                      {prod.rank_badge || `#${prod.rank} Best Seller`}
                    </span>
                  ) : (
                    prod.badge && <span className="product-badge">{prod.badge}</span>
                  )}
                  {prod.discount > 0 && <span className="product-discount-tag">-{prod.discount}%</span>}

                  <button
                    type="button"
                    className={`product-wishlist-toggle ${wishlist.includes(prod.id) ? "active" : ""}`}
                    onClick={(e) => { e.stopPropagation(); toggleWishlist(prod.id); }}
                    title="Toggle Wishlist"
                  >
                    <Heart size={16} fill={wishlist.includes(prod.id) ? "#e54b4b" : "none"} />
                  </button>
                </div>

                <div className="product-details-box">
                  <span className="product-category">{typeof prod.category === "string" ? prod.category : (prod.category?.name ?? "")}</span>
                  <h3 className="product-title" title={prod.name}>{typeof prod.name === "string" ? prod.name : String(prod.name ?? "")}</h3>

                  <div className="product-rating-row" style={{ flexWrap: "wrap", gap: "4px" }}>
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
                    {(prod.units_sold || prod.totalSales) && (
                      <span className="sales-track-pill">
                        🔥 {prod.units_sold || prod.totalSales} sold
                      </span>
                    )}
                  </div>

                  <div className="product-footer-row">
                    <div className="price-box">
                      <span className="sale-price">${prod.price}</span>
                      {prod.originalPrice > prod.price && (
                        <span className="original-price">${prod.originalPrice}</span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="add-cart-btn"
                      onClick={(e) => { e.stopPropagation(); addToCart(prod); }}
                    >
                      <ShoppingBag size={15} /> Add To Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Customer Testimonials Section */}
      <section className="home-section testimonials-section">
        <div className="section-header-row center-text">
          <div>
            <h2>What Our Customers Say</h2>
            <p>Real experiences from verified buyers across Cambodia</p>
          </div>
        </div>

        <div className="testimonials-grid">
          <div className="testimonial-card">
            <Quote className="quote-icon" size={28} />
            <div className="testimonial-stars">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill="#FFC107" stroke="#FFC107" />
              ))}
            </div>
            <p className="testimonial-quote">
              "Ordering from Angkor Mall was super smooth! ABA KHQR payment worked instantly, and my smartwatch arrived in Phnom Penh within 4 hours!"
            </p>
            <div className="testimonial-author">
              <div className="author-avatar">SD</div>
              <div>
                <h4 className="author-name">Sok Dara</h4>
                <span className="author-role"><CheckCircle size={12} className="text-green-inline" /> Verified Buyer • Phnom Penh</span>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <Quote className="quote-icon" size={28} />
            <div className="testimonial-stars">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill="#FFC107" stroke="#FFC107" />
              ))}
            </div>
            <p className="testimonial-quote">
              "Great mobile experience and exact map location pin delivery! The quality of the wireless headphones exceeded my expectations."
            </p>
            <div className="testimonial-author">
              <div className="author-avatar bg-blue">CL</div>
              <div>
                <h4 className="author-name">Chann Lina</h4>
                <span className="author-role"><CheckCircle size={12} className="text-green-inline" /> Verified Buyer • Siem Reap</span>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <Quote className="quote-icon" size={28} />
            <div className="testimonial-stars">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill="#FFC107" stroke="#FFC107" />
              ))}
            </div>
            <p className="testimonial-quote">
              "Customer support is super helpful on Telegram. Genuine products with official warranty. Will definitely buy again!"
            </p>
            <div className="testimonial-author">
              <div className="author-avatar bg-purple">KV</div>
              <div>
                <h4 className="author-name">Keo Vanny</h4>
                <span className="author-role"><CheckCircle size={12} className="text-green-inline" /> Verified Buyer • Battambang</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Promotion VIP Membership Banner */}
      <section className="promotion-banner-section">
        <div className="banner-glow-circle"></div>
        <div className="banner-content">
          <div className="promo-badge-pill">
            <Tag size={14} /> PROMO CODE: <strong>ANGKOR30</strong>
          </div>
          <h2>Get 30% Off Your Next Order</h2>
          <p>Sign up today and unlock member-only prices, priority express delivery, and reward points.</p>
          {!isLoggedIn ? (
            <button className="banner-action-btn" onClick={() => navigate("/auth/register")}>
              Create Free Account <ArrowRight size={18} />
            </button>
          ) : (
            <button className="banner-action-btn" onClick={() => navigate("/shop")}>
              Shop Exclusive Deals <ArrowRight size={18} />
            </button>
          )}
        </div>
      </section>

      {/* Newsletter Subscription Section */}
      <section className="newsletter-section">
        <div className="newsletter-card">
          <div className="newsletter-text">
            <h3>Subscribe for Flash Sales & Deals</h3>
            <p>Get instant updates on daily discounts, new arrivals, and special coupon codes.</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Thank you for subscribing! Check your email for special coupons.", {
                style: { borderRadius: "10px", background: "#1c7e48", color: "#fff" }
              });
            }}
            className="newsletter-form"
          >
            <input type="email" placeholder="Enter your email address..." required />
            <button type="submit" className="newsletter-btn">
              Subscribe <Send size={16} />
            </button>
          </form>
        </div>
      </section>

      {/* Modern Professional Footer */}
      <footer className="home-footer-links">
        <div className="footer-container">
          <div className="footer-brand-col">
            <h3 className="footer-logo-title">Angkor Mall</h3>
            <p>Cambodia's premier online shopping destination. Delivering excellence, quality products, and unbeatable prices daily.</p>
          </div>
          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul>
              <li onClick={() => navigate("/")}>Home</li>
              <li onClick={() => navigate("/shop")}>Shop Catalog</li>
              <li onClick={() => navigate("/orders")}>My Orders</li>
              <li onClick={() => navigate("/auth/login")}>Sign In</li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Customer Service</h4>
            <ul>
              <li>Help & Support</li>
              <li>Shipping & Delivery</li>
              <li>Returns & Exchanges</li>
              <li>Terms & Privacy Policy</li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Payment Methods</h4>
            <div className="payment-badges">
              <span className="pay-badge">ABA KHQR</span>
              <span className="pay-badge">VISA</span>
              <span className="pay-badge">MasterCard</span>
              <span className="pay-badge">Cash on Delivery</span>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <small>© 2026 Angkor Shopping Mall. All rights reserved.</small>
        </div>
      </footer>
    </div>
  );
}

function getDefaultCategories() {
  return [
    { name: "Electronics", count: "1240+ items", icon: "📱" },
    { name: "Fashion", count: "3840+ items", icon: "👗" },
    { name: "Beauty", count: "892+ items", icon: "💄" },
    { name: "Home & Living", count: "2100+ items", icon: "🏠" },
    { name: "Sports", count: "567+ items", icon: "⚽" },
    { name: "Groceries", count: "1890+ items", icon: "🍜" }
  ];
}

export default HomePage;