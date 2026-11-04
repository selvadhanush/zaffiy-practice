import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { ink: "#060606", bone: "#EDE8E0", rose: "#C9A05C" },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      letterSpacing: { label: "0.28em" },
      transitionTimingFunction: { lux: "cubic-bezier(0.22, 0.61, 0.36, 1)" },
    },
  },
  plugins: [],
} satisfies Config;
