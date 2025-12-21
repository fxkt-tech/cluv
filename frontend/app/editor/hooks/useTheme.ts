import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const savedTheme = localStorage.getItem("theme") as Theme | null;
  if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
    return savedTheme;
  }
  return "system";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const applyTheme = (isDark: boolean) => {
      const root = document.documentElement;
      if (isDark) {
        root.setAttribute("data-theme", "dark");
        setResolvedTheme("dark");
      } else {
        root.setAttribute("data-theme", "light");
        setResolvedTheme("light");
      }
    };

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      applyTheme(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    } else {
      applyTheme(theme === "dark");
    }
  }, [theme]);

  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return { theme, resolvedTheme, setTheme: changeTheme };
}
