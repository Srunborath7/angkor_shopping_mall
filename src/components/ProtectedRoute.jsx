import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

function ProtectedRoute() {
    const { token, role, user } = useSelector(
        (state) => state.auth
    );

    if (!token) {
        return <Navigate to="/auth/login" replace />;
    }

    // Role check: Allow any staff/admin/manager/sale role; block only customers
    const userRole = (
        role ||
        user?.role ||
        user?.role_name ||
        user?.roles?.[0]?.name ||
        (Array.isArray(user?.roles) ? user.roles.map((r) => r.name || r).join(" ") : "") ||
        ""
    ).toLowerCase();

    const isCustomer =
        userRole === "customer" ||
        userRole === "customers" ||
        (!userRole && !user);

    if (isCustomer) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}

export default ProtectedRoute;