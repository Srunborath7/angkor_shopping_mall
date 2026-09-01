import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import kmTranslations from "../locales/km.json";
import enTranslations from "../locales/en.json";
import toast from "react-hot-toast";

const translations = {
  km: kmTranslations,
  en: enTranslations
};

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const initialLang = (() => {
    try {
      const saved = localStorage.getItem("angkor_language") || localStorage.getItem("angkor_preferred_voice_lang");
      return saved === "en" ? "en" : "km";
    } catch {
      return "km";
    }
  })();

  const [language, setLanguageState] = useState(initialLang);
  const langRef = useRef(initialLang);
  const isBroadcastingRef = useRef(false);

  const setLanguage = useCallback((newLang, showToast = true, fromExternal = false) => {
    const lang = newLang === "en" ? "en" : "km";
    const prevLang = langRef.current;

    // Guard against identical changes when no toast is requested
    if (lang === prevLang && !showToast) return;

    langRef.current = lang;
    setLanguageState(lang);

    try {
      localStorage.setItem("angkor_language", lang);
      localStorage.setItem("angkor_preferred_voice_lang", lang);
      document.documentElement.lang = lang;
      
      // Dispatch custom event only when not triggered from external listener to prevent recursion
      if (!fromExternal && !isBroadcastingRef.current) {
        isBroadcastingRef.current = true;
        window.dispatchEvent(new CustomEvent("angkor-language-change", { 
          detail: { lang, source: "LanguageContext" } 
        }));
        isBroadcastingRef.current = false;
      }
      
      if (showToast && prevLang !== lang) {
        if (lang === "km") {
          toast.success("🇰🇭 បានប្តូរភាសាទៅជា៖ ភាសាខ្មែរ", { id: "lang-change" });
        } else {
          toast.success("🇺🇸 Language changed to English", { id: "lang-change" });
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Listen to external language change triggers (e.g. from ChatBot language selector)
  useEffect(() => {
    const handleExternalChange = (e) => {
      const targetLang = typeof e.detail === "object" ? e.detail?.lang : e.detail;
      const source = typeof e.detail === "object" ? e.detail?.source : null;
      if (source === "LanguageContext") return; // Ignore own events

      if (targetLang && (targetLang === "km" || targetLang === "en") && targetLang !== langRef.current) {
        setLanguage(targetLang, false, true);
      }
    };
    window.addEventListener("angkor-language-change", handleExternalChange);
    return () => window.removeEventListener("angkor-language-change", handleExternalChange);
  }, [setLanguage]);

  // Set document language attribute on mount
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  /**
   * Translate a key path (e.g., "nav.home", "common.addToCart")
   * @param {string} path - dot separated key path
   * @param {object|string} paramsOrFallback - interpolation object or default fallback string
   */
  const t = useCallback((path, paramsOrFallback = "") => {
    if (!path) return "";

    const keys = path.split(".");
    let current = translations[language];

    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = current[key];
      } else {
        // Fallback to English if key missing in current language
        let fallback = translations.en;
        for (const fbKey of keys) {
          if (fallback && typeof fallback === "object" && fbKey in fallback) {
            fallback = fallback[fbKey];
          } else {
            fallback = null;
            break;
          }
        }
        current = fallback || (typeof paramsOrFallback === "string" ? paramsOrFallback : path);
        break;
      }
    }

    if (typeof current !== "string") {
      return typeof paramsOrFallback === "string" && paramsOrFallback ? paramsOrFallback : path;
    }

    // String interpolation for {{param}}
    if (typeof paramsOrFallback === "object" && paramsOrFallback !== null) {
      let interpolated = current;
      for (const [pKey, pVal] of Object.entries(paramsOrFallback)) {
        interpolated = interpolated.replace(new RegExp(`{{\\s*${pKey}\\s*}}`, "g"), String(pVal));
      }
      return interpolated;
    }

    return current;
  }, [language]);

  const value = {
    language,
    setLanguage,
    t,
    isKhmer: language === "km",
    isEnglish: language === "en"
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export const useTranslation = () => {
  return useLanguage();
};

export default LanguageContext;
