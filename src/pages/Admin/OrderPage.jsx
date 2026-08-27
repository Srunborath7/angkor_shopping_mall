import React, { useEffect, useState, useMemo } from "react";
import {
  FaShoppingCart,
  FaPlus,
  FaSearch,
  FaEye,
  FaTrash,
  FaSync,
  FaSlidersH,
  FaDollarSign,
  FaClock,
  FaCheckCircle,
  FaTruck,
  FaTimesCircle,
  FaFileInvoice,
  FaPrint,
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaBan,
  FaTag,
  FaBox,
  FaEnvelope,
  FaBoxes,
  FaTimes
} from "react-icons/fa";
import Swal from "sweetalert2";
import {
  getAdminOrdersApi,
  updateOrderStatusApi,
  deleteOrderApi,
  createAdminOrderApi
} from "../../services/orderService";
import { CustomersApi } from "../../services/customerService";
import { productsApi } from "../../services/productsService";
import Modal from "../../components/Modal";
import { TableSkeleton } from "../../components/loading/LoadingSkeleton";
import { usePermissions, AccessDeniedView } from "../../hooks/usePermissions.jsx";
import "./style/OrderPage.css";

function OrderPage() {
  const { can } = usePermissions();
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Column Visibility
  const [isColDropdownOpen, setIsColDropdownOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    orderId: true,
    customer: true,
    date: true,
    items: true,
    total: true,
    status: true,
    actions: true
  });

  // View Order Details Modal
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Customer Detail Modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Items Detail Modal
  const [isItemsModalOpen, setIsItemsModalOpen] = useState(false);
  const [selectedOrderItems, setSelectedOrderItems] = useState(null);

  // Create Order Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createUserId, setCreateUserId] = useState("");
  const [createAddress, setCreateAddress] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createStatus, setCreateStatus] = useState("pending");
  const [createItems, setCreateItems] = useState([
    { product_id: "", quantity: 1, price: 0 }
  ]);

  // Fetch Orders, Customers, Products
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await getAdminOrdersApi();
      const data = res.data || (Array.isArray(res) ? res : []);
      setOrders(data);
    } catch (error) {
      Swal.fire("Error", error.message || "Failed to load orders", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await CustomersApi();
      setCustomers(res.data || []);
    } catch (err) {
      console.error("Failed to load customers:", err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await productsApi();
      const data = res.data?.products || res.data || (Array.isArray(res) ? res : []);
      setProducts(data);
    } catch (err) {
      console.error("Failed to load products:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchProducts();
  }, []);

  // Filter and Sort Orders
  const filteredOrders = useMemo(() => {
    return orders
      .filter((ord) => {
        const searchLower = search.toLowerCase();
        const orderIdStr = (ord.id || "").toLowerCase();
        const customerName = (ord.user?.name || "").toLowerCase();
        const customerEmail = (ord.user?.email || "").toLowerCase();
        const customerPhone = (ord.contact_phone || ord.user?.phone || "").toLowerCase();
        const address = (ord.shipping_address || "").toLowerCase();

        const matchesSearch =
          !search ||
          orderIdStr.includes(searchLower) ||
          customerName.includes(searchLower) ||
          customerEmail.includes(searchLower) ||
          customerPhone.includes(searchLower) ||
          address.includes(searchLower);

        const matchesStatus =
          statusFilter === "all" || ord.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "newest") return new Date(b.created_at) - new Date(a.created_at);
        if (sortBy === "oldest") return new Date(a.created_at) - new Date(b.created_at);
        if (sortBy === "total_high") return parseFloat(b.total_amount) - parseFloat(a.total_amount);
        if (sortBy === "total_low") return parseFloat(a.total_amount) - parseFloat(b.total_amount);
        return 0;
      });
  }, [orders, search, statusFilter, sortBy]);

  // Statistics Summary
  const stats = useMemo(() => {
    const totalCount = orders.length;
    const totalRev = orders
      .filter((o) => o.status !== "cancelled" && o.status !== "failed")
      .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
    const pendingCount = orders.filter((o) => o.status === "pending").length;
    const completedCount = orders.filter((o) => o.status === "completed" || o.status === "paid").length;
    return { totalCount, totalRev, pendingCount, completedCount };
  }, [orders]);

  // Handle Quick Status Change
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatusApi(orderId, { status: newStatus });
      Swal.fire({
        icon: "success",
        title: "Status Updated",
        text: `Order status changed to ${newStatus.toUpperCase()}`,
        timer: 1500,
        showConfirmButton: false
      });
      setOrders((prev) =>
        prev.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      Swal.fire("Error", error.message || "Failed to update order status", "error");
    }
  };

  // Handle Delete Order
  const handleDeleteOrder = (orderId) => {
    Swal.fire({
      title: "Delete Order?",
      text: "Are you sure you want to delete this order? This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Delete"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteOrderApi(orderId);
          setOrders((prev) => prev.filter((o) => o.id !== orderId));
          Swal.fire("Deleted!", "Order has been deleted successfully.", "success");
        } catch (error) {
          Swal.fire("Error", error.message || "Failed to delete order", "error");
        }
      }
    });
  };

  const toggleColumn = (colKey) => {
    setVisibleColumns((prev) => ({ ...prev, [colKey]: !prev[colKey] }));
  };

  // Open Create Order Modal
  const openCreateModal = () => {
    setCreateUserId(customers.length > 0 ? customers[0].id : "");
    setCreateAddress("");
    setCreatePhone("");
    setCreateStatus("pending");
    setCreateItems([
      {
        product_id: products.length > 0 ? products[0].id : "",
        quantity: 1,
        price: products.length > 0 ? products[0].price : 0
      }
    ]);
    setIsCreateModalOpen(true);
  };

  const handleAddItemRow = () => {
    const defaultProduct = products.length > 0 ? products[0] : null;
    setCreateItems((prev) => [
      ...prev,
      {
        product_id: defaultProduct ? defaultProduct.id : "",
        quantity: 1,
        price: defaultProduct ? defaultProduct.price : 0
      }
    ]);
  };

  const handleRemoveItemRow = (index) => {
    if (createItems.length === 1) return;
    setCreateItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setCreateItems((prev) => {
      const updated = [...prev];
      if (field === "product_id") {
        const prod = products.find((p) => String(p.id) === String(value));
        updated[index] = {
          ...updated[index],
          product_id: value,
          price: prod ? prod.price : updated[index].price
        };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  };

  const handleCreateOrderSubmit = async (e) => {
    e.preventDefault();
    if (!createUserId) return Swal.fire("Validation Error", "Please select a customer.", "warning");
    if (!createAddress.trim()) return Swal.fire("Validation Error", "Please provide a shipping address.", "warning");
    if (!createPhone.trim()) return Swal.fire("Validation Error", "Please provide a contact phone number.", "warning");

    try {
      const payload = {
        user_id: createUserId,
        shipping_address: createAddress,
        contact_phone: createPhone,
        status: createStatus,
        items: createItems.map((item) => ({
          product_id: item.product_id,
          quantity: parseInt(item.quantity, 10) || 1
        }))
      };
      await createAdminOrderApi(payload);
      Swal.fire("Success", "Order created successfully!", "success");
      setIsCreateModalOpen(false);
      fetchOrders();
    } catch (error) {
      Swal.fire("Error", error.message || "Failed to create order", "error");
    }
  };

  // Render Status Badge
  const renderStatusPill = (status) => {
    const statusMap = {
      pending: { label: "Pending", icon: <FaClock />, class: "pending" },
      paid: { label: "Paid", icon: <FaCheckCircle />, class: "paid" },
      shipped: { label: "Shipped", icon: <FaTruck />, class: "shipped" },
      completed: { label: "Completed", icon: <FaCheckCircle />, class: "completed" },
      cancelled: { label: "Cancelled", icon: <FaBan />, class: "cancelled" },
      failed: { label: "Failed", icon: <FaTimesCircle />, class: "failed" }
    };
    const current = statusMap[status] || { label: status, icon: <FaClock />, class: "pending" };
    return (
      <span className={`status-pill ${current.class}`}>
        {current.icon}
        {current.label}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const handlePrintInvoice = () => window.print();

  // Render variant attributes as colored badges
  const renderAttributeBadges = (attributes) => {
    if (!attributes || typeof attributes !== "object") {
      return <span className="no-variant-pill">Standard / Default</span>;
    }
    const entries = Object.entries(attributes).filter(
      ([k, v]) => v !== null && v !== undefined && v !== "" && k !== "is_flash_sale" && k !== "flash_price"
    );
    if (entries.length === 0) {
      return <span className="no-variant-pill">Standard Item</span>;
    }
    return (
      <div className="attr-badges-row">
        {entries.map(([key, value], idx) => {
          const isColor = key.toLowerCase().includes("color");
          return (
            <span key={key} className={`attr-badge attr-type-${(idx % 6) + 1}`}>
              {isColor && (
                <span
                  className="attr-color-dot"
                  style={{
                    backgroundColor: String(value).toLowerCase(),
                    border: "1px solid rgba(0,0,0,0.15)"
                  }}
                />
              )}
              <strong className="attr-key">{key}:</strong>
              <span className="attr-val">{String(value)}</span>
            </span>
          );
        })}
      </div>
    );
  };

  // Open customer detail modal
  const openCustomerModal = (ord, e) => {
    e.stopPropagation();
    setSelectedCustomer({
      name: ord.user?.name || "Guest Customer",
      email: ord.user?.email || "—",
      phone: ord.contact_phone || ord.user?.phone || "—",
      address: ord.shipping_address || "—",
      orderId: ord.id,
      orderStatus: ord.status,
      totalAmount: ord.total_amount,
      orderDate: ord.created_at
    });
    setIsCustomerModalOpen(true);
  };

  // Open items detail modal
  const openItemsModal = (ord, e) => {
    e.stopPropagation();
    setSelectedOrderItems({ orderId: ord.id, items: ord.items || [] });
    setIsItemsModalOpen(true);
  };

  if (!can("orders", "view")) {
    return <AccessDeniedView moduleName="Orders & Invoicing" />;
  }

  return (
    <div className="order-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-title">
          <h1>Order Management</h1>
          <p>View, process, and track customer orders in real-time</p>
        </div>
        <div className="header-actions">
          <button className="refresh-btn" onClick={fetchOrders} title="Refresh Orders">
            <FaSync className={loading ? "spin" : ""} /> Refresh
          </button>
          {can("orders", "process") && (
            <button className="add-btn" onClick={openCreateModal}>
              <FaPlus /> Place New Order
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="order-stats">
        <div className="order-stat-card total-status">
          <div className="stat-info">
            <p>Total Orders</p>
            <h1>{stats.totalCount}</h1>
          </div>
          <div className="icon-box"><FaShoppingCart /></div>
        </div>
        <div className="order-stat-card active-status">
          <div className="stat-info">
            <p>Total Sales</p>
            <h1>${stats.totalRev.toFixed(2)}</h1>
          </div>
          <div className="icon-box"><FaDollarSign /></div>
        </div>
        <div className="order-stat-card stock-warning">
          <div className="stat-info">
            <p>Pending Orders</p>
            <h1>{stats.pendingCount}</h1>
          </div>
          <div className="icon-box"><FaClock /></div>
        </div>
        <div className="order-stat-card stock-value">
          <div className="stat-info">
            <p>Completed / Paid</p>
            <h1>{stats.completedCount}</h1>
          </div>
          <div className="icon-box"><FaCheckCircle /></div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="order-controls">
        <div className="search-filter-group">
          <div className="search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Search by Order ID, customer, phone, address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="shipped">Shipped</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="failed">Failed</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="total_high">Total: High to Low</option>
            <option value="total_low">Total: Low to High</option>
          </select>
        </div>

        {/* Column Visibility Manager */}
        <div className="column-toggle-wrapper">
          <button
            className="column-toggle-btn"
            onClick={() => setIsColDropdownOpen(!isColDropdownOpen)}
          >
            <FaSlidersH /> Columns
          </button>
          {isColDropdownOpen && (
            <div className="column-toggle-menu">
              {["orderId", "customer", "date", "items", "total", "status", "actions"].map((col) => (
                <label key={col} className="column-toggle-item">
                  <input
                    type="checkbox"
                    checked={visibleColumns[col]}
                    onChange={() => toggleColumn(col)}
                  />
                  {col === "orderId" ? "Order ID" :
                   col === "items" ? "Items Preview" :
                   col === "total" ? "Total Amount" :
                   col.charAt(0).toUpperCase() + col.slice(1)}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Orders Data Table */}
      {loading && orders.length === 0 ? (
        <TableSkeleton rows={6} cols={7} hasAvatar={true} />
      ) : (
        <div className="order-table-container">
          <div className="table-responsive">
            <table className="order-table">
              <thead>
                <tr>
                  {visibleColumns.orderId && <th>Order ID</th>}
                  {visibleColumns.customer && <th>Customer</th>}
                  {visibleColumns.date && <th>Date & Time</th>}
                  {visibleColumns.items && <th>Items Summary</th>}
                  {visibleColumns.total && <th>Total Amount</th>}
                  {visibleColumns.status && <th>Status</th>}
                  {visibleColumns.actions && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      <div className="order-empty-state">
                        <FaShoppingCart />
                        <h4>No orders found</h4>
                        <p>Try adjusting your search or filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                filteredOrders.map((ord) => {
                  const customerName = ord.user?.name || "Guest Customer";
                  const initial = customerName.charAt(0).toUpperCase();
                  const itemCount = ord.items ? ord.items.length : 0;

                  return (
                    <tr key={ord.id}>
                      {visibleColumns.orderId && (
                        <td>
                          <span
                            className="order-id-code"
                            title={ord.id}
                            onClick={() => { setSelectedOrder(ord); setIsViewModalOpen(true); }}
                            style={{ cursor: "pointer" }}
                          >
                            #ORD-{ord.id.slice(-6).toUpperCase()}
                          </span>
                        </td>
                      )}

                      {/* CLICKABLE CUSTOMER COLUMN */}
                      {visibleColumns.customer && (
                        <td>
                          <div
                            className="customer-cell clickable-cell"
                            onClick={(e) => openCustomerModal(ord, e)}
                            title="Click to view customer details"
                          >
                            <div className="customer-avatar">{initial}</div>
                            <div className="customer-info">
                              <span className="name customer-link">{customerName}</span>
                              <span className="contact">
                                {ord.contact_phone || ord.user?.phone || ord.user?.email || "No contact"}
                              </span>
                            </div>
                          </div>
                        </td>
                      )}

                      {visibleColumns.date && (
                        <td>{formatDate(ord.created_at)}</td>
                      )}

                      {/* CLICKABLE ITEMS SUMMARY COLUMN */}
                      {visibleColumns.items && (
                        <td>
                          <div
                            className="items-preview clickable-cell"
                            onClick={(e) => openItemsModal(ord, e)}
                            title="Click to view order items & variants"
                          >
                            <div className="item-thumb-list">
                              {ord.items &&
                                ord.items.slice(0, 3).map((item, idx) => (
                                  <img
                                    key={idx}
                                    src={item.product?.image_url || item.product?.images?.[0]?.image_url || "https://placehold.co/40"}
                                    alt={item.product?.name || "Product"}
                                    className="item-thumb-img"
                                  />
                                ))}
                            </div>
                            <div className="items-summary-text">
                              <span className="item-count-badge">
                                {itemCount} {itemCount === 1 ? "item" : "items"}
                              </span>
                              {/* Show first item's variant attributes as preview */}
                              {ord.items && ord.items[0] && (
                                (() => {
                                  const attrs = ord.items[0].attributes || ord.items[0].variant?.attributes || {};
                                  const attrEntries = Object.entries(attrs).filter(([, v]) => v);
                                  return attrEntries.length > 0 ? (
                                    <span className="variant-preview-tag">
                                      {attrEntries[0][0]}: {attrEntries[0][1]}
                                      {attrEntries.length > 1 ? ` +${attrEntries.length - 1}` : ""}
                                    </span>
                                  ) : null;
                                })()
                              )}
                            </div>
                          </div>
                        </td>
                      )}

                      {visibleColumns.total && (
                        <td>
                          <strong style={{ color: "#111827" }}>
                            ${parseFloat(ord.total_amount).toFixed(2)}
                          </strong>
                        </td>
                      )}

                      {visibleColumns.status && (
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {renderStatusPill(ord.status)}
                            {(can("orders", "process") || can("orders", "cancel")) && (
                              <select
                                className="status-select-inline"
                                value={ord.status}
                                onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                              >
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="shipped">Shipped</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="failed">Failed</option>
                              </select>
                            )}
                          </div>
                        </td>
                      )}

                      {visibleColumns.actions && (
                        <td>
                          <div className="action-buttons">
                            <button
                              className="action-btn view"
                              title="View Order Details"
                              onClick={() => { setSelectedOrder(ord); setIsViewModalOpen(true); }}
                            >
                              <FaEye />
                            </button>
                            {(can("orders", "delete") || can("orders", "cancel")) && (
                              <button
                                className="action-btn delete"
                                title="Delete Order"
                                onClick={() => handleDeleteOrder(ord.id)}
                              >
                                <FaTrash />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* ============ CUSTOMER DETAIL MODAL ============ */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="Customer Details"
        size="sm"
      >
        {selectedCustomer && (
          <div className="customer-detail-modal">
            {/* Avatar + Name */}
            <div className="customer-modal-header">
              <div className="customer-modal-avatar">
                {selectedCustomer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="customer-modal-name">{selectedCustomer.name}</h3>
                <span className={`status-pill ${selectedCustomer.orderStatus}`} style={{ fontSize: "12px" }}>
                  Order: {selectedCustomer.orderStatus?.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Info Grid */}
            <div className="customer-modal-grid">
              <div className="customer-modal-info-item">
                <FaEnvelope className="cmi-icon" />
                <div>
                  <label>Email</label>
                  <span>{selectedCustomer.email}</span>
                </div>
              </div>
              <div className="customer-modal-info-item">
                <FaPhone className="cmi-icon" />
                <div>
                  <label>Phone</label>
                  <span>{selectedCustomer.phone}</span>
                </div>
              </div>
              <div className="customer-modal-info-item">
                <FaMapMarkerAlt className="cmi-icon" />
                <div>
                  <label>Shipping Address</label>
                  <span>{selectedCustomer.address}</span>
                </div>
              </div>
              <div className="customer-modal-info-item">
                <FaDollarSign className="cmi-icon" />
                <div>
                  <label>Order Total</label>
                  <span style={{ fontWeight: 700, color: "#166534" }}>
                    ${parseFloat(selectedCustomer.totalAmount || 0).toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="customer-modal-info-item">
                <FaClock className="cmi-icon" />
                <div>
                  <label>Order Date</label>
                  <span>{formatDate(selectedCustomer.orderDate)}</span>
                </div>
              </div>
              <div className="customer-modal-info-item">
                <FaTag className="cmi-icon" />
                <div>
                  <label>Order ID</label>
                  <span style={{ fontFamily: "monospace", fontSize: "12px", color: "#2563eb" }}>
                    #ORD-{selectedCustomer.orderId?.slice(-8).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-actions-bar" style={{ marginTop: "20px" }}>
              <button className="btn-primary" onClick={() => setIsCustomerModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ============ ITEMS DETAIL MODAL ============ */}
      <Modal
        isOpen={isItemsModalOpen}
        onClose={() => setIsItemsModalOpen(false)}
        title="Order Items & Variants Breakdown"
        size="lg"
      >
        {selectedOrderItems && (
          <div className="items-detail-modal">
            <div className="items-modal-top-bar">
              <div className="order-tag-wrap">
                <span className="order-id-chip">
                  <FaTag size={11} /> #ORD-{selectedOrderItems.orderId?.slice(-8).toUpperCase()}
                </span>
                <span className="items-count-pill">
                  <FaBoxes size={12} /> {selectedOrderItems.items.length} {selectedOrderItems.items.length === 1 ? "Product" : "Products"} Ordered
                </span>
              </div>
            </div>

            {selectedOrderItems.items.length === 0 ? (
              <div className="empty-items-box">
                <FaBox style={{ fontSize: 44, color: "#cbd5e1", marginBottom: 12 }} />
                <p>No products attached to this order.</p>
              </div>
            ) : (
              <div className="items-detail-list">
                {selectedOrderItems.items.map((item, idx) => {
                  const attrs = item.attributes || item.variant?.attributes || {};
                  const productName = item.product?.name || "Product Item";
                  const categoryName = item.product?.category?.name || item.product?.category || "General";
                  const productImage = item.product?.image_url || item.product?.images?.[0]?.image_url || item.variant?.images?.[0]?.image_url || "https://placehold.co/80";
                  const sku = item.variant?.sku || item.product?.sku || "STANDARD";
                  const price = parseFloat(item.price || item.variant?.price || item.product?.price || 0);
                  const qty = parseInt(item.quantity, 10) || 1;
                  const subtotal = price * qty;

                  return (
                    <div key={idx} className="item-detail-card">
                      <div className="item-img-container">
                        <img src={productImage} alt={productName} className="item-detail-img" />
                      </div>

                      <div className="item-detail-body">
                        <div className="item-category-pill">{categoryName}</div>
                        <h4 className="item-detail-name">{productName}</h4>

                        <div className="item-meta-row">
                          <span className="item-sku-chip">
                            <FaTag size={10} /> SKU: <code>{sku}</code>
                          </span>
                        </div>

                        {/* Variant Attributes Chips */}
                        <div className="item-detail-attrs">
                          <span className="attrs-label">Variant / Specs:</span>
                          {renderAttributeBadges(attrs)}
                        </div>
                      </div>

                      <div className="item-detail-pricing">
                        <div className="unit-price-line">
                          <span className="pricing-lbl">Unit Price:</span>
                          <span className="pricing-val">${price.toFixed(2)}</span>
                        </div>
                        <div className="qty-badge-line">
                          <span className="qty-pill">Qty: <strong>{qty}</strong></span>
                        </div>
                        <div className="subtotal-badge-line">
                          <span className="subtotal-val">${subtotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Total Summary Strip */}
            <div className="items-detail-total-strip">
              <div className="total-items-stat">
                Total Quantity: <strong>
                  {selectedOrderItems.items.reduce((sum, item) => sum + (parseInt(item.quantity, 10) || 1), 0)} items
                </strong>
              </div>
              <div className="total-amount-stat">
                Order Total: <span>
                  ${selectedOrderItems.items.reduce((sum, item) => {
                    const price = parseFloat(item.price || item.variant?.price || item.product?.price || 0);
                    return sum + price * (parseInt(item.quantity, 10) || 1);
                  }, 0).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="modal-actions-bar" style={{ marginTop: "20px" }}>
              <button className="btn-primary" onClick={() => setIsItemsModalOpen(false)}>
                Close Window
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ============ VIEW ORDER DETAILS MODAL ============ */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Order Details & Invoice"
        size="lg"
      >
        {selectedOrder && (
          <div className="printable-invoice">
            <div className="order-detail-header">
              <div>
                <h3 style={{ margin: 0, fontSize: "20px", color: "#111827" }}>
                  Order #ORD-{selectedOrder.id.slice(-6).toUpperCase()}
                </h3>
                <span style={{ fontSize: "13px", color: "#6b7280" }}>
                  Placed on {formatDate(selectedOrder.created_at)}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {renderStatusPill(selectedOrder.status)}
                <select
                  className="status-select-inline"
                  value={selectedOrder.status}
                  onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="shipped">Shipped</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>

            {/* Information Grid */}
            <div className="order-detail-grid">
              <div className="detail-card">
                <h4><FaUser /> Customer Info</h4>
                <p><strong>{selectedOrder.user?.name || "Guest"}</strong></p>
                <p className="sub-text">{selectedOrder.user?.email || "No Email"}</p>
                <p className="sub-text">
                  <FaPhone style={{ marginRight: 4 }} />
                  {selectedOrder.contact_phone || selectedOrder.user?.phone || "No Phone"}
                </p>
              </div>
              <div className="detail-card">
                <h4><FaMapMarkerAlt /> Shipping Details</h4>
                <p>{selectedOrder.shipping_address}</p>
                <p className="sub-text">Contact Phone: {selectedOrder.contact_phone}</p>
              </div>
              <div className="detail-card">
                <h4><FaFileInvoice /> Payment & Reference</h4>
                <p className="sub-text">Payment Intent: {selectedOrder.payment_intent_id || "N/A"}</p>
                <p className="sub-text">Full UUID: {selectedOrder.id}</p>
              </div>
            </div>

            {/* Order Items Table with Variant Column */}
            <h4 style={{ fontSize: "14px", textTransform: "uppercase", color: "#6b7280", marginBottom: "10px" }}>
              Ordered Products
            </h4>
            <table className="modal-items-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Variant / Attributes</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th style={{ textAlign: "right" }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item, idx) => {
                    const price = parseFloat(item.price || item.variant?.price || item.product?.price || 0);
                    const qty = item.quantity || 1;
                    const lineSubtotal = price * qty;
                    const attrs = item.attributes || item.variant?.attributes || {};
                    const sku = item.variant?.sku || "—";

                    return (
                      <tr key={idx}>
                        <td>
                          <div className="modal-item-product">
                            <img
                              src={item.product?.image_url || item.product?.images?.[0]?.image_url || "https://placehold.co/44"}
                              alt={item.product?.name}
                              className="modal-item-img"
                            />
                            <div>
                              <strong style={{ color: "#111827", display: "block" }}>
                                {item.product?.name || "Product Item"}
                              </strong>
                              <span style={{ fontSize: "12px", color: "#6b7280" }}>
                                SKU: {sku}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>{renderAttributeBadges(attrs)}</td>
                        <td>${price.toFixed(2)}</td>
                        <td>{qty}</td>
                        <td style={{ textAlign: "right", fontWeight: "600" }}>
                          ${lineSubtotal.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", color: "#6b7280" }}>
                      No items attached to this order.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Trade-In Exchange Badge if order utilized Trade-In */}
            {selectedOrder.trade_in_product && (
              <div style={{ background: "#f0fdf4", border: "1px solid #86efac", padding: "12px 14px", borderRadius: "10px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "12px" }}>
                <img
                  src={selectedOrder.trade_in_product.image_url || "https://placehold.co/44"}
                  alt={selectedOrder.trade_in_product.title}
                  style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", border: "1px solid #bbf7d0" }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#166534", display: "flex", alignItems: "center", gap: 6 }}>
                    <FaTag /> Customer Trade-In: {selectedOrder.trade_in_product.title}
                  </div>
                  <div style={{ fontSize: "12px", color: "#15803d", marginTop: 2 }}>
                    Trade-In Credit: <strong>${parseFloat(selectedOrder.trade_in_discount || selectedOrder.trade_in_product.estimated_value || 0).toFixed(2)}</strong> | Status: <span style={{ textTransform: "capitalize", fontWeight: 600 }}>{selectedOrder.trade_in_product.status}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Summary Box */}
            <div className="order-summary-box">
              <div className="order-summary-row">
                <span>Subtotal:</span>
                <span>${parseFloat(selectedOrder.subtotal_amount || selectedOrder.total_amount).toFixed(2)}</span>
              </div>
              {parseFloat(selectedOrder.trade_in_discount || 0) > 0 && (
                <div className="order-summary-row" style={{ color: "#16a34a", fontWeight: "600" }}>
                  <span>Trade-In Credit Applied:</span>
                  <span>-${parseFloat(selectedOrder.trade_in_discount).toFixed(2)}</span>
                </div>
              )}
              <div className="order-summary-row">
                <span>Shipping Fee:</span>
                <span>$0.00</span>
              </div>
              <div className="order-summary-row total">
                <span>Total Amount:</span>
                <span>${parseFloat(selectedOrder.total_amount).toFixed(2)}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="modal-actions-bar">
              <button className="btn-secondary" onClick={handlePrintInvoice}>
                <FaPrint /> Print Invoice
              </button>
              <button className="btn-primary" onClick={() => setIsViewModalOpen(false)}>
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ============ CREATE ORDER MODAL ============ */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Place New Customer Order"
        size="md"
      >
        <form onSubmit={handleCreateOrderSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
                Select Customer *
              </label>
              <select
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db" }}
                value={createUserId}
                onChange={(e) => setCreateUserId(e.target.value)}
                required
              >
                <option value="">-- Choose Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email || c.phone || "No Contact"})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
                Shipping Address *
              </label>
              <textarea
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db", minHeight: "60px" }}
                placeholder="Enter full delivery address..."
                value={createAddress}
                onChange={(e) => setCreateAddress(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
                Contact Phone *
              </label>
              <input
                type="text"
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db" }}
                placeholder="e.g. +855 12 345 678"
                value={createPhone}
                onChange={(e) => setCreatePhone(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
                Order Status
              </label>
              <select
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db" }}
                value={createStatus}
                onChange={(e) => setCreateStatus(e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="shipped">Shipped</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Dynamic Items Builder */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600" }}>Order Items</label>
                <button
                  type="button"
                  onClick={handleAddItemRow}
                  style={{ background: "none", border: "none", color: "#2563eb", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                >
                  + Add Product Item
                </button>
              </div>
              {createItems.map((item, idx) => (
                <div
                  key={idx}
                  style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "10px", background: "#f9fafb", padding: "8px", borderRadius: "8px" }}
                >
                  <select
                    style={{ flex: 2, padding: "8px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13px" }}
                    value={item.product_id}
                    onChange={(e) => handleItemChange(idx, "product_id", e.target.value)}
                    required
                  >
                    <option value="">-- Choose Product --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (${parseFloat(p.price).toFixed(2)})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    style={{ width: "70px", padding: "8px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13px" }}
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                    required
                  />
                  <span style={{ fontSize: "13px", fontWeight: "600", minWidth: "60px" }}>
                    ${(parseFloat(item.price || 0) * (parseInt(item.quantity) || 1)).toFixed(2)}
                  </span>
                  {createItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItemRow(idx)}
                      style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "4px" }}
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="modal-actions-bar">
              <button type="button" className="btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">Create Order</button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default OrderPage;
