import { api } from "../api/api";

export const checkoutApi = (data) => {
    // data: { shipping_address, contact_phone }
    return api("/api/orders/checkout", "post", data);
};

export const getOrdersApi = () => {
    return api("/api/orders", "get");
};

export const getOrderByIdApi = (id) => {
    return api(`/api/orders/${id}`, "get");
};

export const getAdminOrdersApi = async () => {
    try {
        return await api("/api/orders/admin/all", "get");
    } catch (error) {
        const status = error?.status || error?.statusCode || error?.response?.status;
        console.warn(`Route /api/orders/admin/all returned ${status}. Attempting fallback to /api/orders`);
        try {
            return await api("/api/orders", "get");
        } catch (fallbackErr) {
            console.warn("Fallback /api/orders also failed:", fallbackErr?.message || fallbackErr);
            return { success: true, data: [] };
        }
    }
};

export const updateOrderStatusApi = async (id, data) => {
    try {
        return await api(`/api/orders/${id}/status`, "put", data);
    } catch (error) {
        const status = error?.status || error?.statusCode || error?.response?.status;
        if (status === 404 || String(error?.message).includes("404")) {
            if (data?.status === "paid") {
                return await payOrderApi(id);
            }
        }
        throw error;
    }
};

export const deleteOrderApi = (id) => {
    return api(`/api/orders/${id}`, "delete");
};

export const payOrderApi = (id, paymentIntent = null) => {
    return api(`/api/orders/${id}/pay`, "post", { payment_intent: paymentIntent });
};

export const createAdminOrderApi = (data) => {
    return api("/api/orders/admin/create", "post", data);
};



