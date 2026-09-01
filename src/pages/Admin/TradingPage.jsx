import React, { useEffect, useState } from "react";
import {
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaExchangeAlt,
  FaTag,
  FaEye,
  FaCheckCircle,
  FaClock,
  FaHandshake,
  FaChevronRight,
  FaArrowUp,
} from "react-icons/fa";
import Swal from "sweetalert2";
import {
  getTradeProductsApi,
  createTradeProductApi,
  updateTradeProductApi,
  deleteTradeProductApi,
  getTradeProductByIdApi,
  updateTradeOfferStatusApi
} from "../../services/tradeService";
import { categoriesApi } from "../../services/categoriesService";
import Modal from "../../components/Modal";
import { TableSkeleton } from "../../components/loading/LoadingSkeleton";
import { usePermissions, AccessDeniedView } from "../../hooks/usePermissions.jsx";
import "./style/TradingPage.css";

const NO_IMG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23E2E8F0"/><text x="50%" y="50%" font-size="12" fill="%2394A3B8" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>`;

function formatCondition(condition) {
  switch (condition) {
    case "brand_new": return "Brand New";
    case "like_new": return "Like New";
    case "good": return "Good";
    case "fair": return "Fair";
    case "poor": return "Poor";
    default: return condition || "Good";
  }
}

