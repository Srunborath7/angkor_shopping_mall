import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  token: null,
  tempToken: null,
  refreshToken: null,
  role: null,
  remember: false,
  user: null,
  isPinVerified: false,
};

const isCustomerRole = (role, user) => {
  const roleStr = String(
    role ||
    user?.role ||
    user?.role_name ||
    user?.roles?.[0]?.name ||
    (Array.isArray(user?.roles) ? user.roles.map((r) => r.name || r).join(" ") : "") ||
    ""
  ).toLowerCase();

  return (
    roleStr === "customer" ||
    roleStr === "customers" ||
    (!roleStr && !user)
  );
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (state, action) => {
      const { token, tempToken, refreshToken, role, remember, user, isPinVerified } = action.payload;

      state.token = token !== undefined ? token : state.token;
      if (tempToken !== undefined) {
        state.tempToken = tempToken;
      }
      if (refreshToken !== undefined) {
        state.refreshToken = refreshToken;
      }
      state.role = role !== undefined ? role : state.role;
      state.remember = remember !== undefined ? remember : state.remember;
      state.user = user !== undefined ? user : state.user;

      // Persist directly to localStorage for instant synchronous availability
      try {
        if (state.token) {
          localStorage.setItem("token", state.token);
          localStorage.setItem("accessToken", state.token);
        }
        if (state.role) {
          localStorage.setItem("role", state.role);
        }
        if (state.user) {
          localStorage.setItem("user", JSON.stringify(state.user));
        }
      } catch (e) {}

      const has2FA = Boolean(
        state.user?.two_fa_enabled === true ||
        state.user?.two_fa_enabled === 1 ||
        state.user?.two_fa_enabled === "1" ||
        state.user?.two_fa_enabled === "true" ||
        Boolean(state.tempToken)
      );

      // Customer accounts do not require PIN verification.
      if (isCustomerRole(role, user)) {
        state.isPinVerified = true;
      } else if (typeof isPinVerified === "boolean") {
        state.isPinVerified = isPinVerified;
      } else if (has2FA) {
        // Staff/Admin with 2FA enabled require PIN verification
        state.isPinVerified = false;
      } else {
        // Staff/Admin without 2FA enabled do not require PIN verification
        state.isPinVerified = true;
      }
    },

    verifyPinSuccess: (state, action) => {
      state.isPinVerified = true;
      if (action.payload) {
        const { token, refreshToken, user, role } = action.payload;
        if (token) {
          state.token = token;
          try {
            localStorage.setItem("token", token);
            localStorage.setItem("accessToken", token);
          } catch (e) {}
        }
        if (refreshToken) state.refreshToken = refreshToken;
        if (user) {
          state.user = user;
          try {
            localStorage.setItem("user", JSON.stringify(user));
          } catch (e) {}
        }
        if (role) {
          state.role = role;
          try {
            localStorage.setItem("role", role);
          } catch (e) {}
        }
      }
      state.tempToken = null;
    },

    lockPin: (state) => {
      state.isPinVerified = false;
    },

    clearAuth: (state) => {
      state.token = null;
      state.tempToken = null;
      state.refreshToken = null;
      state.role = null;
      state.remember = false;
      state.user = null;
      state.isPinVerified = false;
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("role");
        localStorage.removeItem("user");
      } catch (e) {}
    },
  },
});

export const { setAuth, verifyPinSuccess, lockPin, clearAuth } = authSlice.actions;
export default authSlice.reducer;