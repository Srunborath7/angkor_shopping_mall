import { api } from "../api/api";

export const productsApi = async (data) => {
    try {
        return await api(
            "/api/products",
            "get",
            data
        );
    } catch (err) {
        console.warn("Products API error, using fallback:", err?.message || err);
        return { success: true, data: [] };
    }
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

export const getTrendingProductsApi = (params) => {
    return api(
        "/api/products/true",
        "get",
        { page: 1, limit: 8, ...params }
    );
};

export const getBestSellersApi = async (limit = 10) => {
    try {
        const res = await api(
            "/api/products/best-sellers",
            "get",
            { limit }
        );
        return res;
    } catch (err) {
        // Handle backend database error (e.g. missing orderitem table query) by falling back to catalog
        try {
            const fallback = await api("/api/products/true", "get", { page: 1, limit });
            return fallback;
        } catch {
            return { data: { products: [] } };
        }
    }
};

export const getFlashSaleProductsApi = (params) => {
    return api(
        "/api/products/true",
        "get",
        { page: 1, limit: 8, ...params }
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

export const getProductByIdApi = async (id) => {
    if (!id) return { data: null };
    try {
        return await api(`/api/products/${id}`, "get");
    } catch {
        return { data: null };
    }
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

export const createProductReviewApi = async (productId, data) => {
    const payload = {
        product_id: productId,
        rating: Number(data.rating || 5),
        comment: data.comment || "",
        images: Array.isArray(data.images) ? data.images : (data.imageUrl ? [data.imageUrl] : []),
        ...(data.user_id ? { user_id: data.user_id } : {}),
        ...(data.user_name ? { user_name: data.user_name } : {})
    };
    try {
        return await api(`/api/products/${productId}/reviews`, "post", payload);
    } catch (err) {
        const status = err?.status || err?.statusCode || err?.response?.status;
        if (status === 404) {
            return await api("/api/reviews", "post", payload);
        }
        throw err;
    }
};

export const getProductReviewsApi = (productId) => {
    return api(`/api/products/${productId}/reviews`, "get");
};
