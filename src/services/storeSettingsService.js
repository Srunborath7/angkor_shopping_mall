import { api } from "../api/api";
import { DEFAULT_STORE_INFO, getCleanStoreSettings } from "../hooks/useStoreSettings";

/**
 * Fetch official store profile & company settings from DB
 */
export async function getStoreSettingsApi() {
  try {
    const res = await api("/api/settings/store-profile", "GET");
    if (res?.data || res?.settings) {
      const data = res.data || res.settings;
      const merged = { ...DEFAULT_STORE_INFO, ...data };
      localStorage.setItem("angkor_store_settings", JSON.stringify(merged));
      localStorage.setItem("angkor_admin_settings_v1", JSON.stringify(merged));
      return merged;
    }
  } catch (err) {
    console.warn("Falling back to local store settings:", err?.message || err);
  }

  // Fallback to local storage or defaults
  return getCleanStoreSettings();
}

/**
 * Save and persist store profile & official company information into Database
 */
export async function updateStoreSettingsApi(settingsData) {
  // Always update local cache & broadcast immediately
  localStorage.setItem("angkor_store_settings", JSON.stringify(settingsData));
  localStorage.setItem("angkor_admin_settings_v1", JSON.stringify(settingsData));
  window.dispatchEvent(new Event("angkor_store_settings_updated"));

  try {
    const res = await api("/api/settings/store-profile", "PUT", settingsData);
    return res?.data || res;
  } catch (err) {
    // Try generic settings endpoint if subroute differs
    try {
      const fallbackRes = await api("/api/settings", "POST", {
        type: "store_profile",
        settings: settingsData,
        ...settingsData
      });
      return fallbackRes?.data || fallbackRes;
    } catch (fallbackErr) {
      console.warn("DB sync warning for store profile (saved locally):", fallbackErr?.message || fallbackErr);
    }
  }

  return settingsData;
}
