import { api } from "../api/api";

/**
 * Fetch approved / published testimonials to display on the Website Homepage
 */
export const getPublishedTestimonialsApi = async () => {
    try {
        const res = await api("/api/testimonials/published", "get");
        return res?.data?.data || res?.data || res || [];
    } catch (err) {
        console.warn("Failed to fetch published testimonials, using fallback:", err?.message);
        return [];
    }
};

/**
 * Customer submits new review / testimonial from the website
 */
export const submitTestimonialApi = async (data) => {
    return await api("/api/testimonials", "post", data);
};

/**
 * Admin: Get all submitted testimonials with optional filters
 */
export const getAllTestimonialsApi = async (params = {}) => {
    try {
        const res = await api("/api/testimonials", "get", params);
        return res?.data?.data || res?.data || res || [];
    } catch (err) {
        console.warn("Failed to fetch admin testimonials:", err?.message);
        return [];
    }
};

/**
 * Admin: Toggle publish / unpublish status for a testimonial on the website
 */
export const togglePublishTestimonialApi = async (id) => {
    return await api(`/api/testimonials/${id}/publish`, "patch");
};

/**
 * Admin: Edit testimonial
 */
export const updateTestimonialApi = async (id, data) => {
    return await api(`/api/testimonials/${id}`, "put", data);
};

/**
 * Admin: Delete testimonial
 */
export const deleteTestimonialApi = async (id) => {
    return await api(`/api/testimonials/${id}`, "delete");
};
