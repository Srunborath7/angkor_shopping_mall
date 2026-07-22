import React, { useEffect, useState } from "react";
import {
    FaPlus,
    FaSearch,
    FaEdit,
    FaTrash,
    FaBookmark
} from "react-icons/fa";
import Swal from "sweetalert2";
import {
    brandsApi,
    createBrandApi,
    updateBrandApi,
    deleteBrandApi
} from "../../services/brandsService";
import "./style/BrandPage.css";

function BrandPage() {
    const [brands, setBrands] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

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

    return (
        <div className="brand-page">
            <div className="page-header">
                <div>
                    <h1>Brands</h1>
                    <p>Manage your product brands</p>
                </div>
                <button className="add-btn" onClick={openCreateModal}>
                    <FaPlus /> Add Brand
                </button>
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
                </div>

                {loading && brands.length === 0 ? (
                    <div className="loading">Loading...</div>
                ) : (
                    <div className="brand-table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Brand</th>
                                    <th>Description</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((item, index) => (
                                    <tr key={item.id}>
                                        <td>{index + 1}</td>
                                        <td>
                                            <div className="brand-name">
                                                <div className="brand-icon">
                                                    <FaBookmark />
                                                </div>
                                                {item.name}
                                            </div>
                                        </td>
                                        <td>{item.description || "-"}</td>
                                        <td>
                                            <button className="edit-btn" onClick={() => openEditModal(item)}>
                                                <FaEdit />
                                            </button>
                                            <button className="delete-btn" onClick={() => deleteBrand(item.id)}>
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="no-data">No brands found</td>
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
                            <h3>{selectedBrand ? "Edit Brand" : "Add Brand"}</h3>
                            <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSave}>
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
                            <div className="modal-footer">
                                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="save-btn" disabled={loading}>
                                    {loading ? "Saving..." : "Save"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default BrandPage;
