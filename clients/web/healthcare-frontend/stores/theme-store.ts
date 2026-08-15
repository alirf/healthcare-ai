"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemeState {
  theme: "light" | "dark" | "system";
  isDark: boolean;
  setTheme: (theme: "light" | "dark" | "system") => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "system",
      isDark: false,
      setTheme: (theme) => {
        const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
        set({ theme, isDark });
        document.documentElement.classList.toggle("dark", isDark);
      },
      toggleTheme: () => {
        const newTheme = get().isDark ? "light" : "dark";
        get().setTheme(newTheme);
      },
    }),
    {
      name: "healthcare-theme",
      onRehydrateStorage: () => (state) => {
        if (state) {
          const isDark = state.theme === "dark" || (state.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
          document.documentElement.classList.toggle("dark", isDark);
        }
      },
    }
  )
);