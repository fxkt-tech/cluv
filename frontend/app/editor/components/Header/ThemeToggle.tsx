/**
 * ThemeToggle Component
 * Theme switching button with dropdown menu
 */

import { useState } from "react";
import { useTheme, Theme } from "../../hooks/useTheme";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const themeOptions: { value: Theme; label: string; icon: string }[] = [
    { value: "light", label: "浅色", icon: "☀️" },
    { value: "dark", label: "深色", icon: "🌙" },
    { value: "system", label: "跟随系统", icon: "💻" },
  ];

  const currentThemeIcon =
    themeOptions.find((opt) => opt.value === theme)?.icon || "💻";

  return (
    <div className="relative">
      <button
        onClick={() => setShowThemeMenu(!showThemeMenu)}
        className="font-medium px-3 py-0.5 rounded text-xs bg-editor-panel text-text-fg hover:bg-editor-hover transition-colors flex items-center gap-1"
        aria-label="Toggle theme"
      >
        <span>{currentThemeIcon}</span>
        <span>主题</span>
      </button>
      {showThemeMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowThemeMenu(false)}
          />
          <div className="absolute right-0 mt-1 w-32 bg-editor-panel border border-editor-border rounded shadow-lg z-20">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setTheme(option.value);
                  setShowThemeMenu(false);
                }}
                className={`w-full px-3 py-2 text-left text-xs hover:bg-editor-hover transition-colors flex items-center gap-2 ${
                  theme === option.value
                    ? "bg-editor-hover text-text-primary"
                    : "text-text-fg"
                }`}
              >
                <span>{option.icon}</span>
                <span>{option.label}</span>
                {theme === option.value && <span className="ml-auto">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
