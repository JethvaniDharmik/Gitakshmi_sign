/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#142033",
        sand: "#f4f1e8",
        clay: "#e3d8c5",
        accent: "#0f766e",
        alert: "#b45309",
      },
      boxShadow: {
        soft: "0 12px 30px rgba(20, 32, 51, 0.08)",
      },
      fontFamily: {
        sans: ["Manrope", "IBM Plex Sans", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};
