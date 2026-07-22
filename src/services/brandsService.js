import { api } from "../api/api";

export const brandsApi = (data) => {
    return api(
        "/api/brands",
        "get",
        data
    );
};

export const createBrandApi = (data) => {
    return api(
        "/api/brands",
        "post",
        data
    );
};

export const updateBrandApi = (id, data) => {
    return api(
        `/api/brands/${id}`,
        "put",
        data
    );
};

export const deleteBrandApi = (id) => {
    return api(
        `/api/brands/${id}`,
        "delete"
    );
};
