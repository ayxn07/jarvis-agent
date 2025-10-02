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
          // Base hues set to greener cyan + vibrant magenta
          cyan: "#00D1FF",
          magenta: "#FF00B0",
          // Variants reflect provided palette spectrum
          cyanLight: "#00D1FF",
          cyanDark: "#0085FF",
          cyanMid: "#00ABFF",
          magentaLight: "#FF00E6",
          magentaDark: "#FF007A"
        }
      },
      backgroundImage: {
        "jarvis-noise":
          "radial-gradient(circle at 20% 20%, rgba(0,209,255,0.10), transparent 60%), radial-gradient(circle at 80% 30%, rgba(255,0,176,0.12), transparent 55%)"
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", ...fontFamily.sans]
      },
      boxShadow: {
        glass: "inset 0 0 1px rgba(255,255,255,0.3)",
        // Use greener cyan for default neon ring shadow
        "neon-ring": "0 0 24px rgba(0,209,255,0.35)"
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};

export default config;
