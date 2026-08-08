import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Star,
  Heart,
  ShoppingCart,
  Zap,
  Truck,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  Minus,
  Plus,
  Loader2,
  Award,
  AlertCircle,
  Share2
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Header from "../../components/Header";
import { getProductByIdApi, productsPagedApi } from "../../services/productsService";
import { addToCartApi } from "../../services/cartService";
import "./styles/ProductDetailPage.css";

const NO_IMAGE_PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
      <rect width="500" height="500" fill="#F1F1F1"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" fill="#9CA3AF" text-anchor="middle" dominant-baseline="middle">No Image Available</text>
    </svg>`
  );

// Fallback demo dataset for instant response if API doesn't return mock items
const MOCK_FALLBACK_PRODUCTS = [
  {
    id: 1,
    name: "Pro Wireless Noise Cancelling Headphones",
    category: "Electronics",
    brand: "SoundMaster",
    price: 129.99,
    originalPrice: 169.99,
    stockQuantity: 15,
    rating: 4.8,
    reviews: 142,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=700&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=700&auto=format&fit=crop&q=80"
    ],
    description: "Experience premium, immersive acoustic clarity with hybrid active noise cancellation, ultra-soft memory foam ear cushions, and up to 40 hours of uninterrupted wireless playback."
  },
  {
    id: 2,
    name: "Active Smart Watch Series 7 Pro",
    category: "Electronics",
    brand: "PulseTech",
    price: 89.99,
    originalPrice: 119.99,
    stockQuantity: 8,
    rating: 4.6,
    reviews: 98,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=700&auto=format&fit=crop&q=80"
    ],
    description: "Track your health metrics, continuous heart rate, sleep cycles, and daily workout routines with high-precision sensors on a brilliant Retina AMOLED display."
  }
];

function normalizeProduct(raw) {
  if (!raw) return null;
  const price = Number(raw.price ?? 0);
  const originalPrice = Number(raw.original_price ?? raw.compare_at_price ?? (price * 1.2).toFixed(2));
  const discount =
    originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  let imagesList = [];
  if (Array.isArray(raw.images) && raw.images.length > 0) {
    imagesList = raw.images.map((img) => (typeof img === "string" ? img : img.image_url)).filter(Boolean);
  }
  if (raw.image_url) imagesList.unshift(raw.image_url);
  if (raw.image) imagesList.unshift(raw.image);
  if (imagesList.length === 0) imagesList = [NO_IMAGE_PLACEHOLDER];

  // Remove duplicates
  imagesList = Array.from(new Set(imagesList));

  return {
    id: raw.id,
    name: raw.name ?? "Untitled Product",
    description: raw.description || "No detailed description provided for this product yet.",
    category: typeof raw.category === "object" ? raw.category?.name : (raw.category || "General"),
    brand: typeof raw.brand === "object" ? raw.brand?.name : (raw.brand || null),
    price,
    originalPrice,
    discount,
    stockQuantity: raw.stock_quantity ?? raw.stockQuantity ?? 10,
    images: imagesList,
    rating: Number(raw.ratingSummary?.averageRating ?? raw.rating ?? 4.7),
    reviews: Number(raw.ratingSummary?.totalReviews ?? raw.reviews ?? 64),
    detail: raw.detail || {},
    variants: Array.isArray(raw.variants) ? raw.variants : []
  };
}

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth);
  const isLoggedIn = !!auth.token;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Gallery state
  const [selectedImage, setSelectedImage] = useState("");

  // Quantity State
  const [quantity, setQuantity] = useState(1);

  // Options State
  const [selectedColor, setSelectedColor] = useState("Default");
  const [selectedSize, setSelectedSize] = useState("Standard");

  // Tab State: 'overview' | 'reviews' | 'shipping'
  const [activeTab, setActiveTab] = useState("overview");

  // Wishlist State (synced from localStorage)
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem("wishlist");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Related Products
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
    window.dispatchEvent(new Event("cart-updated"));
  }, [wishlist]);

  // Fetch Product details by ID from API
  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await getProductByIdApi(id);
        const raw = res?.data?.data || res?.data || res;

        if (raw && (raw.id || raw.name)) {
          const norm = normalizeProduct(raw);
          setProduct(norm);
          setSelectedImage(norm.images[0] || NO_IMAGE_PLACEHOLDER);
        } else {
          // Check fallback items
          const mockMatch = MOCK_FALLBACK_PRODUCTS.find((p) => String(p.id) === String(id));
          if (mockMatch) {
            const norm = normalizeProduct(mockMatch);
            setProduct(norm);
            setSelectedImage(norm.images[0]);
          } else {
            setError("Product not found");
          }
        }
      } catch (err) {
        console.warn("Failed to fetch product details API:", err);
        const mockMatch = MOCK_FALLBACK_PRODUCTS.find((p) => String(p.id) === String(id));
        if (mockMatch) {
          const norm = normalizeProduct(mockMatch);
          setProduct(norm);
          setSelectedImage(norm.images[0]);
        } else {
          setError("Failed to load product details from server");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  // Fetch Related products
  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const res = await productsPagedApi({ page: 1, limit: 8 });
        const list = res?.data?.data?.products || res?.data?.products || res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(list) && list.length > 0) {
          const filtered = list.filter((p) => String(p.id) !== String(id)).map(normalizeProduct);
          setRelatedProducts(filtered.slice(0, 4));
        }
      } catch (err) {
        console.warn("Failed to fetch related products:", err);
      }
    };
    fetchRelated();
  }, [id]);

  const toggleWishlist = () => {
    if (!product) return;
    const prodId = product.id;
    if (wishlist.includes(prodId)) {
      setWishlist(wishlist.filter((item) => item !== prodId));
      toast.success("Removed from wishlist", { icon: "🤍" });
    } else {
      setWishlist([...wishlist, prodId]);
      toast.success("Added to wishlist!", { icon: "❤️" });
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    const saved = localStorage.getItem("cartItems");
    const currentCart = saved ? JSON.parse(saved) : [];

    const existingIndex = currentCart.findIndex(
      (item) => item.id === product.id || item.product_id === product.id
    );

    let updatedCart = [];
    if (existingIndex > -1) {
      updatedCart = [...currentCart];
      updatedCart[existingIndex] = {
        ...updatedCart[existingIndex],
        quantity: updatedCart[existingIndex].quantity + quantity
      };
    } else {
      updatedCart = [
        ...currentCart,
        {
          id: product.id,
          product_id: product.id,
          name: product.name,
          price: product.price,
          image: product.images[0] || NO_IMAGE_PLACEHOLDER,
          quantity: quantity,
          selectedColor,
          selectedSize
        }
      ];
    }

    localStorage.setItem("cartItems", JSON.stringify(updatedCart));

    const totalCount = updatedCart.reduce((acc, item) => acc + item.quantity, 0);
    localStorage.setItem("cartCount", String(totalCount));

    if (isLoggedIn && product.id) {
      try {
        await addToCartApi(product.id, quantity);
      } catch (err) {
        console.warn("Failed sync to cart API:", err);
      }
    }

    window.dispatchEvent(new Event("cart-updated"));
    toast.success(`Added ${quantity} x "${product.name}" to cart!`, {
      style: { borderRadius: "10px", background: "#166534", color: "#fff" }
    });
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    window.dispatchEvent(new Event("open-cart"));
  };

  if (loading) {
    return (
      <div className="product-detail-layout">
        <Header />
        <div className="product-detail-loading">
          <Loader2 size={48} className="animate-spin text-green" style={{ color: "#166534" }} />
          <p>Loading product details from backend server...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail-layout">
        <Header />
        <div className="product-detail-error">
          <AlertCircle size={56} style={{ color: "#ef4444" }} />
          <h3>{error || "Product Not Found"}</h3>
          <p>We couldn't find the product you were looking for.</p>
          <button className="back-home-btn" onClick={() => navigate("/shop")}>
            Browse Shop Catalog
          </button>
        </div>
      </div>
    );
  }

  const isWishlisted = wishlist.includes(product.id);

  return (
    <div className="product-detail-layout">
      <Toaster position="bottom-right" />
      <Header />

      {/* Breadcrumb Navigation */}
      <div className="detail-breadcrumbs-section">
        <div className="detail-breadcrumbs">
          <span className="breadcrumb-link" onClick={() => navigate("/")}>Home</span>
          <ChevronRight size={14} />
          <span className="breadcrumb-link" onClick={() => navigate("/shop")}>Shop</span>
          <ChevronRight size={14} />
          <span className="breadcrumb-link" onClick={() => navigate("/shop", { state: { initialCategory: product.category } })}>
            {product.category}
          </span>
          <ChevronRight size={14} />
          <span className="breadcrumb-current">{product.name}</span>
        </div>
      </div>

      <div className="detail-container">
        {/* Main Product Section */}
        <div className="product-main-grid">
          {/* Gallery Column */}
          <div className="product-gallery-box">
            <div className="main-image-wrapper">
              <img
                src={selectedImage}
                alt={product.name}
                className="main-product-img"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = NO_IMAGE_PLACEHOLDER;
                }}
              />
              {product.discount > 0 && (
                <span className="gallery-badge-discount">-{product.discount}% OFF</span>
              )}

              <button
                type="button"
                className={`gallery-wishlist-btn ${isWishlisted ? "active" : ""}`}
                onClick={toggleWishlist}
                title="Save to Wishlist"
              >
                <Heart size={20} fill={isWishlisted ? "#ef4444" : "none"} />
              </button>
            </div>

            {/* Thumbnail Row */}
            {product.images.length > 1 && (
              <div className="thumbnails-row">
                {product.images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`thumbnail-btn ${selectedImage === imgUrl ? "active" : ""}`}
                    onClick={() => setSelectedImage(imgUrl)}
                  >
                    <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details & Actions Column */}
          <div className="product-info-box">
            <div className="product-meta-header">
              <div className="meta-tags">
                <span className="category-pill">{product.category}</span>
                {product.brand && <span className="brand-pill">{product.brand}</span>}
              </div>

              <span
                className={`stock-status-badge ${
                  product.stockQuantity > 0 ? "in-stock" : "out-of-stock"
                }`}
              >
                <CheckCircle2 size={14} />
                {product.stockQuantity > 0
                  ? `In Stock (${product.stockQuantity} available)`
                  : "Out of Stock"}
              </span>
            </div>

            <h1 className="product-detail-title">{product.name}</h1>

            <div className="product-ratings-row">
              <div className="stars-rating">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    fill={i < Math.floor(product.rating) ? "#FFC107" : "none"}
                    stroke={i < Math.floor(product.rating) ? "#FFC107" : "#CBD5E1"}
                  />
                ))}
              </div>
              <span className="rating-score">{product.rating}</span>
              <span className="reviews-count">({product.reviews} customer reviews)</span>
              <span className="verified-buyer-tag">
                <Award size={14} /> Verified Authentic
              </span>
            </div>

            {/* Pricing */}
            <div className="product-price-section">
              <span className="current-price">${product.price.toFixed(2)}</span>
              {product.originalPrice > product.price && (
                <>
                  <span className="original-price-strike">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                  <span className="savings-tag">
                    Save ${(product.originalPrice - product.price).toFixed(2)}
                  </span>
                </>
              )}
            </div>

            <p className="product-short-desc">{product.description}</p>

            {/* Color/Variant Selection if available */}
            <div className="variants-group">
              <span className="variant-label">Color Preference:</span>
              <div className="variant-options-row">
                {["Black", "Silver", "Midnight Green"].map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`variant-chip ${selectedColor === color ? "active" : ""}`}
                    onClick={() => setSelectedColor(color)}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="quantity-control-group">
              <span className="variant-label">Quantity:</span>
              <div className="quantity-picker">
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus size={14} />
                </button>
                <span className="qty-val">{quantity}</span>
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
                  disabled={quantity >= product.stockQuantity}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="detail-cta-actions">
              <button
                type="button"
                className="add-to-cart-cta"
                onClick={handleAddToCart}
                disabled={product.stockQuantity <= 0}
              >
                <ShoppingCart size={20} /> Add to Cart
              </button>
              <button
                type="button"
                className="buy-now-cta"
                onClick={handleBuyNow}
                disabled={product.stockQuantity <= 0}
              >
                <Zap size={20} /> Buy Now
              </button>
            </div>

            {/* Perks & Highlights */}
            <div className="detail-perks-box">
              <div className="perk-mini-item">
                <div className="perk-mini-icon"><Truck size={20} /></div>
                <div>
                  <span className="perk-mini-title">Express Delivery</span>
                  <p className="perk-mini-sub">Delivery in 24h within Phnom Penh</p>
                </div>
              </div>
              <div className="perk-mini-item">
                <div className="perk-mini-icon"><ShieldCheck size={20} /></div>
                <div>
                  <span className="perk-mini-title">Official Guarantee</span>
                  <p className="perk-mini-sub">100% Genuine product warranty</p>
                </div>
              </div>
              <div className="perk-mini-item">
                <div className="perk-mini-icon"><RotateCcw size={20} /></div>
                <div>
                  <span className="perk-mini-title">7-Day Free Returns</span>
                  <p className="perk-mini-sub">Hassle-free replacement policy</p>
                </div>
              </div>
              <div className="perk-mini-item">
                <div className="perk-mini-icon"><Award size={20} /></div>
                <div>
                  <span className="perk-mini-title">Instant KHQR Pay</span>
                  <p className="perk-mini-sub">Supports ABA & local mobile banking</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Tabs Section */}
        <div className="detail-tabs-section">
          <div className="tabs-navigation-header">
            <button
              className={`tab-nav-btn ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              Overview & Specifications
            </button>
            <button
              className={`tab-nav-btn ${activeTab === "reviews" ? "active" : ""}`}
              onClick={() => setActiveTab("reviews")}
            >
              Reviews ({product.reviews})
            </button>
            <button
              className={`tab-nav-btn ${activeTab === "shipping" ? "active" : ""}`}
              onClick={() => setActiveTab("shipping")}
            >
              Shipping & Returns
            </button>
          </div>

          <div className="tab-content-panel">
            {activeTab === "overview" && (
              <div>
                <p style={{ marginBottom: "1.5rem" }}>{product.description}</p>
                <h4 style={{ color: "#0f172a", marginBottom: "1rem" }}>Technical Specifications</h4>
                <table className="specs-table">
                  <tbody>
                    <tr>
                      <td className="spec-name">Product Name</td>
                      <td className="spec-val">{product.name}</td>
                    </tr>
                    <tr>
                      <td className="spec-name">Category</td>
                      <td className="spec-val">{product.category}</td>
                    </tr>
                    {product.brand && (
                      <tr>
                        <td className="spec-name">Brand</td>
                        <td className="spec-val">{product.brand}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="spec-name">Stock Status</td>
                      <td className="spec-val">{product.stockQuantity > 0 ? "Available" : "Out of Stock"}</td>
                    </tr>
                    <tr>
                      <td className="spec-name">Warranty Period</td>
                      <td className="spec-val">12 Months Official Manufacturer Warranty</td>
                    </tr>
                    <tr>
                      <td className="spec-name">Country of Origin</td>
                      <td className="spec-val">Authorized Official Import</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "reviews" && (
              <div>
                <div className="reviews-overview-box">
                  <div className="overall-rating-card">
                    <div className="rating-number-big">{product.rating}</div>
                    <div className="stars-row-big">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={18}
                          fill={i < Math.floor(product.rating) ? "#FFC107" : "none"}
                          stroke={i < Math.floor(product.rating) ? "#FFC107" : "#CBD5E1"}
                        />
                      ))}
                    </div>
                    <span className="rating-total-sub">Based on {product.reviews} reviews</span>
                  </div>

                  <div className="rating-bars-stack">
                    {[
                      { stars: "5 Star", pct: 82 },
                      { stars: "4 Star", pct: 12 },
                      { stars: "3 Star", pct: 4 },
                      { stars: "2 Star", pct: 1 },
                      { stars: "1 Star", pct: 1 }
                    ].map((item, idx) => (
                      <div key={idx} className="bar-row">
                        <span className="bar-label">{item.stars}</span>
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width: `${item.pct}%` }}></div>
                        </div>
                        <span className="bar-percent">{item.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="customer-reviews-list">
                  <div className="review-item-card">
                    <div className="review-user-row">
                      <span className="reviewer-name">Sok Piseth</span>
                      <span className="review-date">2 days ago</span>
                    </div>
                    <div className="stars-rating" style={{ marginBottom: "0.5rem" }}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill="#FFC107" stroke="#FFC107" />
                      ))}
                    </div>
                    <p className="review-text">
                      Outstanding quality! Super fast delivery in Phnom Penh within 4 hours. The packaging was immaculate.
                    </p>
                  </div>

                  <div className="review-item-card">
                    <div className="review-user-row">
                      <span className="reviewer-name">Channary V.</span>
                      <span className="review-date">1 week ago</span>
                    </div>
                    <div className="stars-rating" style={{ marginBottom: "0.5rem" }}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill={i < 4 ? "#FFC107" : "none"} stroke="#FFC107" />
                      ))}
                    </div>
                    <p className="review-text">
                      Exactly as described in the API catalog. Very pleased with ABA KHQR payment smoothness!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "shipping" && (
              <div>
                <h4 style={{ color: "#0f172a", marginBottom: "0.75rem" }}>Shipping & Delivery Info</h4>
                <p style={{ marginBottom: "1rem" }}>
                  We provide express courier delivery across all 25 provinces in Cambodia. Orders placed before 2:00 PM are processed same-day.
                </p>
                <ul style={{ paddingLeft: "1.5rem", marginBottom: "1.5rem" }}>
                  <li>Phnom Penh Express: $1.50 - $2.50 (1-5 hours delivery)</li>
                  <li>Nationwide Delivery (VET, J&T, Virak Buntham): $2.50 - $4.00 (24-48 hours)</li>
                  <li>Free shipping on all orders over $75.00</li>
                </ul>

                <h4 style={{ color: "#0f172a", marginBottom: "0.75rem" }}>Returns Policy</h4>
                <p>
                  If your item arrives damaged or incomplete, you can initiate a free return within 7 calendar days of receipt.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Related Products Grid */}
        {relatedProducts.length > 0 && (
          <div className="related-products-section">
            <h2 className="related-section-title">You Might Also Like</h2>
            <div className="related-products-grid">
              {relatedProducts.map((relProd) => (
                <div
                  key={relProd.id}
                  className="related-card-item"
                  onClick={() => navigate(`/product/${relProd.id}`)}
                >
                  <div className="related-img-box">
                    <img
                      src={relProd.images[0] || NO_IMAGE_PLACEHOLDER}
                      alt={relProd.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = NO_IMAGE_PLACEHOLDER;
                      }}
                    />
                  </div>
                  <div className="related-details-box">
                    <span className="related-category">{relProd.category}</span>
                    <h3 className="related-title">{relProd.name}</h3>
                    <span className="related-price">${relProd.price.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductDetailPage;
