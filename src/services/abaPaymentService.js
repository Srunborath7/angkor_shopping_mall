import { api } from "../api/api";

export const ABA_CONFIG = {
  apiUrl: import.meta.env.VITE_ABA_PAYWAY_API_URL || "https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase",
  merchantId: import.meta.env.VITE_ABA_PAYWAY_MERCHANT_ID || "ec477y777",
  apiKey: import.meta.env.VITE_ABA_PAYWAY_API_KEY || "bff7e9c4570225fc",
  storeLabel: import.meta.env.VITE_ABA_PAYWAY_STORE_LABEL || "Angkor Shopping Mall",
  accountId: import.meta.env.VITE_ABA_ACCOUNT_ID || "974242291@abaa"
};

/**
 * Generate ABA PayWay Dynamic QR code & Deep Link
 * @param {Object} params
 * @param {string|number} [params.orderId]
 * @param {string|number} [params.order_id]
 * @param {number} [params.amount]
 * @param {string} [params.currency='USD'] - 'USD' | 'KHR'
 */
export const generateAbaQrApi = (params) => {
  const payload = {
    merchantId: ABA_CONFIG.merchantId,
    bakongAccountId: ABA_CONFIG.accountId,
    storeLabel: ABA_CONFIG.storeLabel,
    ...params
  };
  return api("/api/payments/aba/generate-qr", "post", payload);
};

/**
 * Check real-time payment status with ABA PayWay by tran_id or MD5
 * @param {string} tranId
 */
export const checkAbaStatusApi = (tranId) => {
  return api(`/api/payments/aba/check-status/${tranId}`, "get");
};

/**
 * Simulate payment completion for test/sandbox flow
 * @param {Object} params
 * @param {string} [params.tran_id]
 * @param {string} [params.md5]
 * @param {string|number} [params.orderId]
 */
export const simulateAbaPayApi = (params) => {
  return api("/api/payments/aba/simulate", "post", params);
};

// Aliases for compatibility
export const generateKhqrApi = generateAbaQrApi;
export const checkKhqrStatusApi = checkAbaStatusApi;
export const simulateKhqrPayApi = simulateAbaPayApi;
