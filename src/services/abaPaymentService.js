import { api } from "../api/api";

/**
 * Generate ABA PayWay Dynamic QR code & Deep Link
 * @param {Object} params
 * @param {string|number} [params.orderId]
 * @param {string|number} [params.order_id]
 * @param {number} [params.amount]
 * @param {string} [params.currency='USD'] - 'USD' | 'KHR'
 */
export const generateAbaQrApi = (params) => {
  return api("/api/payments/aba/generate-qr", "post", params);
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
