import { api } from "../api/api";

/**
 * Generate Bakong KHQR for an order or custom amount
 * @param {Object} params
 * @param {string|number} [params.orderId]
 * @param {string|number} [params.order_id]
 * @param {number} [params.amount]
 * @param {string} [params.currency='USD'] - 'USD' | 'KHR'
 */
export const generateKhqrApi = (params) => {
  return api("/api/payments/khqr/generate", "post", params);
};

/**
 * Check real-time payment status by MD5 hash
 * @param {string} md5
 */
export const checkKhqrStatusApi = (md5) => {
  return api(`/api/payments/khqr/check-status/${md5}`, "get");
};

/**
 * Simulate payment completion for test/sandbox flow
 * @param {Object} params
 * @param {string} [params.md5]
 * @param {string|number} [params.orderId]
 */
export const simulateKhqrPayApi = (params) => {
  return api("/api/payments/khqr/simulate", "post", params);
};
