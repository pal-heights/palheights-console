/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/Components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "var(--primary-color)",
        secondary: "var(--secondary-color)",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Oxygen",
          "Ubuntu",
          "Cantarell",
          "Fira Sans",
          "Droid Sans",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
      keyframes: {
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
        "border-top": {
          "0%": { width: "0%" },
          "100%": { width: "100%" },
        },
        "border-right": {
          "0%": { height: "0%" },
          "100%": { height: "100%" },
        },
        "border-bottom": {
          "0%": { width: "0%" },
          "100%": { width: "100%" },
        },
        "border-left": {
          "0%": { height: "0%" },
          "100%": { height: "100%" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        marqueeReverse: {
          "0%": { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        blob: "blob 7s infinite",
        "border-top": "border-top 1.5s ease-in-out forwards",
        "border-right": "border-right 1.5s ease-in-out forwards",
        "border-bottom": "border-bottom 1.5s ease-in-out forwards",
        "border-left": "border-left 1.5s ease-in-out forwards",

        // ✅ New Marquee Animations
        marquee: "marquee 30s linear infinite",
        "marquee-reverse": "marqueeReverse 30s linear infinite",

        marqueeFast: "marquee 15s linear infinite", // very fast
        marqueeSlow: "marquee 70s linear infinite", // very slow
      },
      transitionProperty: {
        "transform-opacity": "transform, opacity",
      },
      grayscale: {
        50: "50%",
        70: "70%",
      },
      scale: {
        110: "1.10", // +10% zoom for hover logos
      },
    },
  },
  plugins: [],
};
