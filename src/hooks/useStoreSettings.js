import { useState, useEffect } from "react";
import { getStoreSettingsApi } from "../services/storeSettingsService";

export const DEFAULT_STORE_INFO = {
  storeName: "Angkor Shopping Mall",
  storeTagline: "Cambodia's Leading Tech & Lifestyle Destination",
  storeEmail: "contact@angkormall.com",
  storePhone: "+855 23 888 999",
  supportTelegram: "@AngkorMallSupport",
  storeAddress: "St. 2004, Sangkat Kakab, Khan Sen Sok, Phnom Penh, Kingdom of Cambodia",
  operatingHours: "Mon - Sun: 8:00 AM - 10:00 PM (Daily)",
  currency: "USD",
  dualCurrencyDisplay: true,
  khrRate: 4100,
  taxRate: 10,
  facebookUrl: "https://facebook.com/angkorshoppingmall",
  telegramUrl: "https://t.me/angkormallsupport",
  tiktokUrl: "https://tiktok.com/@angkormall",
  instagramUrl: "https://instagram.com/angkormall",
  abaEnabled: true,
  bakongEnabled: true,
  wingEnabled: true,
  codEnabled: true,
  cardEnabled: true
};

export function getCleanStoreSettings() {
  try {
    const raw =
      localStorage.getItem("angkor_admin_settings_v1") ||
      localStorage.getItem("angkor_store_settings");
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_STORE_INFO, ...parsed };
    }
  } catch (err) {
    console.warn("Failed to parse store settings from storage:", err);
  }
  return DEFAULT_STORE_INFO;
}

export function useStoreSettings() {
  const [storeInfo, setStoreInfo] = useState(getCleanStoreSettings);

  useEffect(() => {
    let isMounted = true;

    getStoreSettingsApi()
      .then((data) => {
        if (isMounted && data) {
          setStoreInfo(data);
        }
      })
      .catch(() => {});

    const updateHandler = () => {
      setStoreInfo(getCleanStoreSettings());
    };

    window.addEventListener("angkor_store_settings_updated", updateHandler);
    window.addEventListener("storage", updateHandler);

    return () => {
      isMounted = false;
      window.removeEventListener("angkor_store_settings_updated", updateHandler);
      window.removeEventListener("storage", updateHandler);
    };
  }, []);

  return storeInfo;
}
