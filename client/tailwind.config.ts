import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Subtle slate-based surface palette for the board UI.
        surface: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
