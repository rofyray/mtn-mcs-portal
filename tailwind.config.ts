import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["selector", ".theme-dark"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
