import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#F1F4F9", 100: "#E0E7F1", 200: "#C2CEE3", 300: "#96A8CC",
          400: "#6A82B2", 500: "#4A6499", 600: "#384D7A", 700: "#2B3B5E",
          800: "#1A2743", 900: "#0A1628", 950: "#050B14",
        },
        ship: {
          50: "#ECFDF4", 100: "#D1FAE5", 200: "#A7F3CF", 300: "#6EE7AD",
          400: "#34D985", 500: "#00D26A", 600: "#00A854", 700: "#008743",
          800: "#066B37", 900: "#08572E", 950: "#023019",
        },
        skip: {
          50: "#FFF1F3", 100: "#FFE0E4", 200: "#FFC7CE", 300: "#FF9EAC",
          400: "#FF3B5C", 500: "#F01235", 600: "#D0072A", 700: "#A90C24",
          800: "#8C1023", 900: "#781323", 950: "#42040E",
        },
        wait: {
          50: "#FFFBEB", 100: "#FEF3C7", 200: "#FDE68A", 300: "#FCD34D",
          400: "#FBBD23", 500: "#FFB800", 600: "#D99706", 700: "#B17309",
          800: "#8F5A0E", 900: "#764812", 950: "#432606",
        },
        data: {
          50: "#EFF6FF", 100: "#DBEAFE", 200: "#BFDBFE", 300: "#93C5FD",
          400: "#60A5FA", 500: "#3B82F6", 600: "#2563EB", 700: "#1D4ED8",
          800: "#1E40AF", 900: "#1E3A8A", 950: "#172554",
        },
        whale: {
          50: "#F5F3FF", 100: "#EDE9FE", 200: "#DDD6FE", 300: "#C4B5FD",
          400: "#A78BFA", 500: "#8B5CF6", 600: "#7C3AED", 700: "#6D28D9",
          800: "#5B21B6", 900: "#4C1D95", 950: "#2E1065",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Cascadia Mono", "Consolas", "monospace"],
      },
      boxShadow: {
        "glow-ship": "0 0 20px rgba(0, 210, 106, 0.15), 0 0 6px rgba(0, 210, 106, 0.1)",
        "glow-skip": "0 0 20px rgba(255, 59, 92, 0.15), 0 0 6px rgba(255, 59, 92, 0.1)",
        "glow-wait": "0 0 20px rgba(255, 184, 0, 0.15), 0 0 6px rgba(255, 184, 0, 0.1)",
        "glow-whale": "0 0 20px rgba(139, 92, 246, 0.15), 0 0 6px rgba(139, 92, 246, 0.1)",
      },
      borderRadius: {
        pill: "9999px",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-up": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "scale-in": { from: { opacity: "0", transform: "scale(0.95)" }, to: { opacity: "1", transform: "scale(1)" } },
        "pulse-glow": { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.7" } },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "slide-up": "slide-up 300ms ease-out",
        "scale-in": "scale-in 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
