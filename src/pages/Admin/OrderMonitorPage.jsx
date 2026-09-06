import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  FaTv,
  FaBoxes,
  FaCheckCircle,
  FaClock,
  FaTruck,
  FaVolumeUp,
  FaVolumeMute,
  FaSync,
  FaExpand,
  FaCompress,
  FaSearch,
  FaFilter,
  FaPrint,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaUser,
  FaBoxOpen,
  FaPlay,
  FaCheck,
  FaArrowRight,
  FaExclamationTriangle,
  FaBarcode,
  FaLayerGroup,
  FaThLarge,
  FaListUl,
  FaClipboardList,
  FaTimes,
  FaInfoCircle,
  FaCopy,
  FaCheckDouble,
  FaSun,
  FaMoon,
  FaMotorcycle,
  FaShippingFast,
  FaIdCard,
  FaStickyNote,
  FaChevronRight,
  FaGripVertical,
  FaSpinner
} from "react-icons/fa";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { getAdminOrdersApi, updateOrderStatusApi, dispatchOrderDeliveryApi } from "../../services/orderService";
import { useTranslation } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { usePermissions } from "../../hooks/usePermissions.jsx";
import Modal from "../../components/Modal";
import "./style/OrderMonitorPage.css";

// Web Audio API context singleton with auto-resume support
let globalAudioCtx = null;
const getAudioContext = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    if (!globalAudioCtx || globalAudioCtx.state === "closed") {
      globalAudioCtx = new AudioContext();
    }
    if (globalAudioCtx.state === "suspended") {
      globalAudioCtx.resume().catch((err) => console.warn("AudioContext resume error:", err));
    }
    return globalAudioCtx;
  } catch (err) {
    console.warn("AudioContext init error:", err);
    return null;
  }
};

// Synthesize pleasant, crisp, energetic chimes with Web Audio API
const playSoundEffect = (type = "chime") => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    if (type === "new_order") {
      // Energetic, crystal-clear 3-note order bell chime
      const now = ctx.currentTime;

      // Note 1: D5 (587.33 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2: A5 (880 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0.4, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.48);

      // Note 3: D6 (1174.66 Hz) with high overtone shimmer
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = "triangle";
      osc3.frequency.setValueAtTime(1174.66, now + 0.24);
      gain3.gain.setValueAtTime(0.45, now + 0.24);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.24);
      osc3.stop(now + 0.75);

      // Shimmer overtone (1760 Hz)
      const osc4 = ctx.createOscillator();
      const gain4 = ctx.createGain();
      osc4.type = "sine";
      osc4.frequency.setValueAtTime(1760, now + 0.25);
      gain4.gain.setValueAtTime(0.18, now + 0.25);
      gain4.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc4.connect(gain4);
      gain4.connect(ctx.destination);
      osc4.start(now + 0.25);
      osc4.stop(now + 0.6);
    } else if (type === "complete") {
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.2, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.35);
      });
    } else {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(660, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    }
  } catch (err) {
    console.warn("Audio playback not permitted or unavailable:", err);
  }
};

// Popular Carriers for Cambodia
const DELIVERY_CARRIERS = [
  { id: "grab", name: "Grab Express 🟢", icon: "🛵" },
  { id: "nham24", name: "NHAM24 Delivery 🔴", icon: "🛵" },
  { id: "foodpanda", name: "FoodPanda Express 🟣", icon: "🐼" },
  { id: "in_house", name: "In-House Mall Courier 🛍️", icon: "🚚" },
  { id: "jt", name: "J&T Express 🟡", icon: "📦" },
  { id: "virak_buntham", name: "Virak Buntham (VET) 🔵", icon: "🚌" },
  { id: "capitol", name: "Capitol Tour & Transport 📦", icon: "🚚" },
  { id: "other", name: "Other / Private Taxi 🚕", icon: "🚗" }
];

// Odoo Pipeline Stages Definition
const ODOO_STAGES = [
  { key: "pending", labelEn: "1. New / Pending", labelKm: "១. ការបញ្ជាទិញថ្មី", color: "#3b82f6" },
  { key: "processing", labelEn: "2. In Packing", labelKm: "២. កំពុងរៀបចំ", color: "#f59e0b" },
  { key: "ready", labelEn: "3. Ready / Picked", labelKm: "៣. រួចរាល់សម្រាប់ដឹក", color: "#10b981" },
  { key: "shipped", labelEn: "4. Out for Delivery", labelKm: "៤. កំពុងដឹកជញ្ជូន", color: "#8b5cf6" },
  { key: "completed", labelEn: "5. Delivered", labelKm: "៥. បានប្រគល់ជោគជ័យ", color: "#059669" }
];

