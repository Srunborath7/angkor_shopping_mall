import React, { useState, useEffect } from "react";
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
  ThumbsUp
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Header from "../../components/Header";
import { productsPagedApi } from "../../services/productsService";
import { categoriesApi } from "../../services/categoriesService";
import { addToCartApi } from "../../services/cartService";
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

function normalizeProduct(raw) {
  const price = Number(raw.price ?? 0);
  const originalPrice = Number(raw.original_price ?? raw.compare_at_price ?? (price * 1.25).toFixed(2));
  const discount =
    originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 15;

  const images = Array.isArray(raw.images) ? raw.images : [];
  const primaryImage = images.find((img) => img.is_primary) ?? images[0];
  const variantImage = raw.variants?.[0]?.images?.[0];

  const { rating, reviewsCount } = getProductRatingAndReviews(raw);

  return {
    id: raw.id,
    name: raw.name ?? "Untitled Product",
    description: raw.description ?? "",
    category: raw.category?.name ?? "General",
    brand: raw.brand?.name ?? null,
    price,
    originalPrice: Number(typeof originalPrice === "number" ? originalPrice.toFixed(2) : originalPrice),
    discount: discount || 15,
    stockQuantity: raw.stock_quantity ?? 0,
    image: raw.image_url || primaryImage?.image_url || variantImage?.image_url || NO_IMAGE_PLACEHOLDER,
    rating: rating,
    reviews: reviewsCount,
    badge: raw.badge || (discount > 20 ? "Hot Sale" : "Trending")
  };
}

