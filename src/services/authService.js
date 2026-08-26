import { api } from "../api/api";

export const loginApi = (data) => {
    return api("/api/auth/login", "post", data);
};

export const registerApi = (data) => {
    return api(
        "/api/auth/register",
        "post",
        data
    );
};

// Google Social Login
export const googleLoginApi = (data) => {
    return api("/api/auth/google", "post", data);
};

// Get Roles (Admin only)
export const getRolesApi = () => {
    return api(
        "/api/roles",
        "get"
    );
};

// Forgot Password - Email Flow
export const sendForgotPasswordEmailApi = (email) => {
    return api("/api/auth/forgot-password", "post", { email });
};

export const verifyResetOtpEmailApi = (email, otp) => {
    return api("/api/auth/verify-reset-otp", "post", { email, otp });
};

export const resetPasswordEmailApi = (resetToken, newPassword) => {
    return api("/api/auth/reset-password", "post", { resetToken, newPassword });
};

// Forgot Password - Telegram Flow
export const sendResetOtpTelegramApi = (phone) => {
    return api("/api/auth/telegram/otp/send", "post", { phone });
};

export const verifyResetOtpTelegramApi = (phone, otp) => {
    return api("/api/auth/telegram/otp/verify", "post", { phone, otp });
};

export const resetPasswordTelegramApi = (resetToken, newPassword) => {
    return api("/api/auth/telegram/password/reset", "post", { resetToken, newPassword });
};