import React, { useState, useEffect } from "react";
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
    FaSpinner
} from "react-icons/fa";
import Swal from "sweetalert2";
import {
    productsApi,
    updateProductApi,
    getProductByIdApi,
    updateProductVariantInventoryApi
} from "../../services/productsService";
import { categoriesApi } from "../../services/categoriesService";
import "./style/InventoryPage.css";

function InventoryPage() {
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

            const prodList = prodRes.data?.products || prodRes.data || [];
            setProducts(prodList);
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
                const detailedProduct = res.data;
                
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
            <div className="row g-4 mb-4">
                {/* Total Stock */}
                <div className="col-xl-3 col-md-6">
                    <div className="kpi-card stock-total">
                        <div className="kpi-content">
                            <div>
                                <p>Total Items in Stock</p>
                                <h1>{totalStockCount.toLocaleString()}</h1>
                            </div>
                            <div className="icon-box">
                                <FaBoxes />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Low Stock alerts */}
                <div className="col-xl-3 col-md-6">
                    <div className="kpi-card stock-warning">
                        <div className="kpi-content">
                            <div>
                                <p>Low Stock Alerts</p>
                                <h1>{lowStockItems.length}</h1>
                            </div>
                            <div className="icon-box">
                                <FaExclamationTriangle />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Out of Stock */}
                <div className="col-xl-3 col-md-6">
                    <div className="kpi-card stock-danger">
                        <div className="kpi-content">
                            <div>
                                <p>Out of Stock</p>
                                <h1>{outOfStockItems.length}</h1>
                            </div>
                            <div className="icon-box">
                                <FaTimesCircle />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Inventory Value */}
                <div className="col-xl-3 col-md-6">
                    <div className="kpi-card stock-value">
                        <div className="kpi-content">
                            <div>
                                <p>Total Inventory Value</p>
                                <h1>${totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h1>
                            </div>
                            <div className="icon-box">
                                <FaDollarSign />
                            </div>
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

                {/* Desktop and Tablet Expandable Table */}
                {loading ? (
                    <div className="loading-container">
                        <FaSpinner className="spinner-icon" />
                        <p>Loading Inventory...</p>
                    </div>
                ) : (
                    <div className="inventory-table-wrapper">
                        <table className="inventory-table">
                            <thead>
                                <tr>
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
                                            <tr className={isExpanded ? "parent-row active" : "parent-row"}>
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
                                                            <img src={p.image_url} alt={p.name} />
                                                        ) : (
                                                            <FaBox className="fallback-box" />
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="inventory-info-cell">
                                                        <strong>{p.name}</strong>
                                                        <small>ID: {p.id.substring(0, 8)}...</small>
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
                                                <td align="center">
                                                    <strong className="stock-count-label">{p.stock_quantity}</strong>
                                                </td>
                                                <td>
                                                    {/* Hide adjust controls if details are loaded and it actually has variants */}
                                                    {hasVariants ? (
                                                        <span className="variants-notice-badge" onClick={() => toggleExpand(p.id)}>
                                                            Manage via Variants ({details.variants.length})
                                                        </span>
                                                    ) : (
                                                        <div className="quick-adjust-control">
                                                            <button 
                                                                type="button" 
                                                                className="adjust-btn minus"
                                                                onClick={() => {
                                                                    if (editingStock[editKey] === undefined) {
                                                                        editingStock[editKey] = p.stock_quantity;
                                                                    }
                                                                    handleDecrement(editKey);
                                                                }}
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
                                                                onClick={() => {
                                                                    if (editingStock[editKey] === undefined) {
                                                                        editingStock[editKey] = p.stock_quantity;
                                                                    }
                                                                    handleIncrement(editKey);
                                                                }}
                                                            >
                                                                <FaPlus />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="save-adjust-btn"
                                                                onClick={() => handleSaveStock("product", p.id)}
                                                                disabled={savingStock[editKey] || Number(currentEditValue) === Number(p.stock_quantity)}
                                                                title="Save quantity"
                                                            >
                                                                {savingStock[editKey] ? <FaSpinner className="row-spinner" /> : <FaCheck />}
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>

                                            {/* Sub-table for variants */}
                                            {isExpanded && (
                                                <tr className="variant-sub-row">
                                                    <td colSpan="7">
                                                        <div className="variants-panel">
                                                            {rowLoading[p.id] ? (
                                                                <div className="panel-loading">
                                                                    <FaSpinner className="spinner-icon" /> Loading variants...
                                                                </div>
                                                            ) : hasVariants ? (
                                                                <table className="variants-table">
                                                                    <thead>
                                                                        <tr>
                                                                            <th>Variant SKU</th>
                                                                            <th>Variant Attributes</th>
                                                                            <th>Stock Status</th>
                                                                            <th style={{ textAlign: 'center' }}>Stock Qty</th>
                                                                            <th style={{ width: '220px' }}>Quick Adjustment</th>
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
                                                                                    <td align="center">
                                                                                        <span className="variant-stock-qty">{v.stock_quantity}</span>
                                                                                    </td>
                                                                                    <td>
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
                                        <td colSpan="7" className="no-data">No catalog products found.</td>
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
