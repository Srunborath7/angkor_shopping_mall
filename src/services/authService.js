import { api } from "../api/api";

export const loginApi = (data) => {
    return api("/api/auth/login", "post", data);
};
export const registerApi = (data) => {
    return api(
        "/api/auth/register",
        "post",
        data
    );
};

// Get Roles (Admin only)
export const getRolesApi = () => {

    return api(
        "/api/roles",
        "get"
    );

};