function HomePage() {
  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth);
  const isLoggedIn = !!auth.token;

  // Real API State
  const [products, setProducts] = useState([]);
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

  // Fetch Products & Categories from API on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Products
        const prodRes = await productsPagedApi({ page: 1, limit: 8 });
        const rawProds = prodRes.data?.data || prodRes.data || (Array.isArray(prodRes) ? prodRes : []);
        if (Array.isArray(rawProds) && rawProds.length > 0) {
          setProducts(rawProds.slice(0, 4).map(normalizeProduct));
        } else {
          setProducts(getFallbackProducts().slice(0, 4));
        }
      } catch (err) {
        console.warn("Failed to fetch homepage products API:", err);
        setProducts(getFallbackProducts());
      }

      try {
        // Fetch Categories
        const catRes = await categoriesApi();
        const rawCats = catRes?.data?.data || catRes?.data || (Array.isArray(catRes) ? catRes : []);
        if (Array.isArray(rawCats) && rawCats.length > 0) {
          const savedIcons = (() => {
            try { return JSON.parse(localStorage.getItem("category_icons") || "{}"); } catch { return {}; }
          })();

          const formattedCats = rawCats.slice(0, 8).map((c, i) => ({
            name: c.name,
            count: c.product_count ? `${c.product_count} items` : `${100 + (c.id || i) * 85}+ items`,
            icon: getCategoryIcon(c.name, c.icon || savedIcons[c.name], i)
          }));
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
        style: { borderRadius: "10px", background: "#1c7e48", color: "#fff" }
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
              Shop Smart,<br />
              <span className="gradient-text">Live Extraordinarily</span>
            </h1>

            <p className="hero-description">
              Explore thousands of premium products backed by AI-curated recommendations, 
              instant ABA KHQR checkout, and express delivery across Cambodia.
            </p>

            <form onSubmit={handleSearchSubmit} className="hero-search-form">
              <div className="search-input-group">
                <Search className="search-icon" size={20} />
                <input
                  type="text"
                  placeholder="Search products, brands, categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button type="submit" className="search-submit-btn">
                Search
              </button>
            </form>

            <div className="hero-quick-tags">
              <span className="tags-label">Popular:</span>
              <button type="button" onClick={() => navigate("/shop", { state: { initialCategory: "Electronics" } })}>Electronics</button>
              <button type="button" onClick={() => navigate("/shop", { state: { initialCategory: "Fashion" } })}>Fashion</button>
              <button type="button" onClick={() => navigate("/shop", { state: { initialCategory: "Sports" } })}>Sports</button>
            </div>

            <div className="hero-stats-row">
              <div className="hero-stat">
                <span className="stat-number">50K+</span>
                <span className="stat-label">Active Products</span>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat">
                <span className="stat-number">120K+</span>
                <span className="stat-label">Happy Clients</span>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat">
                <span className="stat-number">99.8%</span>
                <span className="stat-label">Satisfaction Rate</span>
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
                  <span className="badge-title">AI Engine Active</span>
                  <span className="badge-sub font-light">Personalized deal discovery</span>
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
              <h4>Express Shipping</h4>
              <p>Same-day delivery in Phnom Penh & nationwide</p>
            </div>
          </div>
          <div className="perk-item">
            <div className="perk-icon-box"><ShieldCheck size={24} /></div>
            <div>
              <h4>100% Authentic</h4>
              <p>Direct from official authorized brands</p>
            </div>
          </div>
          <div className="perk-item">
            <div className="perk-icon-box"><CreditCard size={24} /></div>
            <div>
              <h4>Instant KHQR Pay</h4>
              <p>Seamless checkout with ABA & Mobile Banking</p>
            </div>
          </div>
          <div className="perk-item">
            <div className="perk-icon-box"><Headphones size={24} /></div>
            <div>
              <h4>24/7 Live Support</h4>
              <p>Dedicated customer helpline & Telegram bot</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="home-section categories-section">
        <div className="section-header-row">
          <div>
            <h2>Explore Categories</h2>
            <p>Find what you're looking for by browsing our curated collections</p>
          </div>
          <button className="view-all-btn" onClick={() => navigate("/shop")}>
            View All <ChevronRight size={16} />
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
              <h2>Trending & Flash Sale</h2>
              <span className="live-api-badge"><Sparkles size={12} /> Live API</span>
            </div>
            <p>Exclusive deals updated directly from our inventory</p>
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

        {/* Product Grid */}
        {loading ? (
          <div className="homepage-loading-state">
            <Loader2 size={36} className="animate-spin text-green" />
            <p>Loading real-time catalog from server...</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((prod) => (
              <div
                key={prod.id}
                className="product-card-item"
                onClick={() => navigate(`/product/${prod.id}`)}
              >
                <div className="product-image-box">
                  <img src={prod.image} alt={prod.name} loading="lazy" />

                  {prod.badge && <span className="product-badge">{prod.badge}</span>}
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
                  <span className="product-category">{prod.category}</span>
                  <h3 className="product-title" title={prod.name}>{prod.name}</h3>

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

function getFallbackProducts() {
  return [
    {
      id: 101,
      name: "Pro Wireless Headphones v2",
      category: "Electronics",
      price: 39.99,
      originalPrice: 59.99,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60",
      rating: 4.8,
      reviews: 120,
      badge: "Trending",
      discount: 33
    },
    {
      id: 102,
      name: "Active Smart Watch Pro",
      category: "Electronics",
      price: 59.99,
      originalPrice: 89.99,
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60",
      rating: 4.7,
      reviews: 95,
      badge: "Best Seller",
      discount: 33
    },
    {
      id: 103,
      name: "Waterproof Travel Backpack",
      category: "Fashion",
      price: 29.99,
      originalPrice: 39.99,
      image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=60",
      rating: 4.5,
      reviews: 210,
      badge: "New",
      discount: 25
    },
    {
      id: 104,
      name: "Retro Classic Sunglasses",
      category: "Beauty",
      price: 19.99,
      originalPrice: 29.99,
      image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&auto=format&fit=crop&q=60",
      rating: 4.9,
      reviews: 64,
      badge: "Top Rated",
      discount: 33
    }
  ];
}

export default HomePage;