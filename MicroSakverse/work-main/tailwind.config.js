/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#2563EB",     // Main AI Blue
          primaryDark: "#3B82F6",
          accent: "#4F46E5",      // Indigo AI Accent
          accentDark: "#818CF8",
        },

        ui: {
          background: "#F5F7FA",
          backgroundDark: "#0F172A",

          surface: "#FFFFFF",
          surfaceDark: "#1E293B",

          navbar: "#FFFFFF",
          navbarDark: "#111827",

          border: "#E2E8F0",
          borderDark: "#334155",

          text: "#0F172A",
          textDark: "#F1F5F9",

          muted: "#64748B",
          mutedDark: "#94A3B8",
        },
      },
    },
  },
  plugins: [],
};