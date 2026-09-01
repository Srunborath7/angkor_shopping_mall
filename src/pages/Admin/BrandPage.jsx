import React, { useEffect, useState } from "react";
import {
    FaPlus,
    FaSearch,
    FaEdit,
    FaTrash,
    FaBookmark,
    FaAward,
    FaGlobe,
    FaChevronRight,
    FaArrowUp,
    FaSlidersH
} from "react-icons/fa";
import Swal from "sweetalert2";
import {
    brandsApi,
    createBrandApi,
    updateBrandApi,
    deleteBrandApi
} from "../../services/brandsService";
import Modal from "../../components/Modal";
import { TableSkeleton } from "../../components/loading/LoadingSkeleton";
import { usePermissions, AccessDeniedView } from "../../hooks/usePermissions.jsx";
import "./style/BrandPage.css";

function BrandPage() {
    const { can } = usePermissions();
    const [brands, setBrands] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    // Column visibility states
    const [isColDropdownOpen, setIsColDropdownOpen] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState({
        hash: true,
        name: true,
        description: true,
        actions: true
    });

    const colHeaders = {
        hash: "#",
        name: "Brand Name",
        description: "Description",
        actions: "Action"
    };

    // Modal & Form States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const fetchBrands = async () => {
        try {
            setLoading(true);
            const res = await brandsApi();
            setBrands(res.data?.brands || res.data || []);
        } catch (error) {
            Swal.fire("Error", error.message || "Failed to load brands", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBrands();
    }, []);

    const toggleColumn = (col) => {
        setVisibleColumns(prev => ({
            ...prev,
            [col]: !prev[col]
        }));
    };

    const openCreateModal = () => {
        setSelectedBrand(null);
        setName("");
        setDescription("");
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setSelectedBrand(item);
        setName(item.name || "");
        setDescription(item.description || "");
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const payload = { name, description };
            if (selectedBrand) {
                await updateBrandApi(selectedBrand.id, payload);
                Swal.fire("Success", "Brand updated successfully", "success");
            } else {
                await createBrandApi(payload);
                Swal.fire("Success", "Brand created successfully", "success");
            }
            setIsModalOpen(false);
            fetchBrands();
        } catch (error) {
            Swal.fire("Error", error.message || "Failed to save brand", "error");
        } finally {
            setLoading(false);
        }
    };

    const deleteBrand = (id) => {
        Swal.fire({
            title: "Delete Brand?",
            text: "This action cannot be undone",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!"
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    setLoading(true);
                    await deleteBrandApi(id);
                    Swal.fire("Deleted!", "Brand removed successfully", "success");
                    fetchBrands();
                } catch (error) {
                    Swal.fire("Error", error.message || "Failed to delete brand", "error");
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const filtered = brands.filter(item =>
        item.name?.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase())
    );

    if (!can("brands", "view")) {
        return <AccessDeniedView moduleName="Brands & Partners" />;
    }

    return (
        <div className="brand-page">
            <div className="stats-grid" style={{ marginBottom: "24px" }}>
                {/* Total Brands */}
                <div
                    className="stat-card"
                    onClick={() => setSearch("")}
                    role="button"
                    tabIndex={0}
                >
                    <div className="stat-card-header">
                        <div className="stat-icon-wrapper blue-bg">
                            <FaBookmark />
                        </div>
                        <span className="growth-tag positive"><FaArrowUp /> 100%</span>
                    </div>
                    <div className="stat-card-body">
                        <h4>Total Brands</h4>
                        <h2 className="stat-value">{brands.length}</h2>
                        <div className="stat-footer-row">
                            <small>Authorized label partners</small>
                            <span className="kpi-click-hint"><FaChevronRight size={11} /></span>
                        </div>
                    </div>
                </div>

                {/* Global Brand Partners */}
                <div
                    className="stat-card"
                    onClick={() => setSearch("Apple")}
                    role="button"
                    tabIndex={0}
                >
                    <div className="stat-card-header">
                        <div className="stat-icon-wrapper green-bg">
                            <FaAward />
                        </div>
                        <span className="growth-tag positive">Global</span>
                    </div>
                    <div className="stat-card-body">
                        <h4>Tier 1 Global Brands</h4>
                        <h2 className="stat-value">{Math.min(brands.length, 8)}</h2>
                        <div className="stat-footer-row">
                            <small>Official flagship vendors</small>
                            <span className="kpi-click-hint"><FaChevronRight size={11} /></span>
                        </div>
                    </div>
                </div>

                {/* Regional Partners */}
                <div
                    className="stat-card"
                    onClick={() => setSearch("")}
                    role="button"
                    tabIndex={0}
                >
                    <div className="stat-card-header">
                        <div className="stat-icon-wrapper purple-bg">
                            <FaGlobe />
                        </div>
                        <span className="growth-tag positive">Active</span>
                    </div>
                    <div className="stat-card-body">
                        <h4>Regional Distribution</h4>
                        <h2 className="stat-value">{brands.length}</h2>
                        <div className="stat-footer-row">
                            <small>Southeast Asia partners</small>
                            <span className="kpi-click-hint"><FaChevronRight size={11} /></span>
                        </div>
                    </div>
                </div>

                {/* Active Catalog Brands */}
                <div
                    className="stat-card"
                    onClick={() => setSearch("")}
                    role="button"
                    tabIndex={0}
                >
                    <div className="stat-card-header">
                        <div className="stat-icon-wrapper orange-bg">
                            <FaBookmark />
                        </div>
                        <span className="growth-tag positive"><FaArrowUp /> Verified</span>
                    </div>
                    <div className="stat-card-body">
                        <h4>Catalog Partnerships</h4>
                        <h2 className="stat-value">{brands.length}</h2>
                        <div className="stat-footer-row">
                            <small>Verified authentic labels</small>
                            <span className="kpi-click-hint"><FaChevronRight size={11} /></span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="page-header">
                <div>
                    <h1>Brands</h1>
                    <p>Manage your product brands</p>
                </div>
                {can("brands", "create") && (
                    <button className="add-btn" onClick={openCreateModal}>
                        <FaPlus /> Add Brand
                    </button>
                )}
            </div>

            <div className="brand-card">
                <div className="toolbar">
                    <div className="search">
                        <FaSearch />
                        <input
                            placeholder="Search brand..."
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

                {loading && brands.length === 0 ? (
                    <TableSkeleton rows={5} cols={4} hasImage={false} />
                ) : (
                    <div className="brand-table-wrapper">
                        {/* Table view (Desktop/iPad) */}
                        <table className="desktop-table">
                            <thead>
                                <tr>
                                    {visibleColumns.hash && <th>#</th>}
                                    {visibleColumns.name && <th>Brand Name</th>}
                                    {visibleColumns.description && <th>Description</th>}
                                    {visibleColumns.actions && <th>Action</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((item, index) => (
                                    <tr key={item.id}>
                                        {visibleColumns.hash && <td>{index + 1}</td>}
                                        {visibleColumns.name && (
                                            <td>
                                                <div className="brand-name">
                                                    <div className="brand-icon">
                                                        <FaBookmark />
                                                    </div>
                                                    <strong>{item.name}</strong>
                                                </div>
                                            </td>
                                        )}
                                        {visibleColumns.description && <td>{item.description || "-"}</td>}
                                        {visibleColumns.actions && (
                                            <td>
                                                <div className="table-row-actions">
                                                    {can("brands", "edit") && (
                                                        <button className="edit-btn" onClick={() => openEditModal(item)} title="Edit">
                                                            <FaEdit />
                                                        </button>
                                                    )}
                                                    {can("brands", "delete") && (
                                                        <button className="delete-btn" onClick={() => deleteBrand(item.id)} title="Delete">
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
                                        <td colSpan="4" className="no-data">No brands found</td>
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
                                            <div className="mobile-product-icon-placeholder"><FaBookmark /></div>
                                            <div>
                                                <h4 className="mobile-product-name">{item.name}</h4>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="kanban-card-body">
                                        {item.description && (
                                            <div className="mobile-product-description">
                                                <small>{item.description}</small>
                                            </div>
                                        )}
                                        <div className="mobile-card-actions">
                                            {can("brands", "edit") && (
                                                <button className="edit-btn" onClick={() => openEditModal(item)}>
                                                    <FaEdit /> Edit
                                                </button>
                                            )}
                                            {can("brands", "delete") && (
                                                <button className="delete-btn" onClick={() => deleteBrand(item.id)}>
                                                    <FaTrash /> Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filtered.length === 0 && (
                                <div className="no-data">No brands found</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal integration */}
            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={selectedBrand ? "Edit Brand" : "Add Brand"}
                size="md"
            >
                <form onSubmit={handleSave} className="product-form">
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Brand Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                                placeholder="Enter brand name"
                            />
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Enter brand description"
                                rows="4"
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="save-btn" disabled={loading}>
                            {loading ? "Saving..." : "Save Brand"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

export default BrandPage;
