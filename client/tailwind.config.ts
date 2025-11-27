import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      fontFamily: {
        display: ["'Inter'", "system-ui", "sans-serif"],
      },
      colors: {
        hotel: {
          navy: "#0F172A",
          ocean: "#1E3A8A",
          sky: "#38BDF8",
          foam: "#E0F2FE",
          sand: "#F8FAFC",
        },
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      backgroundImage: {
        "hero-texture":
          "radial-gradient(circle at top, rgba(56,189,248,0.15), transparent 60%)",
      },
      boxShadow: {
        soft: "0 10px 40px rgba(15, 23, 42, 0.08)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.45s ease forwards",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;

