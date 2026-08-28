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

      // Customer accounts do not require PIN verification. Staff/Admin require explicit PIN entry.
      if (isCustomerRole(role, user)) {
        state.isPinVerified = true;
      } else if (typeof isPinVerified === "boolean") {
        state.isPinVerified = isPinVerified;
      } else {
        state.isPinVerified = false;
      }
    },

    verifyPinSuccess: (state, action) => {
      state.isPinVerified = true;
      if (action.payload) {
        const { token, refreshToken, user, role } = action.payload;
        if (token) state.token = token;
        if (refreshToken) state.refreshToken = refreshToken;
        if (user) state.user = user;
        if (role) state.role = role;
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
    },
  },
});

export const { setAuth, verifyPinSuccess, lockPin, clearAuth } = authSlice.actions;
export default authSlice.reducer;