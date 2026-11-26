'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  theme: ThemeMode;
  isDarkTheme: boolean;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  reducedMotionSim: boolean;
  setReducedMotionSim: (enabled: boolean) => void;
  toggleReducedMotionSim: () => void;
}

const THEME_STORAGE_KEY = 'dde_theme_preference_v1';
const MOTION_STORAGE_KEY = 'dde_reduced_motion_sim_v1';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function readClientTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch {
    // Fallback
  }
  return 'light';
}

function readClientReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(MOTION_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize with SSR-safe defaults so server HTML and initial client render match 100%
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [reducedMotionSim, setReducedMotionSimState] = useState<boolean>(false);
  const [hydrated, setHydrated] = useState<boolean>(false);

  // Hydrate persisted preferences from localStorage / matchMedia asynchronously after mount
  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      setThemeState(readClientTheme());
      setReducedMotionSimState(readClientReducedMotion());
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(raf);
  }, []);

  // Sync DOM root classes and localStorage when theme changes after hydration
  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Storage unavailable
    }
  }, [theme, hydrated]);

  // Sync reduced-motion class and localStorage after hydration
  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    if (reducedMotionSim) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    try {
      window.localStorage.setItem(MOTION_STORAGE_KEY, String(reducedMotionSim));
    } catch {
      // Storage unavailable
    }
  }, [reducedMotionSim, hydrated]);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const setReducedMotionSim = useCallback((enabled: boolean) => {
    setReducedMotionSimState(enabled);
  }, []);

  const toggleReducedMotionSim = useCallback(() => {
    setReducedMotionSimState((prev) => !prev);
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDarkTheme: theme === 'dark',
        setTheme,
        toggleTheme,
        reducedMotionSim,
        setReducedMotionSim,
        toggleReducedMotionSim,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
