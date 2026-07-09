import { combineReducers, configureStore } from "@reduxjs/toolkit";
import authReduce from "./authSlice";
import { persistReducer, persistStore } from "redux-persist";

const storage = {
  getItem: (key) => Promise.resolve(localStorage.getItem(key)),
  setItem: (key, value) => Promise.resolve(localStorage.setItem(key, value)),
  removeItem: (key) => Promise.resolve(localStorage.removeItem(key)),
};

const configPersist = {
  key: "root",
  storage,
  whitelist: ["auth",],
};

const rootReduc = combineReducers({
  auth: authReduce,
});

const persistedReduc = persistReducer(configPersist, rootReduc);

export const store = configureStore({
  reducer: persistedReduc,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);