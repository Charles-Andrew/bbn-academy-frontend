"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";
import { useThemeStore } from "@/store";

export function useThemeSetup() {
  const { theme, systemTheme } = useTheme();
  const { setResolvedTheme } = useThemeStore();

  useEffect(() => {
    if (theme === "system") {
      setResolvedTheme(systemTheme as "light" | "dark");
    } else {
      setResolvedTheme(theme as "light" | "dark");
    }
  }, [theme, systemTheme, setResolvedTheme]);

  const currentTheme = theme === "system" ? systemTheme : theme;

  return {
    theme,
    systemTheme,
    currentTheme,
    isDark: currentTheme === "dark",
    isLight: currentTheme === "light",
  };
}
