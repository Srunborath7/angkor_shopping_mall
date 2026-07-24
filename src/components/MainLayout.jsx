import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";

import Sidebar from "../layout/Sidebar";
import Navbar from "../layout/Navbar";

import { clearAuth } from "../store/authSlice";

import "./MainLayout.css";

function MainLayout() {

    const [open, setOpen] = useState(false);

    const dispatch = useDispatch();

    const navigate = useNavigate();

    const auth = useSelector(
        (state) => state.auth
    );

    const logout = () => {

        dispatch(clearAuth());

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/auth/login", {
            replace: true,
        });

    };

    return (

        <div className="layout">

            <Sidebar
                open={open}
                setOpen={setOpen}
            />

            <div className="main-content">
                <div className="main-header">
                    <Navbar
                        setOpen={setOpen}
                        user={auth.user}
                        logout={logout}
                    />

                </div>

                <main className="page-content container">

                    <Outlet />

                </main>

            </div>

        </div>

    );

}

export default MainLayout;