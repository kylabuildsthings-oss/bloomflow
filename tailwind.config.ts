import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Brand colors
        primary: {
          DEFAULT: "#87A96B", // sage
          foreground: "#ffffff",
        },
        accent: {
          DEFAULT: "#CC7357", // terracotta
          foreground: "#ffffff",
        },
        parchment: "#F8F4E9", // background
      },
    },
  },
  plugins: [],
};
export default config;