function TradingPage() {
  const { can } = usePermissions();
  const [tradeProducts, setTradeProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [conditionFilter, setConditionFilter] = useState("all");
  const [verifiedFilter, setVerifiedFilter] = useState("all");

  // Modal State for View / Manage
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewProduct, setViewProduct] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    condition: "good",
    estimated_value: "",
    trading_preference: "",
    location: "Phnom Penh",
    phone_number: "",
    status: "available",
    image: null,
    image_url: ""
  });
  const [editId, setEditId] = useState(null);

  const fetchCategories = async () => {
    try {
      const res = await categoriesApi();
      const raw = res?.data?.categories || res?.data?.data || res?.data || (Array.isArray(res) ? res : []);
      setCategories(Array.isArray(raw) ? raw : []);
    } catch (e) {
      console.warn("Failed to load categories:", e);
    }
  };

  const fetchTradeProducts = async () => {
    try {
      setLoading(true);
      const params = {
        search: search || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        condition: conditionFilter !== "all" ? conditionFilter : undefined
      };
      const res = await getTradeProductsApi(params);
      const items = res?.data?.tradeProducts || res?.data?.data || res?.data || (Array.isArray(res) ? res : []);
      let list = Array.isArray(items) ? items : [];
      if (verifiedFilter === "verified") {
        list = list.filter((p) => p.is_store_verified);
      } else if (verifiedFilter === "member") {
        list = list.filter((p) => !p.is_store_verified);
      }
      setTradeProducts(list);
    } catch (err) {
      console.warn("Failed to load trade products:", err);
      setTradeProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchTradeProducts();
  }, [statusFilter, conditionFilter, verifiedFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTradeProducts();
  };

  const toastSuccess = (msg) => {
    Swal.fire({
      icon: "success",
      title: "Success",
      text: msg,
      timer: 2000,
      showConfirmButton: false
    });
  };

  const toastError = (msg) => {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: msg
    });
  };

  // Open Details Modal
  const handleOpenView = async (item) => {
    try {
      const res = await getTradeProductByIdApi(item.id);
      setViewProduct(res?.data || item);
      setIsViewModalOpen(true);
    } catch (e) {
      setViewProduct(item);
      setIsViewModalOpen(true);
    }
  };

  // Quick Change Status
  const handleQuickStatusChange = async (item, newStatus) => {
    try {
      await updateTradeProductApi(item.id, { status: newStatus });
      toastSuccess(`Listing status updated to ${newStatus}`);
      fetchTradeProducts();
      if (viewProduct && viewProduct.id === item.id) {
        setViewProduct({ ...viewProduct, status: newStatus });
      }
    } catch (err) {
      toastError(err?.message || "Failed to update status");
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setEditId(item.id);
    setFormData({
      title: item.title || "",
      description: item.description || "",
      category_id: item.category_id || "",
      condition: item.condition || "good",
      estimated_value: item.estimated_value || "",
      trading_preference: item.trading_preference || "",
      location: item.location || "",
      phone_number: item.phone_number || "",
      status: item.status || "available",
      image: null,
      image_url: item.image_url || ""
    });
    setIsEditModalOpen(true);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditId(null);
    setFormData({
      title: "",
      description: "",
      category_id: categories[0]?.id || "",
      condition: "good",
      estimated_value: "",
      trading_preference: "",
      location: "Phnom Penh",
      phone_number: "",
      status: "available",
      image: null,
      image_url: ""
    });
    setIsCreateModalOpen(true);
  };

  // Save (Create / Update)
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (!formData.title) {
        return toastError("Title is required");
      }

      const body = new FormData();
      body.append("title", formData.title);
      body.append("description", formData.description || "");
      if (formData.category_id) body.append("category_id", formData.category_id);
      body.append("condition", formData.condition);
      if (formData.estimated_value) body.append("estimated_value", formData.estimated_value);
      body.append("trading_preference", formData.trading_preference || "");
      body.append("location", formData.location || "");
      body.append("phone_number", formData.phone_number || "");
      body.append("status", formData.status);

      if (formData.image) {
        body.append("image", formData.image);
      } else if (formData.image_url) {
        body.append("image_url", formData.image_url);
      }

      if (editId) {
        await updateTradeProductApi(editId, body);
        toastSuccess("Trade listing updated successfully");
        setIsEditModalOpen(false);
      } else {
        await createTradeProductApi(body);
        toastSuccess("Trade listing created successfully");
        setIsCreateModalOpen(false);
      }
      fetchTradeProducts();
    } catch (err) {
      toastError(err?.message || "Failed to save listing");
    }
  };

  // Delete Listing
  const handleDelete = (item) => {
    Swal.fire({
      title: "Delete Trade Listing?",
      text: `Are you sure you want to delete "${item.title}"? This cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, delete it"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteTradeProductApi(item.id);
          toastSuccess("Trade listing deleted");
          fetchTradeProducts();
          if (isViewModalOpen) setIsViewModalOpen(false);
        } catch (err) {
          toastError(err?.message || "Failed to delete listing");
        }
      }
    });
  };

  // Offer Status updater from View Modal
  const handleOfferStatusChange = async (offerId, newStatus) => {
    try {
      await updateTradeOfferStatusApi(offerId, newStatus);
      toastSuccess(`Offer marked as ${newStatus}`);
      if (viewProduct) {
        handleOpenView(viewProduct);
      }
      fetchTradeProducts();
    } catch (err) {
      toastError(err?.message || "Failed to update offer");
    }
  };

  // Stats calculation
  const totalListings = tradeProducts.length;
  const availableCount = tradeProducts.filter(p => p.status === "available").length;
  const negotiatingCount = tradeProducts.filter(p => p.status === "in_negotiation").length;
  const tradedCount = tradeProducts.filter(p => p.status === "traded").length;

  if (!can("trading", "view")) {
    return <AccessDeniedView moduleName="Trade-In & Exchange" />;
  }

  return (
    <div className="trading-page-container">
      {/* Header */}
      <div className="flex-between mb-4">
        <div>
          <h1 className="page-title flex-align">
            <FaExchangeAlt className="trading-header-icon" />
            Trade & Exchange Products
          </h1>
          <p className="page-subtitle">
            Manage customer-to-customer trading listings, peer exchange requests, and status lifecycles.
          </p>
        </div>
        {(can("trading", "value") || can("trading", "create") || can("trading", "approve")) && (
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <FaPlus style={{ marginRight: 6 }} /> Create Trade Item
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ marginBottom: "24px" }}>
        <div
          className={`stat-card ${statusFilter === "all" ? "active-kpi" : ""}`}
          onClick={() => setStatusFilter("all")}
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
            <h4>Total Trade Listings</h4>
            <h2 className="stat-value">{totalListings}</h2>
            <div className="stat-footer-row">
              <small>All peer exchange items</small>
              <span className="kpi-click-hint"><FaChevronRight size={11} /></span>
            </div>
          </div>
        </div>

        <div
          className={`stat-card ${statusFilter === "available" ? "active-kpi" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "available" ? "all" : "available")}
          role="button"
          tabIndex={0}
        >
          <div className="stat-card-header">
            <div className="stat-icon-wrapper green-bg">
              <FaCheckCircle />
            </div>
            <span className="growth-tag positive"><FaArrowUp /> Active</span>
          </div>
          <div className="stat-card-body">
            <h4>Active & Available</h4>
            <h2 className="stat-value">{availableCount}</h2>
            <div className="stat-footer-row">
              <small>Open for barter offers</small>
              <span className="kpi-click-hint"><FaChevronRight size={11} /></span>
            </div>
          </div>
        </div>

        <div
          className={`stat-card ${statusFilter === "in_negotiation" ? "active-kpi" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "in_negotiation" ? "all" : "in_negotiation")}
          role="button"
          tabIndex={0}
        >
          <div className="stat-card-header">
            <div className="stat-icon-wrapper orange-bg">
              <FaClock />
            </div>
            <span className="growth-tag warning">{negotiatingCount} pending</span>
          </div>
          <div className="stat-card-body">
            <h4>In Negotiation</h4>
            <h2 className="stat-value">{negotiatingCount}</h2>
            <div className="stat-footer-row">
              <small>Active chat discussions</small>
              <span className="kpi-click-hint"><FaChevronRight size={11} /></span>
            </div>
          </div>
        </div>

        <div
          className={`stat-card ${statusFilter === "traded" ? "active-kpi" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "traded" ? "all" : "traded")}
          role="button"
          tabIndex={0}
        >
          <div className="stat-card-header">
            <div className="stat-icon-wrapper purple-bg">
              <FaHandshake />
            </div>
            <span className="growth-tag positive">Complete</span>
          </div>
          <div className="stat-card-body">
            <h4>Completed Swaps</h4>
            <h2 className="stat-value">{tradedCount}</h2>
            <div className="stat-footer-row">
              <small>Successfully swapped</small>
              <span className="kpi-click-hint"><FaChevronRight size={11} /></span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="trading-filter-bar">
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: 8, flex: 1, minWidth: 260 }}>
          <div className="search-input-wrapper" style={{ flex: 1 }}>
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search trade items, description, or preference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
        </form>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="trading-filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="in_negotiation">In Negotiation</option>
            <option value="traded">Traded</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <label style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>Condition:</label>
          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="trading-filter-select"
          >
            <option value="all">All Conditions</option>
            <option value="brand_new">Brand New</option>
            <option value="like_new">Like New</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>

          <label style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>Verification:</label>
          <select
            value={verifiedFilter}
            onChange={(e) => setVerifiedFilter(e.target.value)}
            className="trading-filter-select"
          >
            <option value="all">All Listings</option>
            <option value="verified">Verified Store Orders Only</option>
            <option value="member">Direct Member Listings</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="card">
        {loading ? (
          <TableSkeleton rows={5} cols={8} hasImage={true} />
        ) : tradeProducts.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
            <FaExchangeAlt size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p>No trade product listings found.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Product / Title</th>
                  <th>Origin & Verification</th>
                  <th>Condition</th>
                  <th>Est. Value</th>
                  <th>Wanted / Preference</th>
                  <th>Seller / Location</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tradeProducts.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <img
                          src={item.image_url || item.images?.[0]?.image_url || NO_IMG}
                          alt={item.title}
                          className="trade-thumb"
                          onError={(e) => (e.target.src = NO_IMG)}
                        />
                        <div>
                          <strong style={{ fontSize: 14, color: "#0f172a", display: "block" }}>
                            {item.title}
                          </strong>
                          <span style={{ fontSize: 12, color: "#64748b" }}>
                            {item.category?.name || "General"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      {item.is_store_verified ? (
                        <span className="store-verified-pill" title={`Verified purchase from Order #${item.order_id || ""}`}>
                          <FaCheckCircle style={{ color: "#16a34a" }} /> Store Verified
                        </span>
                      ) : (
                        <span className="member-listing-pill">
                          Member Listing
                        </span>
                      )}
                    </td>

                    <td>
                      <span className={`condition-badge badge-${item.condition || "good"}`}>
                        {formatCondition(item.condition)}
                      </span>
                    </td>

                    <td>
                      <strong style={{ color: "#059669" }}>
                        ${parseFloat(item.estimated_value || 0).toFixed(2)}
                      </strong>
                    </td>

                    <td style={{ maxWidth: 220 }}>
                      <p style={{ margin: 0, fontSize: 12, color: "#334155" }} className="line-clamp-2">
                        {item.trading_preference || "Open to any fair exchange"}
                      </p>
                    </td>

                    <td>
                      <div style={{ fontSize: 12 }}>
                        <div style={{ fontWeight: 600, color: "#0f172a" }}>
                          {item.owner?.name || "Member"}
                        </div>
                        <div style={{ color: "#64748b" }}>
                          {item.location || "Cambodia"}
                        </div>
                      </div>
                    </td>

                    <td>
                      <select
                        value={item.status || "available"}
                        onChange={(e) => handleQuickStatusChange(item, e.target.value)}
                        disabled={!can("trading", "approve") && !can("trading", "reject")}
                        className={`status-badge badge-${item.status || "available"}`}
                        style={{
                          border: "none",
                          cursor: can("trading", "approve") || can("trading", "reject") ? "pointer" : "not-allowed",
                          outline: "none"
                        }}
                      >
                        <option value="available">Available</option>
                        <option value="in_negotiation">In Negotiation</option>
                        <option value="traded">Traded</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>

                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: 6 }}>
                        <button
                          className="btn-icon btn-secondary"
                          title="View Details & Offers"
                          onClick={() => handleOpenView(item)}
                        >
                          <FaEye />
                        </button>
                        {(can("trading", "value") || can("trading", "edit")) && (
                          <button
                            className="btn-icon btn-secondary"
                            title="Edit Listing"
                            onClick={() => handleOpenEdit(item)}
                          >
                            <FaEdit />
                          </button>
                        )}
                        {(can("trading", "reject") || can("trading", "delete")) && (
                          <button
                            className="btn-icon btn-danger"
                            title="Delete Listing"
                            onClick={() => handleDelete(item)}
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details & Offers Modal */}
      {isViewModalOpen && viewProduct && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title="Trade Listing Details & Offers"
        >
          <div className="trade-details-modal">
            {/* Store Verified Purchase Banner if from past order */}
            {viewProduct.is_store_verified && (
              <div className="store-verified-banner">
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#15803d", fontWeight: 700, fontSize: 13 }}>
                  <FaCheckCircle /> Store Verified Item (Purchased on AngkorMall)
                </div>
                <div style={{ fontSize: 12, color: "#166534", marginTop: 4 }}>
                  Original Order ID: <strong>#{viewProduct.order_id || viewProduct.sourceOrder?.id || "N/A"}</strong>
                  {viewProduct.originalProduct && (
                    <span> | Product: <strong>{viewProduct.originalProduct.name}</strong> (${parseFloat(viewProduct.originalProduct.price || 0).toFixed(2)})</span>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 16 }}>
              <img
                src={viewProduct.image_url || viewProduct.images?.[0]?.image_url || NO_IMG}
                alt={viewProduct.title}
                style={{ width: 140, height: 140, borderRadius: 12, objectFit: "cover", border: "1px solid #cbd5e1" }}
                onError={(e) => (e.target.src = NO_IMG)}
              />
              <div>
                <h2 style={{ margin: "0 0 6px", fontSize: 18, color: "#0f172a" }}>{viewProduct.title}</h2>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  <span className={`condition-badge badge-${viewProduct.condition || "good"}`}>
                    {formatCondition(viewProduct.condition)}
                  </span>
                  <span className={`status-badge badge-${viewProduct.status || "available"}`}>
                    {viewProduct.status}
                  </span>
                  {viewProduct.is_store_verified && (
                    <span className="store-verified-pill">
                      <FaCheckCircle style={{ color: "#16a34a" }} /> Store Verified
                    </span>
                  )}
                </div>
                <p style={{ margin: "0 0 4px", fontSize: 14, color: "#059669", fontWeight: 700 }}>
                  Estimated Value: ${parseFloat(viewProduct.estimated_value || 0).toFixed(2)}
                </p>
                <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                  <strong>Seller:</strong> {viewProduct.owner?.name} | {viewProduct.phone_number || viewProduct.owner?.phone}
                </p>
                <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                  <strong>Location:</strong> {viewProduct.location || "Phnom Penh"}
                </p>
              </div>
            </div>

            <div>
              <h4 style={{ margin: "12px 0 4px", fontSize: 14 }}>Description</h4>
              <p style={{ fontSize: 13, color: "#334155", background: "#f8fafc", padding: 10, borderRadius: 8 }}>
                {viewProduct.description || "No description provided."}
              </p>
            </div>

            <div>
              <h4 style={{ margin: "8px 0 4px", fontSize: 14 }}>Trading Preference</h4>
              <p style={{ fontSize: 13, color: "#166534", background: "#dcfce7", padding: 10, borderRadius: 8 }}>
                {viewProduct.trading_preference || "Open to any offers"}
              </p>
            </div>

            {/* Gallery Images */}
            {viewProduct.images && viewProduct.images.length > 0 && (
              <div>
                <h4 style={{ margin: "10px 0 6px", fontSize: 14 }}>Attached Photos</h4>
                <div className="trade-gallery-row">
                  {viewProduct.images.map((img, idx) => (
                    <img
                      key={img.id || idx}
                      src={img.image_url}
                      alt="gallery"
                      className="trade-gallery-item"
                      onError={(e) => (e.target.src = NO_IMG)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Offers List */}
            <div className="offers-section">
              <h4 style={{ margin: "0 0 10px", fontSize: 15 }}>
                Buyer Trade Offers ({viewProduct.offers?.length || 0})
              </h4>
              {(!viewProduct.offers || viewProduct.offers.length === 0) ? (
                <p style={{ fontSize: 13, color: "#94a3b8" }}>No trade offers received yet for this item.</p>
              ) : (
                viewProduct.offers.map((offer) => (
                  <div key={offer.id} className="offer-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 10, borderBottom: "1px solid #f1f5f9" }}>
                    <div>
                      <strong style={{ fontSize: 14 }}>Offer from {offer.sender?.name || "Buyer"}</strong>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                        Status: <span style={{ fontWeight: 700, textTransform: "capitalize" }}>{offer.status}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {offer.status === "pending" && (
                        <>
                          {can("trading", "approve") && (
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleOfferStatusChange(offer.id, "accepted")}
                            >
                              Accept
                            </button>
                          )}
                          {can("trading", "reject") && (
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleOfferStatusChange(offer.id, "rejected")}
                            >
                              Reject
                            </button>
                          )}
                        </>
                      )}
                      {offer.status === "accepted" && can("trading", "approve") && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleOfferStatusChange(offer.id, "completed")}
                        >
                          Mark Traded
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Create / Edit Modal */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <Modal
          isOpen={isCreateModalOpen || isEditModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
          }}
          title={editId ? "Edit Trade Product" : "Create Trade Product Listing"}
        >
          <form onSubmit={handleSave} className="product-form">
            <div className="form-group mb-3">
              <label>Product Title *</label>
              <input
                type="text"
                required
                placeholder="e.g., iPhone 13 Pro 128GB"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="form-control"
              />
            </div>

            <div className="form-row mb-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="form-control"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Item Condition</label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  className="form-control"
                >
                  <option value="brand_new">Brand New (Sealed)</option>
                  <option value="like_new">Like New (99%)</option>
                  <option value="good">Good Condition</option>
                  <option value="fair">Fair (Minor Scratches)</option>
                  <option value="poor">Poor (For Parts)</option>
                </select>
              </div>
            </div>

            <div className="form-row mb-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="form-group">
                <label>Estimated Value ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g., 450"
                  value={formData.estimated_value}
                  onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="form-control"
                >
                  <option value="available">Available</option>
                  <option value="in_negotiation">In Negotiation</option>
                  <option value="traded">Traded</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="form-group mb-3">
              <label>Trading Preference (What do you want in return?)</label>
              <input
                type="text"
                placeholder="e.g., Looking for iPad Air 5 or PS5 with cash difference"
                value={formData.trading_preference}
                onChange={(e) => setFormData({ ...formData, trading_preference: e.target.value })}
                className="form-control"
              />
            </div>

            <div className="form-row mb-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  placeholder="e.g., Phnom Penh, Toul Kork"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Phone Number / Contact</label>
                <input
                  type="text"
                  placeholder="e.g., 012 345 678"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="form-control"
                />
              </div>
            </div>

            <div className="form-group mb-3">
              <label>Item Description</label>
              <textarea
                rows={3}
                placeholder="Details regarding condition, battery health, original accessories included..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="form-control"
              ></textarea>
            </div>

            <div className="form-group mb-4">
              <label>Primary Image (Upload file or paste Image URL)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                className="form-control mb-2"
              />
              <input
                type="text"
                placeholder="Or paste public image URL"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="form-control"
              />
            </div>

            <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editId ? "Update Listing" : "Create Listing"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default TradingPage;
