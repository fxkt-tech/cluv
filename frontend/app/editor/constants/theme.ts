/**
 * Theme Constants
 * Centralized theme configuration for consistent styling
 */

export const COLORS = {
  editor: {
    bg: "#1e1e1e",
    border: "#2b2b2b",
    dark: "#111",
    hover: "#333",
    panel: "#252525",
    light: "#444",
  },
  accent: {
    cyan: "cyan",
    green: "green",
  },
  text: {
    primary: "text-gray-300",
    secondary: "text-neutral-500",
    light: "text-neutral-400",
    white: "text-white",
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
