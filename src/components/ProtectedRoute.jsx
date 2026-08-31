import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

function ProtectedRoute() {
    const { token, tempToken, role, user, isPinVerified } = useSelector(
        (state) => state.auth
    );

    if (!token && !tempToken) {
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

    // Check if user has 2FA enabled
    const has2FA = Boolean(
        user?.two_fa_enabled === true ||
        user?.two_fa_enabled === 1 ||
        user?.two_fa_enabled === "1" ||
        user?.two_fa_enabled === "true" ||
        Boolean(tempToken)
    );

    // If staff/admin has 2FA enabled and has not passed PIN verification, redirect to PIN challenge page
    if (has2FA && !isPinVerified) {
        return <Navigate to="/auth/pin" replace />;
    }

    return <Outlet />;
}

export default ProtectedRoute;