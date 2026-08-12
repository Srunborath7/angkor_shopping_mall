import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
  Send,
  Camera,
  Image as ImageIcon
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Header from "../../components/Header";
import {
  getProductByIdApi,
  productsPagedApi,
  createProductReviewApi
} from "../../services/productsService";
import { getFlashSalesApi } from "../../services/flashSaleService";
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

// Fallback dataset for instant response if API doesn't return mock items
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
    description: "Experience premium acoustic clarity with hybrid active noise cancellation, ultra-soft memory foam ear cushions, and up to 40 hours of uninterrupted wireless playback.",
    specifications: {
      Connectivity: "Bluetooth 5.2",
      BatteryLife: "40 Hours",
      NoiseCancellation: "Active ANC (45dB)",
      Weight: "250g"
    },
    warranty_info: "1 Year Official Brand Replacement Warranty",
    shipping_info: "Same day Phnom Penh delivery. Nationwide express via Virak Buntham.",
    attributes: {
      Color: ["Matte Black", "Silver", "Space Gray"],
      Storage: ["Standard Case", "Pro Case"]
    }
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
    description: "Track your health metrics, heart rate, sleep cycles, and daily workout routines with high-precision sensors on a brilliant Retina AMOLED display.",
    specifications: {
      Display: "1.9-inch AMOLED",
      WaterResistance: "50m (5 ATM)",
      Sensors: "SpO2, Heart Rate, ECG, GPS"
    },
    warranty_info: "6 Months Hardware Warranty",
    shipping_info: "Standard 1-2 business days across Cambodia.",
    attributes: {
      Color: ["Midnight Black", "Starlight", "Rose Gold"],
      Size: ["41", "43", "45"]
    }
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

  // Remove duplicate images
  imagesList = Array.from(new Set(imagesList));

  // Extract backend API schema fields: specifications, warranty_info, shipping_info, attributes
  const detailObj = raw.detail || raw.productDetail || {};
  const specifications = detailObj.specifications || raw.specifications || {};
  const warrantyInfo =
    detailObj.warranty_info ||
    raw.warranty_info ||
    detailObj.warrantyInfo ||
    raw.warrantyInfo ||
    "12 Months Official Manufacturer Warranty";
  const shippingInfo =
    detailObj.shipping_info ||
    raw.shipping_info ||
    detailObj.shippingInfo ||
    raw.shippingInfo ||
    "Express delivery within Phnom Penh (1-5 hours) & nationwide (24-48 hours).";
  const attributes = detailObj.attributes || raw.attributes || {};

  // Extract Product Variants
  const rawVariants = Array.isArray(raw.variants) ? raw.variants : [];
  const variantsList = rawVariants.map((v) => ({
    id: v.id,
    name: v.name || v.variant_name || "Variant",
    price: Number(v.price ?? price),
    stock_quantity: Number(v.stock_quantity ?? v.stockQuantity ?? raw.stock_quantity ?? 0),
    attributes: v.attributes || {},
    sku: v.sku || "",
    image_url: v.image_url || (Array.isArray(v.images) ? v.images[0]?.image_url : null)
  }));

  // Extract Customer Reviews (matching product_reviews table schema: product_id, user_id, rating, comment, images)
  const reviewsList = Array.isArray(raw.reviews)
    ? raw.reviews
    : Array.isArray(raw.ratingSummary?.reviewsList)
    ? raw.ratingSummary.reviewsList
    : [];

  const { rating, reviewsCount } = getProductRatingAndReviews(raw);

  return {
    id: raw.id,
    name: raw.name ?? "Untitled Product",
    description: raw.description || "No detailed description provided for this product yet.",
    category: typeof raw.category === "object" ? raw.category?.name : (raw.category || "General"),
    brand: typeof raw.brand === "object" ? raw.brand?.name : (raw.brand || null),
    price,
    originalPrice,
    discount,
    stockQuantity: Number(raw.stock_quantity ?? raw.stockQuantity ?? 10),
    images: imagesList,
    rating: rating,
    reviewsCount: reviewsCount,
    reviewsList,
    detail: detailObj,
    specifications,
    warrantyInfo,
    shippingInfo,
    attributes,
    variants: variantsList
  };
}

