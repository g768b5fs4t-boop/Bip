import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0f5c5c",
          deep: "#0a3d3e",
          soft: "#e7f2f2",
        },
        ink: "#0b1f24",
        muted: "#5b6b73",
        accent: "#c45c26",
        line: "#d5e0e6",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 10px 40px -20px rgba(15, 61, 62, 0.35)",
      },
    },
  },
  plugins: [],
} satisfies Config;
