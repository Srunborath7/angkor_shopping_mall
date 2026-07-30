import React, { useState, useEffect } from "react";
import {
    FaPlus,
    FaSearch,
    FaEdit,
    FaTrash,
    FaBox,
    FaSlidersH,
    FaSpinner,
    FaCheck,
    FaImages,
    FaPlusCircle,
    FaTimes,
    FaCog,
    FaInfoCircle
} from "react-icons/fa";
import Swal from "sweetalert2";
import {
    productsApi,
    createProductApi,
    updateProductApi,
    deleteProductApi,
    brandsApi,
    getProductByIdApi,
    upsertProductDetailApi,
    createProductVariantApi,
    updateProductVariantApi,
    deleteProductVariantApi,
    uploadProductImageApi,
    deleteProductImageApi
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

    // Modal & Active Tab
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("general");
    const [savingSubSection, setSavingSubSection] = useState(false);

    // View Detail Modal states
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [detailProduct, setDetailProduct] = useState(null);
    const [activeDetailImage, setActiveDetailImage] = useState("");

    // Tab 1: General Info states
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

    // Tab 2: Specifications states
    const [longDescription, setLongDescription] = useState("");
    const [warrantyInfo, setWarrantyInfo] = useState("");
    const [shippingInfo, setShippingInfo] = useState("");
    const [specifications, setSpecifications] = useState([]); // { key, value }

    // Tab 3: Variants states
    const [variants, setVariants] = useState([]);
    const [isVariantFormOpen, setIsVariantFormOpen] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [vSku, setVSku] = useState("");
    const [vPrice, setVPrice] = useState("");
    const [vStockQuantity, setVStockQuantity] = useState("0");
    const [vAttributes, setVAttributes] = useState([]); // { key, value }
    const [vImageFile, setVImageFile] = useState(null);
    const [vImagePreview, setVImagePreview] = useState("");

    // Tab 4: Gallery states
    const [galleryImages, setGalleryImages] = useState([]);
    const [galleryFile, setGalleryFile] = useState(null);
    const [galleryPreview, setGalleryPreview] = useState("");
    const [uploadingGallery, setUploadingGallery] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [prodRes, catRes, brandRes] = await Promise.all([
                productsApi(),
                categoriesApi(),
                brandsApi().catch(() => ({ data: [] }))
            ]);

            const rawProducts = prodRes.data?.products || prodRes.data || [];
            const detailedProducts = await Promise.all(
                rawProducts.map(async (p) => {
                    try {
                        const detailRes = await getProductByIdApi(p.id);
                        const detailed = detailRes.data;
                        const primaryImg = detailed.images?.find(img => img.is_primary)?.image_url
                            || detailed.images?.[0]?.image_url
                            || "";
                        return {
                            ...p,
                            images: detailed.images || [],
                            image_url: primaryImg,
                            detail: detailed.detail,
                            variants: detailed.variants || []
                        };
                    } catch (err) {
                        console.error(`Failed to load details for product ${p.id}`, err);
                        return p;
                    }
                })
            );

            setProducts(detailedProducts);
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

    // Reload active product detailed data (specs, variants, gallery) from server
    const reloadActiveProductDetails = async (productId) => {
        try {
            const res = await getProductByIdApi(productId);
            const detailed = res.data;

            // Set Specs
            setLongDescription(detailed.detail?.long_description || "");
            setWarrantyInfo(detailed.detail?.warranty_info || "");
            setShippingInfo(detailed.detail?.shipping_info || "");
            const specs = detailed.detail?.specifications || {};
            setSpecifications(Object.keys(specs).map(k => ({ key: k, value: specs[k] })));

            // Set Variants
            setVariants(detailed.variants || []);

            // Set Gallery
            setGalleryImages(detailed.images || []);
        } catch (error) {
            console.error("Failed to load details", error);
        }
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

        // Reset sub-tab states
        setLongDescription("");
        setWarrantyInfo("");
        setShippingInfo("");
        setSpecifications([]);
        setVariants([]);
        setGalleryImages([]);
        setIsVariantFormOpen(false);

        setActiveTab("general");
        setIsModalOpen(true);
    };

    const openEditModal = async (item) => {
        try {
            setSelectedProduct(item);
            setActiveTab("general");
            setIsModalOpen(true);
            setIsVariantFormOpen(false);
            setLoading(true);

            const res = await getProductByIdApi(item.id);
            const detailed = res.data;

            const primaryImg = detailed.images?.find(img => img.is_primary)?.image_url
                || detailed.images?.[0]?.image_url
                || "";

            setName(detailed.name || "");
            setDescription(detailed.description || "");
            setPrice(detailed.price || "");
            setStockQuantity(detailed.stock_quantity || "");
            setCategoryId(detailed.category_id || "");
            setBrandId(detailed.brand_id || "");
            setImageUrl(primaryImg);
            setIsActive(detailed.is_active !== undefined ? detailed.is_active : true);
            setImageFile(null);
            setImagePreview(primaryImg);

            // Specs
            setLongDescription(detailed.detail?.long_description || "");
            setWarrantyInfo(detailed.detail?.warranty_info || "");
            setShippingInfo(detailed.detail?.shipping_info || "");
            const specs = detailed.detail?.specifications || {};
            setSpecifications(Object.keys(specs).map(k => ({ key: k, value: specs[k] })));

            // Variants
            setVariants(detailed.variants || []);

            // Gallery
            setGalleryImages(detailed.images || []);
        } catch (error) {
            Swal.fire("Error", "Failed to retrieve full product information", "error");
            setIsModalOpen(false);
        } finally {
            setLoading(false);
        }
    };

    const openDetailModal = async (item) => {
        try {
            setLoading(true);
            const res = await getProductByIdApi(item.id);
            const detailed = res.data;
            const primaryImg = detailed.images?.find(img => img.is_primary)?.image_url
                || detailed.images?.[0]?.image_url
                || "";

            const enrichedProduct = {
                ...item,
                ...detailed,
                image_url: primaryImg
            };
            setDetailProduct(enrichedProduct);
            setActiveDetailImage(primaryImg);
            setIsDetailModalOpen(true);
        } catch (error) {
            Swal.fire("Error", "Failed to retrieve full product information", "error");
        } finally {
            setLoading(false);
        }
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

    // Save General Info
    const handleSaveGeneral = async (e) => {
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
                Swal.fire({
                    title: "Success",
                    text: "Product updated successfully",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false
                });
                reloadActiveProductDetails(selectedProduct.id);
            } else {
                const res = await createProductApi(formData);
                const createdProduct = res.data;
                setSelectedProduct(createdProduct);

                Swal.fire({
                    title: "Created!",
                    text: "Product created. You can now configure specs, variants, and gallery.",
                    icon: "success"
                });

                // Automatically move to edit context
                reloadActiveProductDetails(createdProduct.id);
            }
            fetchData();
        } catch (error) {
            Swal.fire("Error", error.message || "Failed to save product", "error");
        } finally {
            setLoading(false);
        }
    };

    // Specifications Management
    const handleAddSpecRow = () => {
        setSpecifications(prev => [...prev, { key: "", value: "" }]);
    };

    const handleSpecChange = (index, field, value) => {
        const updated = [...specifications];
        updated[index][field] = value;
        setSpecifications(updated);
    };

    const handleRemoveSpecRow = (index) => {
        setSpecifications(prev => prev.filter((_, i) => i !== index));
    };

    const handleSaveSpecifications = async (e) => {
        e.preventDefault();
        if (!selectedProduct) return;

        const specsObj = {};
        specifications.forEach(item => {
            if (item.key.trim()) {
                specsObj[item.key.trim()] = item.value;
            }
        });

        try {
            setSavingSubSection(true);
            await upsertProductDetailApi(selectedProduct.id, {
                long_description: longDescription,
                warranty_info: warrantyInfo,
                shipping_info: shippingInfo,
                specifications: specsObj
            });

            Swal.fire({
                title: "Saved!",
                text: "Specifications updated successfully",
                icon: "success",
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 2000
            });
            reloadActiveProductDetails(selectedProduct.id);
        } catch (error) {
            Swal.fire("Error", error.message || "Failed to update specifications", "error");
        } finally {
            setSavingSubSection(false);
        }
    };

    // Variants Management
    const openAddVariantForm = () => {
        setSelectedVariant(null);
        setVSku("");
        setVPrice("");
        setVStockQuantity("0");
        setVAttributes([{ key: "Color", value: "" }]);
        setVImageFile(null);
        setVImagePreview("");
        setIsVariantFormOpen(true);
    };

    const openEditVariantForm = (v) => {
        setSelectedVariant(v);
        setVSku(v.sku || "");
        setVPrice(v.price || "");
        setVStockQuantity(v.stock_quantity || "0");

        const attrs = v.attributes || {};
        setVAttributes(Object.keys(attrs).map(k => ({ key: k, value: attrs[k] })));

        // Find variant image from variant's images array or main product image
        const variantImg = v.images && v.images.length > 0 ? v.images[0].image_url : "";
        setVImageFile(null);
        setVImagePreview(variantImg);
        setIsVariantFormOpen(true);
    };

    const handleAddVAttrRow = () => {
        setVAttributes(prev => [...prev, { key: "", value: "" }]);
    };

    const handleVAttrChange = (index, field, value) => {
        const updated = [...vAttributes];
        updated[index][field] = value;
        setVAttributes(updated);
    };

    const handleRemoveVAttrRow = (index) => {
        setVAttributes(prev => prev.filter((_, i) => i !== index));
    };

    const handleVFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setVImageFile(file);
            setVImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSaveVariant = async (e) => {
        e.preventDefault();
        if (!selectedProduct) return;

        const attrsObj = {};
        vAttributes.forEach(item => {
            if (item.key.trim()) {
                attrsObj[item.key.trim()] = item.value;
            }
        });

        const formData = new FormData();
        formData.append("sku", vSku);
        if (vPrice) formData.append("price", Number(vPrice));
        formData.append("stock_quantity", Number(vStockQuantity));
        formData.append("attributes", JSON.stringify(attrsObj));
        if (vImageFile) {
            formData.append("image", vImageFile);
        }

        try {
            setSavingSubSection(true);
            if (selectedVariant) {
                await updateProductVariantApi(selectedVariant.id, formData);
                Swal.fire({
                    title: "Success",
                    text: "Variant updated successfully",
                    icon: "success",
                    toast: true,
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 2000
                });
            } else {
                await createProductVariantApi(selectedProduct.id, formData);
                Swal.fire({
                    title: "Created!",
                    text: "New variant added successfully",
                    icon: "success",
                    toast: true,
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 2000
                });
            }
            setIsVariantFormOpen(false);
            reloadActiveProductDetails(selectedProduct.id);
            fetchData();
        } catch (error) {
            Swal.fire("Error", error.message || "Failed to save variant", "error");
        } finally {
            setSavingSubSection(false);
        }
    };

    const handleDeleteVariant = (id) => {
        Swal.fire({
            title: "Delete Variant?",
            text: "This variant will be permanently removed",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete"
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    setSavingSubSection(true);
                    await deleteProductVariantApi(id);
                    Swal.fire("Deleted!", "Variant has been deleted.", "success");
                    reloadActiveProductDetails(selectedProduct.id);
                    fetchData();
                } catch (error) {
                    Swal.fire("Error", error.message || "Failed to delete variant", "error");
                } finally {
                    setSavingSubSection(false);
                }
            }
        });
    };

    // Gallery Upload Management
    const handleGalleryFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setGalleryFile(file);
            setGalleryPreview(URL.createObjectURL(file));
        }
    };

    const handleUploadGalleryImage = async () => {
        if (!selectedProduct || !galleryFile) return;

        const formData = new FormData();
        formData.append("image", galleryFile);
        formData.append("is_primary", false);

        try {
            setUploadingGallery(true);
            await uploadProductImageApi(selectedProduct.id, formData);
            setGalleryFile(null);
            setGalleryPreview("");
            Swal.fire({
                title: "Uploaded!",
                text: "Image uploaded to gallery",
                icon: "success",
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 2000
            });
            reloadActiveProductDetails(selectedProduct.id);
        } catch (error) {
            Swal.fire("Error", error.message || "Failed to upload image", "error");
        } finally {
            setUploadingGallery(false);
        }
    };

    const handleDeleteGalleryImage = (imageId) => {
        Swal.fire({
            title: "Delete image?",
            text: "This image will be removed from gallery",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Delete"
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    setUploadingGallery(true);
                    await deleteProductImageApi(imageId);
                    Swal.fire("Success", "Image removed", "success");
                    reloadActiveProductDetails(selectedProduct.id);
                } catch (error) {
                    Swal.fire("Error", error.message || "Failed to delete image", "error");
                } finally {
                    setUploadingGallery(false);
                }
            }
        });
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
                                                    <button className="view-btn" onClick={() => openDetailModal(item)} title="View Details">
                                                        <FaInfoCircle />
                                                    </button>
                                                    <button className="edit-btn" onClick={() => openEditModal(item)} title="Manage & Edit Product">
                                                        <FaCog />
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

                        {/* Kanban layout for Mobile */}
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
                                        <div className="mobile-card-actions">
                                            <button className="view-btn" onClick={() => openDetailModal(item)}>
                                                <FaInfoCircle /> View
                                            </button>
                                            <button className="edit-btn" onClick={() => openEditModal(item)}>
                                                <FaCog /> Manage
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

            {/* Reusable Tabbed Modal implementation */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedProduct ? `Manage: ${name}` : "Add New Product"}
                size="xl"
            >
                {/* Tabs selection */}
                {selectedProduct && (
                    <div className="modal-tabs">
                        <button
                            className={`tab-btn ${activeTab === "general" ? "active" : ""}`}
                            onClick={() => setActiveTab("general")}
                        >
                            General Info
                        </button>
                        <button
                            className={`tab-btn ${activeTab === "specs" ? "active" : ""}`}
                            onClick={() => setActiveTab("specs")}
                        >
                            Specifications
                        </button>
                        <button
                            className={`tab-btn ${activeTab === "variants" ? "active" : ""}`}
                            onClick={() => setActiveTab("variants")}
                        >
                            Variants ({variants.length})
                        </button>
                        <button
                            className={`tab-btn ${activeTab === "gallery" ? "active" : ""}`}
                            onClick={() => setActiveTab("gallery")}
                        >
                            Image Gallery ({galleryImages.length})
                        </button>
                    </div>
                )}

                {/* Tab content area */}
                <div className="tab-content-panel">

                    {/* TAB 1: General Info */}
                    {activeTab === "general" && (
                        <form onSubmit={handleSaveGeneral} className="product-form">
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
                                    <label>Short Description</label>
                                    <textarea
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder="Brief summary for catalog listing..."
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
                                    {loading ? "Saving..." : selectedProduct ? "Save Changes" : "Create Product"}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* TAB 2: Detailed Specifications */}
                    {activeTab === "specs" && selectedProduct && (
                        <form onSubmit={handleSaveSpecifications} className="product-specs-form">
                            <div className="specs-grid">
                                <div className="form-group">
                                    <label>Long Detailed Description</label>
                                    <textarea
                                        value={longDescription}
                                        onChange={e => setLongDescription(e.target.value)}
                                        placeholder="Enter detailed description, styling details, size guidelines..."
                                        rows="4"
                                    />
                                </div>
                                <div className="form-row-2">
                                    <div className="form-group">
                                        <label>Warranty Information</label>
                                        <input
                                            type="text"
                                            value={warrantyInfo}
                                            onChange={e => setWarrantyInfo(e.target.value)}
                                            placeholder="e.g. 1 Year Manufacturer Warranty"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Shipping Details</label>
                                        <input
                                            type="text"
                                            value={shippingInfo}
                                            onChange={e => setShippingInfo(e.target.value)}
                                            placeholder="e.g. Ships within 2-3 business days"
                                        />
                                    </div>
                                </div>

                                <div className="specifications-list-section">
                                    <div className="section-title-row">
                                        <h4>Product Technical Specifications</h4>
                                        <button type="button" className="add-spec-row-btn" onClick={handleAddSpecRow}>
                                            <FaPlusCircle /> Add Spec
                                        </button>
                                    </div>

                                    {specifications.length === 0 ? (
                                        <p className="no-specs-notice">No technical specifications added yet.</p>
                                    ) : (
                                        <div className="specs-input-table">
                                            {specifications.map((spec, i) => (
                                                <div key={i} className="spec-input-row">
                                                    <input
                                                        type="text"
                                                        value={spec.key}
                                                        placeholder="Specification label (e.g. RAM)"
                                                        onChange={e => handleSpecChange(i, "key", e.target.value)}
                                                        required
                                                    />
                                                    <input
                                                        type="text"
                                                        value={spec.value}
                                                        placeholder="Value (e.g. 16GB)"
                                                        onChange={e => handleSpecChange(i, "value", e.target.value)}
                                                        required
                                                    />
                                                    <button type="button" className="remove-spec-btn" onClick={() => handleRemoveSpecRow(i)}>
                                                        <FaTimes />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="submit" className="save-btn" disabled={savingSubSection}>
                                    {savingSubSection ? "Saving Specifications..." : "Save Specifications"}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* TAB 3: Product Variants */}
                    {activeTab === "variants" && selectedProduct && (
                        <div className="product-variants-section">
                            {!isVariantFormOpen ? (
                                <>
                                    <div className="section-title-row">
                                        <h4>Product Models / Variants</h4>
                                        <button className="add-btn-sm" onClick={openAddVariantForm}>
                                            <FaPlus /> Add Variant
                                        </button>
                                    </div>

                                    {variants.length === 0 ? (
                                        <div className="empty-tab-notice">
                                            <FaInfoCircle />
                                            <p>This product does not have variants. It behaves as a single product inventory item.</p>
                                        </div>
                                    ) : (
                                        <div className="variants-grid-list">
                                            {variants.map(v => {
                                                const attrKeys = Object.keys(v.attributes || {});
                                                const variantImg = v.images && v.images.length > 0 ? v.images[0].image_url : "";

                                                return (
                                                    <div className="variant-item-card" key={v.id}>
                                                        <div className="variant-card-img">
                                                            {variantImg ? (
                                                                <img src={variantImg} alt={v.sku} />
                                                            ) : (
                                                                <FaBox className="fallback-variant-icon" />
                                                            )}
                                                        </div>
                                                        <div className="variant-card-details">
                                                            <h5>{v.sku}</h5>
                                                            <div className="attrs-list">
                                                                {attrKeys.map(k => (
                                                                    <span key={k} className="attr-tag">
                                                                        {k}: {v.attributes[k]}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                            <div className="price-stock-row">
                                                                <span>Price: <strong>${v.price ? Number(v.price).toFixed(2) : Number(price).toFixed(2)}</strong></span>
                                                                <span>Stock: <strong className={v.stock_quantity > 5 ? "in-stock" : "low-stock"}>{v.stock_quantity}</strong></span>
                                                            </div>
                                                        </div>
                                                        <div className="variant-actions">
                                                            <button className="edit-btn" onClick={() => openEditVariantForm(v)}>
                                                                <FaEdit />
                                                            </button>
                                                            <button className="delete-btn" onClick={() => handleDeleteVariant(v.id)}>
                                                                <FaTrash />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            ) : (
                                /* Add / Edit Variant Form */
                                <form onSubmit={handleSaveVariant} className="variant-subform">
                                    <div className="subform-header">
                                        <h4>{selectedVariant ? `Edit Variant: ${selectedVariant.sku}` : "Add Product Variant"}</h4>
                                        <button type="button" className="close-subform-btn" onClick={() => setIsVariantFormOpen(false)}>
                                            Cancel
                                        </button>
                                    </div>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Variant SKU (Stock Keeping Unit)</label>
                                            <input
                                                type="text"
                                                value={vSku}
                                                onChange={e => setVSku(e.target.value)}
                                                required
                                                placeholder="e.g. I16-PRO-RED-256G"
                                            />
                                        </div>
                                        <div className="form-row-2">
                                            <div className="form-group">
                                                <label>Price ($) <small>(Optional, overrides parent price)</small></label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={vPrice}
                                                    onChange={e => setVPrice(e.target.value)}
                                                    placeholder="defaults to product price"
                                                    min="0"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Stock Quantity</label>
                                                <input
                                                    type="number"
                                                    value={vStockQuantity}
                                                    onChange={e => setVStockQuantity(e.target.value)}
                                                    required
                                                    min="0"
                                                />
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label>Variant Specific Image <small>(Optional)</small></label>
                                            <div className="variant-img-uploader">
                                                {vImagePreview ? (
                                                    <div className="variant-preview-box">
                                                        <img src={vImagePreview} alt="Variant Preview" />
                                                        <button type="button" className="remove-image-btn" onClick={() => { setVImageFile(null); setVImagePreview(""); }}>
                                                            Remove
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="variant-dropzone">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleVFileChange}
                                                            id="variant-image-file"
                                                            className="file-input-hidden"
                                                        />
                                                        <label htmlFor="variant-image-file" className="file-input-label">
                                                            <FaPlus /> Upload Variant Image
                                                        </label>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Dynamic Variant Attributes */}
                                        <div className="variant-attributes-section">
                                            <div className="section-title-row">
                                                <h5>Attributes (e.g. Color, Size, Storage)</h5>
                                                <button type="button" className="add-attr-row-btn" onClick={handleAddVAttrRow}>
                                                    <FaPlusCircle /> Add Attribute
                                                </button>
                                            </div>

                                            {vAttributes.length === 0 ? (
                                                <p className="no-specs-notice">Add at least one attribute to define this model.</p>
                                            ) : (
                                                <div className="attributes-inputs">
                                                    {vAttributes.map((attr, idx) => (
                                                        <div key={idx} className="spec-input-row">
                                                            <input
                                                                type="text"
                                                                value={attr.key}
                                                                placeholder="Attribute Key (e.g. Size)"
                                                                onChange={e => handleVAttrChange(idx, "key", e.target.value)}
                                                                required
                                                            />
                                                            <input
                                                                type="text"
                                                                value={attr.value}
                                                                placeholder="Value (e.g. Large)"
                                                                onChange={e => handleVAttrChange(idx, "value", e.target.value)}
                                                                required
                                                            />
                                                            <button type="button" className="remove-spec-btn" onClick={() => handleRemoveVAttrRow(idx)}>
                                                                <FaTimes />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="submit" className="save-btn" disabled={savingSubSection}>
                                            {savingSubSection ? <FaSpinner className="row-spinner" /> : "Save Model Variant"}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {/* TAB 4: Image Gallery */}
                    {activeTab === "gallery" && selectedProduct && (
                        <div className="product-gallery-section">
                            <div className="gallery-uploader-row">
                                <div className="gallery-dropzone-wrapper">
                                    {galleryPreview ? (
                                        <div className="gallery-preview-box">
                                            <img src={galleryPreview} alt="Gallery Preview" />
                                            <div className="preview-actions">
                                                <button
                                                    className="upload-gallery-btn"
                                                    onClick={handleUploadGalleryImage}
                                                    disabled={uploadingGallery}
                                                >
                                                    {uploadingGallery ? <FaSpinner className="row-spinner" /> : "Upload Image"}
                                                </button>
                                                <button
                                                    className="cancel-gallery-btn"
                                                    onClick={() => { setGalleryFile(null); setGalleryPreview(""); }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="gallery-upload-area">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleGalleryFileChange}
                                                id="gallery-file-input"
                                                className="file-input-hidden"
                                            />
                                            <label htmlFor="gallery-file-input" className="gallery-upload-label">
                                                <FaImages />
                                                <span>Upload gallery image</span>
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="gallery-header-label">
                                <h4>Gallery Photo Collection</h4>
                            </div>

                            {galleryImages.length === 0 ? (
                                <div className="empty-tab-notice">
                                    <FaImages />
                                    <p>No additional gallery images uploaded yet for this catalog item.</p>
                                </div>
                            ) : (
                                <div className="gallery-thumbnails-grid">
                                    {galleryImages.map(img => (
                                        <div key={img.id} className="gallery-thumb-card">
                                            <img src={img.image_url} alt="Gallery item" />
                                            {img.is_primary && <span className="primary-badge">Main Image</span>}
                                            <button
                                                type="button"
                                                className="delete-thumb-btn"
                                                onClick={() => handleDeleteGalleryImage(img.id)}
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Modal>

            {/* View Product Details Modal */}
            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title={`Product Details: ${detailProduct?.name || ""}`}
                size="xl"
            >
                {detailProduct && (
                    <div className="product-detail-dashboard">
                        {/* Header Row */}
                        <div className="detail-header-card">
                            <div className="detail-main-info">
                                <div className="title-badges">
                                    <h2>{detailProduct.name}</h2>
                                    <div className="badge-row">
                                        <span className="category-badge">{detailProduct.category?.name || "General"}</span>
                                        <span className="brand-badge">{detailProduct.brand?.name || "Generic"}</span>
                                        <span className={`status-badge ${detailProduct.is_active ? "active" : "inactive"}`}>
                                            {detailProduct.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                </div>
                                <div className="quick-stats-row">
                                    <div className="stat-card">
                                        <span className="stat-label">Price</span>
                                        <span className="stat-value price">${Number(detailProduct.price).toFixed(2)}</span>
                                    </div>
                                    <div className="stat-card">
                                        <span className="stat-label">Stock Quantity</span>
                                        <span className={`stat-value stock ${detailProduct.stock_quantity > 5 ? "in-stock" : "low-stock"}`}>
                                            {detailProduct.stock_quantity} units
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="detail-grid">
                            {/* Left Panel: Media/Images */}
                            <div className="detail-media-panel">
                                <div className="detail-main-preview">
                                    {activeDetailImage ? (
                                        <img src={activeDetailImage} alt={detailProduct.name} className="active-detail-img" />
                                    ) : (
                                        <div className="detail-fallback-box">
                                            <FaBox />
                                            <span>No Image Available</span>
                                        </div>
                                    )}
                                </div>
                                {detailProduct.images && detailProduct.images.length > 0 && (
                                    <div className="detail-gallery-strip">
                                        {detailProduct.images.map((img) => (
                                            <div
                                                key={img.id}
                                                className={`gallery-strip-thumb ${activeDetailImage === img.image_url ? "active" : ""}`}
                                                onClick={() => setActiveDetailImage(img.image_url)}
                                            >
                                                <img src={img.image_url} alt="Gallery thumbnail" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Right Panel: Content, Specs & Description */}
                            <div className="detail-content-panel">
                                <div className="detail-section">
                                    <h3>Description</h3>
                                    <p className="description-text">{detailProduct.description || "No short description provided."}</p>
                                    {detailProduct.detail?.long_description && (
                                        <div className="long-description-box">
                                            <h4>Detailed Story</h4>
                                            <p className="long-description-text">{detailProduct.detail.long_description}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="detail-row-2">
                                    <div className="detail-section half">
                                        <h3>Warranty</h3>
                                        <p className="meta-text">{detailProduct.detail?.warranty_info || "No warranty information provided."}</p>
                                    </div>
                                    <div className="detail-section half">
                                        <h3>Shipping</h3>
                                        <p className="meta-text">{detailProduct.detail?.shipping_info || "No shipping details available."}</p>
                                    </div>
                                </div>

                                <div className="detail-section">
                                    <h3>Technical Specifications</h3>
                                    {detailProduct.detail?.specifications && Object.keys(detailProduct.detail.specifications).length > 0 ? (
                                        <div className="specs-detail-table">
                                            {Object.entries(detailProduct.detail.specifications).map(([key, val]) => (
                                                <div className="specs-detail-row" key={key}>
                                                    <span className="spec-key">{key}</span>
                                                    <span className="spec-val">{val}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="no-specs-text">No specs listed for this product.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Bottom: Variants Section */}
                        <div className="detail-section variants-section">
                            <h3>Product Models & Variants</h3>
                            {detailProduct.variants && detailProduct.variants.length > 0 ? (
                                <div className="detail-variants-grid">
                                    {detailProduct.variants.map((v) => {
                                        const attrKeys = Object.keys(v.attributes || {});
                                        const variantImg = v.images && v.images.length > 0 ? v.images[0].image_url : "";
                                        return (
                                            <div className="detail-variant-card" key={v.id}>
                                                <div className="detail-variant-img">
                                                    {variantImg ? (
                                                        <img src={variantImg} alt={v.sku} />
                                                    ) : (
                                                        <FaBox />
                                                    )}
                                                </div>
                                                <div className="detail-variant-info">
                                                    <h4>{v.sku}</h4>
                                                    <div className="variant-tags">
                                                        {attrKeys.map((k) => (
                                                            <span key={k} className="variant-tag">
                                                                {k}: {v.attributes[k]}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <div className="variant-meta">
                                                        <span>Price: <strong>${v.price ? Number(v.price).toFixed(2) : Number(detailProduct.price).toFixed(2)}</strong></span>
                                                        <span>Stock: <strong className={v.stock_quantity > 5 ? "in-stock" : "low-stock"}>{v.stock_quantity} units</strong></span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="no-variants-box">
                                    <FaInfoCircle />
                                    <span>This product does not have variants. It operates under standard parent SKU inventory.</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setIsDetailModalOpen(false)}>
                        Close Details
                    </button>
                </div>
            </Modal>
        </div>
    );
}

export default ProductPage;
