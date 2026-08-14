import { api } from "../api/api";

export const getRecommendationsApi = (limit = 10) => {
    return api(
        `/api/recommendations?limit=${limit}`,
        "GET"
    );
};

export const getPopularRecommendationsApi = (limit = 10) => {
    return api(
        `/api/recommendations/popular?limit=${limit}`,
        "GET"
    );
};

export const getBestSellersRecommendationsApi = (limit = 10) => {
    return api(
        `/api/recommendations/best-sellers?limit=${limit}`,
        "GET"
    );
};

export const getSearchRecommendationsApi = (query, limit = 10) => {
    if (!query || !query.trim()) {
        return Promise.resolve({ success: true, data: { categories: [], brands: [], models: [], products: [], ai_suggestions: [] } });
    }
    return api(
        `/api/recommendations/search?q=${encodeURIComponent(query.trim())}&limit=${limit}`,
        "GET"
    );
};

export const getSimilarRecommendationsApi = (productId, limit = 8) => {
    return api(
        `/api/recommendations/similar/${productId}?limit=${limit}`,
        "GET"
    );
};

export const trackInteractionApi = (productId, type = "view", productIds = null) => {
    const payload = productIds ? { productIds, type } : { productId, type };
    return api("/api/recommendations/track", "POST", payload);
};


