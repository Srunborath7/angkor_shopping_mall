import { api } from "../api/api";

/**
 * User / Guest sends support message to Admin
 */
export const sendSupportMessageApi = (data) => {
  return api("/api/support/send", "post", data);
};

/**
 * Logged-in user fetches their support messages & admin replies
 */
export const getMySupportMessagesApi = () => {
  return api("/api/support/my-messages", "get");
};

/**
 * Public/Guest or User track tickets by IDs / email
 */
export const trackSupportMessagesApi = (data = {}) => {
  return api("/api/support/track", "post", data);
};

/**
 * Admin: Get all customer support messages
 */
export const getAdminSupportMessagesApi = (params = {}) => {
  return api("/api/support/messages", "get", params);
};

/**
 * Admin: Get single message details + customer orders
 */
export const getAdminSupportMessageByIdApi = (id) => {
  return api(`/api/support/messages/${id}`, "get");
};

/**
 * Admin: Send reply to customer
 */
export const replySupportMessageApi = (id, reply) => {
  return api(`/api/support/messages/${id}/reply`, "post", { reply });
};

/**
 * Admin: Generate AI Draft reply using OpenAI / AI engine
 */
export const generateAiDraftApi = (id, instruction = "") => {
  return api(`/api/support/messages/${id}/ai-draft`, "post", { instruction });
};

/**
 * Admin: Get support statistics
 */
export const getSupportStatsApi = () => {
  return api("/api/support/stats", "get");
};
