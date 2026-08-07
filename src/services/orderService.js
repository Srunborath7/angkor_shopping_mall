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
        // If /api/orders/admin/all returns 404 (e.g. remote Render server not yet deployed with new route), fallback to /api/orders
        const status = error?.status || error?.statusCode || error?.response?.status;
        if (status === 404 || String(error?.message).includes("404") || String(error).includes("404")) {
            console.warn("Route /api/orders/admin/all returned 404. Falling back to /api/orders");
            return await api("/api/orders", "get");
        }
        throw error;
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



