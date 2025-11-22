/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        emeralddark: "#01211D",
        goldsoft: "#D4AF37",
      },
      boxShadow: {
        goldglow: "0 0 10px rgba(212, 175, 55, 0.45)",
      },
    },
  },
  plugins: [],
}
