"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";

export type DashboardTheme = "light" | "dark";

const STORAGE_KEY = "dala-dashboard-theme";

type DashboardThemeContextValue = {
  theme: DashboardTheme;
  setTheme: (t: DashboardTheme) => void;
  toggle: () => void;
};

const DashboardThemeContext = createContext<DashboardThemeContextValue | null>(null);

export function DashboardThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<DashboardTheme>("light");
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY) as DashboardTheme | null;
      if (v === "dark" || v === "light") setThemeState(v);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const setTheme = useCallback((t: DashboardTheme) => {
    setThemeState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    setThemeState((t) => {
      const next: DashboardTheme = t === "light" ? "dark" : "light";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value: DashboardThemeContextValue = {
    theme: ready ? theme : "light",
    setTheme,
    toggle,
  };

  const isDark = value.theme === "dark";

  return (
    <DashboardThemeContext.Provider value={value}>
      <div
        className={`dashboard-root min-h-screen bg-[#f8fafc] text-[#0f172a] text-[15px] leading-[1.6] transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100 ${
          isDark ? "dark" : ""
        }`}
        suppressHydrationWarning
      >
        {children}
      </div>
    </DashboardThemeContext.Provider>
  );
}

export function useDashboardTheme() {
  const ctx = useContext(DashboardThemeContext);
  if (!ctx) {
    throw new Error("useDashboardTheme must be used within DashboardThemeProvider");
  }
  return ctx;
}
