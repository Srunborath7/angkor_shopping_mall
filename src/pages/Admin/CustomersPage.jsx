import React, { useEffect, useState } from "react";
import {
    FaPlus,
    FaSearch,
    FaEdit,
    FaTrash,
    FaUser
} from "react-icons/fa";
import Swal from "sweetalert2";
import {
    CustomersApi,
    createCutomersApi,
    updateCustomersApi,
    deleteCustomersApi
} from "../../services/customerService";
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
    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const res = await CustomersApi();
            setCustomers(
                res.data || []
            );
        } catch (error) {
            Swal.fire(
                "Error",
                error.message,
                "error"
            );
        }
        finally {
            setLoading(false);
        }

    };
    useEffect(() => {

        fetchCustomers();

    }, []);

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

                await updateCustomersApi(
                    selectedCustomer.id,
                    form
                );

                Swal.fire(
                    "Success",
                    "Customer updated successfully",
                    "success"
                );
            }
            else {
                await createCutomersApi(form);
                Swal.fire(
                    "Success",
                    "Customer created successfully",
                    "success"
                );

            }
            setIsModalOpen(false);
            fetchCustomers();
        }
        catch (error) {
            Swal.fire(
                "Error",
                error.message,
                "error"
            );
        }
        finally {
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
                    Swal.fire(
                        "Deleted!",
                        "Customer removed",
                        "success"
                    );
                    fetchCustomers();
                }
                catch (error) {
                    Swal.fire(
                        "Error",
                        error.message,
                        "error"
                    );
                }
                finally {

                    setLoading(false);

                }
            }
        });
    };
    const filtered = customers.filter(item =>
        item.name
            ?.toLowerCase()
            .includes(
                search.toLowerCase()
            )

    );
    return (
        <div className="customer-page">
            <div className="page-header">
                <div>
                    <h1>Customers</h1>
                    <p>Manage your customers</p>
                </div>
                <button
                    className="add-btn"
                    onClick={openCreateModal}
                >
                    <FaPlus />
                    Add Customer
                </button>
            </div>
            <div className="customer-card">
                <div className="toolbar">
                    <div className="search">
                        <FaSearch />
                        <input placeholder="Search customer..." value={search} onChange={ e => setSearch(e.target.value)}/>
                    </div>
                </div>
                {
                    loading ?
                        <div className="loading">
                            Loading...
                        </div>:
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Customer</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Status</th>
                                    <th>Role</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    filtered.map((item, index) => {
                                        return (
                                            <tr key={item.id}>
                                                <td>
                                                    {index + 1}
                                                </td>
                                                <td>
                                                    <div className="customer-name">
                                                        <div className="customer-icon">
                                                            <FaUser />
                                                        </div>
                                                        {item.name}
                                                    </div>
                                                </td>
                                                <td>
                                                    {item.email}
                                                </td>
                                                <td>
                                                    {item.phone}
                                                </td>
                                                <td>
                                                    <span className={item.is_active
                                                        ? "active"
                                                        : "inactive"}>

                                                        {item.is_active
                                                            ?
                                                            "Active"
                                                            :
                                                            "Inactive"}
                                                    </span>
                                                </td>
                                                <td>
                                                    {item.roles?.map(role => role.name).join(", ")}
                                                </td>
                                                <td>
                                                    <button className="edit-btn" onClick={() => openEditModal(item)}><FaEdit />
                                                    </button>
                                                    <button className="delete-btn" onClick={() => deleteCustomer(item.id)}><FaTrash /></button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                }
                            </tbody>
                        </table>
                }
            </div>
            {
                isModalOpen &&
                <div className="modal-overlay">
                    <div className="modal-container-card">
                        <div className="modal-header">
                            <h3>
                                {selectedCustomer?"Edit Customer":"Add Customer"}
                            </h3>
                            <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="form-group">
                                <label>Name</label>
                                <input name="name" value={form.name} onChange={handleChange}required />
                            </div>
                            <div className="form-group">
                                <label>
                                    Email
                                </label>
                                <input type="email" name="email" value={form.email}onChange={handleChange}required />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input name="phone" value={form.phone}onChange={handleChange}/>
                            </div>
                            {
                                !selectedCustomer &&
                                <div className="form-group">
                                    <label>Password</label>
                                    <input type="password" name="password" value={form.password} onChange={handleChange}  required/>
                                </div>
                            }
                            <div className="modal-footer">
                                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="save-btn" disabled={loading}>
                                    {loading?"Saving...":"Save"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            }
        </div>
    );
}
export default CustomersPage;