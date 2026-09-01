import React, { useEffect, useState } from "react";
import {
    FaPlus,
    FaSearch,
    FaEdit,
    FaTrash,
    FaUser,
    FaUserCheck,
    FaUserTimes,
    FaUserPlus,
    FaChevronRight,
    FaArrowUp,
    FaSlidersH,
    FaKey,
    FaEye,
    FaEyeSlash
} from "react-icons/fa";
import Swal from "sweetalert2";
import {
    CustomersApi,
    createCutomersApi,
    updateCustomersApi,
    deleteCustomersApi,
    adminChangeUserPasswordApi
} from "../../services/customerService";
import Modal from "../../components/Modal";
import { TableSkeleton, KpiCardSkeleton } from "../../components/loading/LoadingSkeleton";
import { usePermissions, AccessDeniedView } from "../../hooks/usePermissions.jsx";
import "./style/CustomersPage.css";

function CustomersPage() {
    const { can } = usePermissions();
    const [customers, setCustomers] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        password: ""
    });

    const [passwordForm, setPasswordForm] = useState({
        newPassword: "",
        confirmPassword: ""
    });
    const [showPassword, setShowPassword] = useState(false);

    // Column visibility states
    const [isColDropdownOpen, setIsColDropdownOpen] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState({
        hash: true,
        customer: true,
        email: true,
        phone: true,
        status: true,
        role: true,
        actions: true
    });

    const colHeaders = {
        hash: "#",
        customer: "Customer",
        email: "Email",
        phone: "Phone",
        status: "Status",
        role: "Role",
        actions: "Action"
    };

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const res = await CustomersApi();
            setCustomers(res.data || []);
        } catch (error) {
            Swal.fire("Error", error.message || "Failed to load customers", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const toggleColumn = (col) => {
        setVisibleColumns(prev => ({
            ...prev,
            [col]: !prev[col]
        }));
    };

    const openCreateModal = () => {
        setSelectedCustomer(null);
        setForm({
            name: "",
            email: "",
            phone: "",
            password: ""
        });
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setSelectedCustomer(item);
        setForm({
            name: item.name || "",
            email: item.email || "",
            phone: item.phone || "",
            password: ""
        });
        setIsModalOpen(true);
    };

    const openPasswordModal = (item) => {
        setSelectedCustomer(item);
        setPasswordForm({
            newPassword: "",
            confirmPassword: ""
        });
        setShowPassword(false);
        setIsPasswordModalOpen(true);
    };

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (selectedCustomer) {
                await updateCustomersApi(selectedCustomer.id, form);
                Swal.fire("Success", "Customer updated successfully", "success");
            } else {
                await createCutomersApi(form);
                Swal.fire("Success", "Customer created successfully", "success");
            }
            setIsModalOpen(false);
            fetchCustomers();
        } catch (error) {
            Swal.fire("Error", error.message || "Failed to save customer", "error");
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordForm.newPassword.length < 6) {
            Swal.fire("Warning", "Password must be at least 6 characters long.", "warning");
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            Swal.fire("Warning", "Passwords do not match.", "warning");
            return;
        }

        try {
            setLoading(true);
            await adminChangeUserPasswordApi(selectedCustomer.id, passwordForm.newPassword);
            Swal.fire("Success", `Password updated for ${selectedCustomer.name}!`, "success");
            setIsPasswordModalOpen(false);
        } catch (error) {
            Swal.fire("Error", error.message || "Failed to change password", "error");
        } finally {
            setLoading(false);
        }
    };

    const deleteCustomer = (id) => {
        Swal.fire({
            title: "Delete Customer?",
            text: "This action cannot be undone",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes delete",
            confirmButtonColor: "#d33"
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    setLoading(true);
                    await deleteCustomersApi(id);
                    Swal.fire("Deleted!", "Customer removed", "success");
                    fetchCustomers();
                } catch (error) {
                    Swal.fire("Error", error.message || "Failed to delete customer", "error");
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const filtered = customers.filter(item => {
        const matchesSearch = item.name?.toLowerCase().includes(search.toLowerCase()) ||
            item.email?.toLowerCase().includes(search.toLowerCase()) ||
            item.phone?.toLowerCase().includes(search.toLowerCase());
        if (statusFilter === "online") return matchesSearch && item.is_online;
        if (statusFilter === "active") return matchesSearch && item.is_active;
        if (statusFilter === "inactive") return matchesSearch && !item.is_active;
        return matchesSearch;
    });

    const totalCount = customers.length;
    const onlineCount = customers.filter(c => c.is_online).length;
    const activeCount = customers.filter(c => c.is_active).length;
    const inactiveCount = customers.filter(c => !c.is_active).length;
    const newClientsCount = customers.filter(c => {
        if (!c.created_at) return false;
        const diffDays = (new Date() - new Date(c.created_at)) / (1000 * 60 * 60 * 24);
        return diffDays <= 30;
    }).length || Math.min(totalCount, 3);

    if (!can("customers", "view")) {
        return <AccessDeniedView moduleName="Customer Accounts & Profiles" />;
    }

    return (
        <div className="customer-page">
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
                            <FaUser />
                        </div>
                        <span className="growth-tag positive"><FaArrowUp /> 100%</span>
                    </div>
                    <div className="stat-card-body">
                        <h4>Total Customers</h4>
                        <h2 className="stat-value">{totalCount}</h2>
                        <div className="stat-footer-row">
                            <small>All registered accounts</small>
                            <span className="kpi-click-hint"><FaChevronRight size={11} /></span>
                        </div>
                    </div>
                </div>

                {/* Online Users */}
                <div
                    className={`stat-card ${statusFilter === "online" ? "active-kpi" : ""}`}
                    onClick={() => setStatusFilter(statusFilter === "online" ? "all" : "online")}
                    role="button"
                    tabIndex={0}
                >
                    <div className="stat-card-header">
                        <div className="stat-icon-wrapper green-bg">
                            <FaUserCheck />
                        </div>
                        <span className="growth-tag positive">● {onlineCount} Active</span>
                    </div>
                    <div className="stat-card-body">
                        <h4>Online Now</h4>
                        <h2 className="stat-value" style={{ color: "#10b981" }}>{onlineCount}</h2>
                        <div className="stat-footer-row">
                            <small>Active in last 2 mins</small>
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
                        <span className="growth-tag positive"><FaArrowUp /> {totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 100}%</span>
                    </div>
                    <div className="stat-card-body">
                        <h4>Active Customers</h4>
                        <h2 className="stat-value">{activeCount}</h2>
                        <div className="stat-footer-row">
                            <small>Eligible for orders</small>
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
                            <FaUserTimes />
                        </div>
                        <span className="growth-tag warning">{inactiveCount} locked</span>
                    </div>
                    <div className="stat-card-body">
                        <h4>Inactive Customers</h4>
                        <h2 className="stat-value">{inactiveCount}</h2>
                        <div className="stat-footer-row">
                            <small>Suspended accounts</small>
                            <span className="kpi-click-hint"><FaChevronRight size={11} /></span>
                        </div>
                    </div>
                </div>

                {/* New Clients */}
                <div
                    className="stat-card"
                    onClick={() => setStatusFilter("all")}
                    role="button"
                    tabIndex={0}
                >
                    <div className="stat-card-header">
                        <div className="stat-icon-wrapper purple-bg">
                            <FaUserPlus />
                        </div>
                        <span className="growth-tag positive">+New</span>
                    </div>
                    <div className="stat-card-body">
                        <h4>New This Month</h4>
                        <h2 className="stat-value">{newClientsCount}</h2>
                        <div className="stat-footer-row">
                            <small>Joined in last 30 days</small>
                            <span className="kpi-click-hint"><FaChevronRight size={11} /></span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="page-header">
                <div>
                    <h1>Customers</h1>
                    <p>Manage your customers & user accounts</p>
                </div>
                <button className="add-btn" onClick={openCreateModal}>
                    <FaPlus /> Add Customer
                </button>
            </div>

            <div className="customer-card">
                <div className="toolbar">
                    <div className="search">
                        <FaSearch />
                        <input 
                            placeholder="Search customer..." 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                        />
                    </div>

                    {/* Column Select Filter */}
                    <div className="column-selector-wrapper">
                        <button 
                            className="column-filter-toggle-btn" 
                            onClick={() => setIsColDropdownOpen(!isColDropdownOpen)}
                        >
                            <FaSlidersH /> Columns
                        </button>
                        {isColDropdownOpen && (
                            <div className="column-dropdown-menu">
                                <h3>Toggle Columns</h3>
                                <div className="column-dropdown-list">
                                    {Object.keys(visibleColumns).map(col => (
                                        <label key={col} className="column-checkbox-row">
                                            <input 
                                                type="checkbox"
                                                checked={visibleColumns[col]}
                                                onChange={() => toggleColumn(col)}
                                            />
                                            <span>{colHeaders[col]}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {loading && customers.length === 0 ? (
                    <TableSkeleton rows={5} cols={7} hasAvatar={true} />
                ) : (
                    <div className="product-table-wrapper">
                        {/* Table view (Desktop/iPad) */}
                        <table className="desktop-table">
                            <thead>
                                <tr>
                                    {visibleColumns.hash && <th>#</th>}
                                    {visibleColumns.customer && <th>Customer</th>}
                                    {visibleColumns.email && <th>Email</th>}
                                    {visibleColumns.phone && <th>Phone</th>}
                                    {visibleColumns.status && <th>Status</th>}
                                    {visibleColumns.role && <th>Role</th>}
                                    {visibleColumns.actions && <th>Action</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((item, index) => (
                                    <tr key={item.id}>
                                        {visibleColumns.hash && <td>{index + 1}</td>}
                                        {visibleColumns.customer && (
                                             <td>
                                                <div className="customer-name">
                                                    <div className="customer-icon" style={{ position: "relative" }}>
                                                        <FaUser />
                                                        <span 
                                                            className={`presence-dot-bubble ${item.is_online ? "online" : "offline"}`} 
                                                            title={item.is_online ? "Active Now (Online)" : "Offline"}
                                                        />
                                                    </div>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                                        <strong>{item.name}</strong>
                                                        {item.is_online && (
                                                            <span className="online-mini-chip">🟢 Online</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        )}
                                        {visibleColumns.email && <td>{item.email}</td>}
                                        {visibleColumns.phone && <td>{item.phone || "-"}</td>}
                                        {visibleColumns.status && (
                                            <td>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                                                    <span className={`status-badge ${item.is_active ? "active" : "inactive"}`}>
                                                        {item.is_active ? "Active" : "Inactive"}
                                                    </span>
                                                    <span className={`presence-pill ${item.is_online ? "online" : "offline"}`}>
                                                        <span className="presence-indicator-dot" />
                                                        {item.is_online ? "Online" : "Offline"}
                                                    </span>
                                                </div>
                                            </td>
                                        )}
                                        {visibleColumns.role && (
                                            <td>
                                                <span className="role-badge">
                                                    {item.roles?.map(role => role.name).join(", ") || (item.role || "Customer")}
                                                </span>
                                            </td>
                                        )}
                                        {visibleColumns.actions && (
                                            <td>
                                                <div className="table-row-actions">
                                                    <button 
                                                        className="password-btn" 
                                                        onClick={() => openPasswordModal(item)} 
                                                        title="Change Password"
                                                    >
                                                        <FaKey />
                                                    </button>
                                                    <button className="edit-btn" onClick={() => openEditModal(item)} title="Edit">
                                                        <FaEdit />
                                                    </button>
                                                    <button className="delete-btn" onClick={() => deleteCustomer(item.id)} title="Delete">
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="no-data">No customers found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Kanban cards view (Mobile) */}
                        <div className="mobile-cards-container">
                            {filtered.map((item) => (
                                <div className="kanban-card product-card-item" key={item.id}>
                                    <div className="kanban-card-header">
                                        <div className="product-preview-info">
                                            <div className="mobile-product-icon-placeholder" style={{ position: "relative" }}>
                                                <FaUser />
                                                <span 
                                                    className={`presence-dot-bubble ${item.is_online ? "online" : "offline"}`} 
                                                    title={item.is_online ? "Active Now (Online)" : "Offline"}
                                                />
                                            </div>
                                            <div>
                                                <h4 className="mobile-product-name">{item.name}</h4>
                                                <span className="role-badge">{item.roles?.map(role => role.name).join(", ") || (item.role || "Customer")}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-end" }}>
                                            <span className={`status-badge ${item.is_active ? "active" : "inactive"}`}>
                                                {item.is_active ? "Active" : "Inactive"}
                                            </span>
                                            <span className={`presence-pill ${item.is_online ? "online" : "offline"}`}>
                                                <span className="presence-indicator-dot" />
                                                {item.is_online ? "Online" : "Offline"}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="kanban-card-body">
                                        <div className="card-info-row">
                                            <span className="info-label">Email:</span>
                                            <span className="info-value">{item.email}</span>
                                        </div>
                                        <div className="card-info-row">
                                            <span className="info-label">Phone:</span>
                                            <span className="info-value">{item.phone || "-"}</span>
                                        </div>
                                        <div className="mobile-card-actions">
                                            <button className="password-btn" onClick={() => openPasswordModal(item)} title="Change Password">
                                                <FaKey /> Key
                                            </button>
                                            <button className="edit-btn" onClick={() => openEditModal(item)}>
                                                <FaEdit /> Edit
                                            </button>
                                            <button className="delete-btn" onClick={() => deleteCustomer(item.id)}>
                                                <FaTrash /> Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filtered.length === 0 && (
                                <div className="no-data">No customers found</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Edit / Create Customer Modal */}
            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={selectedCustomer ? "Edit Customer" : "Add Customer"}
                size="md"
            >
                <form onSubmit={handleSave} className="product-form">
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Name</label>
                            <input 
                                name="name" 
                                type="text"
                                value={form.name} 
                                onChange={handleChange} 
                                required 
                                placeholder="Enter name"
                            />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input 
                                name="email" 
                                type="email" 
                                value={form.email} 
                                onChange={handleChange} 
                                required 
                                placeholder="Enter email"
                            />
                        </div>
                        <div className="form-group">
                            <label>Phone</label>
                            <input 
                                name="phone" 
                                type="text"
                                value={form.phone} 
                                onChange={handleChange} 
                                placeholder="Enter phone number"
                            />
                        </div>
                        {!selectedCustomer && (
                            <div className="form-group">
                                <label>Password</label>
                                <input 
                                    name="password" 
                                    type="password" 
                                    value={form.password} 
                                    onChange={handleChange} 
                                    required 
                                    placeholder="Enter password (min 6 characters)"
                                />
                            </div>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="save-btn" disabled={loading}>
                            {loading ? "Saving..." : "Save Customer"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Change Password Modal */}
            <Modal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                title={`Change Password - ${selectedCustomer?.name || "User"}`}
                size="sm"
            >
                <form onSubmit={handlePasswordSubmit} className="product-form">
                    <div style={{ marginBottom: "16px", color: "var(--text-muted, #64748b)", fontSize: "14px" }}>
                        Enter a new password for <strong>{selectedCustomer?.email}</strong>. The user will be able to log in with this new password immediately.
                    </div>
                    <div className="form-group" style={{ marginBottom: "14px" }}>
                        <label>New Password</label>
                        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                required
                                minLength={6}
                                placeholder="Enter new password (min 6 chars)"
                                style={{ width: "100%", paddingRight: "40px" }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: "absolute",
                                    right: "10px",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "#64748b"
                                }}
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: "20px" }}>
                        <label>Confirm New Password</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            required
                            minLength={6}
                            placeholder="Repeat new password"
                            style={{ width: "100%" }}
                        />
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="cancel-btn" onClick={() => setIsPasswordModalOpen(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="save-btn" disabled={loading} style={{ background: "#f57c00", borderColor: "#f57c00" }}>
                            {loading ? "Updating..." : "Update Password"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

export default CustomersPage;