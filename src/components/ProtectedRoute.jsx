import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

function ProtectedRoute() {
    const { token, role } = useSelector(
        (state) => state.auth
    );

    if (!token) {
        return <Navigate to="/auth/login" replace />;
    }

    // Protect admin routes: role must be admin or sale
    if (role !== "admin" && role !== "sale") {
        return <Navigate to="/auth/login" replace />;
    }

    return <Outlet />;
}

export default ProtectedRoute;