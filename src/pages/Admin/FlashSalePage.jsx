import React, { useEffect, useState } from "react";
import {
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaBolt,
  FaFire,
  FaTag,
  FaPercentage,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaSlidersH,
  FaChevronRight,
  FaArrowUp
} from "react-icons/fa";
import Swal from "sweetalert2";
import {
  getFlashSalesApi,
  createFlashSaleApi,
  updateFlashSaleApi,
  deleteFlashSaleApi
} from "../../services/flashSaleService";
import { productsApi, productsPagedApi } from "../../services/productsService";
import Modal from "../../components/Modal";
import { TableSkeleton } from "../../components/loading/LoadingSkeleton";
import { usePermissions, AccessDeniedView } from "../../hooks/usePermissions.jsx";
import "./style/FlashSalePage.css";

function getCategoryName(cat) {
  if (!cat) return "General";
  if (typeof cat === "string") return cat;
  if (typeof cat === "object") return cat.name || cat.title || "General";
  return String(cat);
}

function formatTimeRemaining(item) {
  if (!item) return "24h Active";
  const now = Date.now();
  let end = null;
  if (item.endTime || item.end_time) {
    end = new Date(item.endTime || item.end_time).getTime();
  } else if (item.created_at || item.createdAt) {
    end = new Date(item.created_at || item.createdAt).getTime() + (item.durationHours || 24) * 3600 * 1000;
  }

  if (!end || isNaN(end)) return "24h Active";
  const diff = end - now;
  if (diff <= 0) return "Expired (Auto-Deleting)";

  const hours = Math.floor(diff / (3600 * 1000));
  const mins = Math.floor((diff % (3600 * 1000)) / (60 * 1000));
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
}

