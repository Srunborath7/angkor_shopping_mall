import { api } from "../api/api";

export const getCartApi = () => {
    return api("/api/cart", "get");
};

/**
 * Add a product to the server cart.
 * @param {string} productId - product UUID
 * @param {number} quantity
 * @param {string|null} variantId - variant UUID (null if no variant)
 * @param {object} attributes - e.g. { color: "Red", size: "L" }
 */
export const addToCartApi = (productId, quantity = 1, variantId = null, attributes = {}) => {
    return api("/api/cart", "post", {
        product_id: productId,
        variant_id: variantId || null,
        quantity,
        attributes: attributes || {}
    });
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
