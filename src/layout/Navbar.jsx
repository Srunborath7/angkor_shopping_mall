import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaBell,
    FaSearch,
    FaBars,
    FaUserCircle,
    FaSignOutAlt,
    FaStore,
    FaChevronDown
} from "react-icons/fa";
import Swal from "sweetalert2";
import "./style/Navbar.css";

function Navbar({
    setOpen,
    user,
    logout
}) {
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        setDropdownOpen(false);
        Swal.fire({
            title: "Logout?",
            text: "Are you sure you want to logout?",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#1c7e48",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, Logout",
            cancelButtonText: "Cancel",
            reverseButtons: true,
        }).then((result) => {
            if (result.isConfirmed) {
                logout();
            }
        });
    };

    return (
        <header className="navbar container px-4">
            <button
                className="menu-button"
                onClick={() => setOpen(true)}
            >
                <FaBars />
            </button>

            <div className="search-box">
                <FaSearch />
                <input
                    type="text"
                    placeholder="Search products, orders..."
                />
            </div>

            <div className="navbar-right">
                <button className="notification" title="Notifications">
                    <FaBell />
                    <span>3</span>
                </button>

                <div className="profile-wrapper" ref={dropdownRef}>
                    <div
                        className="profile"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        title="Profile options"
                    >
                        <FaUserCircle className="profile-icon" />

                        <div>
                            <strong>
                                {user?.name || "Super Admin"}
                            </strong>

                            <small>
                                {user?.role || "Administrator"}
                            </small>
                        </div>

                        <FaChevronDown className={`profile-arrow ${dropdownOpen ? "open" : ""}`} />
                    </div>

                    {dropdownOpen && (
                        <div className="profile-dropdown-card">
                            <div className="dropdown-user-info">
                                <span className="info-name">{user?.name || "Super Admin"}</span>
                                <span className="info-email">{user?.email || "admin@angkor.com"}</span>
                                <span className="info-role">{user?.role?.toUpperCase() || "ADMINISTRATOR"}</span>
                            </div>

                            <button
                                className="dropdown-item"
                                onClick={() => {
                                    setDropdownOpen(false);
                                    navigate("/");
                                }}
                            >
                                <FaStore className="dropdown-icon" />
                                <span>Go to E-commerce</span>
                            </button>

                            <button
                                className="dropdown-item logout-item"
                                onClick={handleLogout}
                            >
                                <FaSignOutAlt className="dropdown-icon" />
                                <span>Logout</span>
                            </button>
                        </div>
                    )}
                </div>

                <button
                    className="logout"
                    onClick={handleLogout}
                    title="Logout"
                >
                    <FaSignOutAlt className="logout-icon" />
                    <span className="logout-text">Logout</span>
                </button>
            </div>
        </header>
    );
}

export default Navbar;