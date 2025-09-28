import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./styles/**/*.{ts,tsx,css}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#05060b",
        foreground: "#f5f7ff",
        border: "rgba(255,255,255,0.14)",
        neon: {
          cyan: "#00f0ff",
          magenta: "#ff4ecd"
        }
      },
      backgroundImage: {
        "jarvis-noise":
          "radial-gradient(circle at 20% 20%, rgba(0,240,255,0.08), transparent 60%), radial-gradient(circle at 80% 30%, rgba(255,78,205,0.08), transparent 55%)"
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", ...fontFamily.sans]
      },
      boxShadow: {
        glass: "inset 0 0 1px rgba(255,255,255,0.3)",
        "neon-ring": "0 0 24px rgba(0,240,255,0.35)"
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};

export default config;
