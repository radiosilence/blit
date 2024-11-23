const proseVars = [
  "--tw-prose-body",
  "--tw-prose-headings",
  "--tw-prose-lead",
  "--tw-prose-bold",
  "--tw-prose-counters",
  "--tw-prose-bullets",
  "--tw-prose-hr",
  "--tw-prose-quotes",
  "--tw-prose-quote-borders",
  "--tw-prose-captions",
  "--tw-prose-code",
  "--tw-prose-pre-code",
  "--tw-prose-pre-bg",
  "--tw-prose-th-borders",
  "--tw-prose-td-borders",
];

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
          light: "#ccc",
          mid: "#666666",
          dark: "#333",
        },
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            "--tw-prose-links": theme("colors.brand.DEFAULT"),
            ...proseVars.reduce((acc, key) => ({ ...acc, [key]: "inherit" }), {}),
          },
        },
      }),
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
