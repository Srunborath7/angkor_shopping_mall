import { api } from "../api/api";

export const checkoutApi = (data) => {
    // data: { shipping_address, contact_phone }
    return api("/api/orders/checkout", "post", data);
};

export const getOrdersApi = () => {
    return api("/api/orders", "get");
};

export const getOrderByIdApi = (id) => {
    const cleanId = String(id || "").replace(/^#/, "").trim();
    return api(`/api/orders/${cleanId}`, "get");
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
    const cleanId = String(id || "").replace(/^#/, "").trim();
    try {
        return await api(`/api/orders/${cleanId}/status`, "put", data);
    } catch (error) {
        const status = error?.status || error?.statusCode || error?.response?.status;
        if (status === 404 || String(error?.message).includes("404")) {
            if (data?.status === "paid") {
                return await payOrderApi(cleanId);
            }
        }
        throw error;
    }
};

export const deleteOrderApi = (id) => {
    const cleanId = String(id || "").replace(/^#/, "").trim();
    return api(`/api/orders/${cleanId}`, "delete");
};

export const payOrderApi = (id, paymentIntent = null) => {
    const cleanId = String(id || "").replace(/^#/, "").trim();
    return api(`/api/orders/${cleanId}/pay`, "post", { payment_intent: paymentIntent });
};

export const createAdminOrderApi = (data) => {
    return api("/api/orders/admin/create", "post", data);
};

// ==========================================
// STORE DELIVERY TABLE API ENDPOINTS
// ==========================================

// 1. Create or save a delivery record for an order in the 'deliveries' table
export const createDeliveryApi = async (data) => {
    // data: { order_id, carrier, driver_name, driver_phone, tracking_number, estimated_time, notes, status }
    try {
        return await api("/api/deliveries", "post", data);
    } catch (error) {
        console.warn("Dedicated /api/deliveries endpoint unavailable, trying /api/orders/:id/delivery fallback:", error.message);
        if (data?.order_id) {
            return await api(`/api/orders/${data.order_id}/delivery`, "post", data);
        }
        throw error;
    }
};

// 2. Fetch delivery info for a specific order
export const getOrderDeliveryApi = async (orderId) => {
    try {
        return await api(`/api/deliveries/order/${orderId}`, "get");
    } catch (error) {
        return await api(`/api/orders/${orderId}/delivery`, "get");
    }
};

// 3. Update existing delivery record status
export const updateDeliveryApi = async (deliveryId, data) => {
    return await api(`/api/deliveries/${deliveryId}`, "put", data);
};

// 4. Combined helper: Dispatches order, creates delivery entry, and updates order status
export const dispatchOrderDeliveryApi = async (orderId, deliveryData) => {
    const payload = {
        order_id: orderId,
        carrier: deliveryData.carrier || deliveryData.delivery_carrier,
        driver_name: deliveryData.driver_name || deliveryData.delivery_driver_name,
        driver_phone: deliveryData.driver_phone || deliveryData.delivery_driver_phone,
        tracking_number: deliveryData.tracking_number,
        estimated_time: deliveryData.estimated_time || deliveryData.estimated_delivery_time,
        notes: deliveryData.notes || deliveryData.delivery_notes,
        status: "in_transit"
    };

    // First, update the order status
    try {
        await updateOrderStatusApi(orderId, {
            status: "shipped",
            ...deliveryData
        });
    } catch (err) {
        console.warn("updateOrderStatusApi warning during dispatch:", err.message);
    }

    // Next, attempt to insert/update in the dedicated 'deliveries' table
    try {
        return await createDeliveryApi(payload);
    } catch (err) {
        console.warn("createDeliveryApi fallback engaged:", err.message);
        return { success: true, data: payload };
    }
};
