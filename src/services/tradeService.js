import { api } from "../api/api";

/**
 * Fetch public / filtered trade product listings
 * @param {Object} params - { search, category_id, brand_id, condition, status, min_value, max_value, location, sort, page, limit }
 */
export const getTradeProductsApi = async (params = {}) => {
  try {
    const cleanParams = {};
    Object.keys(params || {}).forEach((k) => {
      const val = params[k];
      if (val !== undefined && val !== null && val !== "all" && val !== "") {
        cleanParams[k] = val;
      }
    });
    if (cleanParams.limit && Number(cleanParams.limit) > 20) {
      cleanParams.limit = 20;
    }
    return await api("/api/trade-products", "GET", cleanParams);
  } catch (err) {
    console.warn("Trade products API error or fallback:", err?.message || err);
    return { success: true, data: { tradeProducts: [] } };
  }
};

/**
 * Fetch a single trade product by ID
 */
export const getTradeProductByIdApi = (id) => {
  return api(`/api/trade-products/${id}`, "GET");
};

/**
 * Fetch current user's trade listings
 */
export const getMyTradeProductsApi = (params = {}) => {
  return api("/api/trade-products/my", "GET", params);
};

/**
 * Fetch eligible ordered items that user purchased from store for trade listing
 */
export const getEligibleOrderedItemsApi = () => {
  return api("/api/trade-products/eligible-ordered-items", "GET");
};

/**
 * Create a new trade listing
 * @param {FormData|Object} data
 */
export const createTradeProductApi = (data) => {
  return api("/api/trade-products", "POST", data);
};

/**
 * Update an existing trade listing
 * @param {string} id
 * @param {FormData|Object} data
 */
export const updateTradeProductApi = (id, data) => {
  return api(`/api/trade-products/${id}`, "PUT", data);
};

/**
 * Delete a trade listing
 * @param {string} id
 */
export const deleteTradeProductApi = (id) => {
  return api(`/api/trade-products/${id}`, "DELETE");
};

/**
 * Submit a trade offer on a trade product
 * @param {string} productId
 * @param {Object} data - { offered_product_id, offered_item_title, offered_item_description, offered_cash_difference, message, contact_info }
 */
export const createTradeOfferApi = (productId, data) => {
  return api(`/api/trade-products/${productId}/offers`, "POST", data);
};

/**
 * Get received trade offers for logged-in user
 */
export const getReceivedTradeOffersApi = (params = {}) => {
  return api("/api/trade-offers/received", "GET", params);
};

/**
 * Get sent trade offers for logged-in user
 */
export const getSentTradeOffersApi = (params = {}) => {
  return api("/api/trade-offers/sent", "GET", params);
};

/**
 * Get a specific trade offer by ID
 */
export const getTradeOfferByIdApi = (id) => {
  return api(`/api/trade-offers/${id}`, "GET");
};

/**
 * Update status of an offer (accepted, rejected, cancelled, completed)
 * @param {string} id
 * @param {string} status
 * @param {string} status_note
 */
export const updateTradeOfferStatusApi = (id, status, status_note = "") => {
  return api(`/api/trade-offers/${id}/status`, "PATCH", { status, status_note });
};