export default function OrderMonitorPage() {
  const { isKhmer } = useTranslation();
  const { can } = usePermissions();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [autoRefreshSecs, setAutoRefreshSecs] = useState(20);
  const [countdown, setCountdown] = useState(20);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem("angkor_prep_sound") !== "false";
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState("kanban"); // 'kanban' | 'grid' | 'batch'
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusTab, setSelectedStatusTab] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all"); // 'all' | 'urgent' | 'normal'
  const [mobileKanbanTab, setMobileKanbanTab] = useState("all");

  // Selected Order for detail modal or printing
  const [activeOrder, setActiveOrder] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [printOrder, setPrintOrder] = useState(null);

  // Delivery Dispatch Dialog State
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [targetDeliveryOrder, setTargetDeliveryOrder] = useState(null);
  const [deliveryForm, setDeliveryForm] = useState({
    carrier: "Grab Express 🟢",
    driver_name: "",
    driver_phone: "",
    tracking_number: "",
    estimated_time: "15-30 mins",
    notes: ""
  });
  const [isDispatching, setIsDispatching] = useState(false);

  // Local checklist tracking for packing verification per order
  const [packedItems, setPackedItems] = useState(() => {
    try {
      const saved = localStorage.getItem("angkor_packed_checklist");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Delivery Information Persistence Map: { [orderId]: { carrier, driver_name, driver_phone, tracking_number, notes } }
  const [deliveryInfoMap, setDeliveryInfoMap] = useState(() => {
    try {
      const saved = localStorage.getItem("angkor_delivery_info_map");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Drag & Drop State (Odoo style)
  const [draggedOrder, setDraggedOrder] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const knownOrderIdsRef = useRef(new Set());
  const isInitialLoadRef = useRef(true);
  const monitorContainerRef = useRef(null);

  // Unlock audio on first user gesture
  useEffect(() => {
    const handleGesture = () => {
      const ctx = getAudioContext();
      if (ctx && ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
    };
    window.addEventListener("click", handleGesture, { once: true });
    window.addEventListener("keydown", handleGesture, { once: true });
    return () => {
      window.removeEventListener("click", handleGesture);
      window.removeEventListener("keydown", handleGesture);
    };
  }, []);

  // Save checklist in localStorage
  useEffect(() => {
    try {
      localStorage.setItem("angkor_packed_checklist", JSON.stringify(packedItems));
    } catch (e) {
      console.warn("Failed to persist packed checklist:", e);
    }
  }, [packedItems]);

  // Save delivery info map in localStorage
  useEffect(() => {
    try {
      localStorage.setItem("angkor_delivery_info_map", JSON.stringify(deliveryInfoMap));
    } catch (e) {
      console.warn("Failed to persist delivery info map:", e);
    }
  }, [deliveryInfoMap]);

  // Toggle sound setting
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("angkor_prep_sound", String(next));
    if (next) playSoundEffect("chime");
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch((err) => {
        console.warn("Fullscreen request error:", err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false));
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Fetch orders from API and merge with customer local orders
  const fetchOrders = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      // 1. Fetch API orders
      let apiOrders = [];
      try {
        const res = await getAdminOrdersApi();
        apiOrders = res?.data || (Array.isArray(res) ? res : []);
      } catch (apiErr) {
        console.warn("getAdminOrdersApi notice:", apiErr);
      }

      // 2. Fetch localStorage customer orders
      let localOrders = [];
      try {
        const saved = localStorage.getItem("orders");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) localOrders = parsed;
        }
      } catch (locErr) {
        console.warn("localStorage orders parse notice:", locErr);
      }

      // 3. Normalize & Merge orders
      const normalizedMap = new Map();

      // Process API orders first
      apiOrders.forEach((o, idx) => {
        const key = String(o.id || o.order_number);
        const cleanOrderNumber = (o.order_number && String(o.order_number).startsWith("OR-"))
          ? o.order_number
          : (o.order_number && String(o.order_number).startsWith("#OR-"))
          ? o.order_number.replace(/^#/, "")
          : (o.order_number && !String(o.order_number).includes("-") && !isNaN(Number(o.order_number)))
          ? `OR-${String(o.order_number).padStart(5, "0")}`
          : `OR-${String(idx + 1).padStart(5, "0")}`;

        normalizedMap.set(key, {
          ...o,
          id: o.id,
          order_number: cleanOrderNumber,
          total_amount: o.total_amount || o.subtotal_amount || 0,
          status: o.status || "pending",
          items: o.items || o.products || [],
          created_at: o.created_at || o.createdAt || new Date().toISOString()
        });
      });

      // Merge local orders (or add if not present)
      localOrders.forEach((lo, lIdx) => {
        const rawKey = String(lo.rawId || lo.id || "");
        let matchedKey = null;
        for (const [k, existing] of normalizedMap.entries()) {
          if (k === rawKey || existing.rawId === rawKey || String(existing.id) === String(lo.id) || String(existing.order_number) === String(lo.id) || String(existing.order_number) === String(lo.order_number)) {
            matchedKey = k;
            break;
          }
        }

        const localOrderNumber = (lo.order_number && String(lo.order_number).startsWith("OR-"))
          ? lo.order_number
          : (lo.order_number && String(lo.order_number).startsWith("#OR-"))
          ? lo.order_number.replace(/^#/, "")
          : (lo.id && String(lo.id).startsWith("OR-"))
          ? lo.id
          : (lo.id && String(lo.id).startsWith("#OR-"))
          ? lo.id.replace(/^#/, "")
          : `OR-${String(apiOrders.length + lIdx + 1).padStart(5, "0")}`;

        const normalizedLocal = {
          id: lo.id || lo.rawId || `LOCAL-${Date.now()}`,
          rawId: lo.rawId,
          order_number: localOrderNumber,
          user: {
            name: lo.shippingInfo?.fullName || "Customer",
            phone: lo.shippingInfo?.phone || "",
            email: lo.shippingInfo?.email || ""
          },
          shipping_address: lo.shippingInfo?.address || "Phnom Penh",
          contact_phone: lo.shippingInfo?.phone || "",
          total_amount: lo.total || lo.total_amount || 0,
          status: lo.status || "pending",
          paymentMethod: lo.paymentMethod || "COD",
          items: (lo.products || lo.items || []).map((it, idx) => ({
            id: it.id || `item-${idx}`,
            product_id: it.product_id || it.id,
            name: it.name || it.product?.name || "Product Item",
            price: it.price || it.product?.price || 0,
            quantity: it.quantity || 1,
            image: it.image || it.product?.images?.[0]?.image_url || it.product?.image_url || it.product?.image || ""
          })),
          created_at: lo.date || new Date().toISOString()
        };

        if (matchedKey) {
          const existing = normalizedMap.get(matchedKey);
          normalizedMap.set(matchedKey, {
            ...existing,
            items: existing.items?.length ? existing.items : normalizedLocal.items,
            shippingInfo: lo.shippingInfo || existing.shippingInfo,
            paymentMethod: lo.paymentMethod || existing.paymentMethod
          });
        } else {
          normalizedMap.set(normalizedLocal.id, normalizedLocal);
        }
      });

      const mergedList = Array.from(normalizedMap.values()).sort((a, b) => {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      });

      // 4. Check for newly arrived customer orders
      let hasNewOrder = false;
      let newestOrderFound = null;

      mergedList.forEach((ord) => {
        const orderKey = String(ord.id);
        if (!knownOrderIdsRef.current.has(orderKey)) {
          if (!isInitialLoadRef.current) {
            hasNewOrder = true;
            if (!newestOrderFound) newestOrderFound = ord;
          }
          knownOrderIdsRef.current.add(orderKey);
        }
      });

      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
      } else if (hasNewOrder && soundEnabled) {
        playSoundEffect("new_order");
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "info",
          title: isKhmer ? "🔔 មានការបញ្ជាទិញថ្មីពីអតិថិជន!" : "🔔 New Customer Order Received!",
          text: newestOrderFound ? `${String(newestOrderFound.order_number || "OR-00001").startsWith("#") ? newestOrderFound.order_number : `#${newestOrderFound.order_number || "OR-00001"}`} - $${parseFloat(newestOrderFound.total_amount || 0).toFixed(2)}` : "",
          showConfirmButton: false,
          timer: 4000
        });
      }

      setOrders(mergedList);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Failed to fetch monitor orders:", err);
      if (!isSilent) {
        Swal.fire({
          icon: "error",
          title: isKhmer ? "កំហុសទិន្នន័យ" : "Error Loading Orders",
          text: err.message || "Failed to sync order data"
        });
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [soundEnabled, isKhmer]);

  // Initial load
  useEffect(() => {
    fetchOrders(false);
  }, [fetchOrders]);

  // Real-time event listeners across tabs and local components
  useEffect(() => {
    let channel = null;
    try {
      if (typeof BroadcastChannel !== "undefined") {
        channel = new BroadcastChannel("angkor_orders_channel");
        channel.onmessage = (event) => {
          if (event.data?.type === "NEW_ORDER") {
            fetchOrders(true);
          }
        };
      }
    } catch (e) {
      console.warn("BroadcastChannel notice:", e);
    }

    const handleCustomNewOrder = () => {
      fetchOrders(true);
    };
    window.addEventListener("new-customer-order", handleCustomNewOrder);
    window.addEventListener("orders:refresh", handleCustomNewOrder);

    const handleStorage = (e) => {
      if (e.key === "orders") {
        fetchOrders(true);
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      if (channel) {
        try { channel.close(); } catch (e) {}
      }
      window.removeEventListener("new-customer-order", handleCustomNewOrder);
      window.removeEventListener("orders:refresh", handleCustomNewOrder);
      window.removeEventListener("storage", handleStorage);
    };
  }, [fetchOrders]);

  // Auto-refresh timer loop
  useEffect(() => {
    if (autoRefreshSecs === 0) return;
    setCountdown(autoRefreshSecs);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchOrders(true);
          return autoRefreshSecs;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefreshSecs, fetchOrders]);

  // Toggle single item packed status
  const toggleItemPacked = (orderId, itemId, e) => {
    if (e) e.stopPropagation();
    if (soundEnabled) playSoundEffect("tap");

    setPackedItems((prev) => {
      const orderPack = prev[orderId] || {};
      const nextOrderPack = {
        ...orderPack,
        [itemId]: !orderPack[itemId]
      };
      return {
        ...prev,
        [orderId]: nextOrderPack
      };
    });
  };

  // Pack all items in an order
  const packAllItems = (order, e) => {
    if (e) e.stopPropagation();
    if (soundEnabled) playSoundEffect("complete");

    const orderId = order.id;
    const items = order.items || [];
    const allPackedMap = {};
    items.forEach((item, index) => {
      const itemId = item.id || `${item.product_id || index}`;
      allPackedMap[itemId] = true;
    });

    setPackedItems((prev) => ({
      ...prev,
      [orderId]: allPackedMap
    }));
  };

  // Calculate order packing progress (0 to 100)
  const getOrderPackingProgress = useCallback((order) => {
    const items = order.items || [];
    if (!items.length) return { count: 0, total: 0, percent: 100, isAllPacked: true };

    const orderPack = packedItems[order.id] || {};
    let packedCount = 0;

    items.forEach((item, index) => {
      const itemId = item.id || `${item.product_id || index}`;
      if (orderPack[itemId]) packedCount++;
    });

    const percent = Math.round((packedCount / items.length) * 100);
    return {
      count: packedCount,
      total: items.length,
      percent,
      isAllPacked: packedCount === items.length
    };
  }, [packedItems]);

  // Calculate elapsed time in minutes
  const getElapsedInfo = (createdAt) => {
    if (!createdAt) return { minutes: 0, text: "Just now", shortText: "Now", urgency: "normal" };
    const orderDate = new Date(createdAt);
    const now = new Date();
    const diffMs = Math.max(0, now - orderDate);
    const minutes = Math.floor(diffMs / (1000 * 60));

    let urgency = "normal"; // < 15m
    if (minutes >= 30) urgency = "urgent"; // > 30m
    else if (minutes >= 15) urgency = "warning"; // 15-30m

    let text = `${minutes}m ago`;
    let shortText = `${minutes}m`;

    if (minutes < 1) {
      text = isKhmer ? "ទើបតែមកដល់" : "Just now";
      shortText = isKhmer ? "ថ្មីៗ" : "Now";
    } else if (minutes < 60) {
      text = `${minutes}m ago`;
      shortText = `${minutes}m`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const remainingMins = minutes % 60;
      text = remainingMins > 0 ? `${hours}h ${remainingMins}m ago` : `${hours}h ago`;
      shortText = `${hours}h`;
    } else {
      const days = Math.floor(minutes / 1440);
      text = `${days}d ago`;
      shortText = `${days}d`;
    }

    return { minutes, text, shortText, urgency };
  };

  // Open the delivery dispatch form modal
  const promptDeliveryInfoModal = (order, e) => {
    if (e) e.stopPropagation();
    const existing = deliveryInfoMap[order.id] || {};
    setTargetDeliveryOrder(order);
    setDeliveryForm({
      carrier: existing.carrier || "Grab Express 🟢",
      driver_name: existing.driver_name || "",
      driver_phone: existing.driver_phone || "",
      tracking_number: existing.tracking_number || `TRK-${order.id}-${Math.floor(1000 + Math.random() * 9000)}`,
      estimated_time: existing.estimated_time || "15-30 mins",
      notes: existing.notes || ""
    });
    setIsDeliveryModalOpen(true);
  };

  // Submit delivery dispatch form (calls API with full delivery info)
  const handleConfirmDeliveryDispatch = async (e) => {
    e.preventDefault();
    if (!targetDeliveryOrder || isDispatching) return;

    if (!deliveryForm.driver_name.trim()) {
      Swal.fire(isKhmer ? "សូមបំពេញព័ត៌មាន" : "Required Field", isKhmer ? "សូមបញ្ចូលឈ្មោះអ្នកដឹកជញ្ជូន (Driver Name)" : "Please enter Driver Name", "warning");
      return;
    }

    setIsDispatching(true);
    try {
      const payload = {
        status: "shipped",
        delivery_carrier: deliveryForm.carrier,
        delivery_driver_name: deliveryForm.driver_name,
        delivery_driver_phone: deliveryForm.driver_phone,
        tracking_number: deliveryForm.tracking_number,
        delivery_notes: deliveryForm.notes,
        estimated_delivery_time: deliveryForm.estimated_time
      };

      try {
        await dispatchOrderDeliveryApi(targetDeliveryOrder.id, payload);
      } catch (apiErr) {
        console.warn("dispatchOrderDeliveryApi notice:", apiErr?.message);
      }

      // Save delivery details locally
      setDeliveryInfoMap((prev) => ({
        ...prev,
        [targetDeliveryOrder.id]: deliveryForm
      }));

      // Update local storage order if present
      try {
        const saved = localStorage.getItem("orders");
        if (saved) {
          const list = JSON.parse(saved);
          const updatedList = list.map((o) => {
            if (o.id === targetDeliveryOrder.id || o.rawId === targetDeliveryOrder.id || o.order_number === targetDeliveryOrder.id) {
              return { ...o, status: "shipped", deliveryInfo: payload };
            }
            return o;
          });
          localStorage.setItem("orders", JSON.stringify(updatedList));
        }
      } catch (locErr) {
        console.warn("Local storage update notice:", locErr);
      }

      if (soundEnabled) playSoundEffect("complete");

      // Update order state
      setOrders((prev) =>
        prev.map((o) => (o.id === targetDeliveryOrder.id ? { ...o, status: "shipped", ...payload } : o))
      );

      if (activeOrder && activeOrder.id === targetDeliveryOrder.id) {
        setActiveOrder((prev) => ({ ...prev, status: "shipped", ...payload }));
      }

      window.dispatchEvent(new CustomEvent("orders:refresh"));

      setIsDeliveryModalOpen(false);

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: isKhmer
          ? `ការបញ្ជាទិញ #${targetDeliveryOrder.id} បានប្រគល់ជូន ${deliveryForm.driver_name} (${deliveryForm.carrier})`
          : `Order #${targetDeliveryOrder.id} dispatched with ${deliveryForm.driver_name}`,
        showConfirmButton: false,
        timer: 2500
      });
    } catch (err) {
      console.error("Failed to dispatch order:", err);
      Swal.fire("Error", err.message || "Failed to dispatch order", "error");
    } finally {
      setIsDispatching(false);
    }
  };

  // General Status Update (Odoo Pipeline stage click, dropdown select, or button click)
  const handleUpdateStatus = async (orderId, targetStatus, orderNumber, e) => {
    if (e) e.stopPropagation();

    const cleanId = String(orderId || "").replace(/^#/, "").trim();

    // If moving to 'shipped' (Out for Delivery), trigger Delivery Dispatch Modal
    if (targetStatus === "shipped" || targetStatus === "delivering") {
      const foundOrder = orders.find((o) => {
        const oClean = String(o.id || o.rawId || o.order_number || "").replace(/^#/, "").trim();
        return oClean === cleanId || String(o.id) === String(orderId) || String(o.rawId) === String(orderId);
      }) || activeOrder;
      if (foundOrder) {
        promptDeliveryInfoModal(foundOrder, e);
        return;
      }
    }

    // 1. Instant Optimistic UI Update (immediate visual card movement)
    setOrders((prev) =>
      prev.map((o) => {
        const oClean = String(o.id || o.rawId || o.order_number || "").replace(/^#/, "").trim();
        if (oClean === cleanId || String(o.id) === String(orderId) || String(o.rawId) === String(orderId)) {
          return { ...o, status: targetStatus };
        }
        return o;
      })
    );

    if (activeOrder) {
      const activeClean = String(activeOrder.id || "").replace(/^#/, "").trim();
      if (activeClean === cleanId || String(activeOrder.id) === String(orderId)) {
        setActiveOrder((prev) => ({ ...prev, status: targetStatus }));
      }
    }

    if (soundEnabled) playSoundEffect("complete");

    try {
      // 2. Update via Backend API
      try {
        await updateOrderStatusApi(cleanId, { status: targetStatus });
      } catch (apiErr) {
        console.warn("updateOrderStatusApi notice:", apiErr?.message);
      }

      // 3. Update localStorage orders so auto-refresh maintains new status
      try {
        const saved = localStorage.getItem("orders");
        if (saved) {
          const list = JSON.parse(saved);
          const updatedList = list.map((o) => {
            const oClean = String(o.id || o.rawId || o.order_number || "").replace(/^#/, "").trim();
            if (oClean === cleanId || String(o.id) === String(orderId) || String(o.rawId) === String(orderId) || String(o.order_number) === String(orderId)) {
              return { ...o, status: targetStatus };
            }
            return o;
          });
          localStorage.setItem("orders", JSON.stringify(updatedList));
        }
      } catch (locErr) {
        console.warn("Local storage update notice:", locErr);
      }

      window.dispatchEvent(new CustomEvent("orders:refresh"));

      const toastOrderCode = (() => {
        const str = String(orderNumber || cleanId || "");
        if (str.startsWith("#OR-")) return str;
        if (str.startsWith("OR-")) return `#${str}`;
        if (!isNaN(Number(str)) && !str.includes("-")) return `#OR-${str.padStart(5, "0")}`;
        return "#OR-00001";
      })();

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: isKhmer 
          ? `ការបញ្ជាទិញ ${toastOrderCode} បានប្តូរទៅជា ${targetStatus.toUpperCase()}`
          : `Order ${toastOrderCode} updated to ${targetStatus.toUpperCase()}`,
        showConfirmButton: false,
        timer: 2000
      });
    } catch (err) {
      console.error("Failed to update status:", err);
      // Re-sync on failure
      fetchOrders(true);
      Swal.fire({
        icon: "error",
        title: isKhmer ? "មិនអាចកែប្រែបាន" : "Update Failed",
        text: err.message || "Failed to update order status"
      });
    }
  };

  // -------------------------------------------------------------
  // ODOO KANBAN DRAG & DROP HANDLERS
  // -------------------------------------------------------------
  const handleDragStart = (e, order) => {
    setDraggedOrder(order);
    e.dataTransfer.setData("text/plain", String(order.id));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, stageKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumn !== stageKey) {
      setDragOverColumn(stageKey);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStage) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (!draggedOrder) return;

    const orderId = draggedOrder.id;
    const currentStatus = (draggedOrder.status || "pending").toLowerCase();

    // Mapping target stage
    let backendStatus = targetStage;
    if (targetStage === "pending") backendStatus = "pending";
    else if (targetStage === "preparing") backendStatus = "processing";
    else if (targetStage === "ready") backendStatus = "ready";
    else if (targetStage === "delivering") backendStatus = "shipped";
    else if (targetStage === "completed") backendStatus = "completed";

    if (currentStatus === backendStatus) {
      setDraggedOrder(null);
      return;
    }

    if (backendStatus === "shipped") {
      promptDeliveryInfoModal(draggedOrder, e);
      setDraggedOrder(null);
      return;
    }

    await handleUpdateStatus(orderId, backendStatus, draggedOrder.order_number || orderId, e);
    setDraggedOrder(null);
  };

  // Copy text to clipboard helper
  const copyToClipboard = (text, label, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: `${label} ${isKhmer ? "បានចម្លងរួចរាល់" : "Copied to clipboard"}`,
      showConfirmButton: false,
      timer: 1500
    });
  };

  // Print single packing slip
  const handlePrintSlip = (order, e) => {
    if (e) e.stopPropagation();
    setPrintOrder(order);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const idMatch = String(ord.id || "").toLowerCase().includes(q);
        const nameMatch = String(ord.user?.name || "").toLowerCase().includes(q);
        const phoneMatch = String(ord.contact_phone || ord.user?.phone || "").toLowerCase().includes(q);
        const addrMatch = String(ord.shipping_address || "").toLowerCase().includes(q);
        const driverMatch = String(deliveryInfoMap[ord.id]?.driver_name || "").toLowerCase().includes(q);
        const trackingMatch = String(deliveryInfoMap[ord.id]?.tracking_number || "").toLowerCase().includes(q);
        if (!idMatch && !nameMatch && !phoneMatch && !addrMatch && !driverMatch && !trackingMatch) return false;
      }

      // Tab filter
      if (selectedStatusTab !== "all") {
        const st = (ord.status || "pending").toLowerCase();
        if (selectedStatusTab === "pending") {
          if (["processing", "preparing", "packing", "ready", "shipped", "delivering", "dispatched", "completed", "delivered", "cancelled"].includes(st)) return false;
        } else if (selectedStatusTab === "preparing") {
          if (!["processing", "preparing", "packing"].includes(st)) return false;
        } else if (selectedStatusTab === "ready") {
          if (st !== "ready") return false;
        } else if (selectedStatusTab === "delivering") {
          if (!["shipped", "delivering", "dispatched"].includes(st)) return false;
        } else if (selectedStatusTab === "completed") {
          if (!["completed", "delivered"].includes(st)) return false;
        }
      }

      // Urgency filter
      if (urgencyFilter !== "all") {
        const { urgency } = getElapsedInfo(ord.created_at);
        if (urgencyFilter === "urgent" && urgency !== "urgent") return false;
        if (urgencyFilter === "normal" && urgency === "urgent") return false;
      }

      return true;
    });
  }, [orders, searchQuery, selectedStatusTab, urgencyFilter, deliveryInfoMap]);

  // Stage Grouping for Kanban Board
  const kanbanColumns = useMemo(() => {
    const pendingList = [];
    const preparingList = [];
    const readyList = [];
    const deliveringList = [];
    const completedList = [];

    filteredOrders.forEach((order) => {
      const st = (order.status || "pending").toLowerCase();
      if (st === "processing" || st === "preparing" || st === "packing") {
        preparingList.push(order);
      } else if (st === "ready") {
        readyList.push(order);
      } else if (st === "shipped" || st === "delivering" || st === "dispatched") {
        deliveringList.push(order);
      } else if (st === "completed" || st === "delivered") {
        completedList.push(order);
      } else {
        // "pending", "paid", "new", "pending aba payment", "pending (cash on delivery)", etc.
        pendingList.push(order);
      }
    });

    return {
      pending: pendingList,
      preparing: preparingList,
      ready: readyList,
      delivering: deliveringList,
      completed: completedList
    };
  }, [filteredOrders]);

  // Aggregate Batch Picking List
  const batchPickingItems = useMemo(() => {
    const activeOrders = orders.filter((o) => {
      const st = (o.status || "pending").toLowerCase();
      return !["ready", "shipped", "delivering", "dispatched", "completed", "delivered", "cancelled"].includes(st);
    });

    const productMap = {};

    activeOrders.forEach((ord) => {
      const itemsList = ord.items || ord.products || [];
      itemsList.forEach((item) => {
        const prodId = item.product_id || item.id || "unknown";
        const prodName = item.product?.name || item.name || `Product #${prodId}`;
        const prodImage = item.product?.images?.[0]?.image_url || item.product?.image_url || item.product?.image || item.image || "";
        const prodPrice = parseFloat(item.price || item.product?.price || 0);
        const qty = parseInt(item.quantity || 1, 10);

        if (!productMap[prodId]) {
          productMap[prodId] = {
            id: prodId,
            name: prodName,
            image: prodImage,
            price: prodPrice,
            totalQuantity: 0,
            orderCount: 0,
            orders: []
          };
        }

        productMap[prodId].totalQuantity += qty;
        productMap[prodId].orderCount += 1;
        productMap[prodId].orders.push({
          orderId: ord.order_number || ord.id,
          customer: ord.user?.name || ord.shippingInfo?.fullName || "Customer",
          quantity: qty
        });
      });
    });

    return Object.values(productMap).sort((a, b) => b.totalQuantity - a.totalQuantity);
  }, [orders]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const pending = orders.filter((o) => {
      const st = (o.status || "pending").toLowerCase();
      return !["processing", "preparing", "packing", "ready", "shipped", "delivering", "dispatched", "completed", "delivered", "cancelled"].includes(st);
    }).length;
    const preparing = orders.filter((o) => {
      const st = (o.status || "pending").toLowerCase();
      return ["processing", "preparing", "packing"].includes(st);
    }).length;
    const ready = orders.filter((o) => {
      const st = (o.status || "pending").toLowerCase();
      return st === "ready";
    }).length;
    const delivering = orders.filter((o) => {
      const st = (o.status || "pending").toLowerCase();
      return ["shipped", "delivering", "dispatched"].includes(st);
    }).length;
    const completed = orders.filter((o) => {
      const st = (o.status || "pending").toLowerCase();
      return ["completed", "delivered"].includes(st);
    }).length;
    const totalActive = pending + preparing + ready;

    const delayed = orders.filter((o) => {
      const st = (o.status || "pending").toLowerCase();
      if (["completed", "delivered", "cancelled", "failed"].includes(st)) return false;
      const { urgency } = getElapsedInfo(o.created_at);
      return urgency === "urgent";
    }).length;

    return { pending, preparing, ready, delivering, completed, totalActive, delayed };
  }, [orders]);

  return (
    <div className={`order-monitor-container ${isFullscreen ? "is-fullscreen-mode" : ""}`} ref={monitorContainerRef}>
      {/* Top Monitor Header Bar */}
      <header className="monitor-header">
        <div className="monitor-brand-section">
          <div className="monitor-title-badge">
            <span className="live-pulse-dot" />
            <span className="badge-text">{isKhmer ? "ផ្សាយផ្ទាល់ (ODOO STAGE)" : "LIVE DISPATCH"}</span>
          </div>
          <div className="monitor-title-text">
            <h1>
              <FaTv className="monitor-icon" />
              {isKhmer ? "ផ្ទាំងរៀបចំទំនិញ & ដឹកជញ្ជូន" : "Order Prep & Dispatch Monitor"}
            </h1>
            <p className="monitor-subtitle">
              {isKhmer 
                ? "គ្រប់គ្រងដំណាក់កាលដូច Odoo ERP (អូសទម្លាក់ Drag & Drop, បញ្ចូលព័ត៌មានអ្នកដឹកជញ្ជូន និងផ្ទៀងផ្ទាត់កញ្ចប់ទំនិញ)"
                : "Odoo-style interactive Kanban stages with Drag & Drop, delivery driver assignment, and live packing checklist."}
            </p>
          </div>
        </div>

        {/* Global Monitor Quick Stats */}
        <div className="monitor-metrics-bar">
          <div className="metric-pill pending" onClick={() => setSelectedStatusTab(selectedStatusTab === "pending" ? "all" : "pending")}>
            <span className="metric-count">{metrics.pending}</span>
            <span className="metric-label">{isKhmer ? "រង់ចាំចាប់ផ្តើម" : "New / Pending"}</span>
          </div>
          <div className="metric-pill preparing" onClick={() => setSelectedStatusTab(selectedStatusTab === "preparing" ? "all" : "preparing")}>
            <span className="metric-count">{metrics.preparing}</span>
            <span className="metric-label">{isKhmer ? "កំពុងរៀបចំ" : "In Packing"}</span>
          </div>
          <div className="metric-pill ready" onClick={() => setSelectedStatusTab(selectedStatusTab === "ready" ? "all" : "ready")}>
            <span className="metric-count">{metrics.ready}</span>
            <span className="metric-label">{isKhmer ? "រួចរាល់សម្រាប់ដឹក" : "Ready / Packed"}</span>
          </div>
          <div className="metric-pill delivering" onClick={() => setSelectedStatusTab(selectedStatusTab === "delivering" ? "all" : "delivering")}>
            <span className="metric-count">{metrics.delivering}</span>
            <span className="metric-label">{isKhmer ? "កំពុងដឹកជញ្ជូន" : "Out for Delivery"}</span>
          </div>
          <div className="metric-pill completed" onClick={() => setSelectedStatusTab(selectedStatusTab === "completed" ? "all" : "completed")}>
            <span className="metric-count">{metrics.completed}</span>
            <span className="metric-label">{isKhmer ? "បានប្រគល់ជោគជ័យ" : "Delivered"}</span>
          </div>
          {metrics.delayed > 0 && (
            <div className="metric-pill delayed" onClick={() => setUrgencyFilter(urgencyFilter === "urgent" ? "all" : "urgent")}>
              <span className="metric-count"><FaExclamationTriangle /> {metrics.delayed}</span>
              <span className="metric-label">{isKhmer ? "យឺតពេល (>30នាទី)" : "Delayed (>30m)"}</span>
            </div>
          )}
        </div>

        {/* Monitor Control Actions */}
        <div className="monitor-header-actions">
          {/* Sound Toggle */}
          <button 
            type="button" 
            className={`monitor-action-btn ${soundEnabled ? "sound-active" : "sound-off"}`}
            onClick={toggleSound}
            title={soundEnabled ? (isKhmer ? "បិទសំឡេងរោទ៍" : "Mute Sound Alert") : (isKhmer ? "បើកសំឡេងរោទ៍" : "Enable Sound Alert")}
          >
            {soundEnabled ? <FaVolumeUp /> : <FaVolumeMute />}
            <span className="btn-label">{soundEnabled ? (isKhmer ? "សំឡេង: បើក" : "Sound: ON") : (isKhmer ? "សំឡេង: បិទ" : "Sound: OFF")}</span>
          </button>

          {/* Test Sound Alert Button */}
          <button
            type="button"
            className="monitor-action-btn test-sound-btn"
            onClick={() => {
              const ctx = getAudioContext();
              if (ctx && ctx.state === "suspended") {
                ctx.resume().catch(() => {});
              }
              playSoundEffect("new_order");
              Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: isKhmer ? "🔔 បានបន្លឺសំឡេងរោទ៍សាកល្បង!" : "🔔 Sound Alert Test Triggered!",
                text: isKhmer ? "សំឡេងរោទ៍ដំណើរការធម្មតា" : "Audio synthesizer is active and working",
                showConfirmButton: false,
                timer: 2000
              });
            }}
            title={isKhmer ? "សាកល្បងសំឡេងរោទ៍ការបញ្ជាទិញថ្មី" : "Test New Order Alert Sound"}
          >
            <FaVolumeUp />
            <span className="btn-label">{isKhmer ? "សាកល្បងសំឡេង" : "Test Sound"}</span>
          </button>

          {/* Auto Refresh Select */}
          <div className="refresh-control-group">
            <button
              type="button"
              className="refresh-now-btn"
              onClick={() => fetchOrders(false)}
              disabled={loading}
              title={isKhmer ? "ទាញយកទិន្នន័យថ្មីឥឡូវនេះ" : "Refresh Now"}
            >
              <FaSync className={loading ? "spin-icon" : ""} />
            </button>
            <div className="refresh-group-divider" />
            <select
              className="refresh-interval-select"
              value={autoRefreshSecs}
              onChange={(e) => setAutoRefreshSecs(Number(e.target.value))}
              title={isKhmer ? "ជ្រើសរើសចន្លោះពេល Refresh ស្វ័យប្រវត្តិ" : "Auto-refresh interval"}
            >
              <option value={10}>10s auto</option>
              <option value={20}>20s auto</option>
              <option value={30}>30s auto</option>
              <option value={60}>60s auto</option>
              <option value={0}>{isKhmer ? "បិទ Auto" : "Manual"}</option>
            </select>
            {autoRefreshSecs > 0 && (
              <span
                className={`countdown-indicator ${countdown <= 5 ? "countdown-urgent" : ""}`}
                title={isKhmer ? `នៅសល់ ${countdown} វិនាទីនឹង Refresh ស្វ័យប្រវត្តិ` : `${countdown}s until next auto-sync`}
              >
                {countdown}s
              </span>
            )}
          </div>

          {/* View Mode Switcher */}
          <div className="view-mode-tabs">
            <button
              type="button"
              className={`view-tab ${viewMode === "kanban" ? "active" : ""}`}
              onClick={() => setViewMode("kanban")}
              title={isKhmer ? "ទិដ្ឋភាពដំណាក់កាល Odoo Kanban" : "Kanban Workflow"}
            >
              <FaLayerGroup />
              <span className="tab-text">{isKhmer ? "ដំណាក់កាល" : "Stages"}</span>
            </button>
            <button
              type="button"
              className={`view-tab ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title={isKhmer ? "ទិដ្ឋភាពកាតរៀបចំ" : "Packing Cards"}
            >
              <FaThLarge />
              <span className="tab-text">{isKhmer ? "កាតរៀបចំ" : "Cards"}</span>
            </button>
            <button
              type="button"
              className={`view-tab ${viewMode === "batch" ? "active" : ""}`}
              onClick={() => setViewMode("batch")}
              title={isKhmer ? "មុខទំនិញសរុបត្រូវរើស" : "Batch Pick List"}
            >
              <FaClipboardList />
              <span className="tab-text">{isKhmer ? "ទំនិញសរុប" : "Pick List"} ({batchPickingItems.length})</span>
            </button>
          </div>

          {/* Dark / Light Theme Toggle */}
          <button
            type="button"
            className="monitor-action-btn theme-toggle-btn"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            title={resolvedTheme === "dark" ? (isKhmer ? "ប្តូរទៅពន្លឺថ្ងៃ (Light)" : "Switch to Light Mode") : (isKhmer ? "ប្តូរទៅផ្ទៃងងឹត (Dark)" : "Switch to Dark Mode")}
          >
            {resolvedTheme === "dark" ? <FaSun className="theme-icon sun" /> : <FaMoon className="theme-icon moon" />}
            <span className="btn-label">{resolvedTheme === "dark" ? (isKhmer ? "ពន្លឺ" : "Light") : (isKhmer ? "ងងឹត" : "Dark")}</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            className="monitor-action-btn fullscreen-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? (isKhmer ? "បង្រួមធម្មតា" : "Exit Fullscreen") : (isKhmer ? "ពង្រីកពេញអេក្រង់" : "Fullscreen Station")}
          >
            {isFullscreen ? <FaCompress /> : <FaExpand />}
          </button>

          {/* Link back to classic order ledger */}
          <Link to="/admin/orders" className="monitor-action-btn back-order-btn" title={isKhmer ? "ទៅកាន់បញ្ជីការបញ្ជាទិញ" : "Go to Orders List"}>
            <FaListUl />
            <span className="btn-label">{isKhmer ? "បញ្ជីបញ្ជាទិញ" : "Order Table"}</span>
          </Link>
        </div>
      </header>

      {/* Filter and Search Bar */}
      <div className="monitor-subbar">
        <div className="monitor-search-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            className="monitor-search-input"
            placeholder={isKhmer ? "ស្វែងរកលេខកូដបញ្ជាទិញ, អ្នកដឹកជញ្ជូន, ឈ្មោះអតិថិជន, លេខទូរស័ព្ទ, អាសយដ្ឋាន..." : "Search Order ID, Driver, Customer, Phone, Tracking No, Address..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button type="button" className="clear-search-btn" onClick={() => setSearchQuery("")}>
              <FaTimes />
            </button>
          )}
        </div>

        <div className="monitor-filter-tags">
          <span className="filter-tag-label"><FaFilter size={11} /> {isKhmer ? "ច្រោះតាម:" : "Filter:"}</span>
          
          <button
            type="button"
            className={`filter-pill ${selectedStatusTab === "all" ? "active" : ""}`}
            onClick={() => setSelectedStatusTab("all")}
          >
            {isKhmer ? "ទាំងអស់" : "All Orders"} ({orders.length})
          </button>
          <button
            type="button"
            className={`filter-pill ${selectedStatusTab === "pending" ? "active" : ""}`}
            onClick={() => setSelectedStatusTab("pending")}
          >
            {isKhmer ? "រង់ចាំ" : "Pending"} ({kanbanColumns.pending.length})
          </button>
          <button
            type="button"
            className={`filter-pill ${selectedStatusTab === "preparing" ? "active" : ""}`}
            onClick={() => setSelectedStatusTab("preparing")}
          >
            {isKhmer ? "កំពុងរៀបចំ" : "In Packing"} ({kanbanColumns.preparing.length})
          </button>
          <button
            type="button"
            className={`filter-pill ${selectedStatusTab === "ready" ? "active" : ""}`}
            onClick={() => setSelectedStatusTab("ready")}
          >
            {isKhmer ? "រួចរាល់" : "Ready"} ({kanbanColumns.ready.length})
          </button>
          <button
            type="button"
            className={`filter-pill ${selectedStatusTab === "delivering" ? "active" : ""}`}
            onClick={() => setSelectedStatusTab("delivering")}
          >
            {isKhmer ? "ដឹកជញ្ជូន" : "Delivering"} ({kanbanColumns.delivering.length})
          </button>
          <button
            type="button"
            className={`filter-pill ${selectedStatusTab === "completed" ? "active" : ""}`}
            onClick={() => setSelectedStatusTab("completed")}
          >
            {isKhmer ? "បានប្រគល់" : "Delivered"} ({kanbanColumns.completed.length})
          </button>
          <button
            type="button"
            className={`filter-pill ${urgencyFilter === "urgent" ? "active urgent-pill" : ""}`}
            onClick={() => setUrgencyFilter(urgencyFilter === "urgent" ? "all" : "urgent")}
          >
            ⚠️ {isKhmer ? "បន្ទាន់" : "Urgent Only"}
          </button>
        </div>

        <div className="monitor-timestamp">
          <span className="ts-dot" />
          <span>{isKhmer ? "ធ្វើបច្ចុប្បន្នភាពចុងក្រោយ:" : "Updated:"} {lastRefreshed.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="monitor-main-content">
        {loading && orders.length === 0 ? (
          <div className="monitor-loading-state">
            <div className="monitor-spinner" />
            <p>{isKhmer ? "កំពុងទាញយកទិន្នន័យការបញ្ជាទិញផ្សាយផ្ទាល់..." : "Loading live order preparation feed..."}</p>
          </div>
        ) : filteredOrders.length === 0 && viewMode !== "batch" ? (
          <div className="monitor-empty-state">
            <div className="empty-icon-box">
              <FaBoxOpen />
            </div>
            <h3>{isKhmer ? "គ្មានការបញ្ជាទិញត្រូវបង្ហាញឡើយ" : "No Active Orders Matching Filter"}</h3>
            <p>
              {isKhmer 
                ? "នៅពេលមានអតិថិជនបញ្ជាទិញថ្មី វានឹងលេចឡើងនៅលើអេក្រង់នេះភ្លាមៗ" 
                : "New orders placed by customers will instantly pop up on this live station monitor."}
            </p>
            {(searchQuery || selectedStatusTab !== "all" || urgencyFilter !== "all") && (
              <button
                type="button"
                className="reset-filter-btn"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedStatusTab("all");
                  setUrgencyFilter("all");
                }}
              >
                {isKhmer ? "កំណត់ការច្រោះឡើងវិញ" : "Clear All Filters"}
              </button>
            )}
          </div>
        ) : (
          <>
            {/* VIEW MODE 1: KANBAN WORKFLOW WITH ODOO DRAG & DROP */}
            {viewMode === "kanban" && (
              <div className="kanban-section-wrapper">
                {/* Mobile Stage Selector Tabs */}
                <div className="mobile-kanban-stage-tabs">
                  <button
                    type="button"
                    className={`mobile-tab-btn ${mobileKanbanTab === "all" ? "active" : ""}`}
                    onClick={() => setMobileKanbanTab("all")}
                  >
                    {isKhmer ? "ទាំងអស់" : "All Columns"}
                  </button>
                  <button
                    type="button"
                    className={`mobile-tab-btn tab-pending ${mobileKanbanTab === "pending" ? "active" : ""}`}
                    onClick={() => setMobileKanbanTab("pending")}
                  >
                    {isKhmer ? "រង់ចាំ" : "Pending"} ({kanbanColumns.pending.length})
                  </button>
                  <button
                    type="button"
                    className={`mobile-tab-btn tab-preparing ${mobileKanbanTab === "preparing" ? "active" : ""}`}
                    onClick={() => setMobileKanbanTab("preparing")}
                  >
                    {isKhmer ? "រៀបចំ" : "In Packing"} ({kanbanColumns.preparing.length})
                  </button>
                  <button
                    type="button"
                    className={`mobile-tab-btn tab-ready ${mobileKanbanTab === "ready" ? "active" : ""}`}
                    onClick={() => setMobileKanbanTab("ready")}
                  >
                    {isKhmer ? "រួចរាល់" : "Ready"} ({kanbanColumns.ready.length})
                  </button>
                  <button
                    type="button"
                    className={`mobile-tab-btn tab-delivering ${mobileKanbanTab === "delivering" ? "active" : ""}`}
                    onClick={() => setMobileKanbanTab("delivering")}
                  >
                    {isKhmer ? "ដឹកជញ្ជូន" : "Delivering"} ({kanbanColumns.delivering.length})
                  </button>
                  <button
                    type="button"
                    className={`mobile-tab-btn tab-completed ${mobileKanbanTab === "completed" ? "active" : ""}`}
                    onClick={() => setMobileKanbanTab("completed")}
                  >
                    {isKhmer ? "បានប្រគល់" : "Delivered"} ({kanbanColumns.completed.length})
                  </button>
                </div>

                <div className={`kanban-board-layout mobile-view-${mobileKanbanTab}`}>
                  {/* Column 1: New / Pending */}
                  <div
                    className={`kanban-column column-pending ${dragOverColumn === "pending" ? "drag-over-active" : ""}`}
                    onDragOver={(e) => handleDragOver(e, "pending")}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, "pending")}
                  >
                    <div className="column-header">
                      <div className="col-header-title">
                        <span className="col-indicator pending-indicator" />
                        <h3>{isKhmer ? "ការបញ្ជាទិញថ្មី (រង់ចាំ)" : "New / Pending"}</h3>
                      </div>
                      <span className="col-count-badge">{kanbanColumns.pending.length}</span>
                    </div>
                    <div className="column-body">
                      {kanbanColumns.pending.length === 0 ? (
                        <div className="column-empty">{isKhmer ? "គ្មានការបញ្ជាទិញថ្មី" : "Drop orders here"}</div>
                      ) : (
                        kanbanColumns.pending.map((order) => (
                          <OrderPrepCard
                            key={order.id}
                            order={order}
                            isKhmer={isKhmer}
                            packedItems={packedItems}
                            deliveryInfo={deliveryInfoMap[order.id]}
                            onToggleItem={toggleItemPacked}
                            onPackAll={packAllItems}
                            onUpdateStatus={handleUpdateStatus}
                            onPromptDelivery={promptDeliveryInfoModal}
                            onViewDetail={(ord) => {
                              setActiveOrder(ord);
                              setIsDetailModalOpen(true);
                            }}
                            onPrintSlip={handlePrintSlip}
                            onCopyText={copyToClipboard}
                            getElapsedInfo={getElapsedInfo}
                            getProgress={getOrderPackingProgress}
                            stage="pending"
                            onDragStart={(e) => handleDragStart(e, order)}
                          />
                        ))
                      )}
                    </div>
                  </div>

                  {/* Column 2: Preparing / Packing */}
                  <div
                    className={`kanban-column column-preparing ${dragOverColumn === "preparing" ? "drag-over-active" : ""}`}
                    onDragOver={(e) => handleDragOver(e, "preparing")}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, "preparing")}
                  >
                    <div className="column-header">
                      <div className="col-header-title">
                        <span className="col-indicator preparing-indicator" />
                        <h3>{isKhmer ? "កំពុងវេចខ្ចប់ & រៀបចំ" : "Preparing & Packing"}</h3>
                      </div>
                      <span className="col-count-badge">{kanbanColumns.preparing.length}</span>
                    </div>
                    <div className="column-body">
                      {kanbanColumns.preparing.length === 0 ? (
                        <div className="column-empty">{isKhmer ? "គ្មានការបញ្ជាទិញកំពុងរៀបចំ" : "Drop orders here to pack"}</div>
                      ) : (
                        kanbanColumns.preparing.map((order) => (
                          <OrderPrepCard
                            key={order.id}
                            order={order}
                            isKhmer={isKhmer}
                            packedItems={packedItems}
                            deliveryInfo={deliveryInfoMap[order.id]}
                            onToggleItem={toggleItemPacked}
                            onPackAll={packAllItems}
                            onUpdateStatus={handleUpdateStatus}
                            onPromptDelivery={promptDeliveryInfoModal}
                            onViewDetail={(ord) => {
                              setActiveOrder(ord);
                              setIsDetailModalOpen(true);
                            }}
                            onPrintSlip={handlePrintSlip}
                            onCopyText={copyToClipboard}
                            getElapsedInfo={getElapsedInfo}
                            getProgress={getOrderPackingProgress}
                            stage="preparing"
                            onDragStart={(e) => handleDragStart(e, order)}
                          />
                        ))
                      )}
                    </div>
                  </div>

                  {/* Column 3: Ready for Pickup / Delivery */}
                  <div
                    className={`kanban-column column-ready ${dragOverColumn === "ready" ? "drag-over-active" : ""}`}
                    onDragOver={(e) => handleDragOver(e, "ready")}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, "ready")}
                  >
                    <div className="column-header">
                      <div className="col-header-title">
                        <span className="col-indicator ready-indicator" />
                        <h3>{isKhmer ? "រួចរាល់រង់ចាំអ្នកដឹក" : "Ready / Packed"}</h3>
                      </div>
                      <span className="col-count-badge">{kanbanColumns.ready.length}</span>
                    </div>
                    <div className="column-body">
                      {kanbanColumns.ready.length === 0 ? (
                        <div className="column-empty">{isKhmer ? "គ្មានការបញ្ជាទិញរួចរាល់" : "Drop packed orders here"}</div>
                      ) : (
                        kanbanColumns.ready.map((order) => (
                          <OrderPrepCard
                            key={order.id}
                            order={order}
                            isKhmer={isKhmer}
                            packedItems={packedItems}
                            deliveryInfo={deliveryInfoMap[order.id]}
                            onToggleItem={toggleItemPacked}
                            onPackAll={packAllItems}
                            onUpdateStatus={handleUpdateStatus}
                            onPromptDelivery={promptDeliveryInfoModal}
                            onViewDetail={(ord) => {
                              setActiveOrder(ord);
                              setIsDetailModalOpen(true);
                            }}
                            onPrintSlip={handlePrintSlip}
                            onCopyText={copyToClipboard}
                            getElapsedInfo={getElapsedInfo}
                            getProgress={getOrderPackingProgress}
                            stage="ready"
                            onDragStart={(e) => handleDragStart(e, order)}
                          />
                        ))
                      )}
                    </div>
                  </div>

                  {/* Column 4: Out for Delivery */}
                  <div
                    className={`kanban-column column-delivering ${dragOverColumn === "delivering" ? "drag-over-active" : ""}`}
                    onDragOver={(e) => handleDragOver(e, "delivering")}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, "delivering")}
                  >
                    <div className="column-header">
                      <div className="col-header-title">
                        <span className="col-indicator delivering-indicator" />
                        <h3>{isKhmer ? "កំពុងដឹកជញ្ជូន" : "Out for Delivery"}</h3>
                      </div>
                      <span className="col-count-badge">{kanbanColumns.delivering.length}</span>
                    </div>
                    <div className="column-body">
                      {kanbanColumns.delivering.length === 0 ? (
                        <div className="column-empty">{isKhmer ? "អូសទម្លាក់ទីនេះដើម្បីបញ្ចូលអ្នកដឹក" : "Drop here to assign driver"}</div>
                      ) : (
                        kanbanColumns.delivering.map((order) => (
                          <OrderPrepCard
                            key={order.id}
                            order={order}
                            isKhmer={isKhmer}
                            packedItems={packedItems}
                            deliveryInfo={deliveryInfoMap[order.id]}
                            onToggleItem={toggleItemPacked}
                            onPackAll={packAllItems}
                            onUpdateStatus={handleUpdateStatus}
                            onPromptDelivery={promptDeliveryInfoModal}
                            onViewDetail={(ord) => {
                              setActiveOrder(ord);
                              setIsDetailModalOpen(true);
                            }}
                            onPrintSlip={handlePrintSlip}
                            onCopyText={copyToClipboard}
                            getElapsedInfo={getElapsedInfo}
                            getProgress={getOrderPackingProgress}
                            stage="delivering"
                            onDragStart={(e) => handleDragStart(e, order)}
                          />
                        ))
                      )}
                    </div>
                  </div>

                  {/* Column 5: Delivered / Completed */}
                  <div
                    className={`kanban-column column-completed ${dragOverColumn === "completed" ? "drag-over-active" : ""}`}
                    onDragOver={(e) => handleDragOver(e, "completed")}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, "completed")}
                  >
                    <div className="column-header">
                      <div className="col-header-title">
                        <span className="col-indicator completed-indicator" />
                        <h3>{isKhmer ? "បានប្រគល់ជោគជ័យ" : "Delivered"}</h3>
                      </div>
                      <span className="col-count-badge">{kanbanColumns.completed.length}</span>
                    </div>
                    <div className="column-body">
                      {kanbanColumns.completed.length === 0 ? (
                        <div className="column-empty">{isKhmer ? "គ្មានការបញ្ជាទិញបានបញ្ចប់" : "Drop finished orders here"}</div>
                      ) : (
                        kanbanColumns.completed.map((order) => (
                          <OrderPrepCard
                            key={order.id}
                            order={order}
                            isKhmer={isKhmer}
                            packedItems={packedItems}
                            deliveryInfo={deliveryInfoMap[order.id]}
                            onToggleItem={toggleItemPacked}
                            onPackAll={packAllItems}
                            onUpdateStatus={handleUpdateStatus}
                            onPromptDelivery={promptDeliveryInfoModal}
                            onViewDetail={(ord) => {
                              setActiveOrder(ord);
                              setIsDetailModalOpen(true);
                            }}
                            onPrintSlip={handlePrintSlip}
                            onCopyText={copyToClipboard}
                            getElapsedInfo={getElapsedInfo}
                            getProgress={getOrderPackingProgress}
                            stage="completed"
                            onDragStart={(e) => handleDragStart(e, order)}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW MODE 2: GRID PACKING STATION CARDS */}
            {viewMode === "grid" && (
              <div className="station-cards-grid">
                {filteredOrders.map((order) => (
                  <OrderPrepCard
                    key={order.id}
                    order={order}
                    isKhmer={isKhmer}
                    packedItems={packedItems}
                    deliveryInfo={deliveryInfoMap[order.id]}
                    onToggleItem={toggleItemPacked}
                    onPackAll={packAllItems}
                    onUpdateStatus={handleUpdateStatus}
                    onPromptDelivery={promptDeliveryInfoModal}
                    onViewDetail={(ord) => {
                      setActiveOrder(ord);
                      setIsDetailModalOpen(true);
                    }}
                    onPrintSlip={handlePrintSlip}
                    onCopyText={copyToClipboard}
                    getElapsedInfo={getElapsedInfo}
                    getProgress={getOrderPackingProgress}
                    stage={order.status || "pending"}
                    isGridCard
                  />
                ))}
              </div>
            )}

            {/* VIEW MODE 3: BATCH PICKING LIST */}
            {viewMode === "batch" && (
              <div className="batch-picking-station">
                <div className="batch-header-banner">
                  <div className="banner-left">
                    <FaClipboardList className="banner-icon" />
                    <div>
                      <h2>{isKhmer ? "បញ្ជីមុខទំនិញសរុបត្រូវរើសពីឃ្លាំង" : "Consolidated Batch Picking List"}</h2>
                      <p>
                        {isKhmer
                          ? "មុខទំនិញសរុបដែលត្រូវយកចេញពីស្តុកសម្រាប់រៀបចំការបញ្ជាទិញទាំងអស់ដែលកំពុងរង់ចាំ"
                          : "Total aggregated quantities needed from inventory to fulfill all active pending and preparing orders at once."}
                      </p>
                    </div>
                  </div>
                  <div className="banner-stats">
                    <div className="stat-box">
                      <span className="val">{batchPickingItems.length}</span>
                      <span className="lbl">{isKhmer ? "មុខទំនិញខុសគ្នា" : "Unique Items"}</span>
                    </div>
                    <div className="stat-box highlight">
                      <span className="val">
                        {batchPickingItems.reduce((sum, it) => sum + it.totalQuantity, 0)}
                      </span>
                      <span className="lbl">{isKhmer ? "ចំនួនសរុប" : "Total Units"}</span>
                    </div>
                  </div>
                </div>

                {batchPickingItems.length === 0 ? (
                  <div className="monitor-empty-state">
                    <FaCheckCircle size={48} color="#10b981" />
                    <h3>{isKhmer ? "គ្មានទំនិញត្រូវរើសទេ" : "All Active Orders Fulfilled!"}</h3>
                    <p>{isKhmer ? "គ្រប់ការបញ្ជាទិញទាំងអស់ត្រូវបានវេចខ្ចប់រួចរាល់។" : "No pending items remain to be picked from inventory."}</p>
                  </div>
                ) : (
                  <div className="batch-items-grid">
                    {batchPickingItems.map((prod, idx) => (
                      <div key={prod.id || idx} className="batch-product-card">
                        <div className="batch-card-left">
                          <div className="prod-img-box">
                            {prod.image ? (
                              <img src={prod.image} alt={prod.name} />
                            ) : (
                              <div className="no-img-placeholder"><FaBoxOpen /></div>
                            )}
                          </div>
                          <div className="prod-info-box">
                            <span className="prod-sku">ID: #{prod.id}</span>
                            <h4 className="prod-name">{prod.name}</h4>
                            <span className="prod-unit-price">${prod.price?.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="batch-card-right">
                          <div className="qty-highlight-badge">
                            <span className="qty-num">{prod.totalQuantity}</span>
                            <span className="qty-units">{isKhmer ? "ឯកតា" : "units"}</span>
                          </div>
                          <div className="order-refs-tooltip" title={prod.orders.map(o => `#${o.orderId} (${o.quantity}x)`).join(", ")}>
                            <small>{prod.orderCount} {isKhmer ? "ការបញ្ជាទិញ" : "orders"}</small>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* =============================================================
          MODAL 1: DELIVERY DISPATCH INPUT DIALOG (TRIGGERED ON "OUT FOR DELIVERY")
          ============================================================= */}
      {isDeliveryModalOpen && targetDeliveryOrder && (
        <Modal
          isOpen={isDeliveryModalOpen}
          onClose={() => setIsDeliveryModalOpen(false)}
          title={isKhmer ? `🛵 បញ្ចូលព័ត៌មានដឹកជញ្ជូនសម្រាប់ #${targetDeliveryOrder.order_number || 'OR-00001'}` : `🛵 Assign Delivery Info for Order #${targetDeliveryOrder.order_number || 'OR-00001'}`}
        >
          <form className="delivery-dispatch-form" onSubmit={handleConfirmDeliveryDispatch}>
            <div className="dispatch-form-banner">
              <FaMotorcycle className="banner-moto-icon" />
              <div>
                <h4>{isKhmer ? "ប្រគល់កញ្ចប់ទំនិញទៅកាន់អ្នកដឹក" : "Dispatch Package for Delivery"}</h4>
                <p>
                  {isKhmer
                    ? "បញ្ចូលព័ត៌មានអ្នកដឹកជញ្ជូន ដើម្បីងាយស្រួលតាមដាន និងផ្តល់ដំណឹងទៅកាន់អតិថិជន"
                    : "Fill in the driver/courier details to update order status and track delivery."}
                </p>
              </div>
            </div>

            {/* Destination Address Preview */}
            <div className="destination-preview-card">
              <div className="dest-row">
                <span className="dest-lbl"><FaUser size={11} /> {isKhmer ? "អតិថិជន:" : "Customer:"}</span>
                <strong>{targetDeliveryOrder.user?.name || "Customer"}</strong>
              </div>
              <div className="dest-row">
                <span className="dest-lbl"><FaPhoneAlt size={11} /> {isKhmer ? "លេខទូរស័ព្ទ:" : "Phone:"}</span>
                <span>{targetDeliveryOrder.contact_phone || targetDeliveryOrder.user?.phone || "N/A"}</span>
              </div>
              <div className="dest-row">
                <span className="dest-lbl"><FaMapMarkerAlt size={11} /> {isKhmer ? "អាសយដ្ឋាន:" : "Address:"}</span>
                <span>{targetDeliveryOrder.shipping_address || "Store pickup"}</span>
              </div>
            </div>

            {/* Delivery Fields Grid */}
            <div className="delivery-form-grid">
              {/* Carrier Selection */}
              <div className="form-group-item">
                <label className="input-label">
                  <FaShippingFast /> {isKhmer ? "ក្រុមហ៊ុន / សេវាដឹកជញ្ជូន:" : "Delivery Carrier / Service:"}
                </label>
                <select
                  className="dispatch-input select-carrier"
                  value={deliveryForm.carrier}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, carrier: e.target.value })}
                  required
                >
                  {DELIVERY_CARRIERS.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Driver Name */}
              <div className="form-group-item">
                <label className="input-label">
                  <FaIdCard /> {isKhmer ? "ឈ្មោះអ្នកដឹក (Driver / Rider Name):" : "Driver / Rider Name:"} <span className="req-star">*</span>
                </label>
                <input
                  type="text"
                  className="dispatch-input"
                  placeholder={isKhmer ? "ឧ. សុខ សំណាង" : "e.g. Sok Somnang / Driver #4"}
                  value={deliveryForm.driver_name}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, driver_name: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              {/* Driver Phone */}
              <div className="form-group-item">
                <label className="input-label">
                  <FaPhoneAlt /> {isKhmer ? "លេខទូរស័ព្ទអ្នកដឹក (Driver Phone):" : "Driver Phone Number:"}
                </label>
                <input
                  type="text"
                  className="dispatch-input"
                  placeholder="e.g. 012 345 678 / 098 765 432"
                  value={deliveryForm.driver_phone}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, driver_phone: e.target.value })}
                />
              </div>

              {/* Tracking Number / Waybill */}
              <div className="form-group-item">
                <label className="input-label">
                  <FaBarcode /> {isKhmer ? "លេខកូដតាមដាន (Tracking / Waybill No):" : "Tracking / Waybill No:"}
                </label>
                <input
                  type="text"
                  className="dispatch-input"
                  placeholder="e.g. GRB-883921 / JNT-9821"
                  value={deliveryForm.tracking_number}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, tracking_number: e.target.value })}
                />
              </div>

              {/* Estimated Delivery Time */}
              <div className="form-group-item">
                <label className="input-label">
                  <FaClock /> {isKhmer ? "រយៈពេលដឹកជញ្ជូនរំពឹងទុក:" : "Estimated Delivery Time:"}
                </label>
                <select
                  className="dispatch-input"
                  value={deliveryForm.estimated_time}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, estimated_time: e.target.value })}
                >
                  <option value="15-30 mins">15 - 30 minutes (Express)</option>
                  <option value="30-60 mins">30 - 60 minutes</option>
                  <option value="1-2 hours">1 - 2 hours</option>
                  <option value="Same Day">Same Day Delivery (ល្ងាចនេះ)</option>
                  <option value="Next Day">Next Day Province Delivery (ថ្ងៃស្អែក)</option>
                </select>
              </div>

              {/* Driver / Dispatch Notes */}
              <div className="form-group-item full-width">
                <label className="input-label">
                  <FaStickyNote /> {isKhmer ? "កំណត់សម្គាល់សម្រាប់អ្នកដឹក (Notes / Instructions):" : "Delivery Instructions / Notes:"}
                </label>
                <input
                  type="text"
                  className="dispatch-input"
                  placeholder={isKhmer ? "ឧ. សូមទូរស័ព្ទមុនពេលទៅដល់, ផ្ទះមានទ្វាររបងពណ៌បៃតង..." : "e.g. Call before arrival, handle glass items with care..."}
                  value={deliveryForm.notes}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, notes: e.target.value })}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="dispatch-modal-actions">
              <button
                type="button"
                className="cancel-dispatch-btn"
                onClick={() => setIsDeliveryModalOpen(false)}
                disabled={isDispatching}
              >
                {isKhmer ? "បោះបង់" : "Cancel"}
              </button>
              <button
                type="submit"
                className={`confirm-dispatch-btn ${isDispatching ? "loading" : ""}`}
                disabled={isDispatching}
              >
                {isDispatching ? (
                  <>
                    <FaSpinner className="spin-icon" /> {isKhmer ? "កំពុងដំណើរការ..." : "Dispatching..."}
                  </>
                ) : (
                  <>
                    <FaTruck /> {isKhmer ? "បញ្ជូនចេញឥឡូវនេះ (Confirm Out for Delivery)" : "Confirm & Dispatch"}
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* =============================================================
          MODAL 2: ORDER DETAILS & ODOO STAGE PIPELINE
          ============================================================= */}
      {isDetailModalOpen && activeOrder && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={isKhmer ? `ព័ត៌មានលម្អិតការបញ្ជាទិញ #${activeOrder.order_number || 'OR-00001'}` : `Order Details & Odoo Pipeline #${activeOrder.order_number || 'OR-00001'}`}
        >
          <div className="order-modal-detail-view">
            {/* Odoo ERP Stage Pipeline Bar */}
            <div className="odoo-pipeline-ribbon">
              {ODOO_STAGES.map((stage, idx) => {
                const currentStatus = (activeOrder.status || "pending").toLowerCase();
                let isCurrent = false;
                if (stage.key === "pending" && currentStatus === "pending") isCurrent = true;
                else if (stage.key === "processing" && (currentStatus === "processing" || currentStatus === "preparing")) isCurrent = true;
                else if (stage.key === "ready" && (currentStatus === "ready" || currentStatus === "paid")) isCurrent = true;
                else if (stage.key === "shipped" && (currentStatus === "shipped" || currentStatus === "delivering")) isCurrent = true;
                else if (stage.key === "completed" && currentStatus === "completed") isCurrent = true;

                return (
                  <div
                    key={stage.key}
                    className={`pipeline-stage-step ${isCurrent ? "is-active-stage" : ""}`}
                    onClick={() => handleUpdateStatus(activeOrder.id, stage.key, activeOrder.id)}
                    title={isKhmer ? `ចុចដើម្បីប្តូរទៅដំណាក់កាល ${stage.labelKm}` : `Click to move stage to ${stage.labelEn}`}
                  >
                    <span className="stage-name">{isKhmer ? stage.labelKm : stage.labelEn}</span>
                    <FaChevronRight className="stage-arrow" />
                  </div>
                );
              })}
            </div>

            {/* Modal Header Metadata */}
            <div className="modal-order-summary-grid">
              <div className="summary-col">
                <span className="col-lbl">{isKhmer ? "អតិថិជន:" : "Customer:"}</span>
                <strong><FaUser size={12} /> {activeOrder.user?.name || "Customer"}</strong>
                <span className="sub-text">{activeOrder.user?.email || "No email"}</span>
              </div>
              <div className="summary-col">
                <span className="col-lbl">{isKhmer ? "ទំនាក់ទំនង & ដឹកជញ្ជូន:" : "Contact & Delivery:"}</span>
                <div className="clickable-phone" onClick={(e) => copyToClipboard(activeOrder.contact_phone || activeOrder.user?.phone, "Phone", e)}>
                  <FaPhoneAlt size={11} /> <strong>{activeOrder.contact_phone || activeOrder.user?.phone || "N/A"}</strong>
                  <FaCopy size={11} className="copy-icon" />
                </div>
                <div className="delivery-address-snippet">
                  <FaMapMarkerAlt size={11} /> {activeOrder.shipping_address || "No shipping address provided"}
                </div>
              </div>
              <div className="summary-col">
                <span className="col-lbl">{isKhmer ? "ស្ថានភាព & សរុប:" : "Status & Total:"}</span>
                <span className={`modal-status-badge status-${activeOrder.status || "pending"}`}>
                  {(activeOrder.status || "pending").toUpperCase()}
                </span>
                <strong className="modal-total-amount">${parseFloat(activeOrder.total_amount || 0).toFixed(2)}</strong>
              </div>
            </div>

            {/* Assigned Delivery Driver Details Banner (if assigned) */}
            {deliveryInfoMap[activeOrder.id] && (
              <div className="modal-delivery-driver-banner">
                <div className="driver-banner-left">
                  <span className="driver-carrier-tag">{deliveryInfoMap[activeOrder.id].carrier}</span>
                  <div className="driver-meta">
                    <strong><FaMotorcycle /> {deliveryInfoMap[activeOrder.id].driver_name}</strong>
                    {deliveryInfoMap[activeOrder.id].driver_phone && (
                      <span
                        className="driver-phone-click"
                        onClick={(e) => copyToClipboard(deliveryInfoMap[activeOrder.id].driver_phone, "Driver Phone", e)}
                      >
                        <FaPhoneAlt size={10} /> {deliveryInfoMap[activeOrder.id].driver_phone}
                      </span>
                    )}
                  </div>
                </div>
                <div className="driver-banner-right">
                  {deliveryInfoMap[activeOrder.id].tracking_number && (
                    <span className="tracking-badge">
                      <FaBarcode /> {deliveryInfoMap[activeOrder.id].tracking_number}
                    </span>
                  )}
                  <button
                    type="button"
                    className="edit-delivery-btn"
                    onClick={(e) => promptDeliveryInfoModal(activeOrder, e)}
                  >
                    {isKhmer ? "កែប្រែអ្នកដឹក" : "Edit Courier"}
                  </button>
                </div>
              </div>
            )}

            {/* Checklist Header & Pack All Button */}
            <div className="modal-checklist-actions">
              <div className="checklist-progress-text">
                <FaClipboardList />
                <span>
                  {isKhmer ? "ផ្ទៀងផ្ទាត់មុខទំនិញក្នុងកញ្ចប់:" : "Package Item Verification Checklist:"}{" "}
                  <strong>
                    {getOrderPackingProgress(activeOrder).count} / {getOrderPackingProgress(activeOrder).total} {isKhmer ? "បានវេចខ្ចប់" : "Packed"} ({getOrderPackingProgress(activeOrder).percent}%)
                  </strong>
                </span>
              </div>
              <button
                type="button"
                className="pack-all-modal-btn"
                onClick={(e) => packAllItems(activeOrder, e)}
              >
                <FaCheckDouble /> {isKhmer ? "គូសធីកទាំងអស់" : "Pack All Items"}
              </button>
            </div>

            {/* Interactive Items Table */}
            <div className="modal-items-table-wrapper">
              <table className="modal-items-table">
                <thead>
                  <tr>
                    <th style={{ width: "45px", textAlign: "center" }}>{isKhmer ? "ធីក" : "Packed"}</th>
                    <th style={{ width: "65px" }}>{isKhmer ? "រូបភាព" : "Image"}</th>
                    <th>{isKhmer ? "ឈ្មោះទំនិញ & ជម្រើស" : "Product & Options"}</th>
                    <th style={{ width: "90px", textAlign: "center" }}>{isKhmer ? "ចំនួន" : "Qty"}</th>
                    <th style={{ width: "100px", textAlign: "right" }}>{isKhmer ? "តម្លៃរាយ" : "Unit Price"}</th>
                    <th style={{ width: "110px", textAlign: "right" }}>{isKhmer ? "សរុប" : "Subtotal"}</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeOrder.items || []).map((item, idx) => {
                    const itemId = item.id || `${item.product_id || idx}`;
                    const isPacked = Boolean(packedItems[activeOrder.id]?.[itemId]);
                    const itemImg = item.product?.image_url || item.product?.image || item.image || "";
                    const itemName = item.product?.name || item.name || `Product #${item.product_id || idx + 1}`;
                    const itemPrice = parseFloat(item.price || item.product?.price || 0);
                    const qty = parseInt(item.quantity || 1, 10);
                    const subtotal = itemPrice * qty;

                    return (
                      <tr 
                        key={itemId} 
                        className={`item-row ${isPacked ? "item-is-packed" : ""}`}
                        onClick={(e) => toggleItemPacked(activeOrder.id, itemId, e)}
                      >
                        <td style={{ textAlign: "center" }}>
                          <input
                            type="checkbox"
                            className="item-pack-checkbox"
                            checked={isPacked}
                            onChange={(e) => toggleItemPacked(activeOrder.id, itemId, e)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td>
                          <div className="table-thumb">
                            {itemImg ? <img src={itemImg} alt={itemName} /> : <FaBoxOpen />}
                          </div>
                        </td>
                        <td>
                          <div className="item-name-cell">
                            <span className="main-name">{itemName}</span>
                            {item.product?.sku && <span className="item-sku-tag">SKU: {item.product.sku}</span>}
                            {item.attributes && typeof item.attributes === "object" && (
                              <div className="variant-tags-list">
                                {Object.entries(item.attributes).map(([k, v]) => (
                                  <span key={k} className="variant-badge">{k}: {String(v)}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span className="qty-tag">x{qty}</span>
                        </td>
                        <td style={{ textAlign: "right" }}>${itemPrice.toFixed(2)}</td>
                        <td style={{ textAlign: "right", fontWeight: "700" }}>${subtotal.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Quick Status Advancement in Modal */}
            <div className="modal-bottom-actions">
              <div className="status-flow-buttons">
                {activeOrder.status === "pending" && (
                  <button
                    type="button"
                    className="modal-flow-btn btn-advance-prep"
                    onClick={(e) => handleUpdateStatus(activeOrder.id, "processing", activeOrder.id, e)}
                  >
                    <FaPlay /> {isKhmer ? "ចាប់ផ្តើមវេចខ្ចប់" : "Start Preparing / Packing"}
                  </button>
                )}

                {(activeOrder.status === "processing" || activeOrder.status === "preparing" || activeOrder.status === "pending") && (
                  <button
                    type="button"
                    className="modal-flow-btn btn-advance-ready"
                    onClick={(e) => handleUpdateStatus(activeOrder.id, "ready", activeOrder.id, e)}
                  >
                    <FaCheckCircle /> {isKhmer ? "សម្គាល់ថារួចរាល់សម្រាប់ដឹក" : "Mark Ready for Delivery"}
                  </button>
                )}

                {(activeOrder.status === "ready" || activeOrder.status === "paid" || activeOrder.status === "processing") && (
                  <button
                    type="button"
                    className="modal-flow-btn btn-advance-delivering"
                    onClick={(e) => promptDeliveryInfoModal(activeOrder, e)}
                  >
                    <FaMotorcycle /> {isKhmer ? "ប្រគល់ជូនអ្នកដឹក (Out for Delivery)" : "Assign Driver & Out for Delivery"}
                  </button>
                )}

                {activeOrder.status === "shipped" && (
                  <button
                    type="button"
                    className="modal-flow-btn btn-advance-completed"
                    onClick={(e) => handleUpdateStatus(activeOrder.id, "completed", activeOrder.id, e)}
                  >
                    <FaCheck /> {isKhmer ? "បញ្ចប់ការដឹកជញ្ជូនជោគជ័យ" : "Complete Delivery"}
                  </button>
                )}

                <button
                  type="button"
                  className="modal-print-btn"
                  onClick={(e) => handlePrintSlip(activeOrder, e)}
                >
                  <FaPrint /> {isKhmer ? "បោះពុម្ពប័ណ្ណវេចខ្ចប់" : "Print Packing Slip"}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* =============================================================
          HIDDEN PRINTABLE PACKING SLIP / DISPATCH LABEL
          ============================================================= */}
      {printOrder && (
        <div className="printable-slip-wrapper print-only">
          <div className="slip-container">
            <div className="slip-header">
              <div className="slip-store-info">
                <h2>🛍️ ANGKOR SHOPPING MALL</h2>
                <p>Order Fulfillment & Delivery Dispatch Slip</p>
                <small>Phnom Penh, Cambodia | Tel: +855 23 888 999</small>
              </div>
              <div className="slip-qr-box">
                <div className="barcode-simulation">
                  <FaBarcode size={44} />
                  <span>{printOrder.order_number || 'OR-00001'}</span>
                </div>
              </div>
            </div>

            <hr className="slip-divider" />

            <div className="slip-metadata-grid">
              <div className="slip-meta-item">
                <span className="lbl">Order ID:</span>
                <strong>#{printOrder.order_number || 'OR-00001'}</strong>
              </div>
              <div className="slip-meta-item">
                <span className="lbl">Date & Time:</span>
                <span>{new Date(printOrder.created_at || Date.now()).toLocaleString()}</span>
              </div>
              <div className="slip-meta-item">
                <span className="lbl">Customer Name:</span>
                <strong>{printOrder.user?.name || "Customer"}</strong>
              </div>
              <div className="slip-meta-item">
                <span className="lbl">Contact Phone:</span>
                <strong>{printOrder.contact_phone || printOrder.user?.phone || "N/A"}</strong>
              </div>
              <div className="slip-meta-item full-width">
                <span className="lbl">Delivery Address:</span>
                <span>{printOrder.shipping_address || "Standard Store Pickup"}</span>
              </div>
              {deliveryInfoMap[printOrder.id] && (
                <div className="slip-meta-item full-width highlight-courier-box">
                  <span className="lbl">Assigned Courier / Driver:</span>
                  <strong>
                    {deliveryInfoMap[printOrder.id].carrier} | {deliveryInfoMap[printOrder.id].driver_name} (Tel: {deliveryInfoMap[printOrder.id].driver_phone || "N/A"}) | Tracking: {deliveryInfoMap[printOrder.id].tracking_number || "N/A"}
                  </strong>
                </div>
              )}
            </div>

            <table className="slip-items-table">
              <thead>
                <tr>
                  <th style={{ width: "35px" }}>[✓]</th>
                  <th>Item Name / Description</th>
                  <th style={{ width: "50px", textAlign: "center" }}>Qty</th>
                  <th style={{ width: "80px", textAlign: "right" }}>Price</th>
                  <th style={{ width: "90px", textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {(printOrder.items || []).map((it, idx) => (
                  <tr key={idx}>
                    <td style={{ textAlign: "center" }}>[ ]</td>
                    <td>
                      <strong>{it.product?.name || it.name || `Product #${it.product_id}`}</strong>
                      {it.attributes && typeof it.attributes === "object" && (
                        <div style={{ fontSize: "11px", color: "#555" }}>
                          {Object.entries(it.attributes).map(([k, v]) => `${k}: ${v}`).join(", ")}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: "center" }}>{it.quantity || 1}</td>
                    <td style={{ textAlign: "right" }}>${parseFloat(it.price || it.product?.price || 0).toFixed(2)}</td>
                    <td style={{ textAlign: "right" }}>
                      ${(parseFloat(it.price || it.product?.price || 0) * (it.quantity || 1)).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="slip-totals-row">
              <div className="slip-notes">
                <p><strong>Packing Notes:</strong> Handle with care. Check all items before dispatch.</p>
                <p>Packed by: ____________________ Date: _________</p>
                <p>Received by Driver: __________________ Signature: _________</p>
              </div>
              <div className="slip-grand-total">
                <div className="row">
                  <span>Grand Total:</span>
                  <strong>${parseFloat(printOrder.total_amount || 0).toFixed(2)}</strong>
                </div>
                <div className="row">
                  <span>Payment Status:</span>
                  <span>{(printOrder.status === "paid" || printOrder.status === "completed") ? "PAID" : "CASH ON DELIVERY"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// SUB-COMPONENT: ORDER PREPARATION CARD (WITH ODOO DRAG & DROP)
// -------------------------------------------------------------
function OrderPrepCard({
  order,
  isKhmer,
  packedItems,
  deliveryInfo,
  onToggleItem,
  onPackAll,
  onUpdateStatus,
  onPromptDelivery,
  onViewDetail,
  onPrintSlip,
  onCopyText,
  getElapsedInfo,
  getProgress,
  stage,
  isGridCard = false,
  onDragStart
}) {
  const elapsed = getElapsedInfo(order.created_at);
  const progress = getProgress(order);
  const items = order.items || order.products || [];

  const currentStageKey = useMemo(() => {
    const st = (order.status || stage || "pending").toLowerCase();
    if (st === "processing" || st === "preparing" || st === "packing") return "processing";
    if (st === "ready") return "ready";
    if (st === "shipped" || st === "delivering" || st === "dispatched") return "shipped";
    if (st === "completed" || st === "delivered") return "completed";
    return "pending";
  }, [order.status, stage]);

  const displayOrderNumber = useMemo(() => {
    const num = order.order_number || order.id;
    if (!num) return "#OR-00001";
    const str = String(num).trim();
    if (str.startsWith("#OR-")) return str;
    if (str.startsWith("OR-")) return `#${str}`;
    if (!isNaN(Number(str)) && !str.includes("-")) return `#OR-${str.padStart(5, "0")}`;
    if (str.length > 10) return `#OR-${str.slice(0, 5).toUpperCase()}`;
    return `#${str}`;
  }, [order.order_number, order.id]);

  return (
    <div
      className={`order-prep-card urgency-${elapsed.urgency} stage-${currentStageKey} ${isGridCard ? "grid-card-style" : ""}`}
      draggable={!isGridCard}
      onDragStart={onDragStart}
      onClick={() => onViewDetail(order)}
    >
      {/* Card Top Row */}
      <div className="card-top-row">
        <div className="card-id-wrapper">
          {!isGridCard && <FaGripVertical className="card-drag-handle" title={isKhmer ? "អូសកាតដើម្បីប្តូរដំណាក់កាល" : "Drag card to change stage"} />}
          <span className="order-number" title={`Order ID: ${order.order_number || order.id}`}>
            {displayOrderNumber}
          </span>
        </div>
        <div className="card-top-actions" onClick={(e) => e.stopPropagation()}>
          <span className={`time-badge urgency-${elapsed.urgency}`} title={elapsed.text}>
            <FaClock size={9} /> {elapsed.shortText || elapsed.text}
          </span>
          <button
            type="button"
            className="card-quick-action-btn"
            title={isKhmer ? "បោះពុម្ពប័ណ្ណវេចខ្ចប់" : "Print Packing Slip"}
            onClick={(e) => onPrintSlip(order, e)}
          >
            <FaPrint size={10.5} />
          </button>
        </div>
      </div>

      {/* Customer & Delivery Summary */}
      <div className="card-customer-row">
        <div className="customer-main">
          <strong className="customer-name" title={order.user?.name || order.shippingInfo?.fullName || "Customer"}>
            {order.user?.name || order.shippingInfo?.fullName || "Customer"}
          </strong>
          {(order.contact_phone || order.user?.phone || order.shippingInfo?.phone) && (
            <span
              className="customer-phone"
              onClick={(e) => onCopyText(order.contact_phone || order.user?.phone || order.shippingInfo?.phone, "Phone", e)}
              title={isKhmer ? "ចុចដើម្បីចម្លងលេខទូរស័ព្ទ" : "Click to copy phone"}
            >
              <FaPhoneAlt size={9} /> {order.contact_phone || order.user?.phone || order.shippingInfo?.phone}
            </span>
          )}
        </div>
        <div className="card-price-payment-col">
          <div className="order-total-pill">
            ${parseFloat(order.total_amount || order.total || 0).toFixed(2)}
          </div>
          {/* Payment Status Badges */}
          {(order.status === "paid" || order.payment_intent_id || String(order.paymentMethod).toUpperCase() === "PAID" || String(order.paymentMethod).toUpperCase() === "ABA PAYWAY") ? (
            <span className="payment-paid-badge" title="Payment Verified">
              ✓ {isKhmer ? "ទូទាត់រួច" : "PAID"}
            </span>
          ) : (order.paymentMethod === "COD" || String(order.status).includes("Cash on Delivery") || order.payment_method === "cod") ? (
            <span className="payment-cod-badge" title="Cash on Delivery">
              💵 {isKhmer ? "COD" : "COD"}
            </span>
          ) : String(order.status).includes("ABA") ? (
            <span className="payment-pending-badge" title="Pending ABA KHQR Payment">
              ⏳ {isKhmer ? "រង់ចាំ ABA" : "ABA PENDING"}
            </span>
          ) : null}
        </div>
      </div>

      {(order.shipping_address || order.shippingInfo?.address) && (
        <div className="card-address-row" title={order.shipping_address || order.shippingInfo?.address}>
          <FaMapMarkerAlt size={11} className="addr-icon" />
          <span className="addr-text">{order.shipping_address || order.shippingInfo?.address}</span>
        </div>
      )}

      {/* Quick Click Stage Selector Dropdown */}
      <div className="card-stage-switcher" onClick={(e) => e.stopPropagation()}>
        <span className="stage-switch-lbl">
          <FaLayerGroup size={10} /> {isKhmer ? "ដំណាក់កាល:" : "Stage:"}
        </span>
        <select
          className={`stage-select-dropdown stage-color-${currentStageKey}`}
          value={currentStageKey}
          onChange={(e) => {
            e.stopPropagation();
            const nextStage = e.target.value;
            if (nextStage === "shipped") {
              onPromptDelivery(order, e);
            } else {
              onUpdateStatus(order.id, nextStage, order.order_number || order.id, e);
            }
          }}
          title={isKhmer ? "ចុចដើម្បីប្តូរដំណាក់កាលភ្លាមៗ" : "Click to switch stage instantly"}
        >
          <option value="pending">🔵 {isKhmer ? "១. រង់ចាំ" : "1. Pending"}</option>
          <option value="processing">🟠 {isKhmer ? "២. រៀបចំ" : "2. Preparing"}</option>
          <option value="ready">🟢 {isKhmer ? "៣. រួចរាល់" : "3. Ready"}</option>
          <option value="shipped">🟣 {isKhmer ? "៤. កំពុងដឹក" : "4. Delivering"}</option>
          <option value="completed">✅ {isKhmer ? "៥. ជោគជ័យ" : "5. Delivered"}</option>
        </select>
      </div>

      {/* Assigned Delivery Courier Badge (if assigned) */}
      {deliveryInfo && (
        <div className="card-driver-badge-row" onClick={(e) => e.stopPropagation()}>
          <div className="driver-info-wrap" title={`${deliveryInfo.driver_name} (${deliveryInfo.carrier})`}>
            <FaMotorcycle size={11} className="driver-moto-icon" />
            <span className="driver-name-text">{deliveryInfo.driver_name}</span>
            <span className="driver-carrier-tag">({deliveryInfo.carrier})</span>
          </div>
          {deliveryInfo.driver_phone && (
            <span
              className="driver-phone-pill"
              onClick={(e) => onCopyText(deliveryInfo.driver_phone, "Driver Phone", e)}
              title="Click to copy driver phone"
            >
              <FaPhoneAlt size={8.5} /> {deliveryInfo.driver_phone}
            </span>
          )}
        </div>
      )}

      {/* Packing Progress Bar */}
      <div className="card-packing-progress" onClick={(e) => e.stopPropagation()}>
        <div className="progress-header">
          <span className="progress-lbl">
            {isKhmer ? "វេចខ្ចប់បាន:" : "Packed:"}{" "}
            <strong>
              {progress.count}/{progress.total}
            </strong>
          </span>
          <button
            type="button"
            className="pack-all-mini-btn"
            onClick={(e) => onPackAll(order, e)}
            title={isKhmer ? "គូសធីកទាំងអស់" : "Mark all packed"}
          >
            <FaCheckDouble size={11} /> {isKhmer ? "ធីកទាំងអស់" : "Pack All"}
          </button>
        </div>
        <div className="progress-track">
          <div
            className={`progress-fill ${progress.percent === 100 ? "complete" : ""}`}
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>

      {/* Items Preview Checklist */}
      <div className="card-items-checklist" onClick={(e) => e.stopPropagation()}>
        {items.slice(0, 3).map((item, idx) => {
          const itemId = item.id || `${item.product_id || idx}`;
          const isPacked = Boolean(packedItems[order.id]?.[itemId]);
          const itemImg = item.product?.images?.[0]?.image_url || item.product?.image_url || item.product?.image || item.image || "";
          const itemName = item.product?.name || item.name || `Item #${idx + 1}`;
          const qty = parseInt(item.quantity || 1, 10);

          return (
            <div
              key={itemId}
              className={`card-check-item ${isPacked ? "is-packed" : ""}`}
              onClick={(e) => onToggleItem(order.id, itemId, e)}
              title={isKhmer ? "ចុចដើម្បីធីកវេចខ្ចប់" : "Click to toggle item packed"}
            >
              <input
                type="checkbox"
                className="mini-checkbox"
                checked={isPacked}
                onChange={(e) => onToggleItem(order.id, itemId, e)}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="mini-thumb">
                {itemImg ? <img src={itemImg} alt="" /> : <FaBoxOpen size={10} />}
              </div>
              <span className="item-name-preview">{itemName}</span>
              <span className="item-qty-badge">x{qty}</span>
            </div>
          );
        })}

        {items.length > 3 && (
          <div className="card-more-items" onClick={() => onViewDetail(order)}>
            +{items.length - 3} {isKhmer ? "មុខទំនិញទៀត..." : "more items..."}
          </div>
        )}
      </div>

      {/* Bottom Action Bar with Back & Next Step Buttons */}
      <div className="card-footer-actions" onClick={(e) => e.stopPropagation()}>
        {/* ◀ Back / Revert Step Button (when not in Stage 1) */}
        {currentStageKey !== "pending" && (
          <button
            type="button"
            className="revert-prev-btn"
            onClick={(e) => {
              let prevStage = "pending";
              if (currentStageKey === "ready") prevStage = "processing";
              else if (currentStageKey === "shipped") prevStage = "ready";
              else if (currentStageKey === "completed") prevStage = "shipped";
              onUpdateStatus(order.id, prevStage, order.order_number || order.id, e);
            }}
            title={isKhmer ? "ថយទៅដំណាក់កាលមុន" : "Revert to previous stage"}
          >
            <span>◀</span> {isKhmer ? "ថយ" : "Back"}
          </button>
        )}

        {/* Forward Step Action Button */}
        {currentStageKey === "pending" && (
          <button
            type="button"
            className="action-step-btn start-prep-btn"
            onClick={(e) => onUpdateStatus(order.id, "processing", order.order_number || order.id, e)}
          >
            <FaPlay size={10} />
            <span>{isKhmer ? "ចាប់ផ្តើមរៀបចំ" : "Start Packing"}</span>
          </button>
        )}

        {currentStageKey === "processing" && (
          <button
            type="button"
            className="action-step-btn ready-prep-btn"
            onClick={(e) => onUpdateStatus(order.id, "ready", order.order_number || order.id, e)}
          >
            <FaCheckCircle size={11} />
            <span>{isKhmer ? "រួចរាល់" : "Ready"}</span>
          </button>
        )}

        {currentStageKey === "ready" && (
          <button
            type="button"
            className="action-step-btn dispatch-btn"
            onClick={(e) => onPromptDelivery(order, e)}
          >
            <FaMotorcycle size={12} />
            <span>{isKhmer ? "ប្រគល់អ្នកដឹក" : "Dispatch"}</span>
          </button>
        )}

        {currentStageKey === "shipped" && (
          <button
            type="button"
            className="action-step-btn complete-btn"
            onClick={(e) => onUpdateStatus(order.id, "completed", order.order_number || order.id, e)}
          >
            <FaCheck size={11} />
            <span>{isKhmer ? "បានដឹកដល់" : "Delivered"}</span>
          </button>
        )}

        {currentStageKey === "completed" && (
          <div className="completed-badge-btn">
            <FaCheckCircle size={11} />
            <span>{isKhmer ? "បានប្រគល់" : "Delivered"}</span>
          </div>
        )}

        <button
          type="button"
          className="card-detail-link-btn"
          onClick={() => onViewDetail(order)}
          title={isKhmer ? "មើលលម្អិត & ដំណាក់កាល" : "View Details & Odoo Stages"}
        >
          <FaInfoCircle />
        </button>
      </div>
    </div>
  );
}
