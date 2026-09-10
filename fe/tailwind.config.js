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
          850: "#111827",
          950: "#0b0f19",
        },
        terminal: {
          bg: "#0b0f19",
          card: "#0f172a",
          surface: "#131d33",
          border: "rgba(51, 65, 85, 0.5)",
          borderHover: "rgba(96, 165, 250, 0.4)",
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
    },
  },
  plugins: [],
};
