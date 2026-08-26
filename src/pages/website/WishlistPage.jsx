import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Heart,
  ShoppingCart,
  Trash2,
  Star,
  ChevronRight,
  Loader2,
  ShoppingBag,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Flame
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Header from "../../components/Header";
import { productsPagedApi } from "../../services/productsService";
import { getFlashSalesApi } from "../../services/flashSaleService";
import { addToCartApi } from "../../services/cartService";
import { ProductCardSkeleton } from "../../components/loading/LoadingSkeleton";
import "./styles/WishlistPage.css";

const NO_IMAGE_PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
      <rect width="500" height="500" fill="#F1F1F1"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" fill="#9CA3AF" text-anchor="middle" dominant-baseline="middle">No Image Available</text>
    </svg>`
  );

// Fallback items if offline/mock
const MOCK_CATALOG = [
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
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&auto=format&fit=crop&q=80"
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
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700&auto=format&fit=crop&q=80"
  }
];

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

function normalizeProduct(raw) {
  const price = Number(raw.price ?? 0);
  const originalPrice = Number(raw.originalPrice ?? raw.original_price ?? raw.compare_at_price ?? price);
  const discount =
    originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : (raw.discount || 0);

  const images = Array.isArray(raw.images) ? raw.images : [];
  const primaryImage = images.find((img) => img.is_primary) ?? images[0];
  const variantImage = raw.variants?.[0]?.images?.[0];

  const { rating, reviewsCount } = getProductRatingAndReviews(raw);

  return {
    id: raw.id,
    product_id: raw.product_id || raw.id,
    name: typeof raw.name === "string" ? raw.name : (raw.name?.name || raw.name?.title || String(raw.name ?? "Untitled product")),
    description: raw.description ?? "",
    category: typeof raw.category === "object" ? (raw.category?.name || "General") : (raw.category || "General"),
    brand: raw.brand?.name ?? (typeof raw.brand === "string" ? raw.brand : null),
    price,
    originalPrice,
    discount,
    stockQuantity: raw.stockQuantity ?? raw.stock_quantity ?? 10,
    image: primaryImage?.image_url ?? variantImage?.image_url ?? raw.image_url ?? raw.image ?? NO_IMAGE_PLACEHOLDER,
    rating,
    reviews: reviewsCount,
    isFlashSale: Boolean(raw.isFlashSale || raw.is_flash_sale || raw.badge === "Flash Deal"),
    flashPrice: raw.flashPrice || (raw.is_flash_sale ? price : null),
    flashSaleData: raw.flashSaleData || null,
    badge: raw.badge || null
  };
}

function WishlistPage() {
  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth);
  const isLoggedIn = !!auth?.token;

  const [wishlistIds, setWishlistIds] = useState(() => {
    try {
      const saved = localStorage.getItem("wishlist");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync wishlist state to localStorage and trigger count updates
  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(wishlistIds));
    window.dispatchEvent(new Event("cart-updated"));
  }, [wishlistIds]);

  // Fetch full product catalog and active flash sales from API
  useEffect(() => {
    const fetchWishlistProducts = async () => {
      setLoading(true);
      try {
        const [prodResult, flashResult] = await Promise.allSettled([
          productsPagedApi({ page: 1, limit: 100 }),
          getFlashSalesApi()
        ]);

        let catalogList = [];
        if (prodResult.status === "fulfilled") {
          const res = prodResult.value;
          const list = res?.data?.data?.products || res?.data?.products || res?.data || [];
          if (Array.isArray(list) && list.length > 0) {
            catalogList = list.map(normalizeProduct);
          }
        }

        if (catalogList.length === 0) {
          catalogList = MOCK_CATALOG.map(normalizeProduct);
        }

        let flashList = [];
        if (flashResult.status === "fulfilled" && Array.isArray(flashResult.value)) {
          flashList = flashResult.value.filter((item) => item.status === "active" || !item.status);
        }

        // Map through catalog and enrich with active flash sale pricing/badge if matched
        const enrichedProducts = catalogList.map((prod) => {
          const matchedFlash = flashList.find(
            (fs) =>
              String(fs.product_id) === String(prod.id) ||
              String(fs.id) === String(prod.id)
          );

          if (matchedFlash) {
            const fsPrice = Number(matchedFlash.price || prod.price);
            const fsOriginalPrice = Number(matchedFlash.originalPrice || prod.originalPrice || prod.price);
            const fsDiscount =
              matchedFlash.discount ||
              (fsOriginalPrice > fsPrice ? Math.round(((fsOriginalPrice - fsPrice) / fsOriginalPrice) * 100) : 0);

            return {
              ...prod,
              isFlashSale: true,
              price: fsPrice,
              originalPrice: fsOriginalPrice > fsPrice ? fsOriginalPrice : Number((fsPrice * 1.25).toFixed(2)),
              discount: fsDiscount > 0 ? fsDiscount : prod.discount,
              flashPrice: fsPrice,
              flashSaleData: matchedFlash,
              flash_sale_id: matchedFlash.id,
              badge: matchedFlash.badge || "Flash Deal"
            };
          }
          return prod;
        });

        // Also add any standalone flash sale items that might not be in the catalog
        flashList.forEach((fs) => {
          const fsProdId = fs.product_id || fs.id;
          const alreadyIncluded = enrichedProducts.some(
            (p) => String(p.id) === String(fsProdId) || String(p.id) === String(fs.id)
          );
          if (!alreadyIncluded) {
            const fsPrice = Number(fs.price || 0);
            const fsOriginalPrice = Number(
              fs.originalPrice || (fsPrice > 0 ? Number((fsPrice * 1.25).toFixed(2)) : 0)
            );
            const fsDiscount =
              fs.discount ||
              (fsOriginalPrice > fsPrice ? Math.round(((fsOriginalPrice - fsPrice) / fsOriginalPrice) * 100) : 0);

            enrichedProducts.push({
              id: fsProdId,
              product_id: fsProdId,
              flash_sale_id: fs.id,
              name: typeof fs.name === "string" ? fs.name : String(fs.name ?? "Flash Deal Product"),
              description: fs.description || "",
              category: typeof fs.category === "string" ? fs.category : (fs.category?.name || "Flash Deals"),
              brand: fs.brand || null,
              price: fsPrice,
              originalPrice: fsOriginalPrice,
              discount: fsDiscount,
              stockQuantity: fs.stockLimit || fs.stock_quantity || 10,
              image: fs.image || NO_IMAGE_PLACEHOLDER,
              rating: fs.rating || 4.8,
              reviews: fs.reviews || 50,
              isFlashSale: true,
              flashPrice: fsPrice,
              flashSaleData: fs,
              badge: fs.badge || "Flash Deal"
            });
          }
        });

        setProducts(enrichedProducts);
      } catch (err) {
        console.warn("Failed to load catalog for wishlist:", err);
        setProducts(MOCK_CATALOG.map(normalizeProduct));
      } finally {
        setLoading(false);
      }
    };

    fetchWishlistProducts();
  }, []);

  // Filter products matching saved Wishlist IDs (supports both regular IDs and Flash Sale IDs)
  const wishlistedProducts = products.filter((prod) =>
    wishlistIds.some(
      (id) =>
        String(id) === String(prod.id) ||
        String(id) === String(prod.product_id) ||
        (prod.flash_sale_id && String(id) === String(prod.flash_sale_id)) ||
        (prod.flashSaleData &&
          (String(id) === String(prod.flashSaleData.id) || String(id) === String(prod.flashSaleData.product_id)))
    )
  );

  const handleRemoveFromWishlist = (prod) => {
    const targetIds = [
      String(prod.id),
      prod.product_id ? String(prod.product_id) : null,
      prod.flash_sale_id ? String(prod.flash_sale_id) : null,
      prod.flashSaleData?.id ? String(prod.flashSaleData.id) : null,
      prod.flashSaleData?.product_id ? String(prod.flashSaleData.product_id) : null
    ].filter(Boolean);

    const updated = wishlistIds.filter((id) => !targetIds.includes(String(id)));
    setWishlistIds(updated);
    toast.success("Removed item from your wishlist", {
      icon: "🗑️",
      style: { borderRadius: "10px", background: "#334155", color: "#fff" }
    });
  };

  const handleClearWishlist = () => {
    setWishlistIds([]);
    toast.success("Cleared all items from your wishlist", {
      icon: "🧹",
      style: { borderRadius: "10px", background: "#334155", color: "#fff" }
    });
  };

  const handleAddToCart = async (product) => {
    const saved = localStorage.getItem("cartItems");
    const currentCart = saved ? JSON.parse(saved) : [];

    const realProductId = product.product_id || product.id;
    const isFlashSale = Boolean(product.isFlashSale);
    const flashPrice = isFlashSale ? Number(product.price) : null;
    const displayPrice = Number(product.price);
    const itemKey = `${realProductId}${isFlashSale ? "-flash" : "-default"}`;

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
          id: itemKey,
          itemKey,
          product_id: realProductId,
          name: product.name + (isFlashSale ? " (Flash Sale)" : ""),
          price: displayPrice,
          originalPrice: product.originalPrice || (isFlashSale ? Number((displayPrice * 1.25).toFixed(2)) : displayPrice),
          image: product.image,
          rating: product.rating,
          is_flash_sale: isFlashSale,
          flash_price: flashPrice,
          quantity: 1,
          stock_quantity: product.stockQuantity,
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
        console.warn("Failed to sync add to cart API from wishlist:", err);
      }
    }

    window.dispatchEvent(new Event("cart-updated"));
    window.dispatchEvent(new Event("open-cart"));

    toast.success(`Added "${product.name}" to cart!`, {
      style: { borderRadius: "10px", background: "#166534", color: "#fff" }
    });
  };

  return (
    <div className="wishlist-page-layout">
      <Toaster position="bottom-right" />
      <Header />

      {/* Breadcrumb Section */}
      <div className="wishlist-breadcrumbs-section">
        <div className="wishlist-breadcrumbs-container">
          <span className="wishlist-breadcrumb-link" onClick={() => navigate("/")}>
            Home
          </span>
          <ChevronRight size={14} />
          <span className="wishlist-breadcrumb-link" onClick={() => navigate("/shop")}>
            Shop
          </span>
          <ChevronRight size={14} />
          <span className="wishlist-breadcrumb-current">My Wishlist</span>
        </div>
      </div>

      <main className="wishlist-workspace-container">
        {/* Header Title Row */}
        <div className="wishlist-header-row">
          <div className="wishlist-title-box">
            <div className="wishlist-icon-badge">
              <Heart size={22} fill="#ef4444" />
            </div>
            <div>
              <h1 className="wishlist-main-heading">
                My Favorites & Wishlist
                <span className="wishlist-count-pill">
                  {wishlistedProducts.length} {wishlistedProducts.length === 1 ? "item" : "items"}
                </span>
              </h1>
            </div>
          </div>

          {wishlistedProducts.length > 0 && (
            <button className="clear-wishlist-btn" onClick={handleClearWishlist}>
              <RotateCcw size={14} /> Clear Wishlist
            </button>
          )}
        </div>

        {loading ? (
          <ProductCardSkeleton count={4} gridClassName="wishlist-grid" />
        ) : wishlistedProducts.length === 0 ? (
          /* Empty State */
          <div className="wishlist-empty-state">
            <div className="empty-heart-icon">
              <Heart size={38} />
            </div>
            <h2 className="wishlist-empty-title">Your Wishlist is Empty</h2>
            <p className="wishlist-empty-text">
              You haven't saved any favorite products yet. Explore our latest catalog and tap the heart icon on any product to save it here for later!
            </p>
            <button className="wishlist-shop-now-btn" onClick={() => navigate("/shop")}>
              <ShoppingBag size={18} /> Discover Products
            </button>
          </div>
        ) : (
          /* Wishlist Items Grid */
          <div className="wishlist-grid">
            {wishlistedProducts.map((prod) => (
              <div key={prod.id} className={`wishlist-card ${prod.isFlashSale ? "is-flash-deal-card" : ""}`}>
                <div
                  className="wishlist-card-img-box"
                  onClick={() =>
                    navigate(`/product/${prod.product_id || prod.id}`, {
                      state: prod.isFlashSale
                        ? { fromFlashSale: true, flashSale: prod.flashSaleData || prod, flashPrice: prod.price }
                        : { fromFlashSale: false }
                    })
                  }
                >
                  <img
                    src={prod.image}
                    alt={prod.name}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = NO_IMAGE_PLACEHOLDER;
                    }}
                  />
                  {prod.isFlashSale ? (
                    <span className="wishlist-flash-deal-badge">
                      <Flame size={12} /> {prod.badge || "Flash Deal"}
                    </span>
                  ) : null}
                  {prod.discount > 0 && (
                    <span
                      className="wishlist-discount-badge"
                      style={prod.isFlashSale ? { top: "42px" } : {}}
                    >
                      -{prod.discount}% OFF
                    </span>
                  )}
                  <button
                    type="button"
                    className="wishlist-remove-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFromWishlist(prod);
                    }}
                    title="Remove from Wishlist"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="wishlist-card-content">
                  <span className="wishlist-card-category">
                    {prod.brand ? `${prod.brand} · ${prod.category}` : prod.category}
                  </span>

                  <h3
                    className="wishlist-card-title"
                    onClick={() =>
                      navigate(`/product/${prod.product_id || prod.id}`, {
                        state: prod.isFlashSale
                          ? { fromFlashSale: true, flashSale: prod.flashSaleData || prod, flashPrice: prod.price }
                          : { fromFlashSale: false }
                      })
                    }
                  >
                    {prod.name}
                  </h3>

                  <div className="wishlist-card-rating">
                    <div className="wishlist-stars-row">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          fill={i < Math.floor(prod.rating) ? "#FFC107" : "none"}
                          stroke={i < Math.floor(prod.rating) ? "#FFC107" : "#E5E7EB"}
                        />
                      ))}
                    </div>
                    <span className="wishlist-rating-val">{prod.rating} ({prod.reviews})</span>
                  </div>

                  <div className="wishlist-card-price-row">
                    <span className={`wishlist-sale-price ${prod.isFlashSale ? "flash-sale-price-highlight" : ""}`}>
                      ${prod.price.toFixed(2)}
                    </span>
                    {prod.originalPrice > prod.price && (
                      <span className="wishlist-original-price">${prod.originalPrice.toFixed(2)}</span>
                    )}
                  </div>

                  <button
                    type="button"
                    className={`wishlist-add-cart-btn ${prod.isFlashSale ? "wishlist-flash-cart-btn" : ""}`}
                    onClick={() => handleAddToCart(prod)}
                  >
                    <ShoppingCart size={16} /> {prod.isFlashSale ? "Claim Flash Deal" : "Add To Cart"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default WishlistPage;
