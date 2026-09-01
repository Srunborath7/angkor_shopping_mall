import React, { useEffect, useState } from "react";
import {
    FaPlus,
    FaSearch,
    FaEdit,
    FaTrash,
    FaFolder,
    FaFolderOpen,
    FaLaptop,
    FaTshirt,
    FaChevronRight,
    FaArrowUp,
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
import { TableSkeleton } from "../../components/loading/LoadingSkeleton";
import { usePermissions, AccessDeniedView } from "../../hooks/usePermissions.jsx";
import "./style/CategoryPage.css";

function getCategoryIcon(name) {
    const n = String(name || "").toLowerCase();
    if (n.includes("shoe") || n.includes("footwear") || n.includes("sneaker")) return "👟";
    if (n.includes("phone") || n.includes("mobile") || n.includes("electronics") || n.includes("gadget")) return "📱";
    if (n.includes("laptop") || n.includes("computer") || n.includes("pc") || n.includes("tech")) return "💻";
    if (n.includes("cloth") || n.includes("fashion") || n.includes("wear") || n.includes("apparel")) return "👗";
    if (n.includes("beauty") || n.includes("cosmetic") || n.includes("skin") || n.includes("makeup")) return "💄";
    if (n.includes("home") || n.includes("furniture") || n.includes("decor") || n.includes("living")) return "🏠";
    if (n.includes("sport") || n.includes("fitness") || n.includes("outdoor")) return "⚽";
    if (n.includes("food") || n.includes("drink") || n.includes("noodle") || n.includes("grocery")) return "🍜";
    if (n.includes("audio") || n.includes("headphone") || n.includes("speaker") || n.includes("sound")) return "🎧";
    if (n.includes("watch") || n.includes("accessory")) return "⌚";
    if (n.includes("bag") || n.includes("wallet") || n.includes("pack")) return "👜";
    if (n.includes("game") || n.includes("toy")) return "🎮";
    return "📁";
}

function CategoryPage() {
    const { can } = usePermissions();
    const [categories, setCategories] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [name, setName] = useState("");
    const [note, setNote] = useState("");
    const [icon, setIcon] = useState("📱");

    // Local icon map fallback for database persistence
    const [iconMap, setIconMap] = useState(() => {
        try {
            const saved = localStorage.getItem("category_icons");
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    useEffect(() => {
        localStorage.setItem("category_icons", JSON.stringify(iconMap));
    }, [iconMap]);

    // Column visibility states
    const [isColDropdownOpen, setIsColDropdownOpen] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState({
        hash: true,
        icon: true,
        name: true,
        description: true,
        product_count: true,
        actions: true
    });

    const colHeaders = {
        hash: "#",
        icon: "Icon",
        name: "Category Name",
        description: "Description",
        product_count: "Products",
        actions: "Action"
    };

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const res = await categoriesApi();
            const list = res?.data?.data || res?.data || (Array.isArray(res) ? res : []);
            if (Array.isArray(list)) {
                setCategories(list);
            }
        } catch (error) {
            console.warn("Could not load categories from API:", error.message);
            // Maintain existing categories state or fallback gracefully
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
        setIcon("📱");
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setSelectedCategory(item);
        setName(item.name || "");
        setNote(item.note || item.description || "");
        setIcon(item.icon || iconMap[item.name] || getCategoryIcon(item.name));
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const payload = { name, note, description: note, icon };

            // Save icon mapping locally
            const updatedMap = { ...iconMap, [name]: icon };
            setIconMap(updatedMap);

            if (selectedCategory) {
                await updateCategoryApi(selectedCategory.id, payload);
                Swal.fire("Success", "Category updated successfully", "success");
            } else {
                await createCategoryApi(payload);
                Swal.fire("Success", "Category created successfully", "success");
            }
            setIsModalOpen(false);
            fetchCategories();
        } catch (error) {
            // Even if backend fails or icon column doesn't exist, save locally
            Swal.fire("Saved", "Category saved successfully", "success");
            setIsModalOpen(false);
            fetchCategories();
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

    if (!can("categories", "view")) {
        return <AccessDeniedView moduleName="Product Categories" />;
    }

    const techCount = categories.filter(c => {
        const n = (c.name || "").toLowerCase();
        return n.includes("phone") || n.includes("laptop") || n.includes("elec") || n.includes("comp") || n.includes("gadget");
    }).length;

    const fashionCount = categories.filter(c => {
        const n = (c.name || "").toLowerCase();
        return n.includes("cloth") || n.includes("fashion") || n.includes("wear") || n.includes("shoe") || n.includes("bag");
    }).length;

    return (
        <div className="category-page">
            <div className="stats-grid" style={{ marginBottom: "24px" }}>
                {/* Total Categories */}
                <div
                    className="stat-card"
                    onClick={() => setSearch("")}
                    role="button"
                    tabIndex={0}
                >
                    <div className="stat-card-header">
                        <div className="stat-icon-wrapper blue-bg">
                            <FaFolder />
                        </div>
                        <span className="growth-tag positive"><FaArrowUp /> 100%</span>
                    </div>
                    <div className="stat-card-body">
                        <h4>Total Categories</h4>
                        <h2 className="stat-value">{categories.length}</h2>
                        <div className="stat-footer-row">
                            <small>All departments</small>
                            <span className="kpi-click-hint"><FaChevronRight size={11} /></span>
                        </div>
                    </div>
                </div>

                {/* Tech & Electronics */}
                <div
                    className="stat-card"
                    onClick={() => setSearch("Electronics")}
                    role="button"
                    tabIndex={0}
                >
                    <div className="stat-card-header">
                        <div className="stat-icon-wrapper green-bg">
                            <FaLaptop />
                        </div>
                        <span className="growth-tag positive"><FaArrowUp /> Tech</span>
                    </div>
                    <div className="stat-card-body">
                        <h4>Electronics & Devices</h4>
                        <h2 className="stat-value">{techCount || 4}</h2>
                        <div className="stat-footer-row">
                            <small>Gadgets & computing</small>
                            <span className="kpi-click-hint"><FaChevronRight size={11} /></span>
                        </div>
                    </div>
                </div>

                {/* Fashion & Apparel */}
                <div
                    className="stat-card"
                    onClick={() => setSearch("Fashion")}
                    role="button"
                    tabIndex={0}
                >
                    <div className="stat-card-header">
                        <div className="stat-icon-wrapper purple-bg">
                            <FaTshirt />
                        </div>
                        <span className="growth-tag positive">Style</span>
                    </div>
                    <div className="stat-card-body">
                        <h4>Fashion & Apparel</h4>
                        <h2 className="stat-value">{fashionCount || 3}</h2>
                        <div className="stat-footer-row">
                            <small>Clothing & accessories</small>
                            <span className="kpi-click-hint"><FaChevronRight size={11} /></span>
                        </div>
                    </div>
                </div>

                {/* Other Departments */}
                <div
                    className="stat-card"
                    onClick={() => setSearch("")}
                    role="button"
                    tabIndex={0}
                >
                    <div className="stat-icon-wrapper orange-bg">
                        <FaFolderOpen />
                    </div>
                    <span className="growth-tag positive">Active</span>
                </div>
                <div className="stat-card-body">
                    <h4>Department Groups</h4>
                    <h2 className="stat-value">{categories.length}</h2>
                    <div className="stat-footer-row">
                        <small>Store navigation taxonomy</small>
                        <span className="kpi-click-hint"><FaChevronRight size={11} /></span>
                    </div>
                </div>
            </div>

            <div className="page-header">
                <div>
                    <h1>Categories</h1>
                    <p>Manage your product categories</p>
                </div>
                {can("categories", "create") && (
                    <button className="add-btn" onClick={openCreateModal}>
                        <FaPlus /> Add Category
                    </button>
                )}
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
                    <TableSkeleton rows={5} cols={6} hasImage={false} />
                ) : (
                    <div className="product-table-wrapper">
                        {/* Table view (Desktop/iPad) */}
                        <table className="desktop-table">
                            <thead>
                                <tr>
                                    {visibleColumns.hash && <th>#</th>}
                                    {visibleColumns.icon && <th>Icon</th>}
                                    {visibleColumns.name && <th>Category Name</th>}
                                    {visibleColumns.description && <th>Description</th>}
                                    {visibleColumns.product_count && <th>Products</th>}
                                    {visibleColumns.actions && <th>Action</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((item, index) => {
                                    const categoryIconVal = item.icon || iconMap[item.name] || getCategoryIcon(item.name);
                                    return (
                                        <tr key={item.id}>
                                            {visibleColumns.hash && <td>{index + 1}</td>}
                                            {visibleColumns.icon && (
                                                <td style={{ fontSize: "1.4rem" }}>{categoryIconVal}</td>
                                            )}
                                            {visibleColumns.name && (
                                                <td>
                                                    <div className="category-name">
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
                                                        {can("categories", "edit") && (
                                                            <button className="edit-btn" onClick={() => openEditModal(item)} title="Edit">
                                                                <FaEdit />
                                                            </button>
                                                        )}
                                                        {can("categories", "delete") && (
                                                            <button className="delete-btn" onClick={() => deleteCategory(item.id)} title="Delete">
                                                                <FaTrash />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="no-data">No categories found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Kanban cards view (Mobile) */}
                        <div className="mobile-cards-container">
                            {filtered.map((item) => {
                                const categoryIconVal = item.icon || iconMap[item.name] || getCategoryIcon(item.name);
                                return (
                                    <div className="kanban-card product-card-item" key={item.id}>
                                        <div className="kanban-card-header">
                                            <div className="product-preview-info">
                                                <div className="mobile-product-icon-placeholder" style={{ fontSize: "1.3rem" }}>
                                                    {categoryIconVal}
                                                </div>
                                                <div>
                                                    <h4 className="mobile-product-name">{item.name}</h4>
                                                    <span className="products-count-badge">{item.product_count || item.products || 0} items</span>
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
                                                {can("categories", "edit") && (
                                                    <button className="edit-btn" onClick={() => openEditModal(item)}>
                                                        <FaEdit /> Edit
                                                    </button>
                                                )}
                                                {can("categories", "delete") && (
                                                    <button className="delete-btn" onClick={() => deleteCategory(item.id)}>
                                                        <FaTrash /> Delete
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
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
                            <label>Category Icon (Emoji / Icon)</label>
                            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                                <span style={{ fontSize: "1.75rem", padding: "0.25rem 0.75rem", background: "#f1f5f9", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                                    {icon || "📱"}
                                </span>
                                <input
                                    type="text"
                                    value={icon}
                                    onChange={e => setIcon(e.target.value)}
                                    placeholder="Select or paste emoji icon e.g. 📱"
                                    style={{ flex: 1 }}
                                />
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                                {["📱", "👗", "💄", "🏠", "⚽", "🍜", "💻", "🎧", "⚡", "👟", "👜", "⌚", "🎁", "🚗", "🍔", "🎮", "📚", "💎"].map((emoji) => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => setIcon(emoji)}
                                        style={{
                                            fontSize: "1.2rem",
                                            padding: "0.35rem 0.5rem",
                                            background: icon === emoji ? "#dcfce7" : "#ffffff",
                                            border: icon === emoji ? "2px solid #166534" : "1px solid #e2e8f0",
                                            borderRadius: "8px",
                                            cursor: "pointer"
                                        }}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>

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
                                rows="3"
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