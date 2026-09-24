import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        obsidian: "#0a0a0a",
        "matte-black": "#121212",
        "matte-card": "#181818",
        "matte-border": "#262626",
        platinum: "#E5E4E2",
        champagne: "#D4AF37",
        "gold-hover": "#F3E5AB",
        "sand-neutral": "#C5A880",
        charcoal: "#1F1F1F",
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "float": "float 6s ease-in-out infinite",
        "pulse-subtle": "pulseSubtle 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "luxury-glow":
          "radial-gradient(circle at 50% 0%, rgba(212, 175, 55, 0.08) 0%, rgba(10, 10, 10, 0) 70%)",
      },
    },
  },
  plugins: [],
};

export default config;
