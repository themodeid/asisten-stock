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
        // GitHub Primer Dark Color Palette mapped to zinc so the entire UI inherits the authentic theme
        zinc: {
          50: "#ffffff",
          100: "#f0f6fc", // GitHub FG Default (Crisp Headings)
          200: "#e6edf3", // GitHub FG High Contrast
          300: "#c9d1d9", // GitHub FG Body Text
          400: "#8b949e", // GitHub FG Muted
          500: "#8b949e", // GitHub FG Muted
          600: "#6e7681", // GitHub FG Subtle
          700: "#484f58", // GitHub Border Hover
          750: "#38404a",
          800: "#30363d", // GitHub Border Default
          850: "#21262d", // GitHub Canvas Inset / Secondary Button
          900: "#161b22", // GitHub Box / Canvas Subtle
          950: "#0d1117", // GitHub Canvas Default
        },
        // Dedicated GitHub Primer tokens
        gh: {
          bg: "#0d1117",
          card: "#161b22",
          inset: "#010409",
          border: "#30363d",
          borderMuted: "#21262d",
          borderActive: "#58a6ff",
          text: "#f0f6fc",
          muted: "#8b949e",
          subtle: "#6e7681",
          blue: "#58a6ff",
          green: "#3fb950",
          btnGreen: "#238636",
          btnGreenHover: "#2ea043",
          btnGray: "#21262d",
          btnGrayHover: "#30363d",
          red: "#f85149",
          orange: "#f78166",
          yellow: "#d29922",
          purple: "#a371f7",
        },
        terminal: {
          bg: "#0d1117",
          card: "#161b22",
          surface: "#21262d",
          border: "#30363d",
          borderHover: "#8b949e",
        },
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          400: "#58a6ff",
          500: "#1f6feb",
          600: "#238636", // Primary buttons adopt iconic GitHub Green!
          700: "#2ea043",
        },
        accent: {
          gold: "#d29922",
          goldLight: "#e3b341",
          cyan: "#58a6ff",
          jade: "#3fb950",
          coral: "#f85149",
        },
      },
      borderRadius: {
        'gh': '6px',
      },
      backdropBlur: {
        "2xl": "40px",
        "3xl": "64px",
      },
      boxShadow: {
        "subtle": "0 1px 0 rgba(27, 31, 36, 0.04)",
        "card": "none",
        "gh-btn": "0 1px 0 rgba(27, 31, 36, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.03)",
        "gh-box": "0 0 0 1px #30363d",
        "glass": "none",
        "glass-hover": "none",
        "glass-glow-emerald": "none",
        "glass-glow-blue": "none",
        "glass-glow-amber": "none",
        "glass-glow-rose": "none",
      },
    },
  },
  plugins: [],
};
