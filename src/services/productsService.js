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

export const productsPagedApi = (params) => {
    return api(
        "/api/products/true",
        "get",
        params
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

export const getProductByIdApi = (id) => {
    return api(
        `/api/products/${id}`,
        "get"
    );
};

export const upsertProductDetailApi = (productId, data) => {
    return api(
        `/api/products/${productId}/detail`,
        "post",
        data
    );
};

export const createProductVariantApi = (productId, data) => {
    return api(
        `/api/products/${productId}/variants`,
        "post",
        data
    );
};

export const updateProductVariantApi = (variantId, data) => {
    return api(
        `/api/variants/${variantId}`,
        "put",
        data
    );
};

export const deleteProductVariantApi = (variantId) => {
    return api(
        `/api/variants/${variantId}`,
        "delete"
    );
};

export const updateProductVariantInventoryApi = (variantId, stockQuantity) => {
    return api(
        `/api/variants/${variantId}/inventory`,
        "patch",
        { stock_quantity: stockQuantity }
    );
};

export const uploadProductImageApi = (productId, data) => {
    return api(
        `/api/products/${productId}/images`,
        "post",
        data
    );
};

export const deleteProductImageApi = (imageId) => {
    return api(
        `/api/images/${imageId}`,
        "delete"
    );
};

export const brandsApi = () => {
    return api(
        "/api/brands",
        "get"
    );
};
