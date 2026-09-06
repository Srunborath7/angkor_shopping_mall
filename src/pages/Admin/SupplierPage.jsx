import React, { useEffect, useState, useMemo } from "react";
import {
    FaPlus,
    FaSearch,
    FaEdit,
    FaTrash,
    FaTruck,
    FaEnvelope,
    FaPhone,
    FaMapMarkerAlt,
    FaCheckCircle,
    FaTimesCircle,
    FaSlidersH,
    FaUserCheck,
    FaChevronRight,
    FaArrowUp,
    FaBuilding,
    FaTimes
} from "react-icons/fa";
import Swal from "sweetalert2";
import {
    suppliersApi,
    createSupplierApi,
    updateSupplierApi,
    deleteSupplierApi
} from "../../services/supplierService";
import Modal from "../../components/Modal";
import { TableSkeleton } from "../../components/loading/LoadingSkeleton";
import { usePermissions, AccessDeniedView } from "../../hooks/usePermissions.jsx";
import "./style/SupplierPage.css";

function SupplierPage() {
    const { can, isAdmin } = usePermissions();
    const [suppliers, setSuppliers] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [loading, setLoading] = useState(false);

    // Column visibility toggle
    const [isColDropdownOpen, setIsColDropdownOpen] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState({
        hash: true,
        supplier: true,
        contactPerson: true,
        contactInfo: true,
        address: true,
        status: true,
        actions: true
    });

    // Modal & Form States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [name, setName] = useState("");
    const [contactPerson, setContactPerson] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [isActive, setIsActive] = useState(true);

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const res = await suppliersApi();
            const data = res.data?.suppliers || res.data || (Array.isArray(res) ? res : []);
            setSuppliers(data);
        } catch (error) {
            Swal.fire("Error", error.message || "Failed to load suppliers", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const toggleColumn = (col) => {
        setVisibleColumns(prev => ({
            ...prev,
            [col]: !prev[col]
        }));
    };

    const openCreateModal = () => {
        setSelectedSupplier(null);
        setName("");
        setContactPerson("");
        setEmail("");
        setPhone("");
        setAddress("");
        setIsActive(true);
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setSelectedSupplier(item);
        setName(item.name || "");
        setContactPerson(item.contact_person || "");
        setEmail(item.email || "");
        setPhone(item.phone || "");
        setAddress(item.address || "");
        setIsActive(item.is_active !== undefined ? item.is_active : true);
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            Swal.fire("Required", "Supplier Name is required", "warning");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                name,
                contact_person: contactPerson,
                email,
                phone,
                address,
                is_active: isActive
            };

            if (selectedSupplier) {
                await updateSupplierApi(selectedSupplier.id, payload);
                Swal.fire("Success", "Supplier updated successfully", "success");
            } else {
                await createSupplierApi(payload);
                Swal.fire("Success", "Supplier created successfully", "success");
            }
            setIsModalOpen(false);
            fetchSuppliers();
        } catch (error) {
            Swal.fire("Error", error.message || "Failed to save supplier", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: "Delete Supplier?",
            text: "This action cannot be undone",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, Delete"
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    setLoading(true);
                    await deleteSupplierApi(id);
                    Swal.fire("Deleted!", "Supplier has been removed", "success");
                    fetchSuppliers();
                } catch (error) {
                    Swal.fire("Error", error.message || "Failed to delete supplier", "error");
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    // Filter Logic
    const filteredSuppliers = suppliers.filter(item => {
        const matchesSearch =
            (item.name || "").toLowerCase().includes(search.toLowerCase()) ||
            (item.contact_person || "").toLowerCase().includes(search.toLowerCase()) ||
            (item.email || "").toLowerCase().includes(search.toLowerCase()) ||
            (item.phone || "").toLowerCase().includes(search.toLowerCase());

        const matchesStatus =
            statusFilter === "all" ? true :
            statusFilter === "active" ? item.is_active === true :
            item.is_active === false;

        return matchesSearch && matchesStatus;
    });

    // Multi-select state & handlers
    const [selectedIds, setSelectedIds] = useState([]);
    const visibleIds = useMemo(() => filteredSuppliers.map(s => s.id), [filteredSuppliers]);
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
            title: `Delete ${count} Suppliers?`,
            text: "This action will permanently remove all selected vendor profiles.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#64748b",
            confirmButtonText: `Yes, delete ${count} suppliers`
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    setLoading(true);
                    await Promise.all(selectedIds.map(id => deleteSupplierApi(id)));
                    setSelectedIds([]);
                    Swal.fire("Deleted!", `${count} suppliers deleted successfully.`, "success");
                    fetchSuppliers();
                } catch (error) {
                    Swal.fire("Error", error.message || "Failed to delete suppliers", "error");
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
            title: `Set ${count} suppliers to ${newStatus ? "Active" : "Inactive"}?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#10b981",
            cancelButtonColor: "#64748b",
            confirmButtonText: "Confirm"
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    setLoading(true);
                    await Promise.all(selectedIds.map(id => updateSupplierApi(id, { is_active: newStatus })));
                    setSelectedIds([]);
                    Swal.fire("Updated!", `${count} suppliers updated.`, "success");
                    fetchSuppliers();
                } catch (error) {
                    Swal.fire("Error", error.message || "Failed to update suppliers", "error");
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const activeCount = suppliers.filter(s => s.is_active).length;
    const inactiveCount = suppliers.filter(s => !s.is_active).length;

    if (!can("suppliers", "view")) {
        return <AccessDeniedView moduleName="Suppliers & Vendor Directory" />;
    }

    return (
        <div className="supplier-page">
            {/* Header */}
            <div className="page-header">
                <div className="header-title">
                    <h1>Suppliers Directory</h1>
                    <p>Manage product vendors, contact info, and active supply partners</p>
                </div>
                {can("suppliers", "create") && (
                    <button className="add-btn" onClick={openCreateModal}>
                        <FaPlus /> Add New Supplier
                    </button>
                )}
            </div>

            {/* Stats Row */}
            <div className="stats-grid" style={{ marginBottom: "24px" }}>
                {/* Total */}
                <div
                    className={`stat-card ${statusFilter === "all" ? "active-kpi" : ""}`}
                    onClick={() => setStatusFilter("all")}
                    role="button"
                    tabIndex={0}
                >
                    <div className="stat-card-header">
                        <div className="stat-icon-wrapper blue-bg">
                            <FaTruck />
                        </div>
                        <span className="growth-tag positive"><FaArrowUp /> 100%</span>
                    </div>
                    <div className="stat-card-body">
                        <h4>Total Suppliers</h4>
                        <h2 className="stat-value">{suppliers.length}</h2>
                        <div className="stat-footer-row">
                            <small>Registered procurement vendors</small>
                            <span className="kpi-click-hint"><FaChevronRight size={11} /></span>
                        </div>
                    </div>
                </div>

                {/* Active */}
                <div
                    className={`stat-card ${statusFilter === "active" ? "active-kpi" : ""}`}
                    onClick={() => setStatusFilter(statusFilter === "active" ? "all" : "active")}
                    role="button"
                    tabIndex={0}
                >
                    <div className="stat-card-header">
                        <div className="stat-icon-wrapper green-bg">
                            <FaUserCheck />
                        </div>
                        <span className="growth-tag positive"><FaArrowUp /> {suppliers.length > 0 ? Math.round((activeCount / suppliers.length) * 100) : 100}%</span>
                    </div>
                    <div className="stat-card-body">
                        <h4>Active Partners</h4>
                        <h2 className="stat-value">{activeCount}</h2>
                        <div className="stat-footer-row">
                            <small>Open purchase agreements</small>
                            <span className="kpi-click-hint"><FaChevronRight size={11} /></span>
                        </div>
                    </div>
                </div>

                {/* Inactive */}
                <div
                    className={`stat-card ${statusFilter === "inactive" ? "active-kpi" : ""}`}
                    onClick={() => setStatusFilter(statusFilter === "inactive" ? "all" : "inactive")}
                    role="button"
                    tabIndex={0}
                >
                    <div className="stat-card-header">
                        <div className="stat-icon-wrapper orange-bg">
                            <FaTimesCircle />
                        </div>
                        <span className="growth-tag warning">{inactiveCount} paused</span>
                    </div>
                    <div className="stat-card-body">
                        <h4>Inactive Vendors</h4>
                        <h2 className="stat-value">{inactiveCount}</h2>
                        <div className="stat-footer-row">
                            <small>Suspended supplier contracts</small>
                            <span className="kpi-click-hint"><FaChevronRight size={11} /></span>
                        </div>
                    </div>
                </div>

                {/* Verified Corporate */}
                <div
                    className="stat-card"
                    onClick={() => setStatusFilter("all")}
                    role="button"
                    tabIndex={0}
                >
                    <div className="stat-card-header">
                        <div className="stat-icon-wrapper purple-bg">
                            <FaBuilding />
                        </div>
                        <span className="growth-tag positive">Verified</span>
                    </div>
                    <div className="stat-card-body">
                        <h4>Verified Partners</h4>
                        <h2 className="stat-value">{activeCount}</h2>
                        <div className="stat-footer-row">
                            <small>Direct factory authorized</small>
                            <span className="kpi-click-hint"><FaChevronRight size={11} /></span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Card */}
            <div className="supplier-card">
                {/* Toolbar */}
                <div className="supplier-toolbar">
                    <div className="search-group supplier-search-box">
                        <FaSearch className="supplier-search-icon" />
                        <input
                            type="text"
                            placeholder="Search by supplier name, contact, email or phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="supplier-search-input"
                        />
                    </div>

                    <div className="filter-actions">
                        <select
                            className="status-select"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active Only</option>
                            <option value="inactive">Inactive Only</option>
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
                                            checked={visibleColumns.hash}
                                            onChange={() => toggleColumn("hash")}
                                        /> # Index
                                    </label>
                                    <label className="col-dropdown-item">
                                        <input
                                            type="checkbox"
                                            checked={visibleColumns.supplier}
                                            onChange={() => toggleColumn("supplier")}
                                        /> Supplier Name
                                    </label>
                                    <label className="col-dropdown-item">
                                        <input
                                            type="checkbox"
                                            checked={visibleColumns.contactPerson}
                                            onChange={() => toggleColumn("contactPerson")}
                                        /> Contact Person
                                    </label>
                                    <label className="col-dropdown-item">
                                        <input
                                            type="checkbox"
                                            checked={visibleColumns.contactInfo}
                                            onChange={() => toggleColumn("contactInfo")}
                                        /> Email / Phone
                                    </label>
                                    <label className="col-dropdown-item">
                                        <input
                                            type="checkbox"
                                            checked={visibleColumns.address}
                                            onChange={() => toggleColumn("address")}
                                        /> Address
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
                                <strong>{selectedIds.length}</strong> {selectedIds.length === 1 ? "supplier" : "suppliers"} selected
                            </span>
                            <button type="button" className="bulk-banner-text-btn" onClick={() => setSelectedIds([])}>
                                Deselect all
                            </button>
                            {suppliers.length > filteredSuppliers.length && (
                                <button
                                    type="button"
                                    className="bulk-banner-text-btn"
                                    onClick={() => setSelectedIds(suppliers.map(s => s.id))}
                                >
                                    Select all {suppliers.length} in database
                                </button>
                            )}
                        </div>
                        <div className="bulk-banner-actions">
                            <button
                                type="button"
                                className="bulk-action-secondary-btn"
                                onClick={() => handleBulkStatusChange(true)}
                                disabled={loading}
                            >
                                <FaCheckCircle /> Set Active
                            </button>
                            <button
                                type="button"
                                className="bulk-action-secondary-btn"
                                onClick={() => handleBulkStatusChange(false)}
                                disabled={loading}
                            >
                                <FaTimes /> Set Inactive
                            </button>
                            {can("suppliers", "delete") && (
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
                {loading && suppliers.length === 0 ? (
                    <TableSkeleton rows={5} cols={isAdmin ? 8 : 7} hasAvatar={true} />
                ) : filteredSuppliers.length === 0 ? (
                    <div className="empty-box">
                        <p>No suppliers found matching your filters.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="supplier-table">
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
                                                title="Select all visible suppliers"
                                            />
                                        </th>
                                    )}
                                    {visibleColumns.hash && <th>#</th>}
                                    {visibleColumns.supplier && <th>Supplier Name</th>}
                                    {visibleColumns.contactPerson && <th>Contact Person</th>}
                                    {visibleColumns.contactInfo && <th>Email & Phone</th>}
                                    {visibleColumns.address && <th>Address</th>}
                                    {visibleColumns.status && <th>Status</th>}
                                    {visibleColumns.actions && <th style={{ textAlign: "right" }}>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSuppliers.map((item, index) => (
                                    <tr key={item.id || index} className={isAdmin && selectedIds.includes(item.id) ? "admin-row-selected" : ""}>
                                        {isAdmin && (
                                            <td className="admin-td-checkbox" onClick={e => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    className="admin-row-checkbox"
                                                    checked={selectedIds.includes(item.id)}
                                                    onChange={e => handleSelectRow(item.id, e)}
                                                    title="Select this supplier"
                                                />
                                            </td>
                                        )}
                                        {visibleColumns.hash && (
                                            <td style={{ fontWeight: 600, color: "#9ca3af" }}>
                                                {index + 1}
                                            </td>
                                        )}

                                        {visibleColumns.supplier && (
                                            <td>
                                                <div className="supplier-name-box">
                                                    <div className="supplier-avatar">
                                                        {(item.name || "S").charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="supplier-details-cell">
                                                        <div className="supplier-title">{item.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                        )}

                                        {visibleColumns.contactPerson && (
                                            <td style={{ fontWeight: 500 }}>
                                                {item.contact_person || <span style={{ color: "#9ca3af" }}>—</span>}
                                            </td>
                                        )}

                                        {visibleColumns.contactInfo && (
                                            <td>
                                                <div className="contact-cell">
                                                    {item.email && (
                                                        <div className="contact-item">
                                                            <FaEnvelope /> {item.email}
                                                        </div>
                                                    )}
                                                    {item.phone && (
                                                        <div className="contact-item">
                                                            <FaPhone /> {item.phone}
                                                        </div>
                                                    )}
                                                    {!item.email && !item.phone && (
                                                        <span style={{ color: "#9ca3af" }}>N/A</span>
                                                    )}
                                                </div>
                                            </td>
                                        )}

                                        {visibleColumns.address && (
                                            <td>
                                                {item.address ? (
                                                    <div className="contact-item">
                                                        <FaMapMarkerAlt /> {item.address}
                                                    </div>
                                                ) : (
                                                    <span style={{ color: "#9ca3af" }}>N/A</span>
                                                )}
                                            </td>
                                        )}

                                        {visibleColumns.status && (
                                            <td>
                                                <span className={`status-badge ${item.is_active ? "active" : "inactive"}`}>
                                                    <span className="dot"></span>
                                                    {item.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                        )}

                                        {visibleColumns.actions && (
                                            <td>
                                                <div className="action-btns" style={{ justifyContent: "flex-end" }}>
                                                    {can("suppliers", "edit") && (
                                                        <button
                                                            className="btn-icon edit"
                                                            title="Edit Supplier"
                                                            onClick={() => openEditModal(item)}
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                    )}
                                                    {can("suppliers", "delete") && (
                                                        <button
                                                            className="btn-icon delete"
                                                            title="Delete Supplier"
                                                            onClick={() => handleDelete(item.id)}
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

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedSupplier ? "Edit Supplier" : "Add New Supplier"}
                size="md"
            >
                <form onSubmit={handleSave} className="modal-form">
                    <div className="form-group">
                        <label>Supplier / Company Name *</label>
                        <input
                            type="text"
                            placeholder="e.g. Angkor Global Tech Co., Ltd."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="form-input"
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Contact Person</label>
                            <input
                                type="text"
                                placeholder="e.g. John Doe"
                                value={contactPerson}
                                onChange={(e) => setContactPerson(e.target.value)}
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>Phone Number</label>
                            <input
                                type="text"
                                placeholder="e.g. +855 12 345 678"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="form-input"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            placeholder="e.g. supplier@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label>Physical / Business Address</label>
                        <textarea
                            placeholder="e.g. #123, St 271, Phnom Penh, Cambodia"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="form-textarea"
                            rows={3}
                        />
                    </div>

                    <div className="toggle-switch-container">
                        <div>
                            <div style={{ fontWeight: 600, fontSize: "14px" }}>Active Supplier Status</div>
                            <div style={{ fontSize: "12px", color: "#6b7280" }}>Inactive suppliers cannot be assigned to new purchase orders</div>
                        </div>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                            />
                            <span className="slider"></span>
                        </label>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn-cancel"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Cancel
                        </button>
                        <button type="submit" className="btn-save" disabled={loading}>
                            {loading ? "Saving..." : selectedSupplier ? "Update Supplier" : "Create Supplier"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

export default SupplierPage;
