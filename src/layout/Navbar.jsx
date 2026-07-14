import React from "react";
import {
    FaBell,
    FaSearch,
    FaBars,
    FaUserCircle
} from "react-icons/fa";
import "./style/Navbar.css";


function Navbar({
    setOpen,
    user,
    logout
}) {
    return (
        <header className="navbar">
            <button
                className="menu-button"
                onClick={() => setOpen(true)}
            >
                <FaBars />
            </button>
            <div className="search-box">
                <FaSearch />
                <input type="text" placeholder="Search products, orders..."/>
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
                            {
                                user?.name || "Admin"

                            }
                        </strong>
                        <small>

                            {
                                user?.role || "Administrator"

                            }

                        </small>


                    </div>


                </div>
                <button

                    className="logout"

                    onClick={logout}
                >
                    Logout

                </button>
            </div>
        </header>
    );

}

export default Navbar;