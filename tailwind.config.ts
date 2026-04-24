import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

/**
 * Tailwind est volontairement restreint au sous-arbre /app/momentum/v2
 * et aux composants UI shadcn-like de `components/ui/`. Le reste de
 * Campaign Studio reste en inline-styles et ne doit pas être repris
 * par le scanner Tailwind.
 */
const config: Config = {
  content: [
    "./app/momentum/**/*.{ts,tsx}",
    "./components/ui/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        // Stratly / Momentum v2 palette
        navy: {
          DEFAULT: "#1B2E4B",
          50: "#f3f5f9",
          100: "#e3e8f1",
          700: "#1B2E4B",
          800: "#142339",
          900: "#0e1a2b",
        },
        // Electric indigo — remplace l'ancien vert accent partout où `accent-*`
        // est utilisé. Les tons matchent Tailwind `indigo-*`, ce qui permet
        // d'employer `indigo-200/300/400` au besoin sans étendre la config.
        accent: {
          DEFAULT: "#6366F1",
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
        },
        canvas: "#F8F9FC",
        ink: {
          DEFAULT: "#1A1A2E",
          muted: "#6B7280",
        },
        border: "#E5E7EB",
        warn: "#F59E0B",
        danger: "#EF4444",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        lg: "12px",
        md: "10px",
        sm: "8px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.08)",
        "card-hover": "0 6px 20px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(0,0,0,0.05)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.35s cubic-bezier(0.16,1,0.3,1) both",
      },
    },
  },
  plugins: [animate],
};

export default config;
