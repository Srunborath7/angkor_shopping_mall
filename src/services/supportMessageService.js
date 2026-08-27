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
export const getAdminSupportMessagesApi = async (params = {}) => {
  try {
    return await api("/api/support/messages", "get", params);
  } catch (err) {
    console.warn("Support messages API query error:", err.message);
    return { data: { messages: [], rows: [], total: 0 } };
  }
};

/**
 * Admin: Get single message details + customer orders
 */
export const getAdminSupportMessageByIdApi = async (id) => {
  try {
    return await api(`/api/support/messages/${id}`, "get");
  } catch (err) {
    return { data: null };
  }
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
export const getSupportStatsApi = async () => {
  try {
    return await api("/api/support/stats", "get");
  } catch (err) {
    return { data: { unread: 0, total: 0 } };
  }
};