function FlashSalePage() {
  const { can } = usePermissions();
  const [flashSales, setFlashSales] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);

  // Form State
  const [productId, setProductId] = useState("");
  const [badge, setBadge] = useState("Flash Deal");
  const [originalPrice, setOriginalPrice] = useState(0);
  const [price, setPrice] = useState(0);
  const [discount, setDiscount] = useState(20);
  const [stockLimit, setStockLimit] = useState(20);
  const [claimedPct, setClaimedPct] = useState(50);
  const [durationHours, setDurationHours] = useState(24);
  const [status, setStatus] = useState("active");

  // Column visibility filter
  const [isColDropdownOpen, setIsColDropdownOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    hash: true,
    product: true,
    badge: true,
    prices: true,
    stock: true,
    status: true,
    actions: true
  });

  const fetchFlashSales = async () => {
    try {
      setLoading(true);
      const res = await getFlashSalesApi();
      const rawList = Array.isArray(res) ? res : (res?.data || []);

      const now = Date.now();
      const expiredItems = [];
      const validList = [];

      rawList.forEach((item) => {
        let end = null;
        if (item.endTime || item.end_time) {
          end = new Date(item.endTime || item.end_time).getTime();
        } else if (item.created_at || item.createdAt) {
          end = new Date(item.created_at || item.createdAt).getTime() + (item.durationHours || 24) * 3600 * 1000;
        }

        // Auto-delete check: if campaign duration (e.g. 24h) has elapsed, remove from database
        if (end && !isNaN(end) && end < now) {
          expiredItems.push(item);
        } else {
          validList.push(item);
        }
      });

      // Background auto-delete expired 24h flash sale items from database
      if (expiredItems.length > 0) {
        expiredItems.forEach(async (exp) => {
          try {
            await deleteFlashSaleApi(exp.id);
          } catch (e) {
            console.debug("Auto-cleanup expired flash sale error:", e?.message);
          }
        });
      }

      setFlashSales(validList);
    } catch (err) {
      console.error("Failed to load flash sales:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      let list = [];
      try {
        const res = await productsApi();
        const raw = res?.data?.products || res?.data?.data || res?.data?.rows || res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(raw)) list = raw;
        else if (Array.isArray(raw?.rows)) list = raw.rows;
      } catch {
        // fallback to paged API
      }

      if (list.length === 0) {
        const resPaged = await productsPagedApi({ page: 1, limit: 100 });
        const rawPaged = resPaged?.data?.products || resPaged?.data?.data || resPaged?.data?.rows || resPaged?.data || (Array.isArray(resPaged) ? resPaged : []);
        if (Array.isArray(rawPaged)) list = rawPaged;
        else if (Array.isArray(rawPaged?.rows)) list = rawPaged.rows;
      }

      setAvailableProducts(list);
    } catch (err) {
      console.warn("Failed to load products for picker:", err);
      setAvailableProducts([]);
    }
  };

  useEffect(() => {
    fetchFlashSales();
    fetchProducts();
  }, []);

  const toggleColumn = (col) => {
    setVisibleColumns((prev) => ({ ...prev, [col]: !prev[col] }));
  };

  const openCreateModal = () => {
    setSelectedSale(null);
    const firstProd = availableProducts[0];
    const firstId = firstProd?.id || "";
    const orig = Number(firstProd?.price || 49.99);

    setProductId(firstId);
    setBadge("Flash Deal");
    setOriginalPrice(orig);
    setDiscount(30);
    setPrice(Number((orig * 0.7).toFixed(2)));
    setStockLimit(25);
    setClaimedPct(60);
    setDurationHours(24);
    setStatus("active");
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setSelectedSale(item);
    setProductId(item.product_id || item.id || "");
    setBadge(item.badge || "Flash Deal");
    setOriginalPrice(item.originalPrice || 50);
    setPrice(item.price || 35);
    setDiscount(item.discount || 30);
    setStockLimit(item.stockLimit || 20);
    setClaimedPct(item.claimedPct || 50);
    setDurationHours(24);
    setStatus(item.status || "active");
    setIsModalOpen(true);
  };

  const handleProductSelect = (selectedId) => {
    setProductId(selectedId);
    const prod = availableProducts.find((p) => String(p.id) === String(selectedId));
    if (prod) {
      const orig = Number(prod.price || 50);
      setOriginalPrice(orig);
      const calcPrice = (orig * (1 - discount / 100)).toFixed(2);
      setPrice(Number(calcPrice));
    }
  };

  // Selected product preview for the modal
  const selectedProduct = availableProducts.find((p) => String(p.id) === String(productId)) || null;
  const previewImage = selectedProduct?.image_url || selectedProduct?.image || null;

  const handlePriceChange = (val) => {
    const p = Number(val);
    setPrice(p);
    if (originalPrice > 0) {
      const disc = Math.round(((originalPrice - p) / originalPrice) * 100);
      setDiscount(Math.max(0, disc));
    }
  };

  const handleDiscountChange = (val) => {
    const d = Number(val);
    setDiscount(d);
    if (originalPrice > 0) {
      const calcPrice = (originalPrice * (1 - d / 100)).toFixed(2);
      setPrice(Number(calcPrice));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!productId) {
      Swal.fire("Validation", "Please select a product.", "warning");
      return;
    }
    try {
      setLoading(true);
      // The API auto-fills name / image / category from product_id.
      // We only need to send sale-specific settings.
      const payload = {
        product_id: productId,
        badge,
        originalPrice: Number(originalPrice),
        price: Number(price),
        discount: Number(discount),
        stockLimit: Number(stockLimit),
        claimedPct: Number(claimedPct),
        status,
        endTime: new Date(Date.now() + durationHours * 3600 * 1000).toISOString()
      };

      if (selectedSale) {
        await updateFlashSaleApi(selectedSale.id, payload);
        Swal.fire("Updated!", "Flash Sale Deal updated successfully!", "success");
      } else {
        await createFlashSaleApi(payload);
        Swal.fire("Created!", "New Flash Sale Deal is now live!", "success");
      }
      setIsModalOpen(false);
      fetchFlashSales();
    } catch (err) {
      Swal.fire("Error", err.message || "Failed to save flash sale", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Remove Flash Sale?",
      text: "This deal will be removed from the homepage flash sale banner.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, delete it!"
    });

    if (confirm.isConfirmed) {
      await deleteFlashSaleApi(id);
      Swal.fire("Deleted!", "Flash Sale deal removed.", "success");
      fetchFlashSales();
    }
  };

  const toggleStatus = async (item) => {
    const nextStatus = item.status === "active" ? "inactive" : "active";
    await updateFlashSaleApi(item.id, { status: nextStatus });
    fetchFlashSales();
  };

  const filtered = flashSales.filter((item) =>
    (item.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (item.badge || "").toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = flashSales.filter((s) => s.status === "active").length;
  const avgDiscount = flashSales.length > 0
    ? Math.round(flashSales.reduce((acc, s) => acc + (s.discount || 0), 0) / flashSales.length)
    : 0;

  if (!can("flash_sale", "view")) {
    return <AccessDeniedView moduleName="Flash Sale & Deals" />;
  }

  return (
    <div className="flash-sale-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h2>
            <FaBolt className="header-bolt-icon" /> Flash Sale Deals
          </h2>
          <p>Configure live flash sale items, timer durations, and discount rates for Homepage display</p>
        </div>
        {can("flash_sale", "create") && (
          <button className="add-btn" onClick={openCreateModal}>
            <FaPlus /> New Flash Sale Deal
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="stats-grid" style={{ marginBottom: "24px", marginTop: "24px" }}>
        <div
          className="stat-card"
          onClick={() => setSearch("")}
          role="button"
          tabIndex={0}
        >
          <div className="stat-card-header">
            <div className="stat-icon-wrapper orange-bg">
              <FaFire />
            </div>
            <span className="growth-tag warning">Hot Deals</span>
          </div>
          <div className="stat-card-body">
            <h4>Live Flash Deals</h4>
            <h2 className="stat-value">{activeCount} Active</h2>
            <div className="stat-footer-row">
              <small>Live on storefront homepage</small>
              <span className="kpi-click-hint"><FaChevronRight size={11} /></span>
            </div>
          </div>
        </div>

        <div
          className="stat-card"
          onClick={() => setSearch("")}
          role="button"
          tabIndex={0}
        >
          <div className="stat-card-header">
            <div className="stat-icon-wrapper red-bg" style={{ background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", color: "#fff" }}>
              <FaPercentage />
            </div>
            <span className="growth-tag positive"><FaArrowUp /> {avgDiscount}%</span>
          </div>
          <div className="stat-card-body">
            <h4>Average Discount Rate</h4>
            <h2 className="stat-value">{avgDiscount}% OFF</h2>
            <div className="stat-footer-row">
              <small>Across active campaigns</small>
              <span className="kpi-click-hint"><FaChevronRight size={11} /></span>
            </div>
          </div>
        </div>

        <div
          className="stat-card"
          onClick={() => setSearch("")}
          role="button"
          tabIndex={0}
        >
          <div className="stat-card-header">
            <div className="stat-icon-wrapper blue-bg">
              <FaTag />
            </div>
            <span className="growth-tag positive"><FaArrowUp /> 100%</span>
          </div>
          <div className="stat-card-body">
            <h4>Total Configured Deals</h4>
            <h2 className="stat-value">{flashSales.length}</h2>
            <div className="stat-footer-row">
              <small>All scheduled flash items</small>
              <span className="kpi-click-hint"><FaChevronRight size={11} /></span>
            </div>
          </div>
        </div>

        <div
          className="stat-card"
          onClick={() => setSearch("")}
          role="button"
          tabIndex={0}
        >
          <div className="stat-card-header">
            <div className="stat-icon-wrapper purple-bg">
              <FaClock />
            </div>
            <span className="growth-tag positive">24h Cycle</span>
          </div>
          <div className="stat-card-body">
            <h4>Active Countdown Timer</h4>
            <h2 className="stat-value">24 Hours</h2>
            <div className="stat-footer-row">
              <small>Automated hourly reset</small>
              <span className="kpi-click-hint"><FaChevronRight size={11} /></span>
            </div>
          </div>
        </div>
      </div>

      {/* Main card */}
      <div className="category-card">
        <div className="toolbar">
          <div className="search">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search flash deals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Column filter dropdown */}
          <div className="column-selector-wrapper">
            <button
              className="column-filter-toggle-btn"
              onClick={() => setIsColDropdownOpen(!isColDropdownOpen)}
            >
              <FaSlidersH /> Columns
            </button>
            {isColDropdownOpen && (
              <div className="column-dropdown-list">
                {Object.keys(visibleColumns).map((col) => (
                  <label key={col} className="column-checkbox-row">
                    <input
                      type="checkbox"
                      checked={visibleColumns[col]}
                      onChange={() => toggleColumn(col)}
                    />
                    <span>{col.toUpperCase()}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading && flashSales.length === 0 ? (
          <TableSkeleton rows={5} cols={7} hasImage={true} />
        ) : (
          <div className="product-table-wrapper">
            <table className="desktop-table">
              <thead>
                <tr>
                  {visibleColumns.hash && <th>#</th>}
                  {visibleColumns.product && <th>Product Deal</th>}
                  {visibleColumns.badge && <th>Badge Tag</th>}
                  {visibleColumns.prices && <th>Flash Price</th>}
                  {visibleColumns.stock && <th>Sold Progress</th>}
                  {visibleColumns.status && <th>Status</th>}
                  {visibleColumns.actions && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, index) => (
                  <tr key={item.id}>
                    {visibleColumns.hash && <td>{index + 1}</td>}
                    {visibleColumns.product && (
                      <td>
                        <div className="flash-product-cell">
                          <img src={item.image} alt={item.name} className="flash-table-thumb" />
                          <div>
                            <strong>{item.name}</strong>
                            <small className="block-cat">{typeof item.category === "string" ? item.category : (item.category?.name ?? "")}</small>
                          </div>
                        </div>
                      </td>
                    )}
                    {visibleColumns.badge && (
                      <td>
                        <span className="flash-badge-pill">{item.badge || "Flash Deal"}</span>
                      </td>
                    )}
                    {visibleColumns.prices && (
                      <td>
                        <div className="flash-price-cell">
                          <span className="deal-price">${item.price}</span>
                          <span className="deal-orig-price">${item.originalPrice}</span>
                          <span className="deal-discount-badge">-{item.discount}%</span>
                        </div>
                      </td>
                    )}
                    {visibleColumns.stock && (
                      <td>
                        <div className="flash-progress-cell">
                          <div className="progress-labels">
                            <span>🔥 {item.claimedPct}% Claimed</span>
                            <small>{item.stockLimit} max</small>
                          </div>
                          <div className="mini-track">
                            <div
                              className="mini-fill"
                              style={{ width: `${item.claimedPct}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    )}
                    {visibleColumns.status && (
                      <td>
                        <button
                          className={`status-pill-btn ${item.status === "active" ? "active" : "inactive"}`}
                          onClick={() => toggleStatus(item)}
                        >
                          {item.status === "active" ? <FaCheckCircle /> : <FaTimesCircle />}
                          {item.status === "active" ? "Active" : "Inactive"}
                        </button>
                      </td>
                    )}
                    {visibleColumns.actions && (
                      <td>
                        <div className="table-row-actions">
                          {can("flash_sale", "edit") && (
                            <button className="edit-btn" onClick={() => openEditModal(item)} title="Edit">
                              <FaEdit />
                            </button>
                          )}
                          {can("flash_sale", "delete") && (
                            <button className="delete-btn" onClick={() => handleDelete(item.id)} title="Delete">
                              <FaTrash />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="7" className="no-data">No flash sales configured</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Mobile Card List View (< 768px) */}
            <div className="mobile-cards-container">
              {filtered.map((item, index) => {
                const timeRemaining = formatTimeRemaining(item);
                return (
                  <div className="flash-mobile-card" key={item.id}>
                    <div className="flash-mobile-card-top">
                      <div className="flash-mobile-prod-media">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="flash-mobile-thumb"
                          onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150&q=80";
                          }}
                        />
                        <span className="flash-mobile-rank-badge">#{index + 1}</span>
                      </div>
                      <div className="flash-mobile-prod-info">
                        <div className="flash-mobile-badge-row">
                          <span className="flash-badge-pill">{item.badge || "Flash Deal"}</span>
                          <span className="flash-timer-pill">
                            <FaClock size={10} /> {timeRemaining}
                          </span>
                        </div>
                        <h4 className="flash-mobile-title">{item.name}</h4>
                        <span className="block-cat">{typeof item.category === "string" ? item.category : (item.category?.name ?? "General")}</span>
                      </div>
                    </div>

                    <div className="flash-mobile-card-details">
                      <div className="flash-mobile-price-box">
                        <span className="deal-price">${item.price}</span>
                        <span className="deal-orig-price">${item.originalPrice}</span>
                        <span className="deal-discount-badge">-{item.discount}%</span>
                      </div>

                      <div className="flash-mobile-progress-box">
                        <div className="progress-labels">
                          <span>🔥 {item.claimedPct}% Claimed</span>
                          <small>{item.stockLimit} max</small>
                        </div>
                        <div className="mini-track">
                          <div
                            className="mini-fill"
                            style={{ width: `${item.claimedPct}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="flash-mobile-card-footer">
                      <button
                        className={`status-pill-btn ${item.status === "active" ? "active" : "inactive"}`}
                        onClick={() => toggleStatus(item)}
                      >
                        {item.status === "active" ? <FaCheckCircle /> : <FaTimesCircle />}
                        {item.status === "active" ? "Active" : "Inactive"}
                      </button>

                      <div className="mobile-card-actions">
                        {can("flash_sale", "edit") && (
                          <button className="edit-btn" onClick={() => openEditModal(item)} title="Edit">
                            <FaEdit /> Edit
                          </button>
                        )}
                        {can("flash_sale", "delete") && (
                          <button className="delete-btn" onClick={() => handleDelete(item.id)} title="Delete">
                            <FaTrash /> Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="no-data">No flash sales configured</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedSale ? "Edit Flash Sale Deal" : "New Flash Sale Deal"}
        size="md"
      >
        <form onSubmit={handleSave} className="product-form">
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Select Product</label>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                {previewImage && (
                  <img
                    src={previewImage}
                    alt="product preview"
                    style={{
                      width: 64, height: 64, objectFit: "cover",
                      borderRadius: 8, border: "2px solid #e5e7eb",
                      flexShrink: 0
                    }}
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                )}
                <select
                  value={productId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  required
                  style={{ flex: 1 }}
                >
                  <option value="">-- Choose a product from catalog --</option>
                  {(Array.isArray(availableProducts) ? availableProducts : []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (${Number(p.price).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Deal Tag / Badge</label>
              <input
                type="text"
                placeholder="Flash Deal, Hot Sale, Mega Deal"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Original Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label>Flash Discount (%)</label>
              <input
                type="number"
                min="1"
                max="99"
                value={discount}
                onChange={(e) => handleDiscountChange(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Flash Sale Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => handlePriceChange(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Stock Limit Quantity</label>
              <input
                type="number"
                min="1"
                value={stockLimit}
                onChange={(e) => setStockLimit(Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label>Initial Sold / Claimed %</label>
              <input
                type="number"
                min="0"
                max="100"
                value={claimedPct}
                onChange={(e) => setClaimedPct(Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label>Campaign Duration (Hours)</label>
              <input
                type="number"
                min="1"
                max="168"
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="active">Active (Visible on Homepage)</option>
                <option value="inactive">Inactive (Hidden)</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? "Saving..." : "Save Flash Sale"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default FlashSalePage;
