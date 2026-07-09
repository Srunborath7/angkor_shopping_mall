import { api } from "../api/api";

export const loginApi = (data) => {
    return api("/api/auth/login", "post", data);
};