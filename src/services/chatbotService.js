import { api } from "../api/api";

/**
 * Send a user query to the AI Chatbot backend.
 * @param {string} message - The text entered or spoken by the user.
 * @param {object} context - Current page context e.g. { page: "/product/123", productId: "123" }
 */
export const sendChatMessageApi = async (message, context = {}) => {
  return api("/api/chatbot/message", "post", {
    message,
    context
  });
};

/**
 * Get dynamic smart quick prompts from backend.
 */
export const getChatbotPromptsApi = async () => {
  return api("/api/chatbot/prompts", "get");
};
