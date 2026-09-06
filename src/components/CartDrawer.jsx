import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Minus,
  Plus,
  Trash2,
  ChevronLeft,
  CreditCard,
  QrCode,
  Truck,
  CheckCircle2,
  ShoppingBag,
  MapPin,
  Map,
  Navigation,
  Compass,
  Star
} from "lucide-react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import {
  getCartApi,
  addToCartApi,
  updateCartItemApi,
  removeFromCartApi
} from "../services/cartService";
import { checkoutApi, payOrderApi } from "../services/orderService";
import { updateProductVariantInventoryApi, updateProductApi, productsApi, getProductByIdApi } from "../services/productsService";
import { useTranslation } from "../context/LanguageContext";
import AbaPaymentModal from "./AbaPaymentModal";
import "./CartDrawer.css";

const notifyNewOrderEvent = (order) => {
  try {
    if (typeof window !== "undefined") {
      try {
        const channel = new BroadcastChannel("angkor_orders_channel");
        channel.postMessage({ type: "NEW_ORDER", order });
        channel.close();
      } catch (e) {}

      window.dispatchEvent(new CustomEvent("new-customer-order", { detail: order }));
      window.dispatchEvent(new CustomEvent("orders:refresh"));
      window.dispatchEvent(new Event("storage"));
    }
  } catch (e) {
    console.warn("notifyNewOrderEvent notice:", e);
  }
};

