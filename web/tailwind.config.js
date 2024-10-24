/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{astro,js,ts,jsx,tsx,md}"],
  theme: {
    fontFamily: {
      sans: ["Hack", "sans-serif"],
      serif: ["Hack", "sans-serif"],
    },
    extend: {},
  },
  plugins: [require("@tailwindcss/typography")],
};
