import { api } from "../api/api";

export const categoriesApi = (data) => {
    return api(
        "/api/categories",
        "get",
        data
    );
};

export const createCategoryApi = (data) => {
    return api(
        "/api/categories",
        "post",
        data
    );
};

export const updateCategoryApi = (id, data) => {
    return api(
        `/api/categories/${id}`,
        "put",
        data
    );
};

export const deleteCategoryApi = (id) => {
    return api(
        `/api/categories/${id}`,
        "delete"
    );
};