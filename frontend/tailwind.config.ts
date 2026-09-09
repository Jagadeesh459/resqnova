import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./dashboard/**/*.{ts,tsx}",
    "./citizen/**/*.{ts,tsx}",
    "./rescue/**/*.{ts,tsx}",
    "./ambulance/**/*.{ts,tsx}",
    "./shelter/**/*.{ts,tsx}",
    "./settings/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--color-background) / <alpha-value>)",
        secondary: "rgb(var(--color-secondary) / <alpha-value>)",
        card: "rgb(var(--color-card) / <alpha-value>)",
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        success: "rgb(var(--color-success) / <alpha-value>)",
        warning: "rgb(var(--color-warning) / <alpha-value>)",
        danger: "rgb(var(--color-danger) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        text: "rgb(var(--color-text) / <alpha-value>)",
      },
      fontFamily: {
        heading: ["var(--font-poppins)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      boxShadow: {
        glass: "0 18px 60px rgba(0, 0, 0, 0.35)",
        glow: "0 0 0 1px rgba(0, 212, 255, 0.22), 0 0 28px rgba(0, 212, 255, 0.18)",
        neon: "0 0 24px rgba(0, 212, 255, 0.35)",
      },
      backgroundImage: {
        "radial-grid":
          "radial-gradient(circle at top, rgba(0, 212, 255, 0.14), transparent 28%), linear-gradient(180deg, rgba(13, 23, 38, 0.22), rgba(7, 17, 31, 0.88))",
      },
      keyframes: {
        "pulse-soft": {
          "0%, 100%": { opacity: "0.72", transform: "translateY(0px)" },
          "50%": { opacity: "1", transform: "translateY(-2px)" },
        },
      },
      animation: {
        "pulse-soft": "pulse-soft 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
