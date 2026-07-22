import React from "react";
import {
    FaBell,
    FaSearch,
    FaBars,
    FaUserCircle,
    FaSignOutAlt
} from "react-icons/fa";
import Swal from "sweetalert2";
import "./style/Navbar.css";

function Navbar({
    setOpen,
    user,
    logout
}) {

    const handleLogout = () => {

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

                <button className="notification">
                    <FaBell />
                    <span>3</span>
                </button>
                <div className="profile">
                    <FaUserCircle className="profile-icon" />

                    <div>
                        <strong>
                            {user?.name || "Admin"}
                        </strong>

                        <small>
                            {user?.role || "Administrator"}
                        </small>
                    </div>
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