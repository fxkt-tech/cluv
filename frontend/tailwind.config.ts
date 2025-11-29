import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        editor: {
          bg: "#1e1e1e",
          border: "#2b2b2b",
          dark: "#111",
          hover: "#333",
          panel: "#252525",
          light: "#444",
        },
      },
      width: {
        sidebar: "340px",
        "properties-panel": "280px",
        "track-header": "128px",
      },
      height: {
        header: "48px",
        "player-controls": "48px",
        "timeline-toolbar": "40px",
        timeline: "300px",
      },
      spacing: {
        xs: "2px 8px",
        sm: "6px 12px",
        md: "8px 16px",
        lg: "16px 16px",
      },
    },
  },
  plugins: [],
};

export default config;
