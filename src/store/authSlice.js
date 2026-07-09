import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  token: null,
  role: null,
  remember: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (state, action) => {
      const { token, role, remember } = action.payload;

      state.token = token;
      state.role = role;
      state.remember = remember;
    },

    clearAuth: (state) => {
      state.token = null;
      state.role = null;
      state.remember = false;
    },
  },
});

export const { setAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;