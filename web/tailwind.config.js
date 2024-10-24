/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{astro,js,ts,jsx,tsx,md}"],
  theme: {
    fontFamily: {
      sans: ["Hack", "sans-serif"],
      serif: ["Hack", "sans-serif"],
    },
    extend: {
      typography: {
        DEFAULT: {
          css: {
            color: "#333",
            a: {
              color: "#e65e5e",
              "&:hover": {
                color: "#666666",
              },
              "&:visited": {
                color: "#e65e5e",
              },
            },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
