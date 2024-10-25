/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{astro,js,ts,jsx,tsx,md}"],
  theme: {
    fontFamily: {
      sans: ["Geist Mono", "sans-serif"],
      serif: ["Geist Mono", "sans-serif"],
    },
    extend: {
      colors: {
        brand: {
          DEFAULT: "#e65e5e",
          light: "#f7d4d4",
          dark: "#333",
        },
      },
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
