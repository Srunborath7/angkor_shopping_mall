import React, { useState, useEffect } from "react";
import {
    FaPlus,
    FaSearch,
    FaEdit,
    FaTrash,
    FaBox
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
import "./style/ProductPage.css";

function ProductPage() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

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
                brandsApi().catch(() => ({ data: [] })) // Fallback if brand endpoint fails
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

    return (
        <div className="product-page">
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
                </div>

                {loading && products.length === 0 ? (
                    <div className="loading">Loading...</div>
                ) : (
                    <div className="product-table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Image</th>
                                    <th>Product Name</th>
                                    <th>Category</th>
                                    <th>Brand</th>
                                    <th>Price</th>
                                    <th>Stock</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <div className="product-table-image">
                                                {item.image_url ? (
                                                    <img src={item.image_url} alt={item.name} />
                                                ) : (
                                                    <FaBox className="fallback-box-icon" />
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="product-info-cell">
                                                <strong>{item.name}</strong>
                                                <small>{item.description?.substring(0, 50)}{item.description?.length > 50 ? "..." : ""}</small>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="category-badge">
                                                {item.category?.name || "General"}
                                            </span>
                                        </td>
                                        <td>{item.brand?.name || "Generic"}</td>
                                        <td>
                                            <strong>${Number(item.price).toFixed(2)}</strong>
                                        </td>
                                        <td>
                                            <span className={`stock-indicator ${item.stock_quantity > 5 ? "in-stock" : "low-stock"}`}>
                                                {item.stock_quantity}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${item.is_active ? "active" : "inactive"}`}>
                                                {item.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="edit-btn" onClick={() => openEditModal(item)}>
                                                <FaEdit />
                                            </button>
                                            <button className="delete-btn" onClick={() => handleDelete(item.id)}>
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredProducts.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="no-data">No products found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-container-card">
                        <div className="modal-header">
                            <h3>{selectedProduct ? "Edit Product" : "Add Product"}</h3>
                            <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSave} className="product-form">
                            <div className="form-grid">
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
                                    <label>Description</label>
                                    <textarea
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder="Product details and specifications..."
                                        rows="3"
                                    />
                                </div>
                                <div className="form-group checkbox-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={isActive}
                                            onChange={e => setIsActive(e.target.checked)}
                                        />
                                        <span>Active Catalog Product</span>
                                    </label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="save-btn" disabled={loading}>
                                    {loading ? "Saving..." : "Save Product"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProductPage;
