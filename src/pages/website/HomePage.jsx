import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Search,
  Heart,
  Star,
  Sparkles,
  Clock
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Header from "../../components/Header";
import "./styles/HomePage.css";

function HomePage() {
  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth);

  // Authentication State
  const isLoggedIn = !!auth.token;

  // Wishlist State (synced from localStorage)
  const [wishlist, setWishlist] = useState(() => {
    const saved = localStorage.getItem("wishlist");
    return saved ? JSON.parse(saved) : [];
  });

  const [searchQuery, setSearchQuery] = useState("");

  // Sync wishlist updates
  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
    window.dispatchEvent(new Event("cart-updated"));
  }, [wishlist]);

  // Countdown timer: 02h : 14m : 45s initially
  const [timeLeft, setTimeLeft] = useState({
    hours: 2,
    minutes: 14,
    seconds: 45
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          clearInterval(timer);
          return prev;
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate("/shop", { state: { initialSearch: searchQuery } });
    } else {
      toast.error("Please enter a search query");
    }
  };

  const toggleWishlist = (id) => {
    if (wishlist.includes(id)) {
      setWishlist(wishlist.filter((item) => item !== id));
      toast.success("Removed from wishlist", {
        icon: "🤍",
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff"
        }
      });
    } else {
      setWishlist([...wishlist, id]);
      toast.success("Added to wishlist!", {
        icon: "❤️",
        style: {
          borderRadius: "10px",
          background: "#4E7D4E",
          color: "#fff"
        }
      });
    }
  };

  const addToCart = (product) => {
    const saved = localStorage.getItem("cartItems");
    const currentCart = saved ? JSON.parse(saved) : [];
    
    const existing = currentCart.find((item) => item.id === product.id);
    let updatedCart = [];

    if (existing) {
      updatedCart = currentCart.map((item) =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      updatedCart = [...currentCart, { ...product, quantity: 1 }];
    }

    localStorage.setItem("cartItems", JSON.stringify(updatedCart));
    
    const totalCount = updatedCart.reduce((acc, item) => acc + item.quantity, 0);
    localStorage.setItem("cartCount", String(totalCount));

    // Fire sync events to Header / Drawer
    window.dispatchEvent(new Event("cart-updated"));
    window.dispatchEvent(new Event("open-cart"));

    toast.success(`${product.name} added to cart!`, {
      style: {
        borderRadius: "10px",
        background: "#4E7D4E",
        color: "#fff"
      }
    });
  };

  const categories = [
    { name: "Electronics", count: "1240 items", icon: "📱" },
    { name: "Fashion", count: "3840 items", icon: "👗" },
    { name: "Beauty", count: "892 items", icon: "💄" },
    { name: "Home", count: "2100 items", icon: "🏠" },
    { name: "Sports", count: "567 items", icon: "⚽" },
    { name: "Food", count: "1890 items", icon: "🍜" }
  ];

  const products = [
    {
      id: 1,
      name: "Pro Wireless Headphones",
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
      id: 2,
      name: "Active Smart Watch v2",
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
      id: 3,
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
      id: 4,
      name: "Retro Classic Sunglasses",
      category: "Beauty",
      price: 19.99,
      originalPrice: 29.99,
      image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&auto=format&fit=crop&q=60",
      rating: 4.9,
      reviews: 64,
      badge: "Top Rated",
      discount: 33
    },
    {
      id: 5,
      name: "Red Sports Running Shoes",
      category: "Sports",
      price: 49.99,
      originalPrice: 79.99,
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60",
      rating: 4.6,
      reviews: 180,
      badge: "Hot",
      discount: 37
    },
    {
      id: 6,
      name: "Cotton Casual T-Shirt",
      category: "Fashion",
      price: 14.99,
      originalPrice: 19.99,
      image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60",
      rating: 4.4,
      reviews: 42,
      badge: "Sale",
      discount: 25
    }
  ];

  return (
    <div className="home-layout">
      <Toaster position="bottom-right" />

      {/* Render shared Header navbar */}
      <Header />

      {/* Hero Section */}
      <section className="home-hero-section">
        <div className="hero-grid-container">
          <div className="hero-text-content">
            <div className="hero-badge">
              <span className="badge-emoji">🛍️</span>
              <span>Cambodia's #1 Shopping Mall</span>
            </div>

            <h1 className="hero-main-title">
              Shop Smart,<br />Live Better
            </h1>

            <p className="hero-description">
              Discover thousands of products with AI-powered recommendations, fast delivery, and secure payments — all in one beautiful place.
            </p>

            <form onSubmit={handleSearchSubmit} className="hero-search-form">
              <div className="search-input-group">
                <Search className="search-icon" size={20} />
                <input
                  type="text"
                  placeholder="Search for products, brands and more..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button type="submit" className="search-submit-btn">Search</button>
            </form>

            <div className="hero-stats-row">
              <div className="hero-stat">
                <span className="stat-number">50K+</span>
                <span className="stat-label">Active Products</span>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat">
                <span className="stat-number">120K+</span>
                <span className="stat-label">Happy Customers</span>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat">
                <span className="stat-number">99%</span>
                <span className="stat-label">Satisfaction Rate</span>
              </div>
            </div>
          </div>

          <div className="hero-graphics-container">
            <div className="image-wrapper-card">
              <img
                src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&auto=format&fit=crop&q=80"
                alt="shopping experience"
                className="hero-main-image"
              />
              <div className="floating-badge text-card">
                <Sparkles size={16} className="text-badge-icon" />
                <div>
                  <span className="badge-title">AI Recommendation</span>
                  <span className="badge-sub font-light">Custom tailored feed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="home-section categories-section">
        <div className="section-header">
          <h2>Shop by Category</h2>
          <p>Explore our wide range of product categories</p>
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

      {/* Flash Sale Section */}
      <section className="home-section flash-sale-section">
        <div className="flash-sale-header">
          <div className="header-left">
            <div className="flash-title-row">
              <Clock size={24} className="clock-flash-icon" />
              <h2>Flash Sale</h2>
            </div>
            <p>Hurry up! Limited time offers on top items</p>
          </div>

          {/* Countdown Clock */}
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
        <div className="products-grid">
          {products.map((prod) => (
            <div key={prod.id} className="product-card-item">
              <div className="product-image-box">
                <img src={prod.image} alt={prod.name} />

                {prod.badge && <span className="product-badge">{prod.badge}</span>}
                <span className="product-discount-tag">-{prod.discount}%</span>

                <button
                  type="button"
                  className={`product-wishlist-toggle ${wishlist.includes(prod.id) ? "active" : ""}`}
                  onClick={(e) => { e.stopPropagation(); toggleWishlist(prod.id); }}
                >
                  <Heart size={16} fill={wishlist.includes(prod.id) ? "#e54b4b" : "none"} />
                </button>
              </div>

              <div className="product-details-box">
                <span className="product-category">{prod.category}</span>
                <h3 className="product-title">{prod.name}</h3>

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
                  <span className="rating-text">{prod.rating} ({prod.reviews} reviews)</span>
                </div>

                <div className="product-footer-row">
                  <div className="price-box">
                    <span className="sale-price">${prod.price}</span>
                    <span className="original-price">${prod.originalPrice}</span>
                  </div>

                  <button
                    type="button"
                    className="add-cart-btn"
                    onClick={() => addToCart(prod)}
                  >
                    Add To Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Promotion Footer Banner */}
      <section className="promotion-banner-section">
        <div className="banner-content">
          <h2>Get 30% Off Your First Order</h2>
          <p>Register today and enjoy exclusive member offers, fast checkout, and track your orders live.</p>
          {!isLoggedIn ? (
            <button className="banner-action-btn" onClick={() => navigate("/auth/register")}>
              Create Account
            </button>
          ) : (
            <button className="banner-action-btn" onClick={() => toast("You are already logged in as a member!")}>
              Explore Offers
            </button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer-links">
        <div className="footer-bottom">
          <small>© 2026 Angkor Shopping Mall. All rights reserved.</small>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;