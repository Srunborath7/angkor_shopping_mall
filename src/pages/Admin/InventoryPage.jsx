import React, { useState, useEffect, useMemo } from "react";
import {
    FaSearch,
    FaSlidersH,
    FaBox,
    FaBoxes,
    FaExclamationTriangle,
    FaTimesCircle,
    FaDollarSign,
    FaChevronDown,
    FaChevronRight,
    FaPlus,
    FaMinus,
    FaCheck,
    FaArrowUp,
    FaSpinner,
    FaTimes,
    FaBan
} from "react-icons/fa";
import Swal from "sweetalert2";
import {
    productsApi,
    updateProductApi,
    getProductByIdApi,
    updateProductVariantInventoryApi
} from "../../services/productsService";
import { categoriesApi } from "../../services/categoriesService";
import { TableSkeleton } from "../../components/loading/LoadingSkeleton";
import { usePermissions, AccessDeniedView } from "../../hooks/usePermissions.jsx";
import "./style/InventoryPage.css";

function InventoryPage() {
    const { can, isAdmin } = usePermissions();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [stockFilter, setStockFilter] = useState("all"); // all, instock, lowstock, outofstock
    const [loading, setLoading] = useState(false);

    // Track which product rows are expanded
    const [expandedRows, setExpandedRows] = useState({});
    // Track detailed products data (which includes variants) fetched via findOne
    const [detailedProducts, setDetailedProducts] = useState({});
    // Track loading state of individual rows expanding
    const [rowLoading, setRowLoading] = useState({});
    // Track inline edits: key is 'product-{id}' or 'variant-{id}', value is the input number
    const [editingStock, setEditingStock] = useState({});
    const [savingStock, setSavingStock] = useState({});

    const fetchData = async () => {
        try {
            setLoading(true);
            const [prodRes, catRes] = await Promise.all([
                productsApi(),
                categoriesApi()
            ]);

            const rawProducts = prodRes.data?.products || prodRes.data?.data || prodRes.data || (Array.isArray(prodRes) ? prodRes : []);
            const formattedProducts = (Array.isArray(rawProducts) ? rawProducts : []).map(p => {
                const primaryImg = p.image_url 
                    || p.images?.find(img => img.is_primary)?.image_url 
                    || p.images?.[0]?.image_url 
                    || p.image 
                    || "";
                return {
                    ...p,
                    image_url: primaryImg,
                    variants: p.variants || []
                };
            });

            setProducts(formattedProducts);
            setCategories(catRes.data || []);
        } catch (error) {
            Swal.fire("Error", error.message || "Failed to load catalog inventory", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Toggle expand row
    const toggleExpand = async (productId) => {
        if (expandedRows[productId]) {
            setExpandedRows(prev => ({ ...prev, [productId]: false }));
            return;
        }

        setExpandedRows(prev => ({ ...prev, [productId]: true }));

        // If we haven't loaded detailed data for this product yet, load it now
        if (!detailedProducts[productId]) {
            try {
                setRowLoading(prev => ({ ...prev, [productId]: true }));
                const res = await getProductByIdApi(productId);
                const rawDetailed = res.data?.product || res.data?.data || res.data || {};
                const parentImg = rawDetailed.image_url 
                    || rawDetailed.images?.find(img => img.is_primary)?.image_url 
                    || rawDetailed.images?.[0]?.image_url 
                    || rawDetailed.image 
                    || "";

                const detailedProduct = {
                    ...rawDetailed,
                    image_url: parentImg,
                    variants: (rawDetailed.variants || []).map(v => {
                        const variantSpecificImg = (rawDetailed.images || []).find(img => img.product_variant_id === v.id)?.image_url;
                        const vImg = v.image_url 
                            || variantSpecificImg 
                            || (Array.isArray(v.images) && v.images.length > 0 ? v.images[0].image_url : "") 
                            || v.image 
                            || parentImg;
                        return {
                            ...v,
                            image_url: vImg
                        };
                    })
                };

                setDetailedProducts(prev => ({
                    ...prev,
                    [productId]: detailedProduct
                }));

                // Initialize inline editing values for product variants
                const initialEdits = {};
                if (detailedProduct.variants && detailedProduct.variants.length > 0) {
                    detailedProduct.variants.forEach(variant => {
                        initialEdits[`variant-${variant.id}`] = variant.stock_quantity;
                    });
                } else {
                    initialEdits[`product-${productId}`] = detailedProduct.stock_quantity;
                }
                setEditingStock(prev => ({ ...prev, ...initialEdits }));
            } catch (err) {
                console.error("Failed to load variants", err);
                Swal.fire("Error", "Failed to retrieve variants for this product", "error");
                setExpandedRows(prev => ({ ...prev, [productId]: false }));
            } finally {
                setRowLoading(prev => ({ ...prev, [productId]: false }));
            }
        }
    };

    // Inline Stock Handlers
    const handleStockChange = (key, val) => {
        const parsed = parseInt(val);
        setEditingStock(prev => ({
            ...prev,
            [key]: isNaN(parsed) ? 0 : parsed
        }));
    };

    const handleIncrement = (key) => {
        setEditingStock(prev => ({
            ...prev,
            [key]: (prev[key] || 0) + 1
        }));
    };

    const handleDecrement = (key) => {
        setEditingStock(prev => ({
            ...prev,
            [key]: Math.max(0, (prev[key] || 0) - 1)
        }));
    };

    const handleSaveStock = async (type, id, parentProductId) => {
        const key = `${type}-${id}`;
        const newStock = editingStock[key];

        try {
            setSavingStock(prev => ({ ...prev, [key]: true }));

            if (type === "variant") {
                await updateProductVariantInventoryApi(id, newStock);

                // Update detailed products local state
                if (parentProductId && detailedProducts[parentProductId]) {
                    const updatedVariants = detailedProducts[parentProductId].variants.map(v =>
                        v.id === id ? { ...v, stock_quantity: newStock } : v
                    );

                    // Re-calculate parent total stock quantity as sum of variant stocks
                    const newParentStock = updatedVariants.reduce((sum, v) => sum + Number(v.stock_quantity), 0);

                    setDetailedProducts(prev => ({
                        ...prev,
                        [parentProductId]: {
                            ...prev[parentProductId],
                            variants: updatedVariants,
                            stock_quantity: newParentStock
                        }
                    }));

                    // Update main products state as well
                    setProducts(prev => prev.map(p =>
                        p.id === parentProductId ? { ...p, stock_quantity: newParentStock } : p
                    ));
                }
            } else {
                // Product update (without variants)
                const formData = new FormData();
                formData.append("stock_quantity", newStock);

                await updateProductApi(id, formData);

                // Update main list
                setProducts(prev => prev.map(p =>
                    p.id === id ? { ...p, stock_quantity: newStock } : p
                ));

                // Update detailed state if loaded
                if (detailedProducts[id]) {
                    setDetailedProducts(prev => ({
                        ...prev,
                        [id]: { ...prev[id], stock_quantity: newStock }
                    }));
                }
            }

            Swal.fire({
                title: "Updated!",
                text: "Stock quantity updated successfully",
                icon: "success",
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 2000
            });
        } catch (error) {
            Swal.fire("Error", error.message || "Failed to update stock", "error");
        } finally {
            setSavingStock(prev => ({ ...prev, [key]: false }));
        }
    };

    // Calculations for KPI summaries
    const totalInventoryValue = products.reduce((sum, p) => sum + (Number(p.price || 0) * Number(p.stock_quantity || 0)), 0);
    const totalStockCount = products.reduce((sum, p) => sum + Number(p.stock_quantity || 0), 0);
    const lowStockItems = products.filter(p => Number(p.stock_quantity) <= 5 && Number(p.stock_quantity) > 0);
    const outOfStockItems = products.filter(p => Number(p.stock_quantity) === 0);

    // Filtering logic
    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
            p.description?.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory ? p.category_id === selectedCategory : true;

        let matchesStock = true;
        if (stockFilter === "instock") {
            matchesStock = Number(p.stock_quantity) > 5;
        } else if (stockFilter === "lowstock") {
            matchesStock = Number(p.stock_quantity) <= 5 && Number(p.stock_quantity) > 0;
        } else if (stockFilter === "outofstock") {
            matchesStock = Number(p.stock_quantity) === 0;
        }

        return matchesSearch && matchesCategory && matchesStock;
    });

    const [selectedIds, setSelectedIds] = useState([]);
    const visibleIds = useMemo(() => filteredProducts.map(p => p.id), [filteredProducts]);
    const isAllSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id));
    const isSomeSelected = visibleIds.some(id => selectedIds.includes(id)) && !isAllSelected;

    const handleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
        } else {
            setSelectedIds(Array.from(new Set([...selectedIds, ...visibleIds])));
        }
    };

    const handleSelectRow = (id, e) => {
        e.stopPropagation();
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleBulkSetStock = (qty) => {
        if (selectedIds.length === 0) return;
        const actionLabel = qty === 0 ? "Mark Out of Stock (0)" : `Set Stock to ${qty}`;
        Swal.fire({
            title: `${actionLabel} for ${selectedIds.length} items?`,
            text: `This will update the stock quantity of all selected products to ${qty}.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: `Yes, update (${selectedIds.length})`,
            confirmButtonColor: qty === 0 ? "#ef4444" : "#10b981",
            cancelButtonText: "Cancel"
        }).then(async (res) => {
            if (res.isConfirmed) {
                try {
                    setLoading(true);
                    await Promise.all(selectedIds.map(id => {
                        const fd = new FormData();
                        fd.append("stock_quantity", qty);
                        return updateProductApi(id, fd).catch(e => console.error(e));
                    }));
                    Swal.fire("Updated!", `Stock updated for ${selectedIds.length} products.`, "success");
                    setSelectedIds([]);
                    fetchData();
                } catch (err) {
                    Swal.fire("Error", "Failed to update stock for some products.", "error");
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const handleBulkAddStock = (amount) => {
        if (selectedIds.length === 0) return;
        Swal.fire({
            title: `Add +${amount} stock to ${selectedIds.length} items?`,
            text: `Increase inventory count by ${amount} units for selected items.`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: `Yes, add +${amount}`,
            confirmButtonColor: "#10b981",
            cancelButtonText: "Cancel"
        }).then(async (res) => {
            if (res.isConfirmed) {
                try {
                    setLoading(true);
                    await Promise.all(selectedIds.map(id => {
                        const prod = products.find(p => p.id === id);
                        const current = Number(prod?.stock_quantity || 0);
                        const next = current + amount;
                        const fd = new FormData();
                        fd.append("stock_quantity", next);
                        return updateProductApi(id, fd).catch(e => console.error(e));
                    }));
                    Swal.fire("Restocked!", `Added +${amount} units to ${selectedIds.length} products.`, "success");
                    setSelectedIds([]);
                    fetchData();
                } catch (err) {
                    Swal.fire("Error", "Failed to restock some products.", "error");
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    if (!can("inventory", "view")) {
        return <AccessDeniedView moduleName="Inventory & Warehouses" />;
    }

    return (
        <div className="inventory-page">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1>Inventory Control</h1>
                    <p>Track stock levels, monitor alerts, and adjust quantities</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="stats-grid" style={{ marginBottom: "24px" }}>
                {/* Total Stock */}
                <div
                    className={`stat-card ${stockFilter === "all" ? "active-kpi" : ""}`}
                    onClick={() => setStockFilter("all")}
                    role="button"
                    tabIndex={0}
                >
                    <div className="stat-card-header">
                        <div className="stat-icon-wrapper blue-bg">
                            <FaBoxes />
                        </div>
                        <span className="growth-tag positive"><FaArrowUp /> Stock</span>
                    </div>
                    <div className="stat-card-body">
                        <h4>Total In-Stock Items</h4>
                        <h2 className="stat-value">{totalStockCount.toLocaleString()}</h2>
                        <div className="stat-footer-row">
                            <small>Physical unit inventory</small>
                            <span className="kpi-click-hint"><FaChevronRight size={11} /></span>
                        </div>
                    </div>
                </div>

                {/* Low Stock alerts */}
                <div
                    className={`stat-card ${stockFilter === "lowstock" ? "active-kpi" : ""}`}
                    onClick={() => setStockFilter(stockFilter === "lowstock" ? "all" : "lowstock")}
                    role="button"
                    tabIndex={0}
                >
                    <div className="stat-card-header">
                        <div className="stat-icon-wrapper orange-bg">
                            <FaExclamationTriangle />
                        </div>
                        <span className="growth-tag warning">{lowStockItems.length} alerts</span>
                    </div>
                    <div className="stat-card-body">
                        <h4>Low Stock Alerts</h4>
                        <h2 className="stat-value">{lowStockItems.length}</h2>
                        <div className="stat-footer-row">
                            <small>Items with stock ≤ 5</small>
                            <span className="kpi-click-hint"><FaChevronRight size={11} /></span>
                        </div>
                    </div>
                </div>

                {/* Out of Stock */}
                <div
                    className={`stat-card ${stockFilter === "outofstock" ? "active-kpi" : ""}`}
                    onClick={() => setStockFilter(stockFilter === "outofstock" ? "all" : "outofstock")}
                    role="button"
                    tabIndex={0}
                >
                    <div className="stat-card-header">
                        <div className="stat-icon-wrapper red-bg" style={{ background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", color: "#fff" }}>
                            <FaTimesCircle />
                        </div>
                        <span className="growth-tag warning">{outOfStockItems.length} zero</span>
                    </div>
                    <div className="stat-card-body">
                        <h4>Out of Stock</h4>
                        <h2 className="stat-value">{outOfStockItems.length}</h2>
                        <div className="stat-footer-row">
                            <small>Needs immediate purchase</small>
                            <span className="kpi-click-hint"><FaChevronRight size={11} /></span>
                        </div>
                    </div>
                </div>

                {/* Inventory Value */}
                <div
                    className={`stat-card ${stockFilter === "instock" ? "active-kpi" : ""}`}
                    onClick={() => setStockFilter(stockFilter === "instock" ? "all" : "instock")}
                    role="button"
                    tabIndex={0}
                >
                    <div className="stat-card-header">
                        <div className="stat-icon-wrapper green-bg">
                            <FaDollarSign />
                        </div>
                        <span className="growth-tag positive"><FaArrowUp /> Value</span>
                    </div>
                    <div className="stat-card-body">
                        <h4>Total Asset Valuation</h4>
                        <h2 className="stat-value">${totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                        <div className="stat-footer-row">
                            <small>Warehouse retail value</small>
                            <span className="kpi-click-hint"><FaChevronRight size={11} /></span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Table & Filters */}
            <div className="inventory-card">
                {/* Toolbar Filters */}
                <div className="inventory-toolbar">
                    <div className="search-box-inventory">
                        <FaSearch />
                        <input
                            type="text"
                            placeholder="Search catalog products..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="filter-group">
                        <select
                            value={selectedCategory}
                            onChange={e => setSelectedCategory(e.target.value)}
                            className="inventory-select"
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>

                        <select
                            value={stockFilter}
                            onChange={e => setStockFilter(e.target.value)}
                            className="inventory-select"
                        >
                            <option value="all">All Stock Statuses</option>
                            <option value="instock">In Stock</option>
                            <option value="lowstock">Low Stock (≤ 5)</option>
                            <option value="outofstock">Out of Stock (0)</option>
                        </select>
                    </div>
                </div>

                {isAdmin && selectedIds.length > 0 && (
                    <div className="admin-bulk-actions-banner">
                        <div className="bulk-banner-left">
                            <span className="bulk-select-badge">{selectedIds.length}</span>
                            <span className="bulk-select-label">
                                <strong>{selectedIds.length}</strong> {selectedIds.length === 1 ? "product" : "products"} selected
                            </span>
                            <button type="button" className="bulk-banner-text-btn" onClick={() => setSelectedIds([])}>
                                Deselect all
                            </button>
                            {products.length > filteredProducts.length && (
                                <button
                                    type="button"
                                    className="bulk-banner-text-btn"
                                    onClick={() => setSelectedIds(products.map(p => p.id))}
                                >
                                    Select all {products.length} in database
                                </button>
                            )}
                        </div>
                        <div className="bulk-banner-actions">
                            <button
                                type="button"
                                className="bulk-action-secondary-btn"
                                onClick={() => handleBulkAddStock(10)}
                                disabled={loading}
                            >
                                <FaPlus /> Add +10 Stock
                            </button>
                            <button
                                type="button"
                                className="bulk-action-secondary-btn"
                                onClick={() => handleBulkAddStock(50)}
                                disabled={loading}
                            >
                                <FaPlus /> Add +50 Stock
                            </button>
                            <button
                                type="button"
                                className="bulk-delete-btn"
                                onClick={() => handleBulkSetStock(0)}
                                disabled={loading}
                            >
                                <FaBan /> Mark Out of Stock (0)
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

                {/* Desktop and Tablet Expandable Table */}
                {loading ? (
                    <TableSkeleton rows={6} cols={isAdmin ? 8 : 7} hasImage={true} />
                ) : (
                    <div className="inventory-table-wrapper">
                        <table className="inventory-table">
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
                                                title="Select all visible products"
                                            />
                                        </th>
                                    )}
                                    <th width="40"></th>
                                    <th>Image</th>
                                    <th>Product Name</th>
                                    <th>Category</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'center' }}>Total Stock</th>
                                    <th style={{ width: '220px' }}>Quick Adjustment</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map(p => {
                                    const isExpanded = !!expandedRows[p.id];
                                    const details = detailedProducts[p.id];
                                    const hasVariants = details?.variants && details.variants.length > 0;

                                    // Stock Level indicators
                                    let stockStatusClass = "in-stock";
                                    let stockStatusText = "In Stock";
                                    if (Number(p.stock_quantity) === 0) {
                                        stockStatusClass = "out-of-stock";
                                        stockStatusText = "Out of Stock";
                                    } else if (Number(p.stock_quantity) <= 5) {
                                        stockStatusClass = "low-stock";
                                        stockStatusText = "Low Stock";
                                    }

                                    const editKey = `product-${p.id}`;
                                    const currentEditValue = editingStock[editKey] !== undefined ? editingStock[editKey] : p.stock_quantity;

                                    return (
                                        <React.Fragment key={p.id}>
                                            <tr className={(isExpanded ? "parent-row active " : "parent-row ") + (isAdmin && selectedIds.includes(p.id) ? "admin-row-selected" : "")}>
                                                {isAdmin && (
                                                    <td className="admin-td-checkbox" onClick={e => e.stopPropagation()}>
                                                        <input
                                                            type="checkbox"
                                                            className="admin-row-checkbox"
                                                            checked={selectedIds.includes(p.id)}
                                                            onChange={e => handleSelectRow(p.id, e)}
                                                            title="Select this product"
                                                        />
                                                    </td>
                                                )}
                                                <td>
                                                    <button className="expand-row-btn" onClick={() => toggleExpand(p.id)}>
                                                        {rowLoading[p.id] ? (
                                                            <FaSpinner className="row-spinner" />
                                                        ) : isExpanded ? (
                                                            <FaChevronDown />
                                                        ) : (
                                                            <FaChevronRight />
                                                        )}
                                                    </button>
                                                </td>
                                                <td>
                                                    <div className="inventory-img-box">
                                                        {p.image_url ? (
                                                            <img
                                                                src={p.image_url}
                                                                alt={p.name}
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = "none";
                                                                    if (e.currentTarget.nextElementSibling) {
                                                                        e.currentTarget.nextElementSibling.style.display = "flex";
                                                                    }
                                                                }}
                                                            />
                                                        ) : null}
                                                        <div className="fallback-box" style={{ display: p.image_url ? "none" : "flex" }}>
                                                            <FaBox />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="inventory-info-cell">
                                                        <strong>{p.name}</strong>
                                                        <small>Brand: {p.brand?.name || (typeof p.brand === 'string' ? p.brand : "—")}</small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="category-tag">
                                                        {p.category?.name || "General"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`status-tag ${stockStatusClass}`}>
                                                        {stockStatusText}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <strong className="stock-count-label">
                                                        {p.stock_quantity}
                                                    </strong>
                                                </td>
                                                <td>
                                                    {!hasVariants || !isExpanded ? (
                                                        <div className="quick-adjust-control">
                                                            <button
                                                                type="button"
                                                                className="adjust-btn minus"
                                                                onClick={() => handleDecrement(editKey)}
                                                            >
                                                                <FaMinus />
                                                            </button>
                                                            <input
                                                                type="number"
                                                                className="adjust-input"
                                                                value={currentEditValue}
                                                                onChange={e => handleStockChange(editKey, e.target.value)}
                                                                min="0"
                                                            />
                                                            <button
                                                                type="button"
                                                                className="adjust-btn plus"
                                                                onClick={() => handleIncrement(editKey)}
                                                            >
                                                                <FaPlus />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className={`save-stock-btn ${savingStock[editKey] ? 'saving' : ''}`}
                                                                onClick={() => handleSaveStock("product", p.id)}
                                                                title="Save changes"
                                                                disabled={savingStock[editKey]}
                                                            >
                                                                {savingStock[editKey] ? <FaSpinner className="row-spinner" /> : <FaCheck />}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontSize: "12px", color: "#94a3b8" }}>Fixed ({p.stock_quantity})</span>
                                                    )}
                                                </td>
                                            </tr>

                                            {/* Sub-table for variants */}
                                            {isExpanded && (
                                                <tr className="variant-sub-row">
                                                    <td colSpan={isAdmin ? 8 : 7}>
                                                        <div className="variants-panel">
                                                            {rowLoading[p.id] ? (
                                                                <div className="panel-loading">
                                                                    <FaSpinner className="spinner-icon" /> Loading variants...
                                                                </div>
                                                            ) : hasVariants ? (
                                                                <table className="variants-table">
                                                                    <thead>
                                                                        <tr>
                                                                            <th style={{ width: "55px" }}>Image</th>
                                                                            <th>Variant SKU</th>
                                                                            <th>Variant Attributes</th>
                                                                            <th>Stock Status</th>
                                                                            <th style={{ textAlign: "center" }}>Stock Qty</th>
                                                                            <th style={{ width: "220px" }}>Quick Adjustment</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {details.variants.map(v => {
                                                                            const vEditKey = `variant-${v.id}`;
                                                                            const currentVEditValue = editingStock[vEditKey] !== undefined ? editingStock[vEditKey] : v.stock_quantity;

                                                                            let vStockClass = "in-stock";
                                                                            let vStockText = "In Stock";
                                                                            if (Number(v.stock_quantity) === 0) {
                                                                                vStockClass = "out-of-stock";
                                                                                vStockText = "Out of Stock";
                                                                            } else if (Number(v.stock_quantity) <= 5) {
                                                                                vStockClass = "low-stock";
                                                                                vStockText = "Low Stock";
                                                                            }

                                                                            // Format attributes nice as badges
                                                                            const attrKeys = Object.keys(v.attributes || {});
                                                                            const attrsStr = attrKeys.map(k => `${k}: ${v.attributes[k]}`).join(", ");

                                                                            return (
                                                                                <tr key={v.id}>
                                                                                    <td>
                                                                                        <div className="inventory-variant-img-box">
                                                                                            {v.image_url ? (
                                                                                                <img
                                                                                                    src={v.image_url}
                                                                                                    alt={v.sku}
                                                                                                    onError={(e) => {
                                                                                                        e.currentTarget.style.display = "none";
                                                                                                        if (e.currentTarget.nextElementSibling) {
                                                                                                            e.currentTarget.nextElementSibling.style.display = "flex";
                                                                                                        }
                                                                                                    }}
                                                                                                />
                                                                                            ) : null}
                                                                                            <div className="fallback-box" style={{ display: v.image_url ? "none" : "flex" }}>
                                                                                                <FaBox />
                                                                                            </div>
                                                                                        </div>
                                                                                    </td>
                                                                                    <td><strong>{v.sku}</strong></td>
                                                                                    <td>
                                                                                        <span className="variant-attr-badge">
                                                                                            {attrsStr || "Standard"}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td>
                                                                                        <span className={`status-tag ${vStockClass}`}>
                                                                                            {vStockText}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td className="text-center">
                                                                                        <span className="variant-stock-qty">{v.stock_quantity}</span>
                                                                                    </td>
                                                                                    <td>
                                                                                        {can("inventory", "adjust") ? (
                                                                                            <div className="quick-adjust-control">
                                                                                                <button
                                                                                                    type="button"
                                                                                                    className="adjust-btn minus"
                                                                                                    onClick={() => handleDecrement(vEditKey)}
                                                                                                >
                                                                                                    <FaMinus />
                                                                                                </button>
                                                                                                <input
                                                                                                    type="number"
                                                                                                    className="adjust-input"
                                                                                                    value={currentVEditValue}
                                                                                                    onChange={e => handleStockChange(vEditKey, e.target.value)}
                                                                                                    min="0"
                                                                                                />
                                                                                                <button
                                                                                                    type="button"
                                                                                                    className="adjust-btn plus"
                                                                                                    onClick={() => handleIncrement(vEditKey)}
                                                                                                >
                                                                                                    <FaPlus />
                                                                                                </button>
                                                                                                <button
                                                                                                    type="button"
                                                                                                    className="save-adjust-btn"
                                                                                                    onClick={() => handleSaveStock("variant", v.id, p.id)}
                                                                                                    disabled={savingStock[vEditKey] || Number(currentVEditValue) === Number(v.stock_quantity)}
                                                                                                    title="Save quantity"
                                                                                                >
                                                                                                    {savingStock[vEditKey] ? <FaSpinner className="row-spinner" /> : <FaCheck />}
                                                                                                </button>
                                                                                            </div>
                                                                                        ) : (
                                                                                            <span style={{ fontSize: "12px", color: "#94a3b8" }}>Fixed ({v.stock_quantity})</span>
                                                                                        )}
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            ) : (
                                                                <div className="no-variants-notice">
                                                                    No specific variants found. This product uses a single pool of stock.
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}

                                {filteredProducts.length === 0 && (
                                    <tr>
                                        <td colSpan={isAdmin ? 8 : 7} className="no-data">No catalog products found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default InventoryPage;
