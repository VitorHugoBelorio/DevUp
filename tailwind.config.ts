import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        surface: "#020617",
        panel: "#07111F",
        line: "#132033",
        hover: "#0B1B2F",
        cyanGlow: "#2563EB",
        skyGlow: "#60A5FA"
      },
      boxShadow: {
        glow: "0 0 34px rgba(37, 99, 235, 0.22)",
        soft: "0 24px 72px rgba(0, 0, 0, 0.38)"
      }
    }
  },
  plugins: []
};

export default config;
