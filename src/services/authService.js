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

// 2FA / PIN Verification
export const verify2FAApi = (tempToken, pin) => {
    return api("/api/auth/verify-2fa", "post", { temp_token: tempToken, pin });
};

// 2FA Management for Staff
export const enableStaff2FAApi = (userId, pin) => {
    return api(`/api/users/${userId}/2fa/enable`, "post", { pin });
};

export const disableStaff2FAApi = (userId) => {
    return api(`/api/users/${userId}/2fa/disable`, "post");
};

// Get Roles (Admin only)
export const getRolesApi = () => {
    return api(
        "/api/roles",
        "get"
    );
};

// Get Staff Users
export const getStaffApi = () => {
    return api(
        "/api/users/staff",
        "get"
    );
};

// Get All Users
export const getUsersApi = () => {
    return api(
        "/api/users",
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
