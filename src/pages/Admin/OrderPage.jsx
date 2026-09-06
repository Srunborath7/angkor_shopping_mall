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
  FaTimes,
  FaChevronRight,
  FaArrowUp,
  FaTv
} from "react-icons/fa";
import { Link } from "react-router-dom";
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

const formatAdminOrderCode = (order, idx = 0) => {
  if (!order) return "#OR-00001";
  const num = order.order_number;
  if (num && String(num).startsWith("#OR-")) return num;
  if (num && String(num).startsWith("OR-")) return `#${num}`;
  if (num && !isNaN(Number(num)) && !String(num).includes("-")) return `#OR-${String(num).padStart(5, "0")}`;
  if (typeof order.id === "number" || (order.id && !String(order.id).includes("-") && String(order.id).length <= 5)) {
    return `#OR-${String(order.id).padStart(5, "0")}`;
  }
  return `#OR-${String(idx + 1).padStart(5, "0")}`;
};

function OrderPage() {
  const { can, isAdmin } = usePermissions();
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

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
  const [selectedCustomer, setSelectedCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    orderId: "",
    orderCode: "",
    orderStatus: "",
    totalAmount: 0,
    orderDate: ""
  });

  // Items Detail Modal
  const [isItemsModalOpen, setIsItemsModalOpen] = useState(false);
  const [selectedOrderItems, setSelectedOrderItems] = useState(null);

  // Quick Status Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("pending");

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

  // Multi-Selection Computations
  const visibleIds = useMemo(() => filteredOrders.map((o) => o.id), [filteredOrders]);
  const isAllSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  const isSomeSelected = visibleIds.some((id) => selectedIds.includes(id)) && !isAllSelected;

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allMerged = new Set([...selectedIds, ...visibleIds]);
      setSelectedIds(Array.from(allMerged));
    } else {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    }
  };

  const handleSelectRow = (orderId, e) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) => {
      if (prev.includes(orderId)) {
        return prev.filter((id) => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };

  // Handle Bulk Delete Orders
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;

    Swal.fire({
      title: `Delete ${count} Orders?`,
      text: `Are you sure you want to delete ${count} selected order${count > 1 ? "s" : ""}? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: `Yes, Delete ${count} Orders`,
      cancelButtonText: "Cancel"
    }).then(async (result) => {
      if (result.isConfirmed) {
        setLoading(true);
        let deletedCount = 0;
        const idsToDelete = [...selectedIds];

        try {
          // 1. Delete concurrently via API
          await Promise.allSettled(
            idsToDelete.map(async (id) => {
              try {
                await deleteOrderApi(id);
                deletedCount++;
              } catch (err) {
                console.warn(`Failed to delete order ${id}:`, err);
              }
            })
          );

          // 2. Remove from localStorage orders if present
          try {
            const saved = localStorage.getItem("orders");
            if (saved) {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed)) {
                const filtered = parsed.filter(
                  (o) => !idsToDelete.includes(o.id) && !idsToDelete.includes(o.rawId) && !idsToDelete.includes(String(o.id).replace(/^#/, ""))
                );
                localStorage.setItem("orders", JSON.stringify(filtered));
              }
            }
          } catch (e) {}

          // 3. Update React state
          setOrders((prev) => prev.filter((o) => !idsToDelete.includes(o.id)));
          setSelectedIds([]);

          Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: `${deletedCount} order${deletedCount > 1 ? "s" : ""} deleted successfully.`,
            timer: 2000,
            showConfirmButton: false
          });
        } catch (error) {
          Swal.fire("Error", error.message || "Failed to delete selected orders", "error");
        } finally {
          setLoading(false);
        }
      }
    });
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
          setSelectedIds((prev) => prev.filter((id) => id !== orderId));
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
      const nextSeqNum = orders.length + 1;
      const generatedOrderSeq = `OR-${String(nextSeqNum).padStart(5, "0")}`;
      const currentStaffId = currentUser?.id || currentUser?.user_id;

      const payload = {
        user_id: createUserId,
        order_number: generatedOrderSeq,
        order_seq: generatedOrderSeq,
        staff_id: currentStaffId,
        created_by_staff_id: currentStaffId,
        staff_name: currentUser?.name || "Store Staff",
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
    const orderDisplayCode = formatAdminOrderCode(ord);

    setSelectedCustomer({
      name: ord.user?.name || "Guest Customer",
      email: ord.user?.email || "—",
      phone: ord.contact_phone || ord.user?.phone || "—",
      address: ord.shipping_address || "—",
      orderId: ord.id,
      orderCode: orderDisplayCode,
      orderStatus: ord.status,
      totalAmount: ord.total_amount,
      orderDate: ord.created_at
    });
    setIsCustomerModalOpen(true);
  };

  // Open items detail modal
  const openItemsModal = (ord, e) => {
    e.stopPropagation();
    const orderDisplayCode = formatAdminOrderCode(ord);

    setSelectedOrderItems({ orderId: ord.id, orderCode: orderDisplayCode, items: ord.items || [] });
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
          <Link
            to="/admin/order-monitor"
            className="refresh-btn"
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "#ffffff",
              border: "none",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: "600",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)"
            }}
            title="Open Live Kitchen & Packing Station Monitor"
          >
            <FaTv /> Live Prep Monitor
          </Link>
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
      <div className="stats-grid" style={{ marginBottom: "24px" }}>
        {/* Total Orders */}
        <div
          className={`stat-card ${statusFilter === "all" ? "active-kpi" : ""}`}
          onClick={() => setStatusFilter("all")}
          role="button"
          tabIndex={0}
        >
          <div className="stat-card-header">
            <div className="stat-icon-wrapper blue-bg">
              <FaShoppingCart />
            </div>
            <span className="growth-tag positive"><FaArrowUp /> 100%</span>
          </div>
          <div className="stat-card-body">
            <h4>Total Orders</h4>
            <h2 className="stat-value">{stats.totalCount}</h2>
            <div className="stat-footer-row">
              <small>All processed checkouts</small>
              <span className="kpi-click-hint"><FaChevronRight size={11} /></span>
            </div>
          </div>
        </div>

        {/* Total Sales */}
        <div
          className="stat-card"
          onClick={() => setSortBy(sortBy === "total_high" ? "newest" : "total_high")}
          role="button"
          tabIndex={0}
        >
          <div className="stat-card-header">
            <div className="stat-icon-wrapper green-bg">
              <FaDollarSign />
            </div>
            <span className="growth-tag positive"><FaArrowUp /> Rev</span>
          </div>
          <div className="stat-card-body">
            <h4>Total Sales</h4>
            <h2 className="stat-value">${stats.totalRev.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
            <div className="stat-footer-row">
              <small>Paid & completed volume</small>
              <span className="kpi-click-hint"><FaChevronRight size={11} /></span>
            </div>
          </div>
        </div>

        {/* Pending Orders */}
        <div
          className={`stat-card ${statusFilter === "pending" ? "active-kpi" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "pending" ? "all" : "pending")}
          role="button"
          tabIndex={0}
        >
          <div className="stat-card-header">
            <div className="stat-icon-wrapper orange-bg">
              <FaClock />
            </div>
            <span className="growth-tag warning">{stats.pendingCount} pending</span>
          </div>
          <div className="stat-card-body">
            <h4>Pending Orders</h4>
            <h2 className="stat-value">{stats.pendingCount}</h2>
            <div className="stat-footer-row">
              <small>Awaiting payment / dispatch</small>
              <span className="kpi-click-hint"><FaChevronRight size={11} /></span>
            </div>
          </div>
        </div>

        {/* Completed / Paid */}
        <div
          className={`stat-card ${statusFilter === "completed" ? "active-kpi" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "completed" ? "all" : "completed")}
          role="button"
          tabIndex={0}
        >
          <div className="stat-card-header">
            <div className="stat-icon-wrapper purple-bg">
              <FaCheckCircle />
            </div>
            <span className="growth-tag positive"><FaArrowUp /> Done</span>
          </div>
          <div className="stat-card-body">
            <h4>Completed / Paid</h4>
            <h2 className="stat-value">{stats.completedCount}</h2>
            <div className="stat-footer-row">
              <small>Successfully delivered</small>
              <span className="kpi-click-hint"><FaChevronRight size={11} /></span>
            </div>
          </div>
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

      {/* Bulk Selection Actions Bar */}
      {isAdmin && selectedIds.length > 0 && (
        <div className="order-bulk-actions-banner">
          <div className="bulk-banner-left">
            <span className="bulk-select-badge">{selectedIds.length}</span>
            <span className="bulk-select-label">
              <strong>{selectedIds.length}</strong> {selectedIds.length === 1 ? "order" : "orders"} selected
            </span>
            <button
              type="button"
              className="bulk-banner-text-btn"
              onClick={() => {
                if (isAllSelected) {
                  setSelectedIds([]);
                } else {
                  setSelectedIds(filteredOrders.map((o) => o.id));
                }
              }}
            >
              {isAllSelected ? "Deselect all visible" : `Select all ${filteredOrders.length} visible`}
            </button>
            {orders.length > filteredOrders.length && (
              <button
                type="button"
                className="bulk-banner-text-btn"
                onClick={() => setSelectedIds(orders.map((o) => o.id))}
              >
                Select all {orders.length} in database
              </button>
            )}
          </div>
          <div className="bulk-banner-actions">
            <button
              type="button"
              className="bulk-delete-btn"
              onClick={handleBulkDelete}
              disabled={loading}
              title="Delete all selected orders"
            >
              <FaTrash /> Delete Selected ({selectedIds.length})
            </button>
            <button
              type="button"
              className="bulk-cancel-btn"
              onClick={() => setSelectedIds([])}
              title="Cancel selection"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      )}

      {/* Orders Data Table */}
      {loading && orders.length === 0 ? (
        <TableSkeleton rows={6} cols={isAdmin ? 8 : 7} hasAvatar={true} />
      ) : (
        <div className="order-table-container">
          <div className="table-responsive">
            <table className="order-table">
              <thead>
                <tr>
                  {isAdmin && (
                    <th className="order-th-checkbox" style={{ width: "42px", textAlign: "center" }}>
                      <input
                        type="checkbox"
                        className="order-master-checkbox"
                        checked={isAllSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = isSomeSelected;
                        }}
                        onChange={handleSelectAll}
                        title="Select all visible orders"
                      />
                    </th>
                  )}
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
                    <td colSpan={isAdmin ? 8 : 7}>
                      <div className="order-empty-state">
                        <FaShoppingCart />
                        <h4>No orders found</h4>
                        <p>Try adjusting your search or filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord, idx) => {
                    const customerName = ord.user?.name || "Guest Customer";
                    const initial = customerName.charAt(0).toUpperCase();
                    const itemCount = ord.items ? ord.items.length : 0;
                    const orderDisplayCode = formatAdminOrderCode(ord, idx);

                    return (
                      <tr key={ord.id} className={isAdmin && selectedIds.includes(ord.id) ? "order-row-selected" : ""}>
                        {isAdmin && (
                          <td className="order-td-checkbox" style={{ width: "42px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              className="order-row-checkbox"
                              checked={selectedIds.includes(ord.id)}
                              onChange={(e) => handleSelectRow(ord.id, e)}
                              title="Select this order"
                            />
                          </td>
                        )}
                        {visibleColumns.orderId && (
                          <td>
                            <span
                              className="order-id-code"
                              title={`Database ID: ${ord.id}`}
                              onClick={() => { setSelectedOrder(ord); setIsViewModalOpen(true); }}
                              style={{ cursor: "pointer" }}
                            >
                              {orderDisplayCode}
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
              <div className="customer-modal-user-meta">
                <h3 className="customer-modal-name">{selectedCustomer.name}</h3>
                <span className={`status-pill ${selectedCustomer.orderStatus}`}>
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
                  <span className="customer-modal-highlight">
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
                  <span className="customer-modal-ord-id">
                    {selectedCustomer.orderCode || "#OR-00001"}
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-actions-bar">
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
                  <FaTag size={11} /> {selectedOrderItems.orderCode || "#OR-00001"}
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

            <div className="modal-actions-bar">
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
                <h3 className="order-detail-header-title">
                  Order {selectedOrder ? formatAdminOrderCode(selectedOrder) : "#OR-00001"}
                </h3>
                <span className="order-detail-header-date">
                  Placed on {formatDate(selectedOrder.created_at)}
                </span>
              </div>
              <div className="order-detail-header-status-wrap">
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
            <h4 className="modal-section-subtitle">
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
                            <div className="modal-product-info">
                              <strong className="modal-product-name">
                                {item.product?.name || "Product Item"}
                              </strong>
                              <span className="modal-product-sku">
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
                    <td colSpan="5" className="modal-table-empty">
                      No items attached to this order.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Trade-In Exchange Badge if order utilized Trade-In */}
            {selectedOrder.trade_in_product && (
              <div className="order-tradein-banner">
                <img
                  src={selectedOrder.trade_in_product.image_url || "https://placehold.co/44"}
                  alt={selectedOrder.trade_in_product.title}
                  className="order-tradein-img"
                />
                <div className="order-tradein-info">
                  <div className="order-tradein-title">
                    <FaTag /> Customer Trade-In: {selectedOrder.trade_in_product.title}
                  </div>
                  <div className="order-tradein-sub">
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
                <div className="order-summary-row tradein-discount">
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
        <form onSubmit={handleCreateOrderSubmit} className="create-order-form">
          <div className="create-order-fields">
            <div className="order-form-group">
              <label className="order-form-label">
                Select Customer *
              </label>
              <select
                className="order-form-control"
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

            <div className="order-form-group">
              <label className="order-form-label">
                Shipping Address *
              </label>
              <textarea
                className="order-form-control order-form-textarea"
                placeholder="Enter full delivery address..."
                value={createAddress}
                onChange={(e) => setCreateAddress(e.target.value)}
                required
              />
            </div>

            <div className="order-form-group">
              <label className="order-form-label">
                Contact Phone *
              </label>
              <input
                type="text"
                className="order-form-control"
                placeholder="e.g. +855 12 345 678"
                value={createPhone}
                onChange={(e) => setCreatePhone(e.target.value)}
                required
              />
            </div>

            <div className="order-form-group">
              <label className="order-form-label">
                Order Status
              </label>
              <select
                className="order-form-control"
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
            <div className="order-items-builder">
              <div className="order-items-builder-header">
                <label className="order-form-label">Order Items</label>
                <button
                  type="button"
                  onClick={handleAddItemRow}
                  className="add-item-link"
                >
                  + Add Product Item
                </button>
              </div>
              {createItems.map((item, idx) => (
                <div
                  className="form_order_items order-item-input-row"
                  key={idx}
                >
                  <select
                    className="order-item-select"
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
                    className="order-item-qty"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                    required
                  />
                  <span className="order-item-subtotal">
                    ${(parseFloat(item.price || 0) * (parseInt(item.quantity) || 1)).toFixed(2)}
                  </span>
                  {createItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItemRow(idx)}
                      className="order-item-delete-btn"
                      title="Remove item"
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
