import { api } from "../api/api";

export const brandsApi = async (data) => {
    try {
        return await api("/api/brands", "get", data);
    } catch (err) {
        const status = err?.status || err?.statusCode || err?.response?.status;
        if (status === 404) {
            try {
                return await api("/api/brand", "get", data);
            } catch (fallbackErr) {
                console.warn("Brand endpoint fallback returned 404:", fallbackErr);
            }
        }
        throw err;
    }
};

export const createBrandApi = async (data) => {
    try {
        return await api("/api/brands", "post", data);
    } catch (err) {
        const status = err?.status || err?.statusCode || err?.response?.status;
        if (status === 404) {
            return await api("/api/brand", "post", data);
        }
        throw err;
    }
};

export const updateBrandApi = async (id, data) => {
    try {
        return await api(`/api/brands/${id}`, "put", data);
    } catch (err) {
        const status = err?.status || err?.statusCode || err?.response?.status;
        if (status === 404) {
            return await api(`/api/brand/${id}`, "put", data);
        }
        throw err;
    }
};

export const deleteBrandApi = async (id) => {
    try {
        return await api(`/api/brands/${id}`, "delete");
    } catch (err) {
        const status = err?.status || err?.statusCode || err?.response?.status;
        if (status === 404) {
            return await api(`/api/brand/${id}`, "delete");
        }
        throw err;
    }
};
