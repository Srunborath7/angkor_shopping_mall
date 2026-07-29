import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  token: null,
  refreshToken: null,
  role: null,
  remember: false,
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (state, action) => {
      const { token, refreshToken, role, remember, user } = action.payload;

      state.token = token;
      if (refreshToken !== undefined) {
        state.refreshToken = refreshToken;
      }
      state.role = role;
      state.remember = remember;
      state.user = user;
    },

    clearAuth: (state) => {
      state.token = null;
      state.refreshToken = null;
      state.role = null;
      state.remember = false;
      state.user = null;
    },
  },
});

export const { setAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;