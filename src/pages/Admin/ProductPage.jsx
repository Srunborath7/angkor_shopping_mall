import React, { useState, useEffect } from "react";
import {
    FaPlus,
    FaSearch,
    FaEdit,
    FaTrash,
    FaBox,
    FaSlidersH
} from "react-icons/fa";
import Swal from "sweetalert2";
import {
    productsApi,
    createProductApi,
    updateProductApi,
    deleteProductApi,
    brandsApi
} from "../../services/productsService";
import { categoriesApi } from "../../services/categoriesService";
import Modal from "../../components/Modal";
import "./style/ProductPage.css";

function ProductPage() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    // Column visibility states
    const [isColDropdownOpen, setIsColDropdownOpen] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState({
        hash: true,
        image: true,
        name: true,
        category: true,
        brand: true,
        price: true,
        stock: true,
        status: true,
        actions: true
    });

    // Modal & Form States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [stockQuantity, setStockQuantity] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [brandId, setBrandId] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");

    const fetchData = async () => {
        try {
            setLoading(true);
            const [prodRes, catRes, brandRes] = await Promise.all([
                productsApi(),
                categoriesApi(),
                brandsApi().catch(() => ({ data: [] }))
            ]);

            setProducts(prodRes.data?.products || prodRes.data || []);
            setCategories(catRes.data || []);
            setBrands(brandRes.data?.brands || brandRes.data || []);

        } catch (error) {
            Swal.fire("Error", error.message || "Failed to load catalog data", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const toggleColumn = (col) => {
        setVisibleColumns(prev => ({
            ...prev,
            [col]: !prev[col]
        }));
    };

    const openCreateModal = () => {
        setSelectedProduct(null);
        setName("");
        setDescription("");
        setPrice("");
        setStockQuantity("");
        setCategoryId(categories[0]?.id || "");
        setBrandId(brands[0]?.id || "");
        setImageUrl("");
        setIsActive(true);
        setImageFile(null);
        setImagePreview("");
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setSelectedProduct(item);
        setName(item.name || "");
        setDescription(item.description || "");
        setPrice(item.price || "");
        setStockQuantity(item.stock_quantity || "");
        setCategoryId(item.category_id || "");
        setBrandId(item.brand_id || "");
        setImageUrl(item.image_url || "");
        setIsActive(item.is_active !== undefined ? item.is_active : true);
        setImageFile(null);
        setImagePreview(item.image_url || "");
        setIsModalOpen(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview("");
    };

    const handleSave = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append("name", name);
        formData.append("description", description);
        formData.append("price", Number(price));
        formData.append("stock_quantity", Number(stockQuantity));
        formData.append("category_id", categoryId);
        formData.append("brand_id", brandId);
        formData.append("is_active", isActive);
        if (imageFile) {
            formData.append("image", imageFile);
        }

        try {
            setLoading(true);
            if (selectedProduct) {
                await updateProductApi(selectedProduct.id, formData);
                Swal.fire("Success", "Product updated successfully", "success");
            } else {
                await createProductApi(formData);
                Swal.fire("Success", "Product created successfully", "success");
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            Swal.fire("Error", error.message || "Failed to save product", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: "Delete Product?",
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
                    await deleteProductApi(id);
                    Swal.fire("Deleted!", "Product has been deleted.", "success");
                    fetchData();
                } catch (error) {
                    Swal.fire("Error", error.message || "Failed to delete product", "error");
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const filteredProducts = products.filter(item =>
        item.name?.toLowerCase().includes(search.toLowerCase()) ||
        item.category?.name?.toLowerCase().includes(search.toLowerCase()) ||
        item.brand?.name?.toLowerCase().includes(search.toLowerCase())
    );

    const totalProductCount = products.length;
    const activeProductCount = products.filter(product => product.is_active).length;
    const inactiveProductCount = products.filter(product => !product.is_active).length;

    // Helper translation map for visual column headers
    const colHeaders = {
        hash: "#",
        image: "Image",
        name: "Product Name",
        category: "Category",
        brand: "Brand",
        price: "Price",
        stock: "Stock",
        status: "Status",
        actions: "Action"
    };

    return (
        <div className="product-page">
            <div>
                <div className="row g-4 mb-4">
                    {/* Total Products */}
                    <div className="col-xl-4 col-md-6">
                        <div className="kpi-card total">
                            <div className="kpi-content">
                                <div>
                                    <p>Total Products</p>
                                    <h1>{totalProductCount}</h1>
                                </div>
                                <div className="icon-box">
                                    <FaBox />
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Active Products */}
                    <div className="col-xl-4 col-md-6">
                        <div className="kpi-card active-status">
                            <div className="kpi-content">
                                <div>
                                    <p>Active Products</p>
                                    <h1>{activeProductCount}</h1>
                                </div>
                                <div className="icon-box">
                                    <FaBox />
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Inactive Products */}
                    <div className="col-xl-4 col-md-6">
                        <div className="kpi-card inactive-status">
                            <div className="kpi-content">
                                <div>
                                    <p>Inactive Products</p>
                                    <h1>{inactiveProductCount}</h1>
                                </div>
                                <div className="icon-box">
                                    <FaBox />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="page-header">
                <div>
                    <h1>Products</h1>
                    <p>Manage your product catalog</p>
                </div>
                <button className="add-btn" onClick={openCreateModal}>
                    <FaPlus /> Add Product
                </button>
            </div>

            <div className="product-card">
                <div className="toolbar">
                    <div className="search">
                        <FaSearch />
                        <input
                            placeholder="Search products..."
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

                {loading && products.length === 0 ? (
                    <div className="loading">Loading...</div>
                ) : (
                    <div className="product-table-wrapper">
                        {/* Table layout (for Desktop and iPad) */}
                        <table className="desktop-table">
                            <thead>
                                <tr>
                                    {visibleColumns.hash && <th>#</th>}
                                    {visibleColumns.image && <th>Image</th>}
                                    {visibleColumns.name && <th>Product Name</th>}
                                    {visibleColumns.category && <th>Category</th>}
                                    {visibleColumns.brand && <th>Brand</th>}
                                    {visibleColumns.price && <th>Price</th>}
                                    {visibleColumns.stock && <th>Stock</th>}
                                    {visibleColumns.status && <th>Status</th>}
                                    {visibleColumns.actions && <th>Action</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map((item, index) => (
                                    <tr key={item.id}>
                                        {visibleColumns.hash && <td>{index + 1}</td>}
                                        {visibleColumns.image && (
                                            <td>
                                                <div className="product-table-image">
                                                    {item.image_url ? (
                                                        <img src={item.image_url} alt={item.name} />
                                                    ) : (
                                                        <FaBox className="fallback-box-icon" />
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                        {visibleColumns.name && (
                                            <td>
                                                <div className="product-info-cell">
                                                    <strong>{item.name}</strong>
                                                    <small>{item.description?.substring(0, 50)}{item.description?.length > 50 ? "..." : ""}</small>
                                                </div>
                                            </td>
                                        )}
                                        {visibleColumns.category && (
                                            <td>
                                                <span className="category-badge">
                                                    {item.category?.name || "General"}
                                                </span>
                                            </td>
                                        )}
                                        {visibleColumns.brand && <td>{item.brand?.name || "Generic"}</td>}
                                        {visibleColumns.price && (
                                            <td>
                                                <strong>${Number(item.price).toFixed(2)}</strong>
                                            </td>
                                        )}
                                        {visibleColumns.stock && (
                                            <td>
                                                <span className={`stock-indicator ${item.stock_quantity > 5 ? "in-stock" : "low-stock"}`}>
                                                    {item.stock_quantity}
                                                </span>
                                            </td>
                                        )}
                                        {visibleColumns.status && (
                                            <td>
                                                <span className={`status-badge ${item.is_active ? "active" : "inactive"}`}>
                                                    {item.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                        )}
                                        {visibleColumns.actions && (
                                            <td>
                                                <div className="table-row-actions">
                                                    <button className="edit-btn" onClick={() => openEditModal(item)} title="Edit">
                                                        <FaEdit />
                                                    </button>
                                                    <button className="delete-btn" onClick={() => handleDelete(item.id)} title="Delete">
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {filteredProducts.length === 0 && (
                                    <tr>
                                        <td colSpan="9" className="no-data">No products found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Kanban card list layout (for Mobile) */}
                        <div className="mobile-cards-container">
                            {filteredProducts.map((item) => (
                                <div className="kanban-card product-card-item" key={item.id}>
                                    <div className="kanban-card-header">
                                        <div className="product-preview-info">
                                            {item.image_url ? (
                                                <img src={item.image_url} alt={item.name} className="mobile-product-img" />
                                            ) : (
                                                <div className="mobile-product-icon-placeholder"><FaBox /></div>
                                            )}
                                            <div>
                                                <h4 className="mobile-product-name">{item.name}</h4>
                                                <span className="category-badge">{item.category?.name || "General"}</span>
                                            </div>
                                        </div>
                                        <span className={`status-badge ${item.is_active ? "active" : "inactive"}`}>
                                            {item.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                    <div className="kanban-card-body">
                                        <div className="card-info-row">
                                            <span className="info-label">Brand:</span>
                                            <span className="info-value">{item.brand?.name || "Generic"}</span>
                                        </div>
                                        <div className="card-info-row">
                                            <span className="info-label">Price:</span>
                                            <strong className="info-value price-value">${Number(item.price).toFixed(2)}</strong>
                                        </div>
                                        <div className="card-info-row">
                                            <span className="info-label">Stock:</span>
                                            <span className={`stock-indicator ${item.stock_quantity > 5 ? "in-stock" : "low-stock"}`}>
                                                {item.stock_quantity} units
                                            </span>
                                        </div>
                                        {item.description && (
                                            <div className="mobile-product-description">
                                                <small>{item.description}</small>
                                            </div>
                                        )}
                                        <div className="mobile-card-actions">
                                            <button className="edit-btn" onClick={() => openEditModal(item)}>
                                                <FaEdit /> Edit
                                            </button>
                                            <button className="delete-btn" onClick={() => handleDelete(item.id)}>
                                                <FaTrash /> Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filteredProducts.length === 0 && (
                                <div className="no-data">No products found</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Reusable Modal implementation */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedProduct ? "Edit Product" : "Add Product"}
                size="lg"
            >
                <form onSubmit={handleSave} className="product-form">
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Product Image</label>
                            <div className="image-upload-container">
                                {imagePreview ? (
                                    <div className="image-preview-wrapper">
                                        <img src={imagePreview} alt="Preview" className="image-upload-preview" />
                                        <button type="button" className="remove-image-btn" onClick={handleRemoveImage}>
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <div className="image-upload-dropzone">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            id="product-image-file"
                                            className="file-input-hidden"
                                        />
                                        <label htmlFor="product-image-file" className="file-input-label">
                                            <FaPlus />
                                            <span>Upload Image</span>
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Product Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                                placeholder="e.g. iPhone 16 Pro"
                            />
                        </div>
                        <div className="form-row-2">
                            <div className="form-group">
                                <label>Price ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={price}
                                    onChange={e => setPrice(e.target.value)}
                                    required
                                    placeholder="0.00"
                                    min="0"
                                />
                            </div>
                            <div className="form-group">
                                <label>Stock Quantity</label>
                                <input
                                    type="number"
                                    value={stockQuantity}
                                    onChange={e => setStockQuantity(e.target.value)}
                                    required
                                    placeholder="e.g. 10"
                                    min="0"
                                />
                            </div>
                        </div>
                        <div className="form-row-2">
                            <div className="form-group">
                                <label>Category</label>
                                <select
                                    value={categoryId}
                                    onChange={e => setCategoryId(e.target.value)}
                                    required
                                >
                                    <option value="" disabled>Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Brand</label>
                                <select
                                    value={brandId}
                                    onChange={e => setBrandId(e.target.value)}
                                    required
                                >
                                    <option value="" disabled>Select Brand</option>
                                    {brands.map(br => (
                                        <option key={br.id} value={br.id}>{br.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Product details and specifications..."
                                rows="3"
                            />
                        </div>
                        <div className="checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                />
                                <span>Active Catalog Product</span>
                            </label>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="save-btn" disabled={loading}>
                            {loading ? "Saving..." : "Save Product"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

export default ProductPage;
