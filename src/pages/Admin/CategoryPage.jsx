import React, { useEffect, useState } from "react";
import {
    FaPlus,
    FaSearch,
    FaEdit,
    FaTrash,
    FaFolder,
    FaSlidersH
} from "react-icons/fa";
import Swal from "sweetalert2";
import {
    categoriesApi,
    createCategoryApi,
    updateCategoryApi,
    deleteCategoryApi
} from "../../services/categoriesService";
import Modal from "../../components/Modal";
import "./style/CategoryPage.css";

function CategoryPage() {
    const [categories, setCategories] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [name, setName] = useState("");
    const [note, setNote] = useState("");

    // Column visibility states
    const [isColDropdownOpen, setIsColDropdownOpen] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState({
        hash: true,
        name: true,
        description: true,
        product_count: true,
        actions: true
    });

    const colHeaders = {
        hash: "#",
        name: "Category Name",
        description: "Description",
        product_count: "Products",
        actions: "Action"
    };

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const res = await categoriesApi();
            setCategories(res.data || []);
        } catch (error) {
            Swal.fire("Error", error.message || "Failed to load categories", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const toggleColumn = (col) => {
        setVisibleColumns(prev => ({
            ...prev,
            [col]: !prev[col]
        }));
    };

    const openCreateModal = () => {
        setSelectedCategory(null);
        setName("");
        setNote("");
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setSelectedCategory(item);
        setName(item.name || "");
        setNote(item.note || item.description || "");
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (selectedCategory) {
                await updateCategoryApi(selectedCategory.id, { name, note });
                Swal.fire("Success", "Category updated successfully", "success");
            } else {
                await createCategoryApi({ name, note });
                Swal.fire("Success", "Category created successfully", "success");
            }
            setIsModalOpen(false);
            fetchCategories();
        } catch (error) {
            Swal.fire("Error", error.message || "Failed to save category", "error");
        } finally {
            setLoading(false);
        }
    };

    const deleteCategory = (id) => {
        Swal.fire({
            title: "Delete Category?",
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
                    await deleteCategoryApi(id);
                    Swal.fire("Deleted!", "Category removed", "success");
                    fetchCategories();
                } catch (error) {
                    Swal.fire("Error", error.message || "Failed to delete category", "error");
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const filtered = categories.filter(item =>
        item.name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="category-page">
            <div className="page-header">
                <div>
                    <h1>Categories</h1>
                    <p>Manage your product categories</p>
                </div>
                <button className="add-btn" onClick={openCreateModal}>
                    <FaPlus /> Add Category
                </button>
            </div>
            
            <div className="category-card">
                <div className="toolbar">
                    <div className="search">
                        <FaSearch />
                        <input
                            placeholder="Search category..."
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
                
                {loading && categories.length === 0 ? (
                    <div className="loading">Loading...</div>
                ) : (
                    <div className="product-table-wrapper">
                        {/* Table view (Desktop/iPad) */}
                        <table className="desktop-table">
                            <thead>
                                <tr>
                                    {visibleColumns.hash && <th>#</th>}
                                    {visibleColumns.name && <th>Category Name</th>}
                                    {visibleColumns.description && <th>Description</th>}
                                    {visibleColumns.product_count && <th>Products</th>}
                                    {visibleColumns.actions && <th>Action</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((item, index) => (
                                    <tr key={item.id}>
                                        {visibleColumns.hash && <td>{index + 1}</td>}
                                        {visibleColumns.name && (
                                            <td>
                                                <div className="category-name">
                                                    <div className="category-icon"><FaFolder /></div>
                                                    <strong>{item.name}</strong>
                                                </div>
                                            </td>
                                        )}
                                        {visibleColumns.description && (
                                            <td>{item.description || item.note || "-"}</td>
                                        )}
                                        {visibleColumns.product_count && (
                                            <td>
                                                <span className="products-count-badge">
                                                    {item.product_count || 0} items
                                                </span>
                                            </td>
                                        )}
                                        {visibleColumns.actions && (
                                            <td>
                                                <div className="table-row-actions">
                                                    <button className="edit-btn" onClick={() => openEditModal(item)} title="Edit">
                                                        <FaEdit />
                                                    </button>
                                                    <button className="delete-btn" onClick={() => deleteCategory(item.id)} title="Delete">
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="no-data">No categories found</td>
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
                                            <div className="mobile-product-icon-placeholder"><FaFolder /></div>
                                            <div>
                                                <h4 className="mobile-product-name">{item.name}</h4>
                                                <span className="products-count-badge">{item.products || 0} items</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="kanban-card-body">
                                        {(item.description || item.note) && (
                                            <div className="mobile-product-description">
                                                <small>{item.description || item.note}</small>
                                            </div>
                                        )}
                                        <div className="mobile-card-actions">
                                            <button className="edit-btn" onClick={() => openEditModal(item)}>
                                                <FaEdit /> Edit
                                            </button>
                                            <button className="delete-btn" onClick={() => deleteCategory(item.id)}>
                                                <FaTrash /> Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filtered.length === 0 && (
                                <div className="no-data">No categories found</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal integration */}
            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={selectedCategory ? "Edit Category" : "Add Category"}
                size="md"
            >
                <form onSubmit={handleSave} className="product-form">
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Category Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                                placeholder="Enter category name"
                            />
                        </div>
                        <div className="form-group">
                            <label>Note / Description</label>
                            <textarea
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                placeholder="Enter description"
                                rows="4"
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="save-btn" disabled={loading}>
                            {loading ? "Saving..." : "Save Category"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

export default CategoryPage;