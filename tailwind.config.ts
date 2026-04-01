import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F8F9FA",
        foreground: "#0A0A0A",
        primary: "#1B4332",
        accent: "#D4AF37",
        danger: "#DC3545",
      },
    },
  },
  plugins: [],
};

export default config;
