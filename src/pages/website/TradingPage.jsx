import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Repeat,
  Sparkles,
  ShieldCheck,
  Search,
  Filter,
  PlusCircle,
  Tag,
  MapPin,
  Clock,
  Phone,
  MessageSquare,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  ExternalLink,
  Info,
  DollarSign
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Swal from "sweetalert2";
import Header from "../../components/Header";
import Modal from "../../components/Modal";
import {
  getTradeProductsApi,
  getTradeProductByIdApi,
  getMyTradeProductsApi,
  getEligibleOrderedItemsApi,
  createTradeProductApi,
  createTradeOfferApi,
  getReceivedTradeOffersApi,
  getSentTradeOffersApi,
  updateTradeOfferStatusApi,
  deleteTradeProductApi
} from "../../services/tradeService";
import { categoriesApi } from "../../services/categoriesService";
import { TradeCardSkeleton } from "../../components/loading/LoadingSkeleton";
import "./styles/TradingPage.css";

const NO_IMG = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500";

function formatCondition(condition) {
  switch (condition) {
    case "brand_new": return "Brand New (100%)";
    case "like_new": return "Like New (99%)";
    case "good": return "Good Condition";
    case "fair": return "Fair (Used)";
    case "poor": return "For Parts";
    default: return condition || "Good";
  }
}

function WebsiteTradingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const auth = useSelector((state) => state.auth);
  const isLoggedIn = !!auth.token;
  const user = auth.user;

  // Active Main Tab: 'browse' | 'eligible' | 'my-trades' | 'my-offers'
  const initialTab = searchParams.get("tab") || "browse";
  const [activeTab, setActiveTab] = useState(initialTab);

  // Browse Market State
  const [tradeProducts, setTradeProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [conditionFilter, setConditionFilter] = useState("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Eligible Past Orders State (1-Click Trade Listing)
  const [eligibleItems, setEligibleItems] = useState([]);
  const [loadingEligible, setLoadingEligible] = useState(false);

  // My Trade Listings & Offers
  const [myListings, setMyListings] = useState([]);
  const [receivedOffers, setReceivedOffers] = useState([]);
  const [sentOffers, setSentOffers] = useState([]);
  const [loadingMyTrades, setLoadingMyTrades] = useState(false);

  // Modals State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State: Offer Submission
  const [offerForm, setOfferForm] = useState({
    offered_item_title: "",
    offered_item_description: "",
    offered_cash_difference: "",
    message: "",
    contact_info: ""
  });

  // Form State: Create Trade Listing
  const [createForm, setCreateForm] = useState({
    order_item_id: null,
    title: "",
    description: "",
    category_id: "",
    condition: "good",
    estimated_value: "",
    trading_preference: "",
    location: "Phnom Penh",
    phone_number: "",
    image_url: "",
    imageFile: null
  });

  // Load Public / Filtered Trade Listings
  const fetchMarketplace = async () => {
    try {
      setLoading(true);
      const params = {
        search: search || undefined,
        category_id: categoryFilter !== "all" ? categoryFilter : undefined,
        condition: conditionFilter !== "all" ? conditionFilter : undefined,
        limit: 20
      };
      const res = await getTradeProductsApi(params);
      const list = res?.data?.tradeProducts || res?.data?.data || res?.data || (Array.isArray(res) ? res : []);
      let result = Array.isArray(list) ? list : [];
      if (verifiedOnly) {
        result = result.filter((p) => p.is_store_verified);
      }
      setTradeProducts(result);
    } catch (err) {
      console.warn("Failed to load trade marketplace:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load Categories
  const fetchCategories = async () => {
    try {
      const res = await categoriesApi();
      const raw = res?.data?.categories || res?.data?.data || res?.data || (Array.isArray(res) ? res : []);
      setCategories(Array.isArray(raw) ? raw : []);
    } catch (e) {
      console.warn("Failed to load categories:", e);
    }
  };

  // Load Eligible Past Orders
  const fetchEligibleItems = async () => {
    if (!isLoggedIn) return;
    try {
      setLoadingEligible(true);
      const res = await getEligibleOrderedItemsApi();
      const items = res?.data || (Array.isArray(res) ? res : []);
      setEligibleItems(Array.isArray(items) ? items : []);
    } catch (err) {
      console.warn("Failed to load eligible items:", err);
    } finally {
      setLoadingEligible(false);
    }
  };

  // Load My Listings & Offers
  const fetchMyTradesAndOffers = async () => {
    if (!isLoggedIn) return;
    try {
      setLoadingMyTrades(true);
      const [listingsRes, receivedRes, sentRes] = await Promise.allSettled([
        getMyTradeProductsApi({ limit: 50 }),
        getReceivedTradeOffersApi({ limit: 50 }),
        getSentTradeOffersApi({ limit: 50 })
      ]);

      if (listingsRes.status === "fulfilled") {
        const data = listingsRes.value?.data?.tradeProducts || listingsRes.value?.data || [];
        setMyListings(Array.isArray(data) ? data : []);
      }
      if (receivedRes.status === "fulfilled") {
        const data = receivedRes.value?.data?.offers || receivedRes.value?.data || [];
        setReceivedOffers(Array.isArray(data) ? data : []);
      }
      if (sentRes.status === "fulfilled") {
        const data = sentRes.value?.data?.offers || sentRes.value?.data || [];
        setSentOffers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn("Failed to load my trades:", err);
    } finally {
      setLoadingMyTrades(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (activeTab === "browse") {
      fetchMarketplace();
    } else if (activeTab === "eligible") {
      fetchEligibleItems();
    } else if (activeTab === "my-trades" || activeTab === "my-offers") {
      fetchMyTradesAndOffers();
    }
  }, [activeTab, categoryFilter, conditionFilter, verifiedOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMarketplace();
  };

  // Open Details Modal
  const handleOpenDetail = async (prod) => {
    try {
      const res = await getTradeProductByIdApi(prod.id);
      setSelectedProduct(res?.data || prod);
    } catch (e) {
      setSelectedProduct(prod);
    }
    setIsDetailModalOpen(true);
  };

  // Open Offer Modal
  const handleOpenOfferModal = (prod) => {
    if (!isLoggedIn) {
      toast.error("Please sign in to make a trade offer");
      navigate("/auth/login");
      return;
    }
    setSelectedProduct(prod);
    setOfferForm({
      offered_item_title: "",
      offered_item_description: "",
      offered_cash_difference: "",
      message: "",
      contact_info: user?.phone || user?.email || ""
    });
    setIsDetailModalOpen(false);
    setIsOfferModalOpen(true);
  };

  // Submit Trade Offer
  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      await createTradeOfferApi(selectedProduct.id, {
        offered_item_title: offerForm.offered_item_title,
        offered_item_description: offerForm.offered_item_description,
        offered_cash_difference: offerForm.offered_cash_difference ? parseFloat(offerForm.offered_cash_difference) : 0,
        message: offerForm.message,
        contact_info: offerForm.contact_info
      });

      Swal.fire({
        icon: "success",
        title: "Offer Sent!",
        text: `Your trade offer for "${selectedProduct.title}" has been sent to the owner.`,
        confirmButtonColor: "#059669"
      });

      setIsOfferModalOpen(false);
      fetchMyTradesAndOffers();
    } catch (err) {
      toast.error(err?.message || "Failed to submit trade offer");
    }
  };

  // Open 1-Click Listing from Eligible Ordered Item
  const handleStartEligibleListing = (eligibleItem) => {
    setCreateForm({
      order_item_id: eligibleItem.order_item_id,
      title: eligibleItem.product_name || "",
      description: `Original purchase from AngkorMall on ${new Date(eligibleItem.order_date).toLocaleDateString()}. Condition is well-kept.`,
      category_id: eligibleItem.category?.id || categories[0]?.id || "",
      condition: "like_new",
      estimated_value: eligibleItem.purchase_price ? (eligibleItem.purchase_price * 0.8).toFixed(2) : "",
      trading_preference: "Open to fair exchanges or trade-in",
      location: "Phnom Penh",
      phone_number: user?.phone || "",
      image_url: eligibleItem.image_url || "",
      imageFile: null
    });
    setIsCreateModalOpen(true);
  };

  // Open Custom Trade Listing Modal
  const handleOpenCustomCreate = () => {
    if (!isLoggedIn) {
      toast.error("Please sign in to list items for trade");
      navigate("/auth/login");
      return;
    }
    setCreateForm({
      order_item_id: null,
      title: "",
      description: "",
      category_id: categories[0]?.id || "",
      condition: "good",
      estimated_value: "",
      trading_preference: "",
      location: "Phnom Penh",
      phone_number: user?.phone || "",
      image_url: "",
      imageFile: null
    });
    setIsCreateModalOpen(true);
  };

  // Save Trade Listing
  const handleSaveListing = async (e) => {
    e.preventDefault();
    try {
      if (!createForm.title.trim()) {
        return toast.error("Product title is required");
      }

      const body = new FormData();
      if (createForm.order_item_id) {
        body.append("order_item_id", createForm.order_item_id);
      }
      body.append("title", createForm.title);
      body.append("description", createForm.description || "");
      if (createForm.category_id) body.append("category_id", createForm.category_id);
      body.append("condition", createForm.condition);
      if (createForm.estimated_value) body.append("estimated_value", createForm.estimated_value);
      body.append("trading_preference", createForm.trading_preference || "");
      body.append("location", createForm.location || "");
      body.append("phone_number", createForm.phone_number || "");
      body.append("status", "available");

      if (createForm.imageFile) {
        body.append("image", createForm.imageFile);
      } else if (createForm.image_url) {
        body.append("image_url", createForm.image_url);
      }

      await createTradeProductApi(body);

      Swal.fire({
        icon: "success",
        title: "Listing Created!",
        text: createForm.order_item_id
          ? "Your item is now listed with an AngkorMall Verified Purchase badge!"
          : "Your trade product is now live on the AngkorMall Trade Marketplace!",
        confirmButtonColor: "#059669"
      });

      setIsCreateModalOpen(false);
      fetchMarketplace();
      if (activeTab === "eligible") fetchEligibleItems();
      if (activeTab === "my-trades") fetchMyTradesAndOffers();
    } catch (err) {
      toast.error(err?.message || "Failed to create trade listing");
    }
  };

  // Update Offer Status (Accept / Reject / Complete)
  const handleUpdateOffer = async (offerId, newStatus) => {
    try {
      await updateTradeOfferStatusApi(offerId, newStatus);
      toast.success(`Offer marked as ${newStatus}`);
      fetchMyTradesAndOffers();
    } catch (err) {
      toast.error(err?.message || "Failed to update offer");
    }
  };

  // Delete My Listing
  const handleDeleteMyListing = (item) => {
    Swal.fire({
      title: "Remove Listing?",
      text: `Are you sure you want to remove "${item.title}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, delete"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteTradeProductApi(item.id);
          toast.success("Listing removed");
          fetchMyTradesAndOffers();
        } catch (e) {
          toast.error(e?.message || "Failed to delete listing");
        }
      }
    });
  };

  return (
    <div className="website-trading-page">
      <Toaster position="bottom-right" />
      <Header />

      {/* Hero Banner */}
      <section className="trading-hero-section">
        <div className="trading-hero-container">
          <div className="trading-hero-content">
            <div className="hero-badge-tag">
              <Sparkles size={15} /> AngkorMall Peer-to-Peer Trade & Store Exchange
            </div>
            <h1 className="trading-hero-title">
              Trade, Swap & Exchange Products Safely
            </h1>
            <p className="trading-hero-subtitle">
              Exchange your pre-owned electronics, fashion, and gear with other customers.
              Items purchased from AngkorMall come with automatic <strong>Store Verified Purchase</strong> badges!
            </p>
            <div className="hero-actions-row">
              <button className="btn-hero-primary" onClick={handleOpenCustomCreate}>
                <PlusCircle size={18} /> List Item for Trade
              </button>
              {isLoggedIn && (
                <button
                  className="btn-hero-secondary"
                  onClick={() => setActiveTab("eligible")}
                >
                  <ShieldCheck size={18} /> 1-Click List Past Orders
                </button>
              )}
            </div>
          </div>

          <div className="trading-hero-stats">
            <div className="hero-stat-box">
              <span className="hero-stat-val">100%</span>
              <span className="hero-stat-lbl">Secure Trading</span>
            </div>
            <div className="hero-stat-box">
              <span className="hero-stat-val">Verified</span>
              <span className="hero-stat-lbl">Store Order Proof</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Tabs Navigation */}
      <div className="trading-tabs-container">
        <div className="trading-tabs-bar">
          <button
            className={`trading-tab-btn ${activeTab === "browse" ? "active" : ""}`}
            onClick={() => setActiveTab("browse")}
          >
            <Repeat size={16} /> Explore Trade Market ({tradeProducts.length})
          </button>

          {isLoggedIn && (
            <button
              className={`trading-tab-btn ${activeTab === "eligible" ? "active" : ""}`}
              onClick={() => setActiveTab("eligible")}
            >
              <ShieldCheck size={16} /> List Past Orders (1-Click)
            </button>
          )}

          {isLoggedIn && (
            <button
              className={`trading-tab-btn ${activeTab === "my-trades" ? "active" : ""}`}
              onClick={() => setActiveTab("my-trades")}
            >
              <Tag size={16} /> My Listings ({myListings.length})
            </button>
          )}

          {isLoggedIn && (
            <button
              className={`trading-tab-btn ${activeTab === "my-offers" ? "active" : ""}`}
              onClick={() => setActiveTab("my-offers")}
            >
              <MessageSquare size={16} /> Offers ({receivedOffers.length} Received / {sentOffers.length} Sent)
            </button>
          )}
        </div>
      </div>

      {/* ================= TAB 1: BROWSE MARKETPLACE ================= */}
      {activeTab === "browse" && (
        <main>
          {/* Filters Bar */}
          <div className="trading-market-filters">
            <form onSubmit={handleSearchSubmit} className="trading-search-box">
              <Search size={18} className="trading-search-icon" />
              <input
                type="text"
                placeholder="Search trade items, gadgets, brands, wanted swaps..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>

            <div className="trading-filter-group">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="trading-select-ctrl"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <select
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value)}
                className="trading-select-ctrl"
              >
                <option value="all">All Conditions</option>
                <option value="brand_new">Brand New</option>
                <option value="like_new">Like New (99%)</option>
                <option value="good">Good Condition</option>
                <option value="fair">Fair (Minor Scratches)</option>
              </select>

              <button
                type="button"
                className={`trading-select-ctrl ${verifiedOnly ? "active" : ""}`}
                style={{
                  background: verifiedOnly ? "#ecfdf5" : "#ffffff",
                  color: verifiedOnly ? "#059669" : "#334155",
                  borderColor: verifiedOnly ? "#059669" : "#e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
                onClick={() => setVerifiedOnly(!verifiedOnly)}
              >
                <ShieldCheck size={16} /> Store Verified Only
              </button>
            </div>
          </div>

          {/* Listings Grid */}
          {loading ? (
            <TradeCardSkeleton count={6} />
          ) : tradeProducts.length === 0 ? (
            <div className="trading-empty-card">
              <ArrowRightLeft size={48} className="trading-empty-icon" />
              <h3>No Trade Listings Found</h3>
              <p>Be the first customer to list a trade item or adjust your search filters.</p>
              <button className="btn-hero-primary" onClick={handleOpenCustomCreate}>
                <PlusCircle size={16} /> List Your Item Now
              </button>
            </div>
          ) : (
            <div className="trading-products-grid">
              {tradeProducts.map((prod) => (
                <div key={prod.id} className="trade-card">
                  <div className="trade-card-media" onClick={() => handleOpenDetail(prod)} style={{ cursor: "pointer" }}>
                    <img
                      src={prod.image_url || prod.images?.[0]?.image_url || NO_IMG}
                      alt={prod.title}
                      onError={(e) => (e.target.src = NO_IMG)}
                    />
                    {prod.is_store_verified && (
                      <span className="trade-verified-badge" title="Verified original purchase from AngkorMall">
                        <ShieldCheck size={13} /> Store Verified
                      </span>
                    )}
                    <span className={`trade-condition-tag ${prod.condition || "good"}`}>
                      {formatCondition(prod.condition).split(" ")[0]}
                    </span>
                    {prod.status !== "available" && (
                      <span className={`trade-status-overlay ${prod.status}`}>
                        {prod.status === "in_negotiation" ? "In Negotiation" : prod.status}
                      </span>
                    )}
                  </div>

                  <div className="trade-card-body">
                    <div className="trade-card-category">{prod.category?.name || "General"}</div>
                    <h3 className="trade-card-title" onClick={() => handleOpenDetail(prod)} style={{ cursor: "pointer" }}>
                      {prod.title}
                    </h3>

                    <div className="trade-card-price-row">
                      <span className="trade-value-label">Est. Value</span>
                      <span className="trade-value-amount">${parseFloat(prod.estimated_value || 0).toFixed(2)}</span>
                    </div>

                    <div className="trade-preference-box">
                      <div className="trade-preference-label">
                        <ArrowRightLeft size={12} /> Wanted in Return
                      </div>
                      <p className="trade-preference-text">
                        {prod.trading_preference || "Open to reasonable swap offers"}
                      </p>
                    </div>

                    <div className="trade-card-footer">
                      <div className="trade-seller-info">
                        <MapPin size={13} /> {prod.location || "Phnom Penh"}
                      </div>
                      {prod.status === "available" && (
                        <button
                          className="btn-make-offer"
                          onClick={() => handleOpenOfferModal(prod)}
                        >
                          Make Offer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {/* ================= TAB 2: ELIGIBLE PAST ORDERS (1-CLICK LISTING) ================= */}
      {activeTab === "eligible" && (
        <section className="eligible-items-section">
          <div className="eligible-info-banner">
            <div className="eligible-info-text">
              <h3><ShieldCheck style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} /> 1-Click Store-Verified Trade Listing</h3>
              <p>Items you purchased from completed AngkorMall orders qualify for automatic verified origin proof.</p>
            </div>
            <button className="btn-hero-primary" onClick={handleOpenCustomCreate}>
              <PlusCircle size={16} /> List Non-Store Item
            </button>
          </div>

          {loadingEligible ? (
            <TradeCardSkeleton count={4} />
          ) : eligibleItems.length === 0 ? (
            <div className="trading-empty-card">
              <ShoppingBag size={48} className="trading-empty-icon" />
              <h3>No Eligible Past Purchases Found</h3>
              <p>
                Once you complete and receive an order on AngkorMall, your purchased items will show up here for instant 1-click trade-in!
              </p>
              <button className="btn-hero-primary" onClick={() => navigate("/shop")}>
                Go to Shop Catalog
              </button>
            </div>
          ) : (
            <div className="eligible-items-grid">
              {eligibleItems.map((item) => (
                <div key={item.order_item_id} className="eligible-item-card">
                  <img
                    src={item.image_url || NO_IMG}
                    alt={item.product_name}
                    className="eligible-item-img"
                    onError={(e) => (e.target.src = NO_IMG)}
                  />
                  <div className="eligible-item-details">
                    <h4 className="eligible-item-title">{item.product_name}</h4>
                    <div className="eligible-item-meta">
                      Qty: {item.quantity} | Order #{item.order_id}
                    </div>
                    <div className="eligible-item-actions">
                      <span className="already-listed-badge">
                        <ShieldCheck size={13} /> Store Verified Purchase
                      </span>
                      {item.is_listed ? (
                        <span className="already-listed-badge">Already Listed</span>
                      ) : (
                        <button
                          className="btn-list-eligible"
                          onClick={() => handleOpenEligibleCreate(item)}
                        >
                          <PlusCircle size={14} /> 1-Click Trade
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ================= TAB 3: MY TRADE LISTINGS ================= */}
      {activeTab === "my-trades" && (
        <section className="my-trades-section">
          <div className="my-trades-header-row">
            <div>
              <h3>My Active Trade Listings</h3>
              <p>Manage items you've posted for peer-to-peer exchange or store trade-in.</p>
            </div>
            <button className="btn-hero-primary" onClick={handleOpenCustomCreate}>
              <PlusCircle size={16} /> New Trade Listing
            </button>
          </div>

          {loadingMyTrades ? (
            <TradeCardSkeleton count={4} />
          ) : myListings.length === 0 ? (
            <div className="trading-empty-card">
              <Tag size={48} className="trading-empty-icon" />
              <h3>You Have No Active Trade Listings</h3>
              <p>List your pre-owned items to start receiving exchange offers.</p>
              <button className="btn-hero-primary" onClick={handleOpenCustomCreate}>
                <PlusCircle size={16} /> List An Item Now
              </button>
            </div>
          ) : (
            <div className="trading-products-grid">
              {myListings.map((prod) => (
                <div key={prod.id} className="trade-card">
                  <div className="trade-card-media" onClick={() => handleOpenDetail(prod)}>
                    <img
                      src={prod.image_url || prod.images?.[0]?.image_url || NO_IMG}
                      alt={prod.title}
                      onError={(e) => (e.target.src = NO_IMG)}
                    />
                    <span className={`trade-status-overlay ${prod.status}`}>
                      {prod.status}
                    </span>
                  </div>
                  <div className="trade-card-body">
                    <h3 className="trade-card-title">{prod.title}</h3>
                    <div className="trade-card-price-row">
                      <span className="trade-value-label">Est. Value</span>
                      <span className="trade-value-amount">${parseFloat(prod.estimated_value || 0).toFixed(2)}</span>
                    </div>
                    <div className="trade-card-footer">
                      <button
                        style={{ padding: "6px 12px", fontSize: 12, borderRadius: 8 }}
                        onClick={() => handleDeleteMyListing(item)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ================= TAB 4: MY OFFERS (RECEIVED & SENT) ================= */}
      {activeTab === "my-offers" && (
        <section className="eligible-items-section">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {/* Received Offers */}
            <div style={{ background: "#ffffff", padding: 20, borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 18, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                <MessageSquare size={18} color="#059669" /> Received Offers ({receivedOffers.length})
              </h3>
              {receivedOffers.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: 14 }}>No incoming trade offers yet.</p>
              ) : (
                receivedOffers.map((offer) => (
                  <div key={offer.id} style={{ background: "#f8fafc", padding: 14, borderRadius: 12, marginBottom: 12, border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <strong style={{ fontSize: 14 }}>{offer.sender?.name || "Customer"}</strong>
                      <span style={{ fontSize: 12, fontWeight: 700, textTransform: "capitalize", color: offer.status === "accepted" ? "#16a34a" : "#64748b" }}>
                        {offer.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "#334155", marginBottom: 4 }}>
                      <strong>Offered Item:</strong> {offer.offered_item_title || "Direct exchange"}
                    </div>
                    {offer.offered_cash_difference > 0 && (
                      <div style={{ fontSize: 12, color: "#059669", fontWeight: 600 }}>
                        + Extra Cash Offered: ${parseFloat(offer.offered_cash_difference).toFixed(2)}
                      </div>
                    )}
                    {offer.message && (
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                        "{offer.message}"
                      </div>
                    )}
                    {offer.contact_info && (
                      <div style={{ fontSize: 12, color: "#2563eb", marginTop: 4 }}>
                        Contact: {offer.contact_info}
                      </div>
                    )}
                    {offer.status === "pending" && (
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <button
                          className="btn-hero-primary"
                          style={{ padding: "6px 12px", fontSize: 12 }}
                          onClick={() => handleUpdateOffer(offer.id, "accepted")}
                        >
                          Accept Offer
                        </button>
                        <button
                          className="btn-hero-secondary"
                          style={{ padding: "6px 12px", fontSize: 12, color: "#ef4444", borderColor: "#fca5a5" }}
                          onClick={() => handleUpdateOffer(offer.id, "rejected")}
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Sent Offers */}
            <div style={{ background: "#ffffff", padding: 20, borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 18, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                <ArrowRightLeft size={18} color="#2563eb" /> Sent Trade Offers ({sentOffers.length})
              </h3>
              {sentOffers.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: 14 }}>You haven't sent any trade offers yet.</p>
              ) : (
                sentOffers.map((offer) => (
                  <div key={offer.id} style={{ background: "#f8fafc", padding: 14, borderRadius: 12, marginBottom: 12, border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <strong style={{ fontSize: 14 }}>To: {offer.product?.title || "Item Listing"}</strong>
                      <span style={{ fontSize: 12, fontWeight: 700, textTransform: "capitalize", color: offer.status === "accepted" ? "#16a34a" : "#64748b" }}>
                        {offer.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "#334155" }}>
                      You offered: {offer.offered_item_title || "Exchange proposal"}
                    </div>
                    {offer.offered_cash_difference > 0 && (
                      <div style={{ fontSize: 12, color: "#059669", fontWeight: 600, marginTop: 4 }}>
                        + Extra Cash: ${parseFloat(offer.offered_cash_difference).toFixed(2)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* ================= MODAL 1: VIEW DETAILS ================= */}
      {isDetailModalOpen && selectedProduct && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Trade Product Overview"
        >
          <div>
            {selectedProduct.is_store_verified && (
              <div style={{ background: "#f0fdf4", border: "1px solid #86efac", padding: "12px 16px", borderRadius: 12, marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#166534", fontWeight: 700, fontSize: 14 }}>
                  <ShieldCheck size={18} /> Store Verified AngkorMall Purchase
                </div>
                <div style={{ fontSize: 12, color: "#15803d", marginTop: 4 }}>
                  This product has verified authenticity and was originally purchased through AngkorMall.
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              <img
                src={selectedProduct.image_url || selectedProduct.images?.[0]?.image_url || NO_IMG}
                alt={selectedProduct.title}
                style={{ width: 140, height: 140, borderRadius: 12, objectFit: "cover", border: "1px solid #e2e8f0" }}
                onError={(e) => (e.target.src = NO_IMG)}
              />
              <div>
                <h3 style={{ margin: "0 0 6px", fontSize: 18, color: "#0f172a" }}>{selectedProduct.title}</h3>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <span className={`trade-condition-tag ${selectedProduct.condition || "good"}`} style={{ position: "static" }}>
                    {formatCondition(selectedProduct.condition)}
                  </span>
                  <span className="already-listed-badge">
                    {selectedProduct.category?.name || "General"}
                  </span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#059669" }}>
                  Est. Value: ${parseFloat(selectedProduct.estimated_value || 0).toFixed(2)}
                </div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>
                  Seller: <strong>{selectedProduct.owner?.name || "AngkorMall Member"}</strong> | Location: {selectedProduct.location || "Phnom Penh"}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <h5 style={{ margin: "0 0 4px", fontSize: 13, color: "#475569" }}>Description</h5>
              <p style={{ margin: 0, fontSize: 13, color: "#334155", background: "#f8fafc", padding: 10, borderRadius: 8 }}>
                {selectedProduct.description || "No specific notes provided by seller."}
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h5 style={{ margin: "0 0 4px", fontSize: 13, color: "#475569" }}>Trading Preference (What seller wants in return)</h5>
              <p style={{ margin: 0, fontSize: 13, color: "#065f46", background: "#ecfdf5", padding: 10, borderRadius: 8 }}>
                {selectedProduct.trading_preference || "Open to any fair exchanges"}
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button className="btn-hero-secondary" style={{ color: "#334155", borderColor: "#cbd5e1" }} onClick={() => setIsDetailModalOpen(false)}>
                Close
              </button>
              {selectedProduct.status === "available" && (
                <button className="btn-make-offer" onClick={() => handleOpenOfferModal(selectedProduct)}>
                  <ArrowRightLeft size={16} /> Make Trade Offer
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* ================= MODAL 2: SUBMIT TRADE OFFER ================= */}
      {isOfferModalOpen && selectedProduct && (
        <Modal
          isOpen={isOfferModalOpen}
          onClose={() => setIsOfferModalOpen(false)}
          title={`Propose Trade for "${selectedProduct.title}"`}
        >
          <form onSubmit={handleSubmitOffer}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="trade-input-group">
                <label>What item are you offering to swap? *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sony WH-1000XM5 Headphones (Like New)"
                  value={offerForm.offered_item_title}
                  onChange={(e) => setOfferForm({ ...offerForm, offered_item_title: e.target.value })}
                />
              </div>

              <div className="trade-input-group">
                <label>Item Condition & Description</label>
                <textarea
                  rows={2}
                  placeholder="Mention color, warranty, original box, condition..."
                  value={offerForm.offered_item_description}
                  onChange={(e) => setOfferForm({ ...offerForm, offered_item_description: e.target.value })}
                />
              </div>

              <div className="trade-input-group">
                <label>Extra Cash Difference ($ USD, optional)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 50 (if you are adding cash on top)"
                  value={offerForm.offered_cash_difference}
                  onChange={(e) => setOfferForm({ ...offerForm, offered_cash_difference: e.target.value })}
                />
              </div>

              <div className="trade-input-group">
                <label>Your Contact Phone / Telegram *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 012 345 678"
                  value={offerForm.contact_info}
                  onChange={(e) => setOfferForm({ ...offerForm, contact_info: e.target.value })}
                />
              </div>

              <div className="trade-input-group">
                <label>Message to Seller</label>
                <textarea
                  rows={2}
                  placeholder="Hi! I'm interested in trading my item with you..."
                  value={offerForm.message}
                  onChange={(e) => setOfferForm({ ...offerForm, message: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsOfferModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-make-offer">
                  Send Trade Proposal
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* ================= MODAL 3: CREATE TRADE LISTING ================= */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title={createForm.order_item_id ? "List Store Item for Trade" : "Create New Trade Listing"}
        >
          <form onSubmit={handleSaveListing}>
            {createForm.order_item_id && (
              <div style={{ background: "#f0fdf4", border: "1px solid #86efac", padding: 12, borderRadius: 10, marginBottom: 14, fontSize: 13, color: "#166534" }}>
                <ShieldCheck style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                This listing will be automatically verified as an authentic store order purchase.
              </div>
            )}

            <div className="trade-form-grid">
              <div className="trade-input-group trade-form-full">
                <label>Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. iPhone 14 Pro Max 256GB Gold"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                />
              </div>

              <div className="trade-input-group">
                <label>Category</label>
                <select
                  value={createForm.category_id}
                  onChange={(e) => setCreateForm({ ...createForm, category_id: e.target.value })}
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="trade-input-group">
                <label>Item Condition</label>
                <select
                  value={createForm.condition}
                  onChange={(e) => setCreateForm({ ...createForm, condition: e.target.value })}
                >
                  <option value="brand_new">Brand New (100% Sealed)</option>
                  <option value="like_new">Like New (99%)</option>
                  <option value="good">Good Condition</option>
                  <option value="fair">Fair (Visible Wear)</option>
                  <option value="poor">For Parts</option>
                </select>
              </div>

              <div className="trade-input-group">
                <label>Estimated Value ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 550"
                  value={createForm.estimated_value}
                  onChange={(e) => setCreateForm({ ...createForm, estimated_value: e.target.value })}
                />
              </div>

              <div className="trade-input-group">
                <label>Contact Phone</label>
                <input
                  type="text"
                  placeholder="e.g. 012 345 678"
                  value={createForm.phone_number}
                  onChange={(e) => setCreateForm({ ...createForm, phone_number: e.target.value })}
                />
              </div>

              <div className="trade-input-group trade-form-full">
                <label>Trading Preference (What do you want in exchange?)</label>
                <input
                  type="text"
                  placeholder="e.g. Looking to swap for Samsung S23 Ultra or iPad Air"
                  value={createForm.trading_preference}
                  onChange={(e) => setCreateForm({ ...createForm, trading_preference: e.target.value })}
                />
              </div>

              <div className="trade-input-group trade-form-full">
                <label>Location</label>
                <input
                  type="text"
                  placeholder="e.g. Phnom Penh, Toul Kork"
                  value={createForm.location}
                  onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                />
              </div>

              <div className="trade-input-group trade-form-full">
                <label>Detailed Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe battery health, accessories included, original box..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                />
              </div>

              <div className="trade-input-group trade-form-full">
                <label>Product Photo (Upload file or Image URL)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCreateForm({ ...createForm, imageFile: e.target.files[0] })}
                  style={{ marginBottom: 6 }}
                />
                <input
                  type="text"
                  placeholder="Or paste image URL"
                  value={createForm.image_url}
                  onChange={(e) => setCreateForm({ ...createForm, image_url: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn-make-offer">
                Publish Trade Listing
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default WebsiteTradingPage;
