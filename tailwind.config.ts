import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        elevated: "var(--elevated)",
        "border-subtle": "var(--border-subtle)",
        accent: {
          cyan: "#00d4ff",
          green: "#00ff88",
          purple: "#7850ff",
        },
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        warning: "#ffab00",
        error: "#ff4757",
      },
      fontFamily: {
        display: ["var(--font-syne)", "sans-serif"],
        body: ["var(--font-dm-sans)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      animation: {
        "pulse-cyan": "pulse-cyan 2s ease-in-out infinite",
        "pulse-amber": "pulse-amber 2s ease-in-out infinite",
      },
      keyframes: {
        "pulse-cyan": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        "pulse-amber": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
    },
  },
  plugins: [],
}
export default config
