import React, { useEffect, useState, useMemo } from "react";
import {
    FaPlus,
    FaSearch,
    FaEye,
    FaTrash,
    FaFileInvoiceDollar,
    FaTruck,
    FaCheckCircle,
    FaClock,
    FaBan,
    FaSlidersH,
    FaDollarSign,
    FaBoxOpen,
    FaBoxes,
    FaChevronRight,
    FaArrowUp,
    FaTimes
} from "react-icons/fa";
import Swal from "sweetalert2";
import {
    purchaseOrdersApi,
    getPurchaseOrderByIdApi,
    createPurchaseOrderApi,
    updatePurchaseOrderStatusApi,
    deletePurchaseOrderApi
} from "../../services/purchaseService";
import { suppliersApi } from "../../services/supplierService";
import { productsApi } from "../../services/productsService";
import Modal from "../../components/Modal";
import { TableSkeleton } from "../../components/loading/LoadingSkeleton";
import { usePermissions, AccessDeniedView } from "../../hooks/usePermissions.jsx";
import "./style/PurchasePage.css";

function PurchasePage() {
    const { can, isAdmin } = usePermissions();
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [supplierFilter, setSupplierFilter] = useState("all");
    const [loading, setLoading] = useState(false);

    // Column Visibility
    const [isColDropdownOpen, setIsColDropdownOpen] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState({
        poNumber: true,
        supplier: true,
        date: true,
        itemsCount: true,
        totalAmount: true,
        status: true,
        actions: true
    });

    // Create Modal States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [poNumber, setPoNumber] = useState("");
    const [selectedSupplierId, setSelectedSupplierId] = useState("");
    const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0]);
    const [poStatus, setPoStatus] = useState("pending");
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState([
        { product_id: "", product_variant_id: "", quantity: 1, unit_cost: 0 }
    ]);

    // View Details Modal State
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedPO, setSelectedPO] = useState(null);

    const fetchPurchaseOrders = async () => {
        try {
            setLoading(true);
            const res = await purchaseOrdersApi();
            const data = res.data?.purchaseOrders || res.data || (Array.isArray(res) ? res : []);
            setPurchaseOrders(data);
        } catch (error) {
            Swal.fire("Error", error.message || "Failed to load purchase orders", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const res = await suppliersApi();
            const data = res.data?.suppliers || res.data || (Array.isArray(res) ? res : []);
            setSuppliers(data.filter(s => s.is_active));
        } catch (error) {
            console.error("Failed to load suppliers:", error);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await productsApi();
            const data = res.data?.products || res.data || (Array.isArray(res) ? res : []);
            setProducts(data);
        } catch (error) {
            console.error("Failed to load products:", error);
        }
    };

    useEffect(() => {
        fetchPurchaseOrders();
        fetchSuppliers();
        fetchProducts();
    }, []);

    const toggleColumn = (col) => {
        setVisibleColumns(prev => ({
            ...prev,
            [col]: !prev[col]
        }));
    };

    const openCreateModal = () => {
        setPoNumber(`PO-${Date.now().toString().slice(-6)}`);
        setSelectedSupplierId(suppliers.length > 0 ? suppliers[0].id : "");
        setOrderDate(new Date().toISOString().split("T")[0]);
        setPoStatus("pending");
        setNotes("");
        setItems([
            { product_id: products.length > 0 ? products[0].id : "", product_variant_id: "", quantity: 1, unit_cost: products.length > 0 ? (products[0].price || 0) : 0 }
        ]);
        setIsCreateModalOpen(true);
    };

    // Item line builders
    const handleAddItemRow = () => {
        const defaultProd = products.length > 0 ? products[0] : null;
        setItems(prev => [
            ...prev,
            {
                product_id: defaultProd ? defaultProd.id : "",
                product_variant_id: "",
                quantity: 1,
                unit_cost: defaultProd ? (defaultProd.price || 0) : 0
            }
        ]);
    };

    const handleRemoveItemRow = (index) => {
        if (items.length === 1) {
            Swal.fire("Warning", "Purchase Order must have at least one product item", "warning");
            return;
        }
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleItemChange = (index, field, value) => {
        setItems(prev => {
            const updated = [...prev];
            const currentItem = { ...updated[index], [field]: value };

            if (field === "product_id") {
                const prod = products.find(p => p.id === value);
                if (prod) {
                    currentItem.unit_cost = prod.price || 0;
                    currentItem.product_variant_id = "";
                }
            }
            updated[index] = currentItem;
            return updated;
        });
    };

    const calculateGrandTotal = () => {
        return items.reduce((acc, item) => {
            const qty = parseFloat(item.quantity) || 0;
            const cost = parseFloat(item.unit_cost) || 0;
            return acc + (qty * cost);
        }, 0);
    };

    const handleSavePurchaseOrder = async (e) => {
        e.preventDefault();
        if (!selectedSupplierId) {
            Swal.fire("Required", "Please select a supplier", "warning");
            return;
        }
        if (items.length === 0 || items.some(i => !i.product_id || i.quantity <= 0)) {
            Swal.fire("Required", "Please fill in all product items with valid quantities", "warning");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                po_number: poNumber,
                supplier_id: selectedSupplierId,
                order_date: orderDate,
                status: poStatus,
                notes,
                items: items.map(i => ({
                    product_id: i.product_id,
                    product_variant_id: i.product_variant_id || null,
                    quantity: parseInt(i.quantity, 10),
                    unit_cost: parseFloat(i.unit_cost)
                }))
            };

            await createPurchaseOrderApi(payload);

            if (poStatus === "received") {
                Swal.fire("Success", "Purchase Order created and inventory stock updated automatically!", "success");
            } else {
                Swal.fire("Success", "Purchase Order created successfully!", "success");
            }

            setIsCreateModalOpen(false);
            fetchPurchaseOrders();
        } catch (error) {
            Swal.fire("Error", error.message || "Failed to create Purchase Order", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (id) => {
        try {
            setLoading(true);
            const res = await getPurchaseOrderByIdApi(id);
            const poData = res.data?.purchaseOrder || res.data;
            setSelectedPO(poData);
            setIsViewModalOpen(true);
        } catch (error) {
            Swal.fire("Error", error.message || "Failed to load order details", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        Swal.fire({
            title: `Change status to "${newStatus.toUpperCase()}"?`,
            text: newStatus === "received"
                ? "Marking as received will automatically add items to inventory stock!"
                : "Are you sure you want to change order status?",
            icon: newStatus === "received" ? "info" : "warning",
            showCancelButton: true,
            confirmButtonColor: newStatus === "received" ? "#10b981" : "#ef4444",
            confirmButtonText: `Yes, Set to ${newStatus}`
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    setLoading(true);
                    await updatePurchaseOrderStatusApi(id, newStatus);
                    Swal.fire("Updated!", `Order status updated to ${newStatus}`, "success");
                    setIsViewModalOpen(false);
                    fetchPurchaseOrders();
                } catch (error) {
                    Swal.fire("Error", error.message || "Failed to update status", "error");
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const handleDeletePO = (id, status) => {
        if (status === "received") {
            Swal.fire("Action Restricted", "Cannot delete a received Purchase Order. Please set status to Cancelled first.", "info");
            return;
        }

        Swal.fire({
            title: "Delete Purchase Order?",
            text: "This action will permanently delete this PO",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            confirmButtonText: "Yes, Delete"
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    setLoading(true);
                    await deletePurchaseOrderApi(id);
                    Swal.fire("Deleted!", "Purchase Order deleted", "success");
                    fetchPurchaseOrders();
                } catch (error) {
                    Swal.fire("Error", error.message || "Failed to delete Purchase Order", "error");
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    // Filter Logic
    const filteredPOs = purchaseOrders.filter(po => {
        const supplierName = po.supplier?.name || "";
        const matchesSearch =
            (po.po_number || "").toLowerCase().includes(search.toLowerCase()) ||
            supplierName.toLowerCase().includes(search.toLowerCase());

        const matchesStatus =
            statusFilter === "all" ? true : po.status === statusFilter;

        const matchesSupplier =
            supplierFilter === "all" ? true : po.supplier_id === supplierFilter;

        return matchesSearch && matchesStatus && matchesSupplier;
    });

    // Multi-select state & handlers
    const [selectedIds, setSelectedIds] = useState([]);
    const visibleIds = useMemo(() => filteredPOs.map(po => po.id), [filteredPOs]);
    const isAllSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id));
    const isSomeSelected = visibleIds.some(id => selectedIds.includes(id)) && !isAllSelected;

    const handleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
        } else {
            const allMerged = new Set([...selectedIds, ...visibleIds]);
            setSelectedIds(Array.from(allMerged));
        }
    };

    const handleSelectRow = (id, e) => {
        e.stopPropagation();
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;
        const count = selectedIds.length;
        Swal.fire({
            title: `Delete ${count} Purchase Orders?`,
            text: "This action will permanently delete all selected purchase orders.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#64748b",
            confirmButtonText: `Yes, delete ${count} POs`
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    setLoading(true);
                    await Promise.all(selectedIds.map(id => deletePurchaseOrderApi(id)));
                    setSelectedIds([]);
                    Swal.fire("Deleted!", `${count} purchase orders deleted.`, "success");
                    fetchPurchaseOrders();
                } catch (error) {
                    Swal.fire("Error", error.message || "Failed to delete purchase orders", "error");
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const handleBulkStatusChange = (newStatus) => {
        if (selectedIds.length === 0) return;
        const count = selectedIds.length;
        Swal.fire({
            title: `Update ${count} purchase orders to ${newStatus}?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#10b981",
            cancelButtonColor: "#64748b",
            confirmButtonText: "Confirm"
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    setLoading(true);
                    await Promise.all(selectedIds.map(id => updatePurchaseOrderStatusApi(id, newStatus)));
                    setSelectedIds([]);
                    Swal.fire("Updated!", `${count} purchase orders set to ${newStatus}.`, "success");
                    fetchPurchaseOrders();
                } catch (error) {
                    Swal.fire("Error", error.message || "Failed to update purchase orders", "error");
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    // KPI Metrics
    const totalSpend = purchaseOrders.reduce((sum, po) => sum + (parseFloat(po.total_amount) || 0), 0);
    const pendingCount = purchaseOrders.filter(po => po.status === "pending").length;
    const receivedCount = purchaseOrders.filter(po => po.status === "received").length;
    const cancelledCount = purchaseOrders.filter(po => po.status === "cancelled").length;

    if (!can("purchases", "view")) {
        return <AccessDeniedView moduleName="Purchase Orders & Stock Procurement" />;
    }

    return (
        <div className="purchase-page">
            {/* Page Header */}
            <div className="page-header">
                <div className="header-title">
                    <h1>Purchase Orders</h1>
                    <p>Manage procurement, stock restocking, and supplier invoice orders</p>
                </div>
                {can("purchases", "create") && (
                    <button className="add-btn" onClick={openCreateModal}>
                        <FaPlus /> Create Purchase Order
                    </button>
                )}
            </div>

            {/* KPI Stats */}
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
                            <FaFileInvoiceDollar />
                        </div>
                        <span className="growth-tag positive"><FaArrowUp /> 100%</span>
                    </div>
                    <div className="stat-card-body">
                        <h4>Total Purchase Orders</h4>
                        <h2 className="stat-value">{purchaseOrders.length}</h2>
                        <div className="stat-footer-row">
                            <small>All vendor procurement POs</small>
                            <span className="kpi-click-hint"><FaChevronRight size={11} /></span>
                        </div>
                    </div>
                </div>

                {/* Total Spend */}
                <div
                    className="stat-card"
                    onClick={() => setStatusFilter("all")}
                    role="button"
                    tabIndex={0}
                >
                    <div className="stat-card-header">
                        <div className="stat-icon-wrapper green-bg">
                            <FaDollarSign />
                        </div>
                        <span className="growth-tag positive"><FaArrowUp /> Spend</span>
                    </div>
                    <div className="stat-card-body">
                        <h4>Total Procurement Cost</h4>
                        <h2 className="stat-value">${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                        <div className="stat-footer-row">
                            <small>Restock capital investment</small>
                            <span className="kpi-click-hint"><FaChevronRight size={11} /></span>
                        </div>
                    </div>
                </div>

                {/* Pending */}
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
                        <span className="growth-tag warning">{pendingCount} pending</span>
                    </div>
                    <div className="stat-card-body">
                        <h4>Pending Orders</h4>
                        <h2 className="stat-value">{pendingCount}</h2>
                        <div className="stat-footer-row">
                            <small>Awaiting vendor delivery</small>
                            <span className="kpi-click-hint"><FaChevronRight size={11} /></span>
                        </div>
                    </div>
                </div>

                {/* Received / Restocked */}
                <div
                    className={`stat-card ${statusFilter === "received" ? "active-kpi" : ""}`}
                    onClick={() => setStatusFilter(statusFilter === "received" ? "all" : "received")}
                    role="button"
                    tabIndex={0}
                >
                    <div className="stat-card-header">
                        <div className="stat-icon-wrapper purple-bg">
                            <FaCheckCircle />
                        </div>
                        <span className="growth-tag positive"><FaArrowUp /> Stocked</span>
                    </div>
                    <div className="stat-card-body">
                        <h4>Received & Restocked</h4>
                        <h2 className="stat-value">{receivedCount}</h2>
                        <div className="stat-footer-row">
                            <small>Added to warehouse inventory</small>
                            <span className="kpi-click-hint"><FaChevronRight size={11} /></span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="purchase-card">
                {/* Toolbar */}
                <div className="purchase-toolbar">
                    <div className="search-group purchase-search-box">
                        <FaSearch className="purchase-search-icon" />
                        <input
                            type="text"
                            placeholder="Search by PO number or supplier name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="purchase-search-input"
                        />
                    </div>

                    <div className="filter-actions">
                        <select
                            className="filter-select"
                            value={supplierFilter}
                            onChange={(e) => setSupplierFilter(e.target.value)}
                        >
                            <option value="all">All Suppliers</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>

                        <select
                            className="filter-select"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="received">Received</option>
                            <option value="cancelled">Cancelled</option>
                        </select>

                        <div className="col-toggle-wrapper">
                            <button
                                className="col-toggle-btn"
                                onClick={() => setIsColDropdownOpen(!isColDropdownOpen)}
                            >
                                <FaSlidersH /> Columns
                            </button>

                            {isColDropdownOpen && (
                                <div className="col-dropdown">
                                    <label className="col-dropdown-item">
                                        <input
                                            type="checkbox"
                                            checked={visibleColumns.poNumber}
                                            onChange={() => toggleColumn("poNumber")}
                                        /> PO Number
                                    </label>
                                    <label className="col-dropdown-item">
                                        <input
                                            type="checkbox"
                                            checked={visibleColumns.supplier}
                                            onChange={() => toggleColumn("supplier")}
                                        /> Supplier
                                    </label>
                                    <label className="col-dropdown-item">
                                        <input
                                            type="checkbox"
                                            checked={visibleColumns.date}
                                            onChange={() => toggleColumn("date")}
                                        /> Order Date
                                    </label>
                                    <label className="col-dropdown-item">
                                        <input
                                            type="checkbox"
                                            checked={visibleColumns.itemsCount}
                                            onChange={() => toggleColumn("itemsCount")}
                                        /> Items Count
                                    </label>
                                    <label className="col-dropdown-item">
                                        <input
                                            type="checkbox"
                                            checked={visibleColumns.totalAmount}
                                            onChange={() => toggleColumn("totalAmount")}
                                        /> Total Amount
                                    </label>
                                    <label className="col-dropdown-item">
                                        <input
                                            type="checkbox"
                                            checked={visibleColumns.status}
                                            onChange={() => toggleColumn("status")}
                                        /> Status
                                    </label>
                                    <label className="col-dropdown-item">
                                        <input
                                            type="checkbox"
                                            checked={visibleColumns.actions}
                                            onChange={() => toggleColumn("actions")}
                                        /> Actions
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {isAdmin && selectedIds.length > 0 && (
                    <div className="admin-bulk-actions-banner">
                        <div className="bulk-banner-left">
                            <span className="bulk-select-badge">{selectedIds.length}</span>
                            <span className="bulk-select-label">
                                <strong>{selectedIds.length}</strong> {selectedIds.length === 1 ? "purchase order" : "purchase orders"} selected
                            </span>
                            <button type="button" className="bulk-banner-text-btn" onClick={() => setSelectedIds([])}>
                                Deselect all
                            </button>
                            {purchaseOrders.length > filteredPOs.length && (
                                <button
                                    type="button"
                                    className="bulk-banner-text-btn"
                                    onClick={() => setSelectedIds(purchaseOrders.map(p => p.id))}
                                >
                                    Select all {purchaseOrders.length} in database
                                </button>
                            )}
                        </div>
                        <div className="bulk-banner-actions">
                            <button
                                type="button"
                                className="bulk-action-secondary-btn"
                                onClick={() => handleBulkStatusChange("received")}
                                disabled={loading}
                            >
                                <FaCheckCircle /> Mark Received
                            </button>
                            <button
                                type="button"
                                className="bulk-action-secondary-btn"
                                onClick={() => handleBulkStatusChange("cancelled")}
                                disabled={loading}
                            >
                                <FaBan /> Mark Cancelled
                            </button>
                            {can("purchases", "delete") && (
                                <button
                                    type="button"
                                    className="bulk-delete-btn"
                                    onClick={handleBulkDelete}
                                    disabled={loading}
                                >
                                    <FaTrash /> Delete Selected ({selectedIds.length})
                                </button>
                            )}
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

                {/* Table */}
                {loading && purchaseOrders.length === 0 ? (
                    <TableSkeleton rows={5} cols={isAdmin ? 8 : 7} hasAvatar={false} />
                ) : filteredPOs.length === 0 ? (
                    <div className="empty-box">
                        <p>No purchase orders found matching your criteria.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="purchase-table">
                            <thead>
                                <tr>
                                    {isAdmin && (
                                        <th className="admin-th-checkbox">
                                            <input
                                                type="checkbox"
                                                className="admin-master-checkbox"
                                                checked={isAllSelected}
                                                ref={el => { if (el) el.indeterminate = isSomeSelected; }}
                                                onChange={handleSelectAll}
                                                title="Select all visible purchase orders"
                                            />
                                        </th>
                                    )}
                                    {visibleColumns.poNumber && <th>PO Number</th>}
                                    {visibleColumns.supplier && <th>Supplier</th>}
                                    {visibleColumns.date && <th>Order Date</th>}
                                    {visibleColumns.itemsCount && <th>Items</th>}
                                    {visibleColumns.totalAmount && <th>Total Amount</th>}
                                    {visibleColumns.status && <th>Status</th>}
                                    {visibleColumns.actions && <th style={{ textAlign: "right" }}>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPOs.map((po) => (
                                    <tr key={po.id} className={isAdmin && selectedIds.includes(po.id) ? "admin-row-selected" : ""}>
                                        {isAdmin && (
                                            <td className="admin-td-checkbox" onClick={e => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    className="admin-row-checkbox"
                                                    checked={selectedIds.includes(po.id)}
                                                    onChange={e => handleSelectRow(po.id, e)}
                                                    title="Select this purchase order"
                                                />
                                            </td>
                                        )}
                                        {visibleColumns.poNumber && (
                                            <td>
                                                <span className="po-number-tag">{po.po_number}</span>
                                            </td>
                                        )}

                                        {visibleColumns.supplier && (
                                            <td style={{ fontWeight: 600, color: "#111827" }}>
                                                {po.supplier?.name || "Unknown Supplier"}
                                            </td>
                                        )}

                                        {visibleColumns.date && (
                                            <td style={{ color: "#4b5563" }}>
                                                {po.order_date ? new Date(po.order_date).toLocaleDateString() : "N/A"}
                                            </td>
                                        )}

                                        {visibleColumns.itemsCount && (
                                            <td>
                                                <span style={{ fontWeight: 600 }}>{po.items?.length || 0}</span> items
                                            </td>
                                        )}

                                        {visibleColumns.totalAmount && (
                                            <td style={{ fontWeight: 700, color: "#10b981" }}>
                                                ${parseFloat(po.total_amount || 0).toFixed(2)}
                                            </td>
                                        )}

                                        {visibleColumns.status && (
                                            <td>
                                                <span className={`po-status-badge ${po.status}`}>
                                                    <span className="dot"></span>
                                                    {po.status}
                                                </span>
                                            </td>
                                        )}

                                        {visibleColumns.actions && (
                                            <td>
                                                <div className="action-btns" style={{ justifyContent: "flex-end" }}>
                                                    <button
                                                        className="btn-icon view"
                                                        title="View PO Details"
                                                        onClick={() => handleViewDetails(po.id)}
                                                    >
                                                        <FaEye />
                                                    </button>
                                                    {can("purchases", "delete") && (
                                                        <button
                                                            className="btn-icon delete"
                                                            title="Delete PO"
                                                            onClick={() => handleDeletePO(po.id, po.status)}
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Purchase Order Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create New Purchase Order"
                size="lg"
            >
                <form onSubmit={handleSavePurchaseOrder} className="modal-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label>PO Number *</label>
                            <input
                                type="text"
                                value={poNumber}
                                onChange={(e) => setPoNumber(e.target.value)}
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Supplier *</label>
                            <select
                                value={selectedSupplierId}
                                onChange={(e) => setSelectedSupplierId(e.target.value)}
                                className="form-input"
                                required
                            >
                                <option value="">Select Supplier</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Order Date *</label>
                            <input
                                type="date"
                                value={orderDate}
                                onChange={(e) => setOrderDate(e.target.value)}
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Initial Order Status</label>
                            <select
                                value={poStatus}
                                onChange={(e) => setPoStatus(e.target.value)}
                                className="form-input"
                            >
                                <option value="pending">Pending (Stock not updated yet)</option>
                                <option value="received">Received (Restock inventory immediately)</option>
                            </select>
                        </div>
                    </div>

                    {/* Item Builder Table */}
                    <div className="items-builder-container">
                        <div className="items-builder-header">
                            <h4>Procurement Product Items</h4>
                            <button
                                type="button"
                                className="btn-add-item"
                                onClick={handleAddItemRow}
                            >
                                <FaPlus /> Add Line Item
                            </button>
                        </div>

                        <table className="items-table">
                            <thead>
                                <tr>
                                    <th style={{ width: "45%" }}>Product</th>
                                    <th style={{ width: "15%" }}>Quantity</th>
                                    <th style={{ width: "20%" }}>Unit Cost ($)</th>
                                    <th style={{ width: "15%" }}>Subtotal</th>
                                    <th style={{ width: "5%" }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td>
                                            <select
                                                value={item.product_id}
                                                onChange={(e) => handleItemChange(idx, "product_id", e.target.value)}
                                                className="item-select"
                                                required
                                            >
                                                <option value="">Select Product</option>
                                                {products.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock_quantity ?? 0})</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                                                className="item-input"
                                                required
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={item.unit_cost}
                                                onChange={(e) => handleItemChange(idx, "unit_cost", e.target.value)}
                                                className="item-input"
                                                required
                                            />
                                        </td>
                                        <td className="subtotal-cell">
                                            ${((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_cost) || 0)).toFixed(2)}
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                className="btn-remove-item"
                                                onClick={() => handleRemoveItemRow(idx)}
                                                title="Remove item"
                                            >
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="po-total-summary">
                            <span className="label">Grand Total:</span>
                            <span className="amount">${calculateGrandTotal().toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="form-group" style={{ marginTop: "12px" }}>
                        <label>Notes / Order Remarks</label>
                        <textarea
                            placeholder="Optional order notes or tracking references..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="form-textarea"
                            rows={2}
                        />
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn-cancel"
                            onClick={() => setIsCreateModalOpen(false)}
                        >
                            Cancel
                        </button>
                        <button type="submit" className="btn-save" disabled={loading}>
                            {loading ? "Creating..." : "Submit Purchase Order"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* View PO Details Modal */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title={`Purchase Order Details - ${selectedPO?.po_number || ""}`}
                size="lg"
            >
                {selectedPO && (
                    <div className="po-details-view">
                        <div className="po-detail-header-card">
                            <div className="po-detail-info-item">
                                <label>Supplier</label>
                                <div className="po-detail-val">{selectedPO.supplier?.name || "N/A"}</div>
                            </div>
                            <div className="po-detail-info-item">
                                <label>Order Date</label>
                                <div className="po-detail-val">{new Date(selectedPO.order_date).toLocaleDateString()}</div>
                            </div>
                            <div className="po-detail-info-item">
                                <label>Status</label>
                                <div>
                                    <span className={`po-status-badge ${selectedPO.status}`}>
                                        <span className="dot"></span>
                                        {selectedPO.status}
                                    </span>
                                </div>
                            </div>
                            <div className="po-detail-info-item">
                                <label>Total Cost</label>
                                <div className="po-detail-total-val">
                                    ${parseFloat(selectedPO.total_amount || 0).toFixed(2)}
                                </div>
                            </div>
                        </div>

                        {selectedPO.notes && (
                            <div className="po-notes-card">
                                <strong>Notes:</strong> {selectedPO.notes}
                            </div>
                        )}

                        <div className="po-items-section">
                            <h4 className="po-section-title">Ordered Items</h4>
                            <div className="po-table-wrapper">
                                <table className="po-items-detail-table">
                                    <thead>
                                        <tr>
                                            <th>Product Name</th>
                                            <th>Quantity</th>
                                            <th>Unit Cost</th>
                                            <th style={{ textAlign: "right" }}>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedPO.items?.map((item, i) => (
                                            <tr key={i}>
                                                <td>{item.product?.name || "Product"}</td>
                                                <td>{item.quantity}</td>
                                                <td>${parseFloat(item.unit_cost || 0).toFixed(2)}</td>
                                                <td style={{ textAlign: "right", fontWeight: 600 }}>
                                                    ${parseFloat(item.total_cost || 0).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Status transition actions */}
                        <div className="status-actions-bar">
                            <div className="status-actions-title">
                                Quick Status Action:
                            </div>
                            <div className="status-action-btns">
                                {selectedPO.status !== "received" && (
                                    <button
                                        className="btn-status-receive"
                                        onClick={() => handleStatusUpdate(selectedPO.id, "received")}
                                    >
                                        <FaCheckCircle /> Mark as Received (Restock)
                                    </button>
                                )}
                                {selectedPO.status !== "cancelled" && (
                                    <button
                                        className="btn-status-cancel"
                                        onClick={() => handleStatusUpdate(selectedPO.id, "cancelled")}
                                    >
                                        <FaBan /> Cancel Order
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default PurchasePage;
