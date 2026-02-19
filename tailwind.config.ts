import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Warm Neutrals — primary surface palette */
        warm: {
          50: "#FEFDFB", 100: "#FAF9F6", 200: "#F5F3EF", 300: "#EDEBE6",
          400: "#D8D5CE", 500: "#B5B0A6", 600: "#8A8478", 700: "#6B6560",
          800: "#4A453F", 900: "#2A2622", 950: "#1A1816",
        },
        /* Ink — dark authority frame (nav/footer) */
        ink: {
          50: "#F5F5F5", 100: "#E5E5E5", 200: "#CCCCCC", 300: "#A3A3A3",
          400: "#737373", 500: "#525252", 600: "#3D3D3D", 700: "#2E2E2E",
          800: "#1F1F1F", 900: "#1A1A1A", 950: "#0F0F0F",
        },
        /* Navy — alias to ink for backward compat (remove later) */
        navy: {
          50: "#F5F5F5", 100: "#E5E5E5", 200: "#CCCCCC", 300: "#A3A3A3",
          400: "#737373", 500: "#525252", 600: "#3D3D3D", 700: "#2E2E2E",
          800: "#1F1F1F", 900: "#1A1A1A", 950: "#0F0F0F",
        },
        /* Teal-Green (Ship) — anchor #0D9669 at 600 */
        ship: {
          50: "#ECFDF5", 100: "#D1FAE5", 200: "#A7F3D0", 300: "#6EE7B7",
          400: "#34D399", 500: "#10B981", 600: "#0D9669", 700: "#047857",
          800: "#065F46", 900: "#064E3B", 950: "#022C22",
        },
        /* Coral-Red (Skip) — anchor #DC4A4A at 500 */
        skip: {
          50: "#FEF2F2", 100: "#FEE2E2", 200: "#FECACA", 300: "#FCA5A5",
          400: "#F87171", 500: "#DC4A4A", 600: "#C53030", 700: "#9B2C2C",
          800: "#822727", 900: "#6B2121", 950: "#3B0D0D",
        },
        /* Warm Amber (Wait) — anchor #D97C0A at 600 */
        wait: {
          50: "#FFFBEB", 100: "#FEF3C7", 200: "#FDE68A", 300: "#FCD34D",
          400: "#FBBF24", 500: "#F59E0B", 600: "#D97C0A", 700: "#B45309",
          800: "#92400E", 900: "#78350F", 950: "#451A03",
        },
        /* Blue (Data) */
        data: {
          50: "#EFF6FF", 100: "#DBEAFE", 200: "#BFDBFE", 300: "#93C5FD",
          400: "#60A5FA", 500: "#3B82F6", 600: "#2563EB", 700: "#1D4ED8",
          800: "#1E40AF", 900: "#1E3A8A", 950: "#172554",
        },
        /* Purple (Whale) */
        whale: {
          50: "#F5F3FF", 100: "#EDE9FE", 200: "#DDD6FE", 300: "#C4B5FD",
          400: "#A78BFA", 500: "#8B5CF6", 600: "#7C3AED", 700: "#6D28D9",
          800: "#5B21B6", 900: "#4C1D95", 950: "#2E1065",
        },
        /* Override neutral with Stone (warm undertone) */
        neutral: {
          50: "#FAFAF9", 100: "#F5F5F4", 200: "#E7E5E4", 300: "#D6D3D1",
          400: "#A8A29E", 500: "#78716C", 600: "#57534E", 700: "#44403C",
          800: "#292524", 900: "#1C1917", 950: "#0C0A09",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Cascadia Mono", "Consolas", "monospace"],
      },
      boxShadow: {
        "glow-ship": "0 0 20px rgba(13, 150, 105, 0.15), 0 0 6px rgba(13, 150, 105, 0.10)",
        "glow-skip": "0 0 20px rgba(220, 74, 74, 0.15), 0 0 6px rgba(220, 74, 74, 0.10)",
        "glow-wait": "0 0 20px rgba(217, 124, 10, 0.15), 0 0 6px rgba(217, 124, 10, 0.10)",
        "glow-whale": "0 0 20px rgba(139, 92, 246, 0.15), 0 0 6px rgba(139, 92, 246, 0.10)",
        "warm-sm": "0 1px 2px 0 rgba(60, 50, 40, 0.05)",
        "warm-md": "0 4px 6px -1px rgba(60, 50, 40, 0.05), 0 2px 4px -1px rgba(60, 50, 40, 0.03)",
        "warm-lg": "0 10px 15px -3px rgba(60, 50, 40, 0.05), 0 4px 6px -2px rgba(60, 50, 40, 0.02)",
        "warm-xl": "0 20px 25px -5px rgba(60, 50, 40, 0.05), 0 10px 10px -5px rgba(60, 50, 40, 0.02)",
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
