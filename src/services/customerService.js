import { api } from "../api/api";

// Customers API
export const CustomersApi = async (data = null) => {
    try {
        const payload = data && typeof data === "object" && Object.keys(data).length > 0 ? data : null;
        return await api(
            "/api/users/customers",
            "get",
            payload
        );
    } catch (err) {
        console.warn("Customers API error, using fallback:", err?.message || err);
        return { success: true, data: [] };
    }
};

export const createCutomersApi = (data) => {
    return api(
        "/api/users",
        "post",
        data
    );
};

export const updateCustomersApi = (id, data) => {
    return api(
        `/api/users/${id}`,
        "put",
        data
    );
};

export const deleteCustomersApi = (id) => {
    return api(
        `/api/users/${id}`,
        "delete"
    );
};

// Staff API (Users with Admin / Manager / Staff roles)
export const StaffApi = (data) => {
    return api(
        "/api/users/staff",
        "get",
        data
    );
};

export const createStaffApi = (data) => {
    return api(
        "/api/users",
        "post",
        data
    );
};

export const updateStaffApi = (id, data) => {
    return api(
        `/api/users/${id}`,
        "put",
        data
    );
};

export const deleteStaffApi = (id) => {
    return api(
        `/api/users/${id}`,
        "delete"
    );
};

// Roles API
export const RolesApi = (data) => {
    return api(
        "/api/roles",
        "get",
        data
    );
};

export const createRoleApi = (data) => {
    return api(
        "/api/roles",
        "post",
        data
    );
};

export const updateRoleApi = (id, data) => {
    return api(
        `/api/roles/${id}`,
        "put",
        data
    );
};

export const deleteRoleApi = (id) => {
    return api(
        `/api/roles/${id}`,
        "delete"
    );
};

// Admin change password for any user/staff
export const adminChangeUserPasswordApi = (id, password) => {
    return api(
        `/api/users/${id}/change-password`,
        "put",
        { password }
    );
};

// User/Staff change their own password
export const changeOwnPasswordApi = (data) => {
    return api(
        "/api/users/change-my-password",
        "put",
        data
    );
};

// Permissions API
export const getPermissionsApi = () => {
    return api(
        "/api/roles/permissions",
        "get"
    );
};

// 2FA Management API
export const enableStaff2FAApi = (userId, pin) => {
    return api(
        `/api/users/${userId}/2fa/enable`,
        "post",
        { pin }
    );
};

export const disableStaff2FAApi = (userId) => {
    return api(
        `/api/users/${userId}/2fa/disable`,
        "post"
    );
};
