import { api } from "../api/api";

export const suppliersApi = (params) => {
    return api(
        "/api/suppliers",
        "get",
        params
    );
};

export const getSupplierByIdApi = (id) => {
    return api(
        `/api/suppliers/${id}`,
        "get"
    );
};

export const createSupplierApi = (data) => {
    return api(
        "/api/suppliers",
        "post",
        data
    );
};

export const updateSupplierApi = (id, data) => {
    return api(
        `/api/suppliers/${id}`,
        "put",
        data
    );
};

export const deleteSupplierApi = (id) => {
    return api(
        `/api/suppliers/${id}`,
        "delete"
    );
};
