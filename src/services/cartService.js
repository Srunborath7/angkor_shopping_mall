import { api } from "../api/api";

export const getCartApi = () => {
    return api("/api/cart", "get");
};

export const addToCartApi = (productId, quantity = 1) => {
    return api("/api/cart", "post", { product_id: productId, quantity });
};

export const updateCartItemApi = (cartItemId, quantity) => {
    return api(`/api/cart/${cartItemId}`, "put", { quantity });
};

export const removeFromCartApi = (cartItemId) => {
    return api(`/api/cart/${cartItemId}`, "delete");
};

export const clearCartApi = () => {
    return api("/api/cart", "delete");
};