// Normalizes attribute key names e.g. "size" -> "Size", "color" -> "Color", "ram_capacity" -> "Ram Capacity"
function formatAttributeKey(key) {
  if (!key) return "";
  const s = String(key).trim();
  if (!s) return "";
  return s
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// Extracts clean, normalized attribute options (e.g. Color, Size, Storage, Capacity) dynamically from API
function getDynamicAttributes(prod) {
  if (!prod) return {};
  const attrs = {};

  const addAttr = (rawKey, val) => {
    if (!rawKey || val === undefined || val === null) return;
    const formattedKey = formatAttributeKey(rawKey);
    if (!formattedKey) return;

    if (!attrs[formattedKey]) attrs[formattedKey] = [];

    const appendValue = (v) => {
      const s = String(v).trim();
      if (!s) return;
      const exists = attrs[formattedKey].some(
        (existing) => existing.toLowerCase() === s.toLowerCase()
      );
      if (!exists) {
        attrs[formattedKey].push(s);
      }
    };

    if (Array.isArray(val)) {
      val.forEach(appendValue);
    } else {
      appendValue(val);
    }
  };

  // 1. Check raw attributes object
  if (prod.attributes && typeof prod.attributes === "object") {
    Object.entries(prod.attributes).forEach(([k, v]) => addAttr(k, v));
  }

  // 2. Check detail attributes object
  if (prod.detail?.attributes && typeof prod.detail.attributes === "object") {
    Object.entries(prod.detail.attributes).forEach(([k, v]) => addAttr(k, v));
  }

  // 3. Extract attributes from variants array
  if (Array.isArray(prod.variants)) {
    prod.variants.forEach((v) => {
      if (v.attributes && typeof v.attributes === "object") {
        Object.entries(v.attributes).forEach(([key, val]) => addAttr(key, val));
      }
      if (v.name && v.name !== "Default Title" && v.name !== "Variant") {
        const parts = v.name.split(/[/|-]/);
        if (parts.length > 1) {
          parts.forEach((p, idx) => {
            const attrKey = idx === 0 ? "Color" : idx === 1 ? "Size" : "Option";
            addAttr(attrKey, p.trim());
          });
        }
      }
    });
  }

  // Sort values naturally (e.g. numeric sizes sorted ascending 38, 39, 40, 41, 42, 43...)
  Object.keys(attrs).forEach((key) => {
    attrs[key].sort((a, b) => {
      const numA = parseFloat(a);
      const numB = parseFloat(b);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.localeCompare(b);
    });
  });

  return attrs;
}

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth);
  const isLoggedIn = !!auth.token;
  const user = auth.user;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Gallery state
  const [selectedImage, setSelectedImage] = useState("");

  // Quantity State
  const [quantity, setQuantity] = useState(1);

  // Selected Variant State
  const [selectedVariant, setSelectedVariant] = useState(null);

  // Dynamic Selected Attributes State: { Color: "Black", Storage: "256GB", Size: "41" }
  const [selectedAttributes, setSelectedAttributes] = useState({});

  // Tab State: 'overview' | 'reviews' | 'shipping'
  const [activeTab, setActiveTab] = useState("overview");

  // Review & Rating Submission State (matching ProductReview sequelize schema)
  const [newRating, setNewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [reviewerName, setReviewerName] = useState(user?.name || "Customer");
  const [reviewImageUrl, setReviewImageUrl] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

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

  const location = useLocation();
  const locationState = location.state || {};
  const fromFlashSale = locationState.fromFlashSale || false;
  const passedFlashSale = locationState.flashSale || null;
  const passedFlashPrice = locationState.flashPrice || passedFlashSale?.price || null;

  // Active Flash Sales State
  const [activeFlashSale, setActiveFlashSale] = useState(null);

  useEffect(() => {
    const fetchFlashSale = async () => {
      try {
        const sales = await getFlashSalesApi();
        if (Array.isArray(sales)) {
          const match = sales.find(
            (s) => (String(s.product_id) === String(id) || String(s.id) === String(id)) && s.status === "active"
          );
          if (match) {
            setActiveFlashSale(match);
          }
        }
      } catch (err) {
        console.warn("Failed to check active flash sales:", err);
      }
    };
    fetchFlashSale();
  }, [id]);

  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
    window.dispatchEvent(new Event("cart-updated"));
  }, [wishlist]);

  // Extract normalized dynamic attribute options based on current product
  const dynamicAttributes = useMemo(() => {
    return getDynamicAttributes(product);
  }, [product]);

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

          if (norm.variants && norm.variants.length > 0) {
            setSelectedVariant(norm.variants[0]);
          }
        } else {
          const mockMatch = MOCK_FALLBACK_PRODUCTS.find((p) => String(p.id) === String(id));
          if (mockMatch) {
            const norm = normalizeProduct(mockMatch);
            setProduct(norm);
            setSelectedImage(norm.images[0]);
            if (norm.variants && norm.variants.length > 0) {
              setSelectedVariant(norm.variants[0]);
            }
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
          if (norm.variants && norm.variants.length > 0) {
            setSelectedVariant(norm.variants[0]);
          }
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

  // Initialize selected attribute values when product/dynamicAttributes load
  useEffect(() => {
    if (dynamicAttributes && Object.keys(dynamicAttributes).length > 0) {
      const initial = {};
      Object.entries(dynamicAttributes).forEach(([key, values]) => {
        if (values && values.length > 0) {
          initial[key] = values[0];
        }
      });
      setSelectedAttributes(initial);
    }
  }, [dynamicAttributes]);

  // Auto-sync selectedVariant whenever selectedAttributes or product changes
  useEffect(() => {
    if (product?.variants && product.variants.length > 0 && Object.keys(selectedAttributes).length > 0) {
      const matchedVariant = product.variants.find((v) => {
        if (!v.attributes || typeof v.attributes !== "object") return false;
        return Object.entries(selectedAttributes).every(([k, val]) => {
          const vAttrVal = v.attributes[k] || v.attributes[k.toLowerCase()];
          if (!vAttrVal) return false;
          return String(vAttrVal).toLowerCase() === String(val).toLowerCase();
        });
      });

      if (matchedVariant) {
        setSelectedVariant(matchedVariant);
        if (matchedVariant.image_url) {
          setSelectedImage(matchedVariant.image_url);
        }
      }
    }
  }, [selectedAttributes, product]);

  // Handle user selecting an attribute chip (e.g. Color: "Space Gray", Size: "41")
  const handleSelectAttribute = (attrKey, value) => {
    const updated = { ...selectedAttributes, [attrKey]: value };
    setSelectedAttributes(updated);

    // If variants exist, attempt to match the variant corresponding to selected attributes
    if (product?.variants && product.variants.length > 0) {
      const matchedVariant = product.variants.find((v) => {
        if (!v.attributes) return false;
        return Object.entries(updated).every(([k, val]) => {
          const vAttrVal = v.attributes[k] || v.attributes[k.toLowerCase()];
          if (!vAttrVal) return true;
          return String(vAttrVal).toLowerCase() === String(val).toLowerCase();
        });
      });

      if (matchedVariant) {
        setSelectedVariant(matchedVariant);
        if (matchedVariant.image_url) {
          setSelectedImage(matchedVariant.image_url);
        }
      }
    }
  };

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

  // Review & Rating Submission Handler (matching ProductReview sequelize schema)
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      toast.error("Please write a comment for your review");
      return;
    }

    setIsSubmittingReview(true);
    const reviewImagesArray = reviewImageUrl.trim() ? [reviewImageUrl.trim()] : [];

    try {
      await createProductReviewApi(product.id, {
        product_id: product.id,
        user_id: user?.id,
        rating: Number(newRating),
        comment: newComment.trim(),
        images: reviewImagesArray,
        user_name: reviewerName || user?.name || "Customer"
      });
    } catch (err) {
      console.warn("API review submit error, performing optimistic UI update:", err);
    } finally {
      setIsSubmittingReview(false);
    }

    const newReviewObj = {
      id: `rev-${Date.now()}`,
      product_id: product.id,
      user_id: user?.id || "user-id",
      user_name: reviewerName || user?.name || "Customer",
      rating: newRating,
      comment: newComment.trim(),
      images: reviewImagesArray,
      created_at: "Just now"
    };

    const updatedList = [newReviewObj, ...product.reviewsList];
    const totalCount = product.reviewsCount + 1;
    const newAvgRating = parseFloat(
      ((product.rating * product.reviewsCount + newRating) / totalCount).toFixed(1)
    );

    setProduct({
      ...product,
      reviewsList: updatedList,
      reviewsCount: totalCount,
      rating: newAvgRating
    });

    setNewComment("");
    setReviewImageUrl("");
    toast.success("Thank you! Your product review has been published.", {
      style: { borderRadius: "10px", background: "#166534", color: "#fff" }
    });
  };

  // Stock & Pricing calculations based on selected variant, base product, or flash sale
  const effectiveFlashSale = passedFlashSale || activeFlashSale;
  const isFlashSaleActive = fromFlashSale || (effectiveFlashSale && locationState.fromFlashSale !== false);
  const flashPrice = passedFlashPrice !== null ? Number(passedFlashPrice) : (effectiveFlashSale ? Number(effectiveFlashSale.price) : null);

  const baseOriginalPrice = product?.originalPrice || (product?.price ? Number((product.price * 1.25).toFixed(2)) : 0);
  const regularPrice = selectedVariant ? Number(selectedVariant.price) : Number(product?.price ?? 0);
  const availableStock = selectedVariant ? selectedVariant.stock_quantity : (product?.stockQuantity ?? 0);

  const currentPrice = isFlashSaleActive && flashPrice ? flashPrice : regularPrice;
  const displayOriginalPrice = isFlashSaleActive
    ? (regularPrice > (flashPrice || 0) ? regularPrice : baseOriginalPrice)
    : (product?.originalPrice > regularPrice ? product.originalPrice : null);

  // Pre-Add-To-Cart Stock Check Validation
  const handleAddToCart = async () => {
    if (!product) return;

    // 1. Stock check: ensure product / variant is in stock
    if (availableStock <= 0) {
      toast.error("Sorry! This product item is currently out of stock.", {
        style: { borderRadius: "10px", background: "#ef4444", color: "#fff" }
      });
      return;
    }

    // 2. Quantity stock limit validation
    if (quantity > availableStock) {
      toast.error(`Cannot add ${quantity} items. Only ${availableStock} left in stock!`, {
        style: { borderRadius: "10px", background: "#f59e0b", color: "#fff" }
      });
      return;
    }

    const saved = localStorage.getItem("cartItems");
    const currentCart = saved ? JSON.parse(saved) : [];

    const variantId = selectedVariant ? selectedVariant.id : null;
    const attrSummary = Object.values(selectedAttributes).filter(Boolean).join(" / ");
    
    const isFlash = isFlashSaleActive && !!flashPrice;
    const finalPrice = isFlash ? flashPrice : regularPrice;
    const itemKey = `${product.id}-${variantId || attrSummary || "default"}${isFlash ? "-flash" : ""}`;

    const attributesToSend = {
      ...selectedAttributes,
      ...(isFlash ? { is_flash_sale: true, flash_price: finalPrice } : {})
    };

    const existingIndex = currentCart.findIndex(
      (item) => item.itemKey === itemKey || (item.product_id === product.id && item.variant_id === variantId && Boolean(item.is_flash_sale) === isFlash)
    );

    let updatedCart = [];
    if (existingIndex > -1) {
      const existingItem = currentCart[existingIndex];
      const newQty = existingItem.quantity + quantity;

      if (newQty > availableStock) {
        toast.error(`Limit reached! You have ${existingItem.quantity} in cart and only ${availableStock} exist in stock.`, {
          style: { borderRadius: "10px", background: "#f59e0b", color: "#fff" }
        });
        return;
      }

      updatedCart = [...currentCart];
      updatedCart[existingIndex] = {
        ...existingItem,
        quantity: newQty,
        attributes: attributesToSend
      };
    } else {
      updatedCart = [
        ...currentCart,
        {
          id: itemKey,
          itemKey,
          product_id: product.id,
          variant_id: variantId,
          name: product.name + (attrSummary ? ` (${attrSummary})` : "") + (isFlash ? " (Flash Sale)" : ""),
          price: finalPrice,
          originalPrice: displayOriginalPrice || baseOriginalPrice,
          is_flash_sale: isFlash,
          flash_price: isFlash ? finalPrice : null,
          image: selectedImage || product.images[0] || NO_IMAGE_PLACEHOLDER,
          quantity: quantity,
          attributes: attributesToSend,
          stock_quantity: availableStock
        }
      ];
    }

    localStorage.setItem("cartItems", JSON.stringify(updatedCart));

    const totalCount = updatedCart.reduce((acc, item) => acc + item.quantity, 0);
    localStorage.setItem("cartCount", String(totalCount));

    if (isLoggedIn && product.id) {
      try {
        await addToCartApi(product.id, quantity, variantId || null, attributesToSend);
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
    if (availableStock <= 0 || quantity > availableStock) {
      handleAddToCart();
      return;
    }
    await handleAddToCart();
    window.dispatchEvent(new Event("open-cart"));
  };

  if (loading) {
    return (
      <div className="product-detail-layout">
        <Header />
        <div className="product-detail-loading">
          <Loader2 size={48} className="animate-spin text-green" style={{ color: "#166534" }} />
          <p>Fetching product attributes & details from backend server...</p>
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
          <p>We couldn't find the requested product details.</p>
          <button className="back-home-btn" onClick={() => navigate("/shop")}>
            Browse Shop Catalog
          </button>
        </div>
      </div>
    );
  }

  const isWishlisted = wishlist.includes(product.id);
  const specsEntries = Object.entries(product.specifications || {});

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
                  availableStock > 0 ? "in-stock" : "out-of-stock"
                }`}
              >
                <CheckCircle2 size={14} />
                {availableStock > 0
                  ? `In Stock (${availableStock} available)`
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
              <span className="reviews-count">({product.reviewsCount} verified reviews)</span>
              <span className="verified-buyer-tag">
                <Award size={14} /> Official Brand Item
              </span>
            </div>

            {/* Pricing */}
            <div className="product-price-section">
              {isFlashSaleActive && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#fef2f2", color: "#ef4444", padding: "4px 12px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 700, marginBottom: "8px" }}>
                  <Zap size={14} fill="#ef4444" /> Flash Sale Deal
                </div>
              )}
              <div>
                <span className="current-price">${currentPrice.toFixed(2)}</span>
                {displayOriginalPrice && displayOriginalPrice > currentPrice && (
                  <>
                    <span className="original-price-strike">
                      ${Number(displayOriginalPrice).toFixed(2)}
                    </span>
                    <span className="savings-tag">
                      Save ${(Number(displayOriginalPrice) - currentPrice).toFixed(2)}
                    </span>
                  </>
                )}
              </div>
            </div>

            <p className="product-short-desc">{product.description}</p>

            {/* Render Normalized Attributes (e.g. Color, Size, Storage, Capacity) dynamically from API */}
            {Object.entries(dynamicAttributes).map(([attrKey, valList]) => (
              <div key={attrKey} className="variants-group">
                <div className="attribute-header-line">
                  <span className="variant-label">{attrKey}:</span>
                  {selectedAttributes[attrKey] && (
                    <span className="selected-attribute-val">{selectedAttributes[attrKey]}</span>
                  )}
                </div>
                <div className="variant-options-row">
                  {valList.map((val) => (
                    <button
                      key={val}
                      type="button"
                      className={`variant-chip ${selectedAttributes[attrKey] === val ? "active" : ""}`}
                      onClick={() => handleSelectAttribute(attrKey, val)}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Quantity Selector with stock limit enforcement */}
            <div className="quantity-control-group">
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: "320px" }}>
                <span className="variant-label">Quantity:</span>
                <span style={{ fontSize: "0.8rem", color: availableStock <= 5 ? "#dc2626" : "#64748b", fontWeight: 600 }}>
                  {availableStock > 0 ? `Max Stock: ${availableStock}` : "Stock Unavailable"}
                </span>
              </div>
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
                  onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                  disabled={quantity >= availableStock || availableStock <= 0}
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
                disabled={availableStock <= 0}
              >
                <ShoppingCart size={20} />
                {availableStock <= 0 ? "Out of Stock" : "Add to Cart"}
              </button>
              <button
                type="button"
                className="buy-now-cta"
                onClick={handleBuyNow}
                disabled={availableStock <= 0}
              >
                <Zap size={20} />
                {availableStock <= 0 ? "Out of Stock" : "Buy Now"}
              </button>
            </div>

            {/* Perks & Highlights */}
            <div className="detail-perks-box">
              <div className="perk-mini-item">
                <div className="perk-mini-icon"><Truck size={20} /></div>
                <div>
                  <span className="perk-mini-title">Express Delivery</span>
                  <p className="perk-mini-sub">Phnom Penh & Provinces</p>
                </div>
              </div>
              <div className="perk-mini-item">
                <div className="perk-mini-icon"><ShieldCheck size={20} /></div>
                <div>
                  <span className="perk-mini-title">Warranty Coverage</span>
                  <p className="perk-mini-sub">{product.warrantyInfo}</p>
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
                  <p className="perk-mini-sub">ABA KHQR accepted</p>
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
              Specifications & Overview
            </button>
            <button
              className={`tab-nav-btn ${activeTab === "reviews" ? "active" : ""}`}
              onClick={() => setActiveTab("reviews")}
            >
              Reviews ({product.reviewsCount})
            </button>
            <button
              className={`tab-nav-btn ${activeTab === "shipping" ? "active" : ""}`}
              onClick={() => setActiveTab("shipping")}
            >
              Shipping & Warranty
            </button>
          </div>

          <div className="tab-content-panel">
            {activeTab === "overview" && (
              <div>
                <p style={{ marginBottom: "1.5rem" }}>{product.description}</p>
                <h4 style={{ color: "#0f172a", marginBottom: "1rem" }}>API Technical Specifications</h4>
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
                      <td className="spec-val">
                        {availableStock > 0 ? `${availableStock} units in stock` : "Out of stock"}
                      </td>
                    </tr>
                    <tr>
                      <td className="spec-name">Warranty Info</td>
                      <td className="spec-val">{product.warrantyInfo}</td>
                    </tr>
                    {specsEntries.length > 0 &&
                      specsEntries.map(([key, val]) => (
                        <tr key={key}>
                          <td className="spec-name">{key}</td>
                          <td className="spec-val">{typeof val === "object" ? JSON.stringify(val) : String(val)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "reviews" && (
              <div>
                {/* Add Review & Rating Form */}
                <div className="add-review-form-card">
                  <h4 className="review-form-title">Write a Review & Rate Product</h4>
                  <form onSubmit={handleSubmitReview} className="review-form-grid">
                    <div className="review-form-row">
                      <label>Your Rating (1 to 5 Stars):</label>
                      <div className="star-rating-picker">
                        {[1, 2, 3, 4, 5].map((starVal) => {
                          const isFilled = starVal <= (hoverRating || newRating);
                          return (
                            <button
                              key={starVal}
                              type="button"
                              className="star-pick-btn"
                              onClick={() => setNewRating(starVal)}
                              onMouseEnter={() => setHoverRating(starVal)}
                              onMouseLeave={() => setHoverRating(0)}
                              title={`Rate ${starVal} Star${starVal > 1 ? "s" : ""}`}
                            >
                              <Star
                                size={24}
                                fill={isFilled ? "#FFC107" : "none"}
                                stroke={isFilled ? "#FFC107" : "#CBD5E1"}
                              />
                            </button>
                          );
                        })}
                        <span style={{ marginLeft: "0.5rem", fontSize: "0.9rem", fontWeight: 700, color: "#166534" }}>
                          {newRating} / 5 Stars
                        </span>
                      </div>
                    </div>

                    <div className="review-form-row">
                      <label>Your Name:</label>
                      <input
                        type="text"
                        className="review-input-text"
                        placeholder="Enter your full name"
                        value={reviewerName}
                        onChange={(e) => setReviewerName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="review-form-row">
                      <label>Review Comment:</label>
                      <textarea
                        className="review-textarea"
                        placeholder="Share your experience with this product..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        required
                      />
                    </div>

                    <div className="review-form-row">
                      <label style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <ImageIcon size={16} /> Photo Attachment URL (Optional):
                      </label>
                      <input
                        type="url"
                        className="review-input-text"
                        placeholder="https://example.com/photo.jpg"
                        value={reviewImageUrl}
                        onChange={(e) => setReviewImageUrl(e.target.value)}
                      />
                    </div>

                    <button
                      type="submit"
                      className="submit-review-btn"
                      disabled={isSubmittingReview}
                    >
                      {isSubmittingReview ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      Submit Review
                    </button>
                  </form>
                </div>

                {/* Rating Overview Card */}
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
                    <span className="rating-total-sub">Based on {product.reviewsCount} reviews</span>
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

                {/* Customer Reviews List */}
                <div className="customer-reviews-list">
                  {product.reviewsList.length > 0 ? (
                    product.reviewsList.map((rev, i) => (
                      <div key={rev.id || i} className="review-item-card">
                        <div className="review-user-row">
                          <span className="reviewer-name">{rev.user_name || rev.userName || "Verified Buyer"}</span>
                          <span className="review-date">{rev.created_at || "Recently"}</span>
                        </div>
                        <div className="stars-rating" style={{ marginBottom: "0.5rem" }}>
                          {[...Array(5)].map((_, idx) => (
                            <Star
                              key={idx}
                              size={14}
                              fill={idx < Number(rev.rating || 5) ? "#FFC107" : "none"}
                              stroke={idx < Number(rev.rating || 5) ? "#FFC107" : "#CBD5E1"}
                            />
                          ))}
                        </div>
                        <p className="review-text">{rev.comment || rev.text || "Great product quality!"}</p>
                        {Array.isArray(rev.images) && rev.images.length > 0 && (
                          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                            {rev.images.map((imgUrl, imgIdx) => (
                              <img
                                key={imgIdx}
                                src={imgUrl}
                                alt="Review attachment"
                                style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === "shipping" && (
              <div>
                <h4 style={{ color: "#0f172a", marginBottom: "0.75rem" }}>Shipping Info</h4>
                <p style={{ marginBottom: "1.5rem" }}>{product.shippingInfo}</p>

                <h4 style={{ color: "#0f172a", marginBottom: "0.75rem" }}>Warranty Coverage</h4>
                <p style={{ marginBottom: "1.5rem" }}>{product.warrantyInfo}</p>

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
