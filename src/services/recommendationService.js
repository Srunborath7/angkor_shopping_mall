import { api } from "../api/api";

export const getRecommendationsApi = () => {
    return api(
        "/api/recommendations",
        "get"
    );
};

export const getPopularRecommendationsApi = () => {
    return api(
        "/api/recommendations/popular",
        "get"
    );
};

export const getSearchRecommendationsApi = (query) => {
    return api(
        `/api/recommendations/search?q=${query}`,
        "get"
    );
};

export const getSimilarRecommendationsApi = (productId) => {
    return api(
        `/api/recommendations/similar/${productId}`,
        "get"
    );
};
