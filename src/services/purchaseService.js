import { api } from "../api/api";

export const purchaseOrdersApi = (params) => {
    return api(
        "/api/purchase-orders",
        "get",
        params
    );
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
