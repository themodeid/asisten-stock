/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        zinc: {
          750: "#1e293b",
          850: "#131a2b",
          950: "#07090e",
        },
        terminal: {
          bg: "#07090e",
          card: "#0e1322",
          surface: "#13192c",
          border: "rgba(255, 255, 255, 0.08)",
          borderHover: "rgba(255, 255, 255, 0.20)",
        },
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        accent: {
          gold: "#f59e0b",
          goldLight: "#fbbf24",
          cyan: "#06b6d4",
          jade: "#10b981",
          coral: "#f43f5e",
        },
      },
      backdropBlur: {
        "2xl": "40px",
        "3xl": "64px",
      },
      boxShadow: {
        "glass": "0 8px 32px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
        "glass-hover": "0 16px 48px -8px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        "glass-glow-emerald": "0 0 20px rgba(16, 185, 129, 0.3)",
        "glass-glow-blue": "0 0 20px rgba(59, 130, 246, 0.3)",
        "glass-glow-amber": "0 0 20px rgba(245, 158, 11, 0.3)",
        "glass-glow-rose": "0 0 20px rgba(244, 63, 94, 0.3)",
      },
    },
  },
  plugins: [],
};