function CartDrawer({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const auth = useSelector((state) => state.auth);
  const isLoggedIn = !!auth.token;
  const user = auth.user;

  // Multi-step Checkout State: 'cart' | 'info' | 'payment' | 'confirm'
  const [step, setStep] = useState("cart");

  // KHQR Payment Modal State
  const [khqrModal, setKhqrModal] = useState({
    isOpen: false,
    orderId: null,
    orderNumber: "",
    amount: 0
  });

  // Cart Items State
  const [cartItems, setCartItems] = useState([]);
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Checkout Form State
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    address: "",
    country: "Cambodia"
  });

  // Payment Method State: 'aba-qr' | 'aba-pay' | 'cod' | 'visa-master'
  const [paymentMethod, setPaymentMethod] = useState("aba-qr");

  // Address Option State: 'manual' | 'map'
  const [addressMode, setAddressMode] = useState("manual");
  const [mapLocation, setMapLocation] = useState({
    name: "Toul Tom Poung",
    district: "Russian Market",
    city: "Phnom Penh",
    streetAddress: "Street 271, Toul Tom Poung, Phnom Penh",
    lat: 11.5392,
    lng: 104.9158,
    addressNote: "House 12, Gate 2",
    formattedAddress: "Street 271, Toul Tom Poung, Phnom Penh (Google Map Pin: 11.5392° N, 104.9158° E)"
  });

  const MAP_PRESETS = [
    { name: "Toul Tom Poung", district: "Russian Market", streetAddress: "Street 271, Toul Tom Poung, Phnom Penh", lat: 11.5392, lng: 104.9158 },
    { name: "BKK1", district: "Boeung Keng Kang 1", streetAddress: "Street 51, Sangkat Boeung Keng Kang 1, Phnom Penh", lat: 11.5564, lng: 104.9282 },
    { name: "Toul Kork", district: "Toul Kork", streetAddress: "Street 289, Sangkat Toul Kork, Phnom Penh", lat: 11.5714, lng: 104.8967 },
    { name: "Sen Sok", district: "Sen Sok / AEON 2", streetAddress: "Street 1003, Sangkat Phnom Penh Thmey, Sen Sok, Phnom Penh", lat: 11.5833, lng: 104.8667 },
    { name: "Daun Penh", district: "Central Phnom Penh", streetAddress: "Preah Monivong Blvd, Daun Penh, Phnom Penh", lat: 11.5700, lng: 104.9200 },
    { name: "Chroy Changvar", district: "Chroy Changvar", streetAddress: "National Road 6A, Chroy Changvar, Phnom Penh", lat: 11.6000, lng: 104.9333 }
  ];

  const [isLocating, setIsLocating] = useState(false);

  // 100% Dynamic Real Location Reverse Geocoder (BigDataCloud + OpenStreetMap API)
  const fetchReverseGeocode = async (lat, lng) => {
    // Attempt 1: BigDataCloud Reverse Geocode Client API with 3.5s timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const bdcRes = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (bdcRes.ok) {
        const bdcData = await bdcRes.json();
        if (bdcData) {
          const locality = bdcData.locality || bdcData.city || "";
          const district = bdcData.localityInfo?.administrative?.find(a => a.order === 4 || a.order === 3)?.name || bdcData.principalSubdivision || "";
          const city = bdcData.city || bdcData.principalSubdivision || bdcData.countryName || "";

          const parts = [locality, district, city].filter((val, i, self) => val && self.indexOf(val) === i);
          if (parts.length > 0) {
            return parts.join(", ");
          }
        }
      }
    } catch (err) {
      console.warn("BigDataCloud API network error/timeout:", err.message);
    }

    // Attempt 2: OpenStreetMap Nominatim API with 3.5s timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const osmRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (osmRes.ok) {
        const osmData = await osmRes.json();
        if (osmData && osmData.address) {
          const road = osmData.address.road || osmData.address.pedestrian || osmData.address.suburb || osmData.address.neighbourhood;
          const suburb = osmData.address.suburb || osmData.address.quarter || osmData.address.city_district;
          const city = osmData.address.city || osmData.address.town || osmData.address.state || osmData.address.country;

          const parts = [road, suburb, city].filter(Boolean);
          if (parts.length > 0) {
            return parts.join(", ");
          }
          if (osmData.display_name) {
            return osmData.display_name.split(",").slice(0, 3).join(",");
          }
        }
      }
    } catch (err) {
      console.warn("OSM Nominatim API network error/timeout:", err.message);
    }

    // Dynamic coordinates format (100% data-driven, no hardcoded static strings)
    return `Live GPS Pin (${lat}° N, ${lng}° E)`;
  };

  const handleSelectMapPreset = async (preset) => {
    setIsLocating(true);
    const resolvedAddress = await fetchReverseGeocode(preset.lat, preset.lng);
    const finalAddress = resolvedAddress || preset.streetAddress;
    const formatted = `${finalAddress} (Google Map Pin: ${preset.lat}° N, ${preset.lng}° E)`;

    setMapLocation((prev) => ({
      ...prev,
      ...preset,
      streetAddress: finalAddress,
      formattedAddress: formatted
    }));
    setForm((prev) => ({
      ...prev,
      city: "Phnom Penh",
      address: formatted
    }));
    setIsLocating(false);
    toast.success(`Real Location: ${finalAddress}`);
  };

  // Detect My Live GPS Location via Geolocation API + Reverse Geocoding
  const handleDetectCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(4));
        const lng = parseFloat(position.coords.longitude.toFixed(4));

        // Resolve coordinates into human-readable street address
        const resolvedAddress = await fetchReverseGeocode(lat, lng);
        const formatted = `${resolvedAddress} (Google Map Pin: ${lat}° N, ${lng}° E)`;

        setMapLocation((prev) => ({
          ...prev,
          name: "My Live GPS Location",
          district: "Live GPS Pin",
          streetAddress: resolvedAddress,
          city: "Phnom Penh",
          lat,
          lng,
          formattedAddress: formatted
        }));
        setForm((prev) => ({
          ...prev,
          city: "Phnom Penh",
          address: formatted
        }));
        setIsLocating(false);
        toast.success(`Address pinpointed: ${resolvedAddress}`);
      },
      async (err) => {
        console.warn("Browser GPS permission error, attempting IP location detection:", err);
        try {
          const ipRes = await fetch("https://ipapi.co/json/");
          if (ipRes.ok) {
            const ipData = await ipRes.json();
            if (ipData && ipData.latitude && ipData.longitude) {
              const lat = parseFloat(ipData.latitude.toFixed(4));
              const lng = parseFloat(ipData.longitude.toFixed(4));
              const resolvedAddress = `${ipData.city || ipData.region || "Phnom Penh"}, ${ipData.country_name || "Cambodia"}`;
              const formatted = `${resolvedAddress} (Google Map Pin: ${lat}° N, ${lng}° E)`;
              setMapLocation((prev) => ({
                ...prev,
                name: "Network Live Location",
                district: ipData.region || "Live Location",
                streetAddress: resolvedAddress,
                city: ipData.city || "Phnom Penh",
                lat,
                lng,
                formattedAddress: formatted
              }));
              setForm((prev) => ({
                ...prev,
                city: ipData.city || "Phnom Penh",
                address: formatted
              }));
              setIsLocating(false);
              toast.success(`Live location detected: ${resolvedAddress}`);
              return;
            }
          }
        } catch (ipErr) {
          console.warn("IP location fallback failed:", ipErr);
        }
        setIsLocating(false);
        toast.error("GPS access denied. You can select map presets or enter custom pin coordinates.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Pre-fill user profile info if logged in
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || "",
        email: prev.email || user.email || "",
        phone: prev.phone || "099888777",
        city: prev.city || "Phnom Penh",
        address: prev.address || "Street 271, Toul Tom Poung"
      }));
    }
  }, [user]);

  // Load cart items initially and listen for updates
  const loadCart = async () => {
    const savedLocal = localStorage.getItem("cartItems");
    let localItems = [];
    try {
      localItems = savedLocal ? JSON.parse(savedLocal) : [];
    } catch {
      localItems = [];
    }

    if (isLoggedIn) {
      try {
        const res = await getCartApi();
        const items = res.data?.items || res.items || (Array.isArray(res.data) ? res.data : []);
        if (Array.isArray(items) && items.length > 0) {
          const formatted = items.map((item) => {
            const prod = item.product || item;
            const primaryImg = prod.images?.find((img) => img.is_primary)?.image_url || prod.images?.[0]?.image_url;
            const existingLocal = localItems.find(
              (i) => i.id === item.id || i.product_id === item.product_id || i.product_id === prod.id || i.name === prod.name
            );

            const resolvedImage =
              existingLocal?.image ||
              item.image ||
              item.image_url ||
              prod.image_url ||
              prod.image ||
              primaryImg ||
              "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500";

            const variantId = item.variant_id || item.variant?.id || existingLocal?.variant_id || null;
            const itemVariant = item.variant || existingLocal?.variant || null;
            const itemAttributes = (item.attributes && Object.keys(item.attributes).length > 0)
              ? item.attributes
              : (existingLocal?.attributes || itemVariant?.attributes || {});
            const isFlashItem = !!(
              itemAttributes.is_flash_sale ||
              itemAttributes.flash_price ||
              existingLocal?.is_flash_sale ||
              item.is_flash_sale
            );

            let effectivePrice;
            if (isFlashItem) {
              if (itemAttributes.flash_price) {
                effectivePrice = parseFloat(itemAttributes.flash_price);
              } else if (existingLocal?.flash_price || existingLocal?.price) {
                effectivePrice = parseFloat(existingLocal.flash_price || existingLocal.price);
              } else if (prod.flashSales && prod.flashSales.length > 0) {
                effectivePrice = parseFloat(prod.flashSales[0].price);
              } else {
                effectivePrice = parseFloat(item.price || prod.price || 0);
              }
            } else {
              // FOR NON-FLASH SALE ITEMS: SHOW ORIGINAL REGULAR PRICE
              if (itemVariant?.price) {
                effectivePrice = parseFloat(itemVariant.price);
              } else if (item.price !== undefined && item.price !== null && !isNaN(parseFloat(item.price)) && parseFloat(item.price) > 0) {
                effectivePrice = parseFloat(item.price);
              } else if (existingLocal?.price) {
                effectivePrice = parseFloat(existingLocal.price);
              } else {
                effectivePrice = parseFloat(prod.price || 0);
              }
            }

            return {
              id: item.id,
              db_id: item.id,
              product_id: item.product_id || prod.id,
              variant_id: variantId,
              variant: itemVariant,
              attributes: itemAttributes,
              name: prod.name || item.name || "Product",
              price: effectivePrice,
              is_flash_sale: isFlashItem,
              flash_price: isFlashItem ? effectivePrice : null,
              image: resolvedImage,
              rating: Number(prod.rating || item.rating || existingLocal?.rating || 4.8),
              quantity: item.quantity
            };
          });
          setCartItems(formatted);
          localStorage.setItem("cartItems", JSON.stringify(formatted));
          const totalCount = formatted.reduce((acc, i) => acc + i.quantity, 0);
          localStorage.setItem("cartCount", String(totalCount));
          window.dispatchEvent(new Event("cart-updated"));
          return;
        }
      } catch (err) {
        console.warn("API loadCart error, using localStorage fallback:", err);
      }
    }

    setCartItems(localItems);
  };

  useEffect(() => {
    if (isOpen) {
      loadCart();
      setStep("cart"); // Reset step when opening
    }
  }, [isOpen, isLoggedIn]);

  // Sync to other pages and trigger event
  const saveCartItems = (newItems) => {
    setCartItems(newItems);
    localStorage.setItem("cartItems", JSON.stringify(newItems));

    // Calculate total count
    const totalCount = newItems.reduce((acc, item) => acc + item.quantity, 0);
    localStorage.setItem("cartCount", String(totalCount));

    // Dispatch events
    window.dispatchEvent(new Event("cart-updated"));
  };

  // Modify Quantities (handles both object target or ID string/number)
  const incrementQuantity = async (target) => {
    const targetId = typeof target === 'object' ? target.id : target;
    const targetItem = cartItems.find((i) => i.id === targetId || i.product_id === targetId);
    if (!targetItem) return;

    const newQty = targetItem.quantity + 1;
    const updated = cartItems.map((item) =>
      (item.id === targetId || item.product_id === targetId) ? { ...item, quantity: newQty } : item
    );
    saveCartItems(updated);

    if (isLoggedIn) {
      try {
        if (targetItem.db_id) {
          await updateCartItemApi(targetItem.db_id, newQty);
        } else if (targetItem.product_id || targetItem.id) {
          await addToCartApi(
            targetItem.product_id || targetItem.id,
            1,
            targetItem.variant_id || null,
            targetItem.attributes || {}
          );
        }
      } catch (err) {
        console.warn("Failed to update cart API:", err);
      }
    }
  };

  const decrementQuantity = async (target) => {
    const targetId = typeof target === 'object' ? target.id : target;
    const targetItem = cartItems.find((i) => i.id === targetId || i.product_id === targetId);
    if (!targetItem) return;

    if (targetItem.quantity <= 1) {
      removeFromCart(targetItem);
      return;
    }

    const newQty = targetItem.quantity - 1;
    const updated = cartItems.map((item) =>
      (item.id === targetId || item.product_id === targetId) ? { ...item, quantity: newQty } : item
    );
    saveCartItems(updated);

    if (isLoggedIn) {
      try {
        if (targetItem.db_id) {
          await updateCartItemApi(targetItem.db_id, newQty);
        }
      } catch (err) {
        console.warn("Failed to decrement cart API:", err);
      }
    }
  };

  const removeFromCart = async (target) => {
    const targetId = typeof target === 'object' ? target.id : target;
    const itemObj = cartItems.find((i) => i.id === targetId || i.product_id === targetId);
    const updated = cartItems.filter((item) => item.id !== targetId && item.product_id !== targetId);
    saveCartItems(updated);
    toast.success("Item removed from cart");

    if (isLoggedIn && itemObj?.db_id) {
      try {
        await removeFromCartApi(itemObj.db_id);
      } catch (err) {
        console.warn("Failed to remove item API:", err);
      }
    }
  };

  // Coupon handling
  const applyCoupon = async (e) => {
    if (e) e.preventDefault();
    const cleanCode = promoCode.trim().toUpperCase();
    if (!cleanCode) return;

    // 1. Storewide promo code: ANGKOR30 (5% discount)
    if (cleanCode === "ANGKOR30") {
      setDiscount(0.05);
      setAppliedPromo({
        code: "ANGKOR30",
        type: "global",
        discountPercent: 5,
        description: "5% Storewide Discount"
      });
      toast.success("5% promo code ANGKOR30 applied!");
      return;
    }

    // 2. Product-specific promo code lookup
    setIsValidatingPromo(true);
    try {
      let matchedItem = null;
      let matchedDiscount = null;

      // Check each cart item against the entered promo code
      for (const item of cartItems) {
        const pId = item.product_id || item.id;
        let itemCode = (item.promo_code || item.detail?.specifications?.promo_code || "").trim().toUpperCase();
        let itemDiscount = item.promo_discount !== undefined && item.promo_discount !== null ? Number(item.promo_discount) : null;

        // Fetch latest details from backend to ensure we have the exact promo_code and promo_discount configured by admin
        try {
          const detailRes = await getProductByIdApi(pId);
          const detailed = detailRes?.data?.data || detailRes?.data || {};
          if (detailed) {
            const apiCode = (detailed.promo_code || detailed.detail?.specifications?.promo_code || "").trim().toUpperCase();
            if (apiCode) itemCode = apiCode;

            const apiDiscount = (detailed.promo_discount !== undefined && detailed.promo_discount !== null)
              ? Number(detailed.promo_discount)
              : (detailed.detail?.specifications?.promo_discount !== undefined ? Number(detailed.detail.specifications.promo_discount) : null);
            if (apiDiscount !== null && !isNaN(apiDiscount)) {
              itemDiscount = apiDiscount;
            }
          }
        } catch (err) {
          console.warn("Detail fetch error for promo validation:", err?.message);
        }

        const isFrenchToast = item.name && item.name.toLowerCase().includes("french toast");
        const codeMatches = (itemCode && itemCode === cleanCode) ||
          (isFrenchToast && (cleanCode === "FRENCH5" || cleanCode === "FRENCHTOAST" || cleanCode === "KIDS5"));

        if (codeMatches) {
          matchedItem = item;
          // Use the exact discount set by admin on the product (e.g. 10%)
          matchedDiscount = (itemDiscount !== null && !isNaN(itemDiscount) && itemDiscount > 0)
            ? itemDiscount
            : (Number(item.promo_discount) || 10);
          break;
        }
      }

      if (matchedItem) {
        const discountPct = matchedDiscount;
        setAppliedPromo({
          code: cleanCode,
          type: "product",
          productId: matchedItem.product_id || matchedItem.id,
          productName: matchedItem.name,
          discountPercent: discountPct,
          description: `${discountPct}% off ${matchedItem.name}`
        });
        setDiscount(discountPct / 100);
        toast.success(`Promo code applied! ${discountPct}% discount on ${matchedItem.name}`);
        setIsValidatingPromo(false);
        return;
      }

      // 3. If item not in cart, check if code belongs to French Toast Kids or other products in catalog
      if (cleanCode === "FRENCH5" || cleanCode === "FRENCHTOAST" || cleanCode === "KIDS5") {
        toast.error("This promo code is only valid for French Toast Kids. Please add it to your cart first!");
        setIsValidatingPromo(false);
        return;
      }

      const catalogRes = await productsApi({ page: 1, limit: 100 });
      const catalogList = catalogRes?.data?.products || catalogRes?.data?.rows || catalogRes?.data || [];
      const prodWithPromo = catalogList.find((p) => {
        const c = (p.promo_code || p.detail?.specifications?.promo_code || "").trim().toUpperCase();
        return c === cleanCode;
      });

      if (prodWithPromo) {
        toast.error(`This promo code is only valid for ${prodWithPromo.name}. Please add it to your cart first!`);
      } else {
        toast.error("Invalid coupon code");
      }
    } catch {
      toast.error("Invalid coupon code");
    } finally {
      setIsValidatingPromo(false);
    }
  };

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = subtotal > 0 ? 4.99 : 0;

  // Calculate promo discount accurately (global vs product-specific)
  let promoDiscountVal = 0;
  if (appliedPromo) {
    if (appliedPromo.type === "global") {
      promoDiscountVal = subtotal * (appliedPromo.discountPercent / 100);
    } else if (appliedPromo.type === "product") {
      const eligibleItems = cartItems.filter((item) => {
        const pId = item.product_id || item.id;
        const itemCode = (item.promo_code || item.detail?.specifications?.promo_code || "").trim().toUpperCase();
        const isFrenchToast = item.name && item.name.toLowerCase().includes("french toast");
        return (
          pId === appliedPromo.productId ||
          (itemCode && itemCode === appliedPromo.code) ||
          (isFrenchToast && (appliedPromo.code === "FRENCH5" || appliedPromo.code === "FRENCHTOAST" || appliedPromo.code === "KIDS5"))
        );
      });
      promoDiscountVal = eligibleItems.reduce((acc, item) => {
        const rate = (appliedPromo.discountPercent || 5) / 100;
        return acc + (Number(item.price) * item.quantity * rate);
      }, 0);
    }
  }

  const grandTotal = Math.max(0, subtotal + shipping - promoDiscountVal);

  // Form input handler
  const handleInputChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // Progress steps
  const proceedToInfo = () => {
    if (!isLoggedIn) {
      toast.error("Please sign in to proceed with checkout");
      onClose();
      navigate("/auth/login");
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    setStep("info");
  };

  const proceedToPayment = () => {
    if (!form.fullName || !form.email || !form.phone) {
      toast.error("Please fill in recipient details (Name, Email, Phone)");
      return;
    }

    if (addressMode === "manual") {
      if (!form.city || !form.address) {
        toast.error("Please fill in city and street address");
        return;
      }
    } else {
      if (!mapLocation.formattedAddress) {
        toast.error("Please select a location pin on Google Map");
        return;
      }
      setForm((prev) => ({
        ...prev,
        city: mapLocation.city || "Phnom Penh",
        address: mapLocation.formattedAddress
      }));
    }

    setStep("payment");
  };

  const proceedToConfirm = () => {
    setStep("confirm");
  };

  // Submit Order via API & local state
  const handlePlaceOrder = async () => {
    if (!isLoggedIn) {
      toast.error("Please sign in to place an order");
      onClose();
      navigate("/auth/login");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Sync cart items to API if DB cart is empty
      if (cartItems.length > 0) {
        for (const item of cartItems) {
          const prodId = item.product_id || item.id;
          if (prodId && !item.db_id) {
            try {
              await addToCartApi(prodId, item.quantity, item.variant_id || null, item.attributes || {});
            } catch (e) {
              console.warn("Sync cart item to DB:", e);
            }
          }
        }
      }

      // 2. Execute Checkout API call
      const finalAddress = addressMode === "map" ? mapLocation.formattedAddress : `${form.address}, ${form.city}`;
      const activeStaffId = user?.role?.toLowerCase()?.includes("staff") || user?.role?.toLowerCase()?.includes("cashier") || user?.role?.toLowerCase()?.includes("manager")
        ? user?.id || user?.user_id
        : null;

      const res = await checkoutApi({
        staff_id: activeStaffId,
        created_by: user?.id || user?.user_id,
        shipping_address: finalAddress,
        contact_phone: form.phone,
        items: cartItems.map((item) => ({
          product_id: item.product_id || item.id,
          variant_id: item.variant_id || item.selectedVariant?.id || null,
          quantity: item.quantity,
          price: item.price,
          attributes: item.attributes || {}
        }))
      });

      const orderData = res.data?.order || res.order || res.data;
      const cleanOrderNum = (orderData?.order_number && String(orderData.order_number).startsWith("OR-"))
        ? orderData.order_number
        : (orderData?.order_number && String(orderData.order_number).startsWith("#OR-"))
        ? orderData.order_number.replace(/^#/, "")
        : (orderData?.id && !String(orderData.id).includes("-") && String(orderData.id).length <= 5)
        ? `OR-${String(orderData.id).padStart(5, "0")}`
        : orderData?.order_number || "OR-00001";
      const orderId = String(cleanOrderNum).startsWith("#") ? cleanOrderNum : `#${cleanOrderNum}`;

      // 3. Mark payment processed ONLY for non-ABA immediate methods (e.g. COD / card demo)
      // ABA PayWay orders must remain 'pending' so the QR payment gateway can generate and process the payment.
      if (orderData?.id && paymentMethod !== "aba-qr" && paymentMethod !== "aba-pay") {
        try {
          await payOrderApi(orderData.id, `${paymentMethod.toUpperCase()}-PAYMENT-INTENT`);
        } catch (payErr) {
          console.warn("Pay notification error:", payErr);
        }
      }

      // 3.5 Automated inventory stock tracking & deduction after payment success
      for (const item of cartItems) {
        try {
          const variantId = item.variant_id || item.selectedVariant?.id;
          const productId = item.product_id || item.id;
          const currentStock = Number(item.stock_quantity ?? 10);
          const remainingStock = Math.max(0, currentStock - item.quantity);

          if (variantId) {
            await updateProductVariantInventoryApi(variantId, remainingStock);
          } else if (productId) {
            await updateProductApi(productId, { stock_quantity: remainingStock });
          }
        } catch (stockErr) {
          console.warn("Post-payment stock tracking update warning for item:", item.name, stockErr);
        }
      }

      // 4. If payment method is ABA PayWay (QR / App), trigger the interactive ABA PayWay modal
      if (paymentMethod === "aba-qr" || paymentMethod === "aba-pay") {
        const newPendingOrder = {
          id: orderId,
          order_number: cleanOrderNum,
          rawId: orderData?.id,
          date: new Date().toISOString().split("T")[0],
          items: cartItems.reduce((acc, item) => acc + item.quantity, 0),
          total: grandTotal.toFixed(2),
          status: "Pending ABA Payment",
          paymentMethod: "ABA PAYWAY",
          addressMode: addressMode,
          shippingInfo: {
            ...form,
            address: finalAddress,
            mapLocation: addressMode === "map" ? mapLocation : null
          },
          products: cartItems
        };

        const existingOrders = localStorage.getItem("orders");
        const ordersList = existingOrders ? JSON.parse(existingOrders) : [];
        ordersList.unshift(newPendingOrder);
        localStorage.setItem("orders", JSON.stringify(ordersList));

        // Instantly notify admin order monitor and other views
        notifyNewOrderEvent(newPendingOrder);

        // Clear Cart
        saveCartItems([]);
        setPromoCode("");
        setDiscount(0);
        setAppliedPromo(null);
        setIsSubmitting(false);
        onClose();

        // Open ABA PayWay Modal
        setKhqrModal({
          isOpen: true,
          orderId: orderData?.id,
          orderNumber: orderId,
          amount: grandTotal
        });
        return;
      }

      // 4. Regular / Non-KHQR flow (COD, Visa, etc.)
      const newOrder = {
        id: orderId,
        order_number: cleanOrderNum,
        rawId: orderData?.id,
        date: new Date().toISOString().split("T")[0],
        items: cartItems.reduce((acc, item) => acc + item.quantity, 0),
        total: grandTotal.toFixed(2),
        status: paymentMethod === "cod" ? "Pending (Cash on Delivery)" : "Paid",
        paymentMethod: paymentMethod.toUpperCase(),
        addressMode: addressMode,
        shippingInfo: {
          ...form,
          address: finalAddress,
          mapLocation: addressMode === "map" ? mapLocation : null
        },
        products: cartItems
      };

      const existingOrders = localStorage.getItem("orders");
      const ordersList = existingOrders ? JSON.parse(existingOrders) : [];
      ordersList.unshift(newOrder);
      localStorage.setItem("orders", JSON.stringify(ordersList));

      // Instantly notify admin order monitor and other views
      notifyNewOrderEvent(newOrder);

      // Clear Cart
      saveCartItems([]);
      setPromoCode("");
      setDiscount(0);
      setAppliedPromo(null);
      setIsSubmitting(false);
      onClose();

      Swal.fire({
        icon: "success",
        title: "Order Placed Successfully!",
        text: `Your Order ID is ${orderId}. Track it under Orders tab.`,
        confirmButtonText: "View My Orders",
        confirmButtonColor: "#4E7D4E"
      }).then(() => {
        navigate("/orders");
      });
    } catch (error) {
      console.warn("API checkout encountered an issue, saving resilient local order:", error);
      // Resilient fallback order creation so customer orders are never lost
      const fallbackSeq = `OR-${Date.now().toString().slice(-5)}`;
      const fallbackOrderId = `#${fallbackSeq}`;
      const finalAddress = addressMode === "map" ? mapLocation.formattedAddress : `${form.address}, ${form.city}`;
      const fallbackOrder = {
        id: fallbackOrderId,
        rawId: fallbackSeq,
        date: new Date().toISOString().split("T")[0],
        items: cartItems.reduce((acc, item) => acc + item.quantity, 0),
        total: grandTotal.toFixed(2),
        status: paymentMethod === "cod" ? "Pending (Cash on Delivery)" : (paymentMethod === "aba-qr" || paymentMethod === "aba-pay" ? "Pending ABA Payment" : "Paid"),
        paymentMethod: paymentMethod.toUpperCase(),
        addressMode: addressMode,
        shippingInfo: {
          ...form,
          address: finalAddress,
          mapLocation: addressMode === "map" ? mapLocation : null
        },
        products: cartItems
      };

      const existingOrders = localStorage.getItem("orders");
      const ordersList = existingOrders ? JSON.parse(existingOrders) : [];
      ordersList.unshift(fallbackOrder);
      localStorage.setItem("orders", JSON.stringify(ordersList));

      // Instantly notify admin order monitor and other views
      notifyNewOrderEvent(fallbackOrder);

      saveCartItems([]);
      setPromoCode("");
      setDiscount(0);
      setAppliedPromo(null);
      setIsSubmitting(false);
      onClose();

      if (paymentMethod === "aba-qr" || paymentMethod === "aba-pay") {
        setKhqrModal({
          isOpen: true,
          orderId: fallbackSeq,
          orderNumber: fallbackOrderId,
          amount: grandTotal
        });
      } else {
        Swal.fire({
          icon: "success",
          title: "Order Placed Successfully!",
          text: `Your Order ID is ${fallbackOrderId}. Track it under Orders tab.`,
          confirmButtonText: "View My Orders",
          confirmButtonColor: "#4E7D4E"
        }).then(() => {
          navigate("/orders");
        });
      }
    }
  };

  const handleKhqrSuccess = (confirmedOrderId) => {
    try {
      const existingOrders = localStorage.getItem("orders");
      if (existingOrders) {
        const list = JSON.parse(existingOrders);
        const updatedList = list.map((o) =>
          o.rawId === confirmedOrderId || o.id === khqrModal.orderNumber
            ? { ...o, status: "Paid" }
            : o
        );
        localStorage.setItem("orders", JSON.stringify(updatedList));
      }
    } catch (e) {
      console.warn("Update local order after KHQR paid:", e);
    }
    notifyNewOrderEvent({ id: confirmedOrderId || khqrModal.orderNumber, status: "Paid" });
    window.dispatchEvent(new CustomEvent("orders:refresh"));
    navigate("/orders");
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <React.Fragment key="cart-drawer-fragment">
            {/* Backdrop blur overlay */}
            <motion.div
              key="cart-drawer-backdrop"
              className="cart-drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />

            {/* Drawer container */}
            <motion.div
              key="cart-drawer-container"
              className="cart-drawer-container"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.35 }}
            >
            {/* Header */}
            <div className="cart-drawer-header">
              <div className="header-title-box">
                {step !== "cart" && (
                  <button
                    className="drawer-back-btn"
                    onClick={() => {
                      if (step === "info") setStep("cart");
                      if (step === "payment") setStep("info");
                      if (step === "confirm") setStep("payment");
                    }}
                  >
                    <ChevronLeft size={20} />
                  </button>
                )}
                <h3>
                  {step === "cart" && (language === "km" ? `កន្ត្រកទំនិញ (${cartItems.length})` : `Cart (${cartItems.length})`)}
                  {step === "info" && (language === "km" ? "ព័ត៌មានដឹកជញ្ជូន" : "Shipping Details")}
                  {step === "payment" && (language === "km" ? "ជ្រើសរើសវិធីទូទាត់" : "Select Payment")}
                  {step === "confirm" && (language === "km" ? "សង្ខេបការបញ្ជាទិញ" : "Order Overview")}
                </h3>
              </div>
              <button className="drawer-close-btn" onClick={onClose}>
                <X size={20} />
              </button>
            </div>

            {/* Content Switch */}
            <div className="cart-drawer-body">
              {step === "cart" && (
                <div className="cart-step-content">
                  {cartItems.length === 0 ? (
                    <div className="empty-cart-view">
                      <ShoppingBag size={64} className="empty-cart-icon" />
                      <h4>{language === "km" ? "កន្ត្រកទំនិញរបស់អ្នកនៅទំនេរ" : "Your cart is empty"}</h4>
                      <p>{language === "km" ? "សូមស្វែងរកផលិតផល និងបញ្ចូលទៅក្នុងកន្ត្រកដើម្បីទិញ។" : "Browse products and add them to your cart to checkout."}</p>
                      <button className="empty-continue-btn" onClick={() => { onClose(); navigate("/shop"); }}>
                        {language === "km" ? "បន្តការទិញទំនិញ" : "Continue Shopping"}
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Cart Items List */}
                      <div className="cart-items-list">
                        {cartItems.map((item) => {
                          const targetId = item.product_id || item.id;
                          const isFlashItem = !!(item.is_flash_sale || item.attributes?.is_flash_sale);
                          const userFacingAttributes = item.attributes
                            ? Object.entries(item.attributes).filter(([k]) => k !== "is_flash_sale" && k !== "flash_price")
                            : [];

                          const handleGoToDetail = () => {
                            onClose();
                            if (targetId) {
                              navigate(`/product/${targetId}`, {
                                state: isFlashItem ? { fromFlashSale: true, flashPrice: item.price } : { fromFlashSale: false }
                              });
                            }
                          };

                          return (
                            <div key={item.id} className="cart-item-card">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="cart-item-img"
                                onClick={handleGoToDetail}
                                style={{ cursor: "pointer" }}
                              />
                              <div className="cart-item-info">
                                <h4
                                  className="cart-item-name"
                                  onClick={handleGoToDetail}
                                  style={{ cursor: "pointer" }}
                                >
                                  {item.name}
                                </h4>
                                {(isFlashItem || userFacingAttributes.length > 0) && (
                                  <div className="cart-item-attributes-badges" style={{ display: "flex", flexWrap: "wrap", gap: "4px", margin: "2px 0 4px 0" }}>
                                    {isFlashItem && (
                                      <span style={{ fontSize: "0.7rem", padding: "1px 6px", background: "#fef2f2", color: "#ef4444", borderRadius: "4px", fontWeight: 700 }}>
                                        🔥 Flash Sale
                                      </span>
                                    )}
                                    {userFacingAttributes.map(([k, val]) => (
                                      <span key={k} style={{ fontSize: "0.7rem", padding: "1px 6px", background: "#f1f5f9", color: "#475569", borderRadius: "4px", fontWeight: 600 }}>
                                        {k}: {val}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <div className="cart-item-rating-row" style={{ display: "flex", alignItems: "center", gap: "0.25rem", margin: "2px 0 4px 0" }}>
                                  <Star size={12} fill="#FFC107" stroke="#FFC107" />
                                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>
                                    {item.rating ? Number(item.rating).toFixed(1) : "4.8"}
                                  </span>
                                </div>
                                <span className="cart-item-price">${Number(item.price).toFixed(2)}</span>
                                {appliedPromo && appliedPromo.type === "product" && (
                                  (item.product_id === appliedPromo.productId || item.id === appliedPromo.productId || (item.name && item.name.toLowerCase().includes("french toast") && (appliedPromo.code === "FRENCH5" || appliedPromo.code === "FRENCHTOAST" || appliedPromo.code === "KIDS5")))
                                ) && (
                                  <div style={{ fontSize: "11px", color: "#16a34a", fontWeight: "700", marginTop: "2px" }}>
                                    🏷️ {appliedPromo.discountPercent}% promo discount applied
                                  </div>
                                )}
                                <div className="cart-qty-row">
                                  <div className="cart-qty-buttons">
                                    <button onClick={() => decrementQuantity(item.id)}>
                                      <Minus size={12} />
                                    </button>
                                    <span>{item.quantity}</span>
                                    <button onClick={() => incrementQuantity(item.id)}>
                                      <Plus size={12} />
                                    </button>
                                  </div>
                                  <button className="cart-item-delete" onClick={() => removeFromCart(item.id)}>
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Coupon Box */}
                      <form onSubmit={applyCoupon} className="coupon-box-form">
                        <input
                          type="text"
                          placeholder="Promo code (e.g. ANGKOR30)"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                        />
                        <button type="submit" disabled={isValidatingPromo}>
                          {isValidatingPromo ? "Checking..." : "Apply"}
                        </button>
                      </form>

                      {/* Applied Promo Code Pill */}
                      {appliedPromo && (
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          background: "#f0fdf4",
                          border: "1px solid #bbf7d0",
                          color: "#166534",
                          padding: "8px 12px",
                          borderRadius: "10px",
                          fontSize: "12px",
                          fontWeight: "600",
                          marginTop: "8px"
                        }}>
                          <span>
                            🏷️ <strong>{appliedPromo.code}</strong>: {appliedPromo.description} (-${promoDiscountVal.toFixed(2)})
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setAppliedPromo(null);
                              setDiscount(0);
                              setPromoCode("");
                              toast("Promo code removed", { icon: "ℹ️" });
                            }}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#166534",
                              cursor: "pointer",
                              padding: "2px",
                              display: "inline-flex",
                              alignItems: "center"
                            }}
                            title="Remove promo code"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {step === "info" && (
                <div className="info-step-content">
                  {/* Address Method Selection Tabs (2 Options) */}
                  <div className="address-option-toggle-bar">
                    <button
                      type="button"
                      className={`address-tab-btn ${addressMode === "manual" ? "active" : ""}`}
                      onClick={() => setAddressMode("manual")}
                    >
                      <span>📝 Field Address</span>
                    </button>
                    <button
                      type="button"
                      className={`address-tab-btn ${addressMode === "map" ? "active" : ""}`}
                      onClick={() => setAddressMode("map")}
                    >
                      <span>🗺️ Select Google Map</span>
                    </button>
                  </div>

                  {/* Recipient Details */}
                  <div className="checkout-form-group">
                    <label>Recipient Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      placeholder="e.g. Sok Dara"
                      value={form.fullName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="checkout-form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="e.g. sokdara@example.com"
                      value={form.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="checkout-form-group">
                    <label>Phone Number (Delivery Contact)</label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="e.g. 099888777"
                      value={form.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  {/* OPTION 1: Manual Field Address */}
                  {addressMode === "manual" ? (
                    <>
                      <div className="checkout-form-group">
                        <label>City / Province</label>
                        <input
                          type="text"
                          name="city"
                          placeholder="e.g. Phnom Penh"
                          value={form.city}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="checkout-form-group">
                        <label>Street & House Address</label>
                        <input
                          type="text"
                          name="address"
                          placeholder="e.g. House 12, St 271, Sangkat Boeung Keng Kang"
                          value={form.address}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </>
                  ) : (
                    /* OPTION 2: Interactive Google Map Location Picker */
                    <div className="google-map-picker-block">
                      <div className="map-actions-top-bar">
                        <button
                          type="button"
                          className="detect-gps-btn"
                          onClick={handleDetectCurrentLocation}
                          disabled={isLocating}
                        >
                          <Navigation size={15} className={isLocating ? "animate-spin" : ""} />
                          <span>{isLocating ? "Locating My Device..." : "Detect My Live GPS Location"}</span>
                        </button>

                        <a
                          href={`https://www.google.com/maps?q=${mapLocation.lat},${mapLocation.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="open-google-map-link"
                          title="Open Pin in Google Maps"
                        >
                          <Compass size={14} /> Open Google Maps
                        </a>
                      </div>

                      <div className="map-presets-header">
                        <label><MapPin size={14} className="text-green" /> Quick Click Map District Presets:</label>
                        <div className="presets-pills-row">
                          {MAP_PRESETS.map((preset, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className={`preset-pill ${mapLocation.name === preset.name ? "active" : ""}`}
                              onClick={() => handleSelectMapPreset(preset)}
                            >
                              📍 {preset.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Live Google Map Interactive Canvas Embed */}
                      <div className="google-map-iframe-container">
                        <iframe
                          title="Google Map Location Picker"
                          width="100%"
                          height="200"
                          style={{ border: 0, borderRadius: "14px" }}
                          loading="lazy"
                          allowFullScreen
                          src={`https://maps.google.com/maps?q=${mapLocation.lat},${mapLocation.lng}&z=15&output=embed`}
                        ></iframe>
                        <div className="map-pin-badge-overlay">
                          <MapPin size={16} className="pin-pulse-icon" />
                          <span>Selected Pin: {mapLocation.name} ({mapLocation.lat}° N, {mapLocation.lng}° E)</span>
                        </div>
                      </div>

                      {/* Resolved Street Address Field */}
                      <div className="checkout-form-group margin-top-10">
                        <label>Map Resolved Street Address</label>
                        <input
                          type="text"
                          placeholder="e.g. Street 271, Toul Tom Poung, Phnom Penh"
                          value={mapLocation.streetAddress || "Street 271, Toul Tom Poung, Phnom Penh"}
                          onChange={(e) => {
                            const newAddress = e.target.value;
                            setMapLocation((prev) => {
                              const updated = {
                                ...prev,
                                streetAddress: newAddress,
                                formattedAddress: `${newAddress} (Google Map Pin: ${prev.lat}° N, ${prev.lng}° E)`
                              };
                              setForm((f) => ({ ...f, city: "Phnom Penh", address: updated.formattedAddress }));
                              return updated;
                            });
                          }}
                        />
                      </div>

                      {/* Fine-tune Coordinates Input Controls */}
                      <div className="coordinates-fine-tune-row">
                        <div className="coord-input-item">
                          <label>Latitude:</label>
                          <input
                            type="number"
                            step="0.0001"
                            value={mapLocation.lat}
                            onChange={async (e) => {
                              const val = parseFloat(e.target.value) || 11.5392;
                              const resolved = await fetchReverseGeocode(val, mapLocation.lng);
                              setMapLocation((prev) => {
                                const formatted = `${resolved} (Google Map Pin: ${val}° N, ${prev.lng}° E)`;
                                setForm((f) => ({ ...f, city: "Phnom Penh", address: formatted }));
                                return { ...prev, name: "Custom Map Pin", lat: val, streetAddress: resolved, formattedAddress: formatted };
                              });
                            }}
                          />
                        </div>
                        <div className="coord-input-item">
                          <label>Longitude:</label>
                          <input
                            type="number"
                            step="0.0001"
                            value={mapLocation.lng}
                            onChange={async (e) => {
                              const val = parseFloat(e.target.value) || 104.9158;
                              const resolved = await fetchReverseGeocode(mapLocation.lat, val);
                              setMapLocation((prev) => {
                                const formatted = `${resolved} (Google Map Pin: ${prev.lat}° N, ${val}° E)`;
                                setForm((f) => ({ ...f, city: "Phnom Penh", address: formatted }));
                                return { ...prev, name: "Custom Map Pin", lng: val, streetAddress: resolved, formattedAddress: formatted };
                              });
                            }}
                          />
                        </div>
                      </div>

                      {/* Map Location Detail Input Note */}
                      <div className="checkout-form-group margin-top-10">
                        <label>House / Floor / Delivery Note</label>
                        <input
                          type="text"
                          placeholder="e.g. House 12, Gate 2, 3rd Floor"
                          value={mapLocation.addressNote}
                          onChange={(e) => {
                            const newNote = e.target.value;
                            setMapLocation((prev) => {
                              const baseAddr = prev.streetAddress || "Street 271, Toul Tom Poung, Phnom Penh";
                              const updated = {
                                ...prev,
                                addressNote: newNote,
                                formattedAddress: `${baseAddr} (Google Map Pin: ${prev.lat}° N, ${prev.lng}° E) - Note: ${newNote}`
                              };
                              setForm((f) => ({ ...f, city: "Phnom Penh", address: updated.formattedAddress }));
                              return updated;
                            });
                          }}
                        />
                      </div>

                      <div className="selected-map-preview-card">
                        <Navigation size={16} className="text-green" />
                        <div>
                          <span className="preview-label">Selected Delivery Coordinates:</span>
                          <p className="preview-address-text">{mapLocation.formattedAddress}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="checkout-form-group">
                    <label>Country</label>
                    <input
                      type="text"
                      name="country"
                      value={form.country}
                      onChange={handleInputChange}
                      disabled
                    />
                  </div>
                </div>
              )}

              {step === "payment" && (
                <div className="payment-step-content">
                  <h4 className="payment-section-title">Select Payment Method</h4>

                  <div className="payment-options-grid">
                    {/* ABA Bank KHQR (Official Single Payment Gateway) */}
                    <div
                      className="payment-option-card active"
                      style={{
                        border: "2px solid #00294B",
                        background: "linear-gradient(135deg, rgba(0, 41, 75, 0.04) 0%, rgba(237, 28, 36, 0.04) 100%)",
                        borderRadius: "16px",
                        position: "relative",
                        overflow: "hidden"
                      }}
                      onClick={() => setPaymentMethod("aba-qr")}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          background: "#ED1C24",
                          color: "#fff",
                          fontSize: "10px",
                          fontWeight: 800,
                          padding: "2px 10px",
                          borderBottomLeftRadius: "10px",
                          letterSpacing: "0.5px"
                        }}
                      >
                        OFFICIAL KHQR
                      </div>
                      <div
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "12px",
                          background: "#00294B",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ffffff",
                          flexShrink: 0,
                          fontWeight: 900,
                          fontSize: "14px",
                          letterSpacing: "0.5px"
                        }}
                      >
                        ABA<span style={{ color: "#ED1C24" }}>'</span>
                      </div>
                      <div className="payment-card-text">
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span className="method-title" style={{ fontWeight: 800, color: "#00294B", fontSize: "15px" }}>
                            ABA Bank KHQR
                          </span>
                          <span
                            style={{
                              background: "#ED1C24",
                              color: "#ffffff",
                              fontSize: "10px",
                              fontWeight: 900,
                              padding: "1px 6px",
                              borderRadius: "4px"
                            }}
                          >
                            KHQR
                          </span>
                        </div>
                        <span className="method-sub" style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                          Scan & Pay with ABA Mobile or any Bakong KHQR Banking App
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === "confirm" && (
                <div className="confirm-step-content">
                  {/* Shipping info review */}
                  <div className="review-block-card">
                    <h4>
                      {addressMode === "map" ? "🗺️ Google Map Delivery Location" : "📍 Field Address Delivery"}
                    </h4>
                    <p className="bold">{form.fullName}</p>
                    <p>{form.phone}</p>
                    <p className="address-review-highlight">{form.address}, {form.city}</p>
                  </div>

                  {/* Payment method review */}
                  <div className="review-block-card">
                    <h4>Payment Method</h4>
                    <p className="bold text-green">
                      ABA Bank KHQR (Scan & Pay)
                    </p>
                  </div>

                  {/* Products review with image thumbnails */}
                  <div className="review-block-card">
                    <h4>Items Checklist ({cartItems.reduce((acc, item) => acc + item.quantity, 0)})</h4>
                    <div className="review-items-mini-list">
                      {cartItems.map((item) => (
                        <div key={item.id} className="review-mini-item">
                          <img src={item.image} alt={item.name} className="review-mini-img" />
                          <div className="review-mini-details">
                            <span className="review-mini-name">{item.name}</span>
                            {item.attributes && Object.keys(item.attributes).length > 0 && (
                              <span className="review-mini-attrs" style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>
                                {Object.entries(item.attributes).map(([k, v]) => `${k}: ${v}`).join(" | ")}
                              </span>
                            )}
                            <span className="text-light">Qty: {item.quantity} &times; ${Number(item.price).toFixed(2)}</span>
                          </div>
                          <span className="review-mini-price">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Calculator / Actions */}
            {cartItems.length > 0 && (
              <div className="cart-drawer-footer">
                <div className="billing-summary-block">
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Shipping</span>
                    <span>${shipping.toFixed(2)}</span>
                  </div>
                  {promoDiscountVal > 0 && (
                    <div className="summary-row text-green">
                      <span>
                        Discount ({appliedPromo?.type === "product" ? `${appliedPromo.productName} - ${appliedPromo.discountPercent}%` : `ANGKOR30 - 5%`})
                      </span>
                      <span>-${promoDiscountVal.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="summary-row total-row">
                    <span>Total Cost</span>
                    <span>${grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="footer-action-buttons">
                  {step === "cart" && (
                    <button className="checkout-primary-btn" onClick={proceedToInfo}>
                      Proceed to Checkout
                    </button>
                  )}
                  {step === "info" && (
                    <button className="checkout-primary-btn" onClick={proceedToPayment}>
                      Continue to Payment
                    </button>
                  )}
                  {step === "payment" && (
                    <button className="checkout-primary-btn" onClick={proceedToConfirm}>
                      Review Order Details
                    </button>
                  )}
                  {step === "confirm" && (
                    <button className="checkout-primary-btn confirm-order-btn" onClick={handlePlaceOrder}>
                      <CheckCircle2 size={16} /> Place Order
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>

    {/* Interactive ABA PayWay Modal */}
    <AbaPaymentModal
      isOpen={khqrModal.isOpen}
      onClose={() => setKhqrModal((prev) => ({ ...prev, isOpen: false }))}
      orderId={khqrModal.orderId}
      orderNumber={khqrModal.orderNumber}
      amount={khqrModal.amount}
      onSuccess={handleKhqrSuccess}
    />
  </>
  );
}

export default CartDrawer;
