"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    // Read persisted theme or fall back to system
    try {
      const savedTheme = localStorage.getItem("theme") as Theme | null;
      if (savedTheme === "light" || savedTheme === "dark") {
        setThemeState(savedTheme);
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(savedTheme);
      } else {
        // Default to dark mode as it's the primary theme
        localStorage.setItem("theme", "dark");
        setThemeState("dark");
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add("dark");
      }
    } catch (e) {
      console.error("Failed to load theme from localStorage", e);
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem("theme", newTheme);
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(newTheme);
    } catch (e) {
      console.error("Failed to persist theme", e);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
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
