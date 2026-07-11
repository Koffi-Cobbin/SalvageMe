import type { Config } from "tailwindcss";

// SalvageMe design tokens.
// Palette rationale: warm terracotta as the primary action color (community,
// hand-off, warmth) paired with a deep moss green for trust/success states
// and a soft sand/paper background family instead of stark white/gray.
// Explicitly avoids Tailwind's default indigo/blue-500 "AI app" palette.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          50: "#FDFBF7",
          100: "#FAF5EC",
          200: "#F3EAD9",
          300: "#E9DBC0",
        },
        ink: {
          700: "#3A342C",
          800: "#2A251F",
          900: "#1D1A15",
        },
        terracotta: {
          50: "#FDF1EC",
          100: "#FADFD3",
          300: "#EFA688",
          500: "#D9683F", // primary
          600: "#C05530",
          700: "#9C4325",
        },
        moss: {
          50: "#F0F5EC",
          100: "#DCEAD0",
          300: "#A9C990",
          500: "#5F8B4C", // success / verified
          600: "#4A6E3B",
        },
        clay: {
          50: "#FBF0E8",
          400: "#E0956B",
          600: "#B5623A",
        },
        amber: {
          100: "#FCEFCB",
          500: "#D9A441", // pending state
          700: "#9C7623",
        },
        rose: {
          100: "#FBE4E0",
          500: "#C24B3E", // error / claimed-elsewhere
          700: "#8F2F26",
        },
      },
      fontFamily: {
        display: ["'Source Serif 4'", "Georgia", "serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-lg": ["3rem", { lineHeight: "1.1", fontWeight: "600" }],
        "display-md": ["2.25rem", { lineHeight: "1.15", fontWeight: "600" }],
        "display-sm": ["1.75rem", { lineHeight: "1.2", fontWeight: "600" }],
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        card: "0 2px 10px rgba(29, 26, 21, 0.06)",
        cardHover: "0 6px 20px rgba(29, 26, 21, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
