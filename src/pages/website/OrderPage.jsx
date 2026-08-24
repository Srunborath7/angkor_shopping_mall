import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  User,
  Package,
  Heart,
  ChevronRight,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  Clock,
  ChevronDown,
  ChevronUp,
  CreditCard,
  QrCode
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Header from "../../components/Header";
import { getOrdersApi } from "../../services/orderService";
import KhqrPaymentModal from "../../components/KhqrPaymentModal";
import "./styles/OrderPage.css";

function OrderPage() {
  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth);

  const isLoggedIn = !!auth.token;
  const user = auth.user;
  const role = auth.role;

  // Tabs state: 'overview' | 'orders' | 'wishlist'
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [khqrModal, setKhqrModal] = useState({
    isOpen: false,
    orderId: null,
    orderNumber: "",
    amount: 0
  });

  // Load orders from API & localStorage fallback
  const loadOrders = async () => {
    if (isLoggedIn) {
      try {
        const res = await getOrdersApi();
        // Handle various Axios/fetch response wrappings
        const payload = res?.data?.data || res?.data || res || {};
        const apiOrders = Array.isArray(payload) ? payload : (Array.isArray(payload.orders) ? payload.orders : []);
        
        if (apiOrders && apiOrders.length >= 0) {
          const formattedOrders = apiOrders.map((order) => ({
            id: `#ORD-${order.id}`,
            rawId: order.id,
            date: new Date(order.created_at || order.createdAt || Date.now()).toISOString().split("T")[0],
            items: order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0, // calculate total quantity
            subtotal: parseFloat(order.subtotal_amount || order.total_amount || 0).toFixed(2),
            tradeInDiscount: parseFloat(order.trade_in_discount || 0),
            tradeInProduct: order.trade_in_product || null,
            total: parseFloat(order.total_amount || 0).toFixed(2),
            status: order.status ? (order.status.charAt(0).toUpperCase() + order.status.slice(1)) : "Pending",
            paymentMethod: order.payment_intent_id ? "Online Pay (Paid)" : "ABA KHQR / COD",
            shippingInfo: {
              fullName: user?.name || "Customer",
              email: user?.email || "",
              phone: order.contact_phone || "099888777",
              address: order.shipping_address || "Phnom Penh",
              city: ""
            },
            products: (order.items || []).map((item) => ({
              id: item.product?.id || item.product_id,
              name: item.product?.name || "Product Item",
              price: parseFloat(item.price || item.product?.price || 0),
              image: item.images?.[0]?.image_url || item.product?.images?.[0]?.image_url || item.product?.image_url || item.product?.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
              quantity: item.quantity
            }))
          }));
          setOrders(formattedOrders);
          localStorage.setItem("orders", JSON.stringify(formattedOrders));
          return;
        }
      } catch (err) {
        console.warn("Failed to load orders API, using fallback:", err);
      }
    }

    const saved = localStorage.getItem("orders");
    if (saved) {
      try {
        setOrders(JSON.parse(saved));
      } catch {
        setOrders([]);
      }
    } else {
      setOrders([]);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadOrders();
    }
  }, [isLoggedIn]);

  // Mock order prepopulation removed to use API data only

  const toggleOrderDetails = (id) => {
    if (expandedOrderId === id) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(id);
    }
  };

  const getStatusClass = (status) => {
    if (status === "Delivered") return "status-delivered";
    if (status === "Shipped") return "status-shipped";
    if (status === "Processing") return "status-processing";
    return "status-pending"; // Default
  };

  // If not logged in, render unauthenticated CTA screen
  if (!isLoggedIn) {
    return (
      <div className="orders-unauth-layout">
        <Toaster position="bottom-right" />
        <Header />
        
        <div className="unauth-container">
          <div className="unauth-card">
            <Package size={64} className="unauth-icon animate-pulse" />
            <h2>Access Denied</h2>
            <p>Please sign in to view your orders, track shipments, and check your wishlist history.</p>
            <button className="unauth-login-btn" onClick={() => navigate("/auth/login")}>
              Sign In to Your Account
            </button>
            <button className="unauth-home-btn" onClick={() => navigate("/")}>
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalOrdersCount = orders.length;
  const totalSpent = orders.reduce((acc, curr) => acc + parseFloat(curr.total), 0).toFixed(2);
  
  let wishlistCount = 0;
  try {
    const saved = localStorage.getItem("wishlist");
    wishlistCount = saved ? JSON.parse(saved).length : 0;
  } catch {}

  return (
    <div className="orders-page-layout">
      <Toaster position="bottom-right" />
      
      {/* Shared Header Navigation */}
      <Header />

      {/* Breadcrumbs */}
      <div className="shop-breadcrumbs-section">
        <div className="breadcrumbs-container">
          <span className="breadcrumb-link" onClick={() => navigate("/")}>Home</span>
          <ChevronRight size={14} className="breadcrumb-arrow" />
          <span className="breadcrumb-current">My Account</span>
        </div>
      </div>

      {/* Profile Page Grid Workspace */}
      <div className="profile-workspace-container">
        <div className="profile-grid-wrapper">
          
          {/* Left Sidebar Menu */}
          <aside className="profile-sidebar-aside">
            <div className="profile-brief-card">
              <div className="profile-brief-avatar">
                {user?.name ? user.name[0].toUpperCase() : <User />}
              </div>
              <div className="profile-brief-details">
                <h3>{user?.name}</h3>
                <span>{user?.email}</span>
                <span className="badge-brief-role">{role ? role.toUpperCase() : "CUSTOMER"}</span>
              </div>
            </div>

            <nav className="profile-sidebar-nav">
              <button 
                className={`profile-nav-btn ${activeTab === "overview" ? "active" : ""}`}
                onClick={() => setActiveTab("overview")}
              >
                <User size={16} />
                <span>Profile Overview</span>
              </button>
              <button 
                className={`profile-nav-btn ${activeTab === "orders" ? "active" : ""}`}
                onClick={() => setActiveTab("orders")}
              >
                <Package size={16} />
                <span>My Orders ({totalOrdersCount})</span>
              </button>
              <button 
                className="profile-nav-btn"
                onClick={() => { navigate("/shop"); toast("Manage wishlist from the Shop page!"); }}
              >
                <Heart size={16} />
                <span>Wishlist ({wishlistCount})</span>
              </button>
            </nav>
          </aside>

          {/* Right Main Content Panel */}
          <main className="profile-content-main">
            
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="overview-tab-content">
                <div className="welcome-banner-card">
                  <h2>Welcome back, {user?.name?.split(" ")[0]}!</h2>
                  <p>Manage your orders, edit shipping preferences, and track your account statistics from one premium board.</p>
                </div>

                {/* Dashboard Stats */}
                <div className="dashboard-stats-grid">
                  <div className="dashboard-stat-card">
                    <Package size={24} className="stat-card-icon green" />
                    <div className="stat-card-text">
                      <span className="stat-card-label">Total Orders</span>
                      <span className="stat-card-val">{totalOrdersCount}</span>
                    </div>
                  </div>

                  <div className="dashboard-stat-card">
                    <Heart size={24} className="stat-card-icon red" />
                    <div className="stat-card-text">
                      <span className="stat-card-label">Wishlist Items</span>
                      <span className="stat-card-val">{wishlistCount}</span>
                    </div>
                  </div>

                  <div className="dashboard-stat-card">
                    <CreditCard size={24} className="stat-card-icon blue" />
                    <div className="stat-card-text">
                      <span className="stat-card-label">Total Expenditure</span>
                      <span className="stat-card-val">${totalSpent}</span>
                    </div>
                  </div>

                  <div className="dashboard-stat-card">
                    <ShieldCheck size={24} className="stat-card-icon gold" />
                    <div className="stat-card-text">
                      <span className="stat-card-label">Account Status</span>
                      <span className="stat-card-val text-green">Verified</span>
                    </div>
                  </div>
                </div>

                {/* User Details Details Card */}
                <div className="user-details-card">
                  <h3>Account Credentials</h3>
                  <div className="details-rows-list">
                    <div className="details-row-item">
                      <div className="row-label"><Mail size={14} /> Email Address</div>
                      <div className="row-value">{user?.email}</div>
                    </div>
                    <div className="details-row-item">
                      <div className="row-label"><ShieldCheck size={14} /> Assigned Role</div>
                      <div className="row-value text-green bold">{role ? role.toUpperCase() : "CUSTOMER"}</div>
                    </div>
                    <div className="details-row-item">
                      <div className="row-label"><Phone size={14} /> Phone Support</div>
                      <div className="row-value">099 888 777 (Support Helpline)</div>
                    </div>
                    <div className="details-row-item">
                      <div className="row-label"><MapPin size={14} /> Default Store Branch</div>
                      <div className="row-value">Angkor Mall, Phnom Penh Central</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === "orders" && (
              <div className="orders-tab-content">
                <div className="orders-header-row">
                  <h3>Recent Orders History</h3>
                  <span className="order-counter-badge">{orders.length} orders total</span>
                </div>

                {orders.length === 0 ? (
                  <div className="empty-orders-view">
                    <ShoppingBag size={48} className="empty-orders-icon" />
                    <h4>No Orders Placed</h4>
                    <p>You haven't ordered any items yet. Visit our shop and get started!</p>
                    <button className="orders-shop-btn" onClick={() => navigate("/shop")}>
                      Explore Shop Catalog
                    </button>
                  </div>
                ) : (
                  <div className="orders-table-wrapper">
                    {orders.map((order) => (
                      <div key={order.id} className="accordion-order-item">
                        {/* Accordion header row */}
                        <div 
                          className={`order-accordion-header ${expandedOrderId === order.id ? "expanded" : ""}`}
                          onClick={() => toggleOrderDetails(order.id)}
                        >
                          <div className="order-main-meta">
                            <span className="meta-id">{order.id}</span>
                            <span className="meta-date"><Clock size={12} /> {order.date}</span>
                          </div>

                          <div className="order-summary-meta">
                            <span className="meta-items-count">{order.items} {order.items === 1 ? "item" : "items"}</span>
                            <span className="meta-total bold">${order.total}</span>
                          </div>

                          <div className="order-status-meta">
                            <span className={`status-badge-tag ${getStatusClass(order.status)}`}>
                              {order.status}
                            </span>
                            {expandedOrderId === order.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </div>
                        </div>

                        {/* Accordion details panel */}
                        {expandedOrderId === order.id && (
                          <div className="order-accordion-details">
                            {/* Billing & Address */}
                            <div className="order-details-grid-2col">
                              <div className="details-info-card">
                                <h5>Shipping Details</h5>
                                <p className="bold-name">{order.shippingInfo.fullName}</p>
                                <p><Mail size={12} /> {order.shippingInfo.email}</p>
                                <p><Phone size={12} /> {order.shippingInfo.phone}</p>
                                <p><MapPin size={12} /> {order.shippingInfo.address}, {order.shippingInfo.city}</p>
                              </div>

                              <div className="details-info-card">
                                <h5>Order Calculations</h5>
                                <div className="billing-details-lines">
                                  <div className="billing-line">
                                    <span>Payment Mode:</span>
                                    <span className="bold">{order.paymentMethod || "COD"}</span>
                                  </div>
                                  <div className="billing-line">
                                    <span>Subtotal:</span>
                                    <span>${order.subtotal || order.total}</span>
                                  </div>
                                  {order.tradeInDiscount > 0 && (
                                    <div className="billing-line" style={{ color: "#16a34a", fontWeight: 600 }}>
                                      <span>Trade-In Credit Applied:</span>
                                      <span>-${order.tradeInDiscount.toFixed(2)}</span>
                                    </div>
                                  )}
                                  <div className="billing-line">
                                    <span>Shipping Delivery:</span>
                                    <span>$4.99</span>
                                  </div>
                                  <div className="billing-line total-highlight">
                                    <span>Grand Total:</span>
                                    <span className="bold text-green">${order.total}</span>
                                  </div>
                                </div>

                                {String(order.status).toLowerCase().includes("pending") && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setKhqrModal({
                                        isOpen: true,
                                        orderId: order.rawId || order.id?.replace("#ORD-", ""),
                                        orderNumber: order.id,
                                        amount: parseFloat(order.total)
                                      })
                                    }
                                    style={{
                                      marginTop: "12px",
                                      width: "100%",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      gap: "8px",
                                      padding: "10px",
                                      background: "linear-gradient(135deg, #e11d48 0%, #be123c 100%)",
                                      color: "#ffffff",
                                      border: "none",
                                      borderRadius: "12px",
                                      fontWeight: 700,
                                      fontSize: "13px",
                                      cursor: "pointer",
                                      boxShadow: "0 4px 12px rgba(225, 29, 72, 0.25)"
                                    }}
                                  >
                                    <QrCode size={16} /> Pay with Bakong KHQR
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Products breakdown */}
                            <div className="details-products-section">
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                <h5 style={{ margin: 0 }}>Products Purchased</h5>
                                <button
                                  type="button"
                                  className="order-tradein-btn"
                                  onClick={() => navigate("/trading?tab=eligible")}
                                >
                                  🔄 Trade-In / List Items for Exchange
                                </button>
                              </div>
                              <div className="products-mini-cards-list">
                                {order.products.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="product-mini-card"
                                    onClick={() => navigate(`/product/${item.id || item.product_id || 1}`)}
                                    style={{ cursor: "pointer" }}
                                  >
                                    <img src={item.image} alt={item.name} />
                                    <div className="mini-card-info">
                                      <h6>{item.name}</h6>
                                      <span>Qty: <strong>{item.quantity}</strong> &times; ${item.price}</span>
                                    </div>
                                    <span className="mini-card-total-cost bold">
                                      ${(item.price * item.quantity).toFixed(2)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>

        </div>
      </div>

      {/* Bakong KHQR Payment Modal */}
      <KhqrPaymentModal
        isOpen={khqrModal.isOpen}
        onClose={() => setKhqrModal((prev) => ({ ...prev, isOpen: false }))}
        orderId={khqrModal.orderId}
        orderNumber={khqrModal.orderNumber}
        amount={khqrModal.amount}
        onSuccess={() => {
          loadOrders();
        }}
      />
    </div>
  );
}

export default OrderPage;
