/** @type {import('tailwindcss').Config} */
export default {
  content: ["./*.html", "./data/**/*.js"],
  theme: {
    extend: {
      colors: {
        brand: {
          black: "#111827",
          dark: "#1f2937",
          muted: "#4b5563",
          subtle: "#6b7280",
          border: "#e5e7eb",
          light: "#f9fafb",
          surface: "#ffffff",
          copper: "#a36735",
          terracotta: "#8c4a24",
          gold: "#c59b6d"
        }
      },
      fontFamily: {
        display: ['"Playfair Display"', "Georgia", "serif"],
        serif: ['"Playfair Display"', "Georgia", "serif"],
        sans: ['"Plus Jakarta Sans"', "-apple-system", "BlinkMacSystemFont", "sans-serif"]
      },
      boxShadow: {
        card: "0 2px 10px rgba(0, 0, 0, 0.04)",
        lift: "0 12px 30px rgba(0, 0, 0, 0.08)"
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        sm: "0.125rem",
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
        card: "0.5rem",
        pill: "9999px"
      }
    }
  }
};
