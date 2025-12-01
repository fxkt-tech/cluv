/**
 * Theme Constants - Tokyo Night Light
 * Centralized theme configuration for consistent styling
 * Based on the Tokyo Night Light color scheme
 */

export const COLORS = {
  // Tokyo Night Light base colors
  editor: {
    bg: "#d5d6db",           // Light grayish background
    bgAlt: "#e9e9ed",        // Alternative lighter background
    panel: "#e9e9ed",        // Panel background
    border: "#c1c2c7",       // Border color - subtle gray
    dark: "#0f0f14",         // Very dark (for preview window)
    hover: "#c4c8da",        // Hover state
    light: "#a8aecb",        // Light accent
  },

  // Tokyo Night Light accent colors
  accent: {
    blue: "#2e7de9",         // Primary blue
    cyan: "#007197",         // Cyan/teal
    magenta: "#9854f1",      // Purple/magenta
    green: "#587539",        // Green
    red: "#f52a65",          // Red
    orange: "#b15c00",       // Orange
    yellow: "#8c6c3e",       // Yellow/gold
  },

  // Text colors
  text: {
    primary: "#3760bf",      // Primary text (blue)
    secondary: "#6172b0",    // Secondary text
    tertiary: "#848cb5",     // Tertiary text
    muted: "#9699a3",        // Muted text
    fg: "#343b58",           // Foreground text
    fgDark: "#0f0f14",       // Dark foreground
  },
};

export const SIZES = {
  header: "h-8",
  playerControls: "h-12",
  timelineToolbar: "h-10",
  timeline: "h-[300px]",
  sidebar: "w-[340px]",
  propertiesPanel: "w-[280px]",
  trackHeader: "w-32",
};

export const SPACING = {
  xs: "px-2 py-1",
  sm: "px-3 py-1.5",
  md: "px-4 py-2",
  lg: "px-4 py-4",
};

export const TRANSITIONS = {
  colors: "transition-colors",
  all: "transition-all",
};

export const BORDERS = {
  thin: "border-[1px]",
  separator: `border-[${COLORS.editor.border}]`,
};
