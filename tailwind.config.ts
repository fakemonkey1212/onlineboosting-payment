import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        "pay-bar": "hsl(var(--pay-bar))",
        "pay-text": "hsl(var(--pay-text))",
        "card-chip": "hsl(var(--card-chip))",
        "card-chip-dark": "hsl(var(--card-chip-dark))",
        "card-chip-line": "hsl(var(--card-chip-line))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "dotRotate1": {
          "0%, 100%": { left: "0px" },
          "25%": { left: "22px" },
          "50%": { left: "44px" },
          "75%": { left: "66px" },
        },
        "dotRotate2": {
          "0%, 100%": { left: "22px" },
          "25%": { left: "44px" },
          "50%": { left: "66px" },
          "75%": { left: "0px" },
        },
        "dotRotate3": {
          "0%, 100%": { left: "44px" },
          "25%": { left: "66px" },
          "50%": { left: "0px" },
          "75%": { left: "22px" },
        },
        "dotRotate4": {
          "0%, 100%": { left: "66px" },
          "25%": { left: "0px" },
          "50%": { left: "22px" },
          "75%": { left: "44px" },
        },
        "dotRotateBtnA": {
          "0%, 100%": { left: "0px" },
          "25%": { left: "12px" },
          "50%": { left: "24px" },
          "75%": { left: "36px" },
        },
        "dotRotateBtnB": {
          "0%, 100%": { left: "12px" },
          "25%": { left: "24px" },
          "50%": { left: "36px" },
          "75%": { left: "0px" },
        },
        "dotRotateBtnC": {
          "0%, 100%": { left: "24px" },
          "25%": { left: "36px" },
          "50%": { left: "0px" },
          "75%": { left: "12px" },
        },
        "dotRotateBtnD": {
          "0%, 100%": { left: "36px" },
          "25%": { left: "0px" },
          "50%": { left: "12px" },
          "75%": { left: "24px" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
