import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  Heart,
  Star,
  SlidersHorizontal,
  ChevronRight,
  ArrowUpDown,
  RotateCcw,
  Loader2,
  AlertTriangle,
  ChevronLeft
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Header from "../../components/Header";
import { productsPagedApi } from "../../services/productsService";
import { useSelector } from "react-redux";
import { addToCartApi } from "../../services/cartService";
import "./styles/ShopPage.css";

// Inline "no image" placeholder — avoids depending on an external image
// host (via.placeholder.com has been unreliable / blocked on some networks).
const NO_IMAGE_PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
      <rect width="500" height="500" fill="#F1F1F1"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" fill="#9CA3AF" text-anchor="middle" dominant-baseline="middle">No Image</text>
    </svg>`
  );

const PAGE_SIZE = 12;

// Normalizes a product object coming back from the API (see actual shape
// returned by GET /api/products/:id) into the shape this page's UI expects.
function normalizeProduct(raw) {
  const price = Number(raw.price ?? 0);

  const originalPrice = Number(raw.original_price ?? raw.compare_at_price ?? price);
  const discount =
    originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  const images = Array.isArray(raw.images) ? raw.images : [];
  const primaryImage = images.find((img) => img.is_primary) ?? images[0];
  const variantImage = raw.variants?.[0]?.images?.[0];

  return {
    id: raw.id,
    name: raw.name ?? "Untitled product",
    description: raw.description ?? "",
    category: raw.category?.name ?? "Uncategorized",
    brand: raw.brand?.name ?? null,
    price,
    originalPrice,
    discount,
    stockQuantity: raw.stock_quantity ?? 0,
    isActive: raw.is_active !== false,
    image: primaryImage?.image_url ?? variantImage?.image_url ?? NO_IMAGE_PLACEHOLDER,
    rating: Number(raw.ratingSummary?.averageRating ?? 0),
    reviews: Number(raw.ratingSummary?.totalReviews ?? 0),
    badge: raw.badge ?? null
  };
}

function ShopPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth);
  const isLoggedIn = !!auth.token;

  // Product data from API
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Pagination state (server-driven, via GET /api/products/true)
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

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

  // Fetch a page of products from the API
  const fetchProducts = async (targetPage = page) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await productsPagedApi({ page: targetPage, limit: PAGE_SIZE });

      // Controller wraps the service result directly as data:
      // { success, message, data: { totalItems, totalPages, currentPage, products } }.
      // Handle a couple of possible unwrap shapes depending on the api() helper.
      const payload = res?.data?.data ?? res?.data ?? res ?? {};
      const list = Array.isArray(payload.products) ? payload.products : [];

      setProducts(list.map(normalizeProduct));
      setTotalPages(payload.totalPages ?? 1);
      setTotalItems(payload.totalItems ?? list.length);
      setPage(payload.currentPage ?? targetPage);
    } catch (err) {
      console.error("Failed to load products:", err);
      setLoadError("We couldn't load products right now. Please try again.");
      toast.error("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const goToPage = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
    window.history.replaceState({}, document.title);
  }, [location.state]);

  // Build the category list dynamically from whatever products came back
  // on the current page (categories on other pages simply won't show a
  // count until you land on a page that contains them).
  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);
    return ["All", ...unique];
  }, [products]);

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

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setPriceRange(130);
    setMinRating(0);
    setSortBy("default");
    toast.success("All filters cleared");
  };

  // Filter and Sort execution — applied within the currently loaded page
  const filteredProducts = products
    .filter((prod) => {
      const matchesSearch =
        prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || prod.category === selectedCategory;
      const matchesPrice = prod.price <= priceRange;
      const matchesRating = prod.rating >= minRating;

      return matchesSearch && matchesCategory && matchesPrice && matchesRating;
    })
    .sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "rating-desc") return b.rating - a.rating;
      return 0;
    });

  return (
    <div className="shop-page-layout">
      <Toaster position="bottom-right" />
      <Header />

      <div className="shop-breadcrumbs-section">
        <div className="breadcrumbs-container">
          <span className="breadcrumb-link" onClick={() => navigate("/")}>Home</span>
          <ChevronRight size={14} className="breadcrumb-arrow" />
          <span className="breadcrumb-current">Shop</span>
        </div>
      </div>

      <div className="shop-workspace-container">
        <div className="shop-grid-wrapper">

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

            <div className="sidebar-filter-group">
              <h4>Categories</h4>
              <div className="category-filter-list">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    className={`category-filter-btn ${selectedCategory === cat ? "active" : ""}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    <span>{cat}</span>
                    <span className="cat-count">
                      ({cat === "All" ? products.length : products.filter((p) => p.category === cat).length})
                    </span>
                  </button>
                ))}
              </div>
            </div>

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

          <main className="shop-products-main">
            <div className="shop-topbar-row">
              <div className="results-counter">
                Showing <strong>{filteredProducts.length}</strong> of <strong>{totalItems}</strong> products
                {totalPages > 1 && (
                  <span className="page-indicator"> · Page {page} of {totalPages}</span>
                )}
              </div>

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

            {isLoading && (
              <div className="no-products-found">
                <Loader2 size={48} className="no-results-icon spin" />
                <h3>Loading products…</h3>
              </div>
            )}

            {!isLoading && loadError && (
              <div className="no-products-found">
                <AlertTriangle size={48} className="no-results-icon" />
                <h3>{loadError}</h3>
                <button className="reset-sidebar-btn" onClick={() => fetchProducts(page)}>
                  Retry
                </button>
              </div>
            )}

            {!isLoading && !loadError && filteredProducts.length === 0 && (
              <div className="no-products-found">
                <RotateCcw size={48} className="no-results-icon" />
                <h3>No Products Found</h3>
                <p>We couldn't find any items matching your selected filter guidelines.</p>
                <button className="reset-sidebar-btn" onClick={clearFilters}>
                  Reset Filter Guidelines
                </button>
              </div>
            )}

            {!isLoading && !loadError && filteredProducts.length > 0 && (
              <div className="shop-products-grid">
                {filteredProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="product-card-item"
                    onClick={() => navigate(`/product/${prod.id}`)}
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
                          <span className="sale-price">${prod.price}</span>
                          {prod.originalPrice > prod.price && (
                            <span className="original-price">${prod.originalPrice}</span>
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
            )}

            {/* Pagination Controls */}
            {!isLoading && !loadError && totalPages > 1 && (
              <div className="shop-pagination-row">
                <button
                  type="button"
                  className="pagination-btn pagination-prev"
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                >
                  <ChevronLeft size={16} /> Prev
                </button>

                <div className="pagination-pages">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`pagination-page-btn ${p === page ? "active" : ""}`}
                      onClick={() => goToPage(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="pagination-btn pagination-next"
                  disabled={page >= totalPages}
                  onClick={() => goToPage(page + 1)}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </main>

        </div>
      </div>
    </div>
  );
}

export default ShopPage;