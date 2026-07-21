import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  Heart,
  Star,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  ArrowUpDown,
  RotateCcw
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Header from "../../components/Header";
import "./styles/ShopPage.css";

const ALL_PRODUCTS = [
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
  },
  {
    id: 7,
    name: "Smart RGB LED Light Bulb",
    category: "Electronics",
    price: 12.99,
    originalPrice: 19.99,
    image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=500&auto=format&fit=crop&q=60",
    rating: 4.3,
    reviews: 29,
    badge: "New",
    discount: 35
  },
  {
    id: 8,
    name: "Organic Ceremonial Match Tea",
    category: "Food",
    price: 24.99,
    originalPrice: 34.99,
    image: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500&auto=format&fit=crop&q=60",
    rating: 4.9,
    reviews: 58,
    badge: "Premium",
    discount: 28
  },
  {
    id: 9,
    name: "Ergonomic Mesh Office Chair",
    category: "Home",
    price: 89.99,
    originalPrice: 129.99,
    image: "https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=500&auto=format&fit=crop&q=60",
    rating: 4.7,
    reviews: 112,
    badge: "Office",
    discount: 30
  },
  {
    id: 10,
    name: "Non-Slip Yoga Exercise Mat",
    category: "Sports",
    price: 18.99,
    originalPrice: 24.99,
    image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500&auto=format&fit=crop&q=60",
    rating: 4.6,
    reviews: 87,
    badge: "Sports",
    discount: 24
  },
  {
    id: 11,
    name: "Matte Velvet Red Lipstick",
    category: "Beauty",
    price: 9.99,
    originalPrice: 14.99,
    image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500&auto=format&fit=crop&q=60",
    rating: 4.4,
    reviews: 35,
    badge: "Beauty",
    discount: 33
  },
  {
    id: 12,
    name: "Fresh Roasted Arabica Coffee",
    category: "Food",
    price: 15.99,
    originalPrice: 21.99,
    image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&auto=format&fit=crop&q=60",
    rating: 4.8,
    reviews: 73,
    badge: "Hot",
    discount: 27
  }
];

const CATEGORIES = ["All", "Electronics", "Fashion", "Beauty", "Home", "Sports", "Food"];

function ShopPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [priceRange, setPriceRange] = useState(130); // Max price limit
  const [minRating, setMinRating] = useState(0);

  // Sorting
  const [sortBy, setSortBy] = useState("default");

  // Wishlist State (synced from localStorage)
  const [wishlist, setWishlist] = useState(() => {
    const saved = localStorage.getItem("wishlist");
    return saved ? JSON.parse(saved) : [];
  });

  // Sync wishlist to localStorage on change
  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
    window.dispatchEvent(new Event("cart-updated"));
  }, [wishlist]);

  // Read initial states passed from HomePage redirects
  useEffect(() => {
    if (location.state?.initialCategory) {
      setSelectedCategory(location.state.initialCategory);
    }
    if (location.state?.initialSearch) {
      setSearchQuery(location.state.initialSearch);
    }
    // Clean up router state so refreshing page doesn't sticky filter
    window.history.replaceState({}, document.title);
  }, [location.state]);

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

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setPriceRange(130);
    setMinRating(0);
    setSortBy("default");
    toast.success("All filters cleared");
  };

  // Filter and Sort execution
  const filteredProducts = ALL_PRODUCTS.filter((prod) => {
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          prod.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || prod.category === selectedCategory;
    const matchesPrice = prod.price <= priceRange;
    const matchesRating = prod.rating >= minRating;

    return matchesSearch && matchesCategory && matchesPrice && matchesRating;
  }).sort((a, b) => {
    if (sortBy === "price-asc") return a.price - b.price;
    if (sortBy === "price-desc") return b.price - a.price;
    if (sortBy === "rating-desc") return b.rating - a.rating;
    return 0; // default
  });

  return (
    <div className="shop-page-layout">
      <Toaster position="bottom-right" />

      {/* Render shared Header navbar */}
      <Header />

      {/* Breadcrumbs Banner */}
      <div className="shop-breadcrumbs-section">
        <div className="breadcrumbs-container">
          <span className="breadcrumb-link" onClick={() => navigate("/")}>Home</span>
          <ChevronRight size={14} className="breadcrumb-arrow" />
          <span className="breadcrumb-current">Shop</span>
        </div>
      </div>

      {/* Shop Layout Workspace */}
      <div className="shop-workspace-container">
        <div className="shop-grid-wrapper">
          
          {/* Left Filter Sidebar */}
          <aside className="shop-sidebar-aside">
            <div className="sidebar-header-row">
              <div className="sidebar-title">
                <SlidersHorizontal size={18} />
                <span>Filters</span>
              </div>
              <button className="sidebar-clear-btn" onClick={clearFilters}>
                <RotateCcw size={14} /> Clear All
              </button>
            </div>

            {/* Category Filter */}
            <div className="sidebar-filter-group">
              <h4>Categories</h4>
              <div className="category-filter-list">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    className={`category-filter-btn ${selectedCategory === cat ? "active" : ""}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    <span>{cat}</span>
                    <span className="cat-count">
                      ({cat === "All" ? ALL_PRODUCTS.length : ALL_PRODUCTS.filter(p => p.category === cat).length})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Slider Filter */}
            <div className="sidebar-filter-group">
              <h4>Max Price</h4>
              <div className="price-slider-box">
                <input
                  type="range"
                  min="5"
                  max="130"
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                />
                <div className="price-slider-labels">
                  <span>$5.00</span>
                  <span className="current-range-val">${priceRange.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Rating Filter */}
            <div className="sidebar-filter-group">
              <h4>Customer Rating</h4>
              <div className="rating-filter-list">
                {[4, 3, 2, 0].map((star) => (
                  <button
                    key={star}
                    className={`rating-filter-btn ${minRating === star ? "active" : ""}`}
                    onClick={() => setMinRating(star)}
                  >
                    {star === 0 ? (
                      <span>All Ratings</span>
                    ) : (
                      <>
                        <div className="rating-stars-row">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              fill={i < star ? "#FFC107" : "none"}
                              stroke={i < star ? "#FFC107" : "#E5E7EB"}
                            />
                          ))}
                        </div>
                        <span>& Up</span>
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Right Product Grid Workspace */}
          <main className="shop-products-main">
            {/* Top Filter Summary & Sorting */}
            <div className="shop-topbar-row">
              <div className="results-counter">
                Showing <strong>{filteredProducts.length}</strong> of <strong>{ALL_PRODUCTS.length}</strong> products
              </div>

              {/* Live search input */}
              <div className="shop-topbar-search">
                <Search size={16} className="topbar-search-icon" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="sorting-select-box">
                <ArrowUpDown size={14} className="sort-icon" />
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="default">Default Sort</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating-desc">Rating: High to Low</option>
                </select>
              </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="no-products-found">
                <RotateCcw size={48} className="no-results-icon" />
                <h3>No Products Found</h3>
                <p>We couldn't find any items matching your selected filter guidelines.</p>
                <button className="reset-sidebar-btn" onClick={clearFilters}>
                  Reset Filter Guidelines
                </button>
              </div>
            ) : (
              <div className="shop-products-grid">
                {filteredProducts.map((prod) => (
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
                        <span className="rating-text">{prod.rating} ({prod.reviews})</span>
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
            )}
          </main>

        </div>
      </div>
    </div>
  );
}

export default ShopPage;
