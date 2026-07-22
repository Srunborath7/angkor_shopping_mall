import { api } from "../api/api";

export const productsApi = (data) => {
    return api(
        "/api/products",
        "get",
        data
    );
};

export const createProductApi = (data) => {
    return api(
        "/api/products",
        "post",
        data
    );
};

export const updateProductApi = (id, data) => {
    return api(
        `/api/products/${id}`,
        "put",
        data
    );
};

export const deleteProductApi = (id) => {
    return api(
        `/api/products/${id}`,
        "delete"
    );
};

export const brandsApi = () => {
    return api(
        "/api/brands",
        "get"
    );
};
