import React, { useEffect, useState } from "react";
import {
    FaPlus,
    FaSearch,
    FaEdit,
    FaTrash,
    FaUser,
    FaSlidersH
} from "react-icons/fa";
import Swal from "sweetalert2";
import {
    CustomersApi,
    createCutomersApi,
    updateCustomersApi,
    deleteCustomersApi
} from "../../services/customerService";
import Modal from "../../components/Modal";
import "./style/CustomersPage.css";

function CustomersPage() {
    const [customers, setCustomers] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        password: ""
    });

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

    const filtered = customers.filter(item =>
        item.name?.toLowerCase().includes(search.toLowerCase()) ||
        item.email?.toLowerCase().includes(search.toLowerCase())
    );

    const totalCount = customers.length;
    const activeCount = customers.filter(c => c.is_active).length;
    const inactiveCount = customers.filter(c => !c.is_active).length;

    return (
        <div className="customer-page">
            <div className="row g-4 mb-4">
                {/* Total */}
                <div className="col-xl-4 col-md-6">
                    <div className="kpi-card total">
                        <div className="kpi-content">
                            <div>
                                <p>Total Customers</p>
                                <h1>{totalCount}</h1>
                            </div>
                            <div className="icon-box">
                                <FaUser />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active */}
                <div className="col-xl-4 col-md-6">
                    <div className="kpi-card active-status">
                        <div className="kpi-content">
                            <div>
                                <p>Active Customers</p>
                                <h1>{activeCount}</h1>
                            </div>
                            <div className="icon-box">
                                <FaUser />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Inactive */}
                <div className="col-xl-4 col-md-6">
                    <div className="kpi-card inactive-status">
                        <div className="kpi-content">
                            <div>
                                <p>Inactive Customers</p>
                                <h1>{inactiveCount}</h1>
                            </div>
                            <div className="icon-box">
                                <FaUser />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="page-header">
                <div>
                    <h1>Customers</h1>
                    <p>Manage your customers</p>
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
                    <div className="loading">Loading...</div>
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
                                                    <div className="customer-icon">
                                                        <FaUser />
                                                    </div>
                                                    <strong>{item.name}</strong>
                                                </div>
                                            </td>
                                        )}
                                        {visibleColumns.email && <td>{item.email}</td>}
                                        {visibleColumns.phone && <td>{item.phone || "-"}</td>}
                                        {visibleColumns.status && (
                                            <td>
                                                <span className={`status-badge ${item.is_active ? "active" : "inactive"}`}>
                                                    {item.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                        )}
                                        {visibleColumns.role && (
                                            <td>
                                                <span className="role-badge">
                                                    {item.roles?.map(role => role.name).join(", ") || "Customer"}
                                                </span>
                                            </td>
                                        )}
                                        {visibleColumns.actions && (
                                            <td>
                                                <div className="table-row-actions">
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
                                            <div className="mobile-product-icon-placeholder"><FaUser /></div>
                                            <div>
                                                <h4 className="mobile-product-name">{item.name}</h4>
                                                <span className="role-badge">{item.roles?.map(role => role.name).join(", ") || "Customer"}</span>
                                            </div>
                                        </div>
                                        <span className={`status-badge ${item.is_active ? "active" : "inactive"}`}>
                                            {item.is_active ? "Active" : "Inactive"}
                                        </span>
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

            {/* Modal integration */}
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
                                    placeholder="Enter password"
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
        </div>
    );
}

export default CustomersPage;