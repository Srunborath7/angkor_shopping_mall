import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem("angkor_theme_preference") || "system";
    } catch {
      return "system";
    }
  });

  const getSystemTheme = useCallback(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  }, []);

  const [resolvedTheme, setResolvedTheme] = useState(() => {
    const saved = localStorage.getItem("angkor_theme_preference") || "system";
    if (saved === "system") {
      return typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return saved;
  });

  // Apply theme attributes to DOM
  const applyTheme = useCallback((effectiveTheme) => {
    document.documentElement.setAttribute("data-theme", effectiveTheme);
    if (effectiveTheme === "dark") {
      document.body.classList.add("dark-theme");
      document.body.classList.remove("light-theme");
    } else {
      document.body.classList.add("light-theme");
      document.body.classList.remove("dark-theme");
    }
  }, []);

  const setTheme = useCallback((newTheme) => {
    const validTheme = ["system", "dark", "light"].includes(newTheme) ? newTheme : "system";
    setThemeState(validTheme);
    try {
      localStorage.setItem("angkor_theme_preference", validTheme);
    } catch (e) {
      console.error(e);
    }

    const effective = validTheme === "system" ? getSystemTheme() : validTheme;
    setResolvedTheme(effective);
    applyTheme(effective);
  }, [applyTheme, getSystemTheme]);

  // Handle system color scheme changes in real-time
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => {
      if (theme === "system") {
        const effective = e.matches ? "dark" : "light";
        setResolvedTheme(effective);
        applyTheme(effective);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    // Initial apply on mount
    const effective = theme === "system" ? (mediaQuery.matches ? "dark" : "light") : theme;
    setResolvedTheme(effective);
    applyTheme(effective);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [theme, applyTheme]);

  const value = {
    theme,
    setTheme,
    resolvedTheme,
    isDark: resolvedTheme === "dark",
    isLight: resolvedTheme === "light",
    isSystem: theme === "system"
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export default ThemeContext;
