import { api } from "../api/api";

export const categoriesApi = async (data) => {
    const params = data && typeof data === "object" && Object.keys(data).length > 0 ? data : undefined;
    try {
        const res = await api("/api/categories", "get", params);
        return res;
    } catch (err) {
        try {
            return await api("/api/category", "get", params);
        } catch (fallbackErr) {
            console.warn("Categories API unavailable, using fallback list:", fallbackErr.message);
            return { success: true, data: { categories: [] } };
        }
    }
};

export const createCategoryApi = async (data) => {
    try {
        return await api("/api/categories", "post", data);
    } catch (err) {
        const status = err?.status || err?.statusCode || err?.response?.status;
        if (status === 404) {
            return await api("/api/category", "post", data);
        }
        throw err;
    }
};

export const updateCategoryApi = async (id, data) => {
    try {
        return await api(`/api/categories/${id}`, "put", data);
    } catch (err) {
        const status = err?.status || err?.statusCode || err?.response?.status;
        if (status === 404) {
            return await api(`/api/category/${id}`, "put", data);
        }
        throw err;
    }
};

export const deleteCategoryApi = async (id) => {
    try {
        return await api(`/api/categories/${id}`, "delete");
    } catch (err) {
        const status = err?.status || err?.statusCode || err?.response?.status;
        if (status === 404) {
            return await api(`/api/category/${id}`, "delete");
        }
        throw err;
    }
};