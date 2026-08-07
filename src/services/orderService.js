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

export const payOrderApi = (id, paymentIntent = null) => {
    return api(`/api/orders/${id}/pay`, "post", { payment_intent: paymentIntent });
};
