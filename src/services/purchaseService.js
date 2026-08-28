import { api } from "../api/api";

export const purchaseOrdersApi = async (params = null) => {
    try {
        const payload = params && typeof params === "object" && Object.keys(params).length > 0 ? params : null;
        return await api(
            "/api/purchase-orders",
            "get",
            payload
        );
    } catch (err) {
        console.warn("Purchase orders API error, using fallback:", err?.message || err);
        return { success: true, data: [] };
    }
};

export const getPurchaseOrderByIdApi = (id) => {
    return api(
        `/api/purchase-orders/${id}`,
        "get"
    );
};

export const createPurchaseOrderApi = (data) => {
    return api(
        "/api/purchase-orders",
        "post",
        data
    );
};

export const updatePurchaseOrderStatusApi = (id, status) => {
    return api(
        `/api/purchase-orders/${id}/status`,
        "patch",
        { status }
    );
};

export const deletePurchaseOrderApi = (id) => {
    return api(
        `/api/purchase-orders/${id}`,
        "delete"
    );
};
