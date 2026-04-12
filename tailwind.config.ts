import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        display: ["var(--font-cinzel-decorative)", "serif"],
        heading: ["var(--font-cinzel)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
        norse: ["var(--font-norse)", "serif"],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
          hover: "hsl(var(--card-hover))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          dark: "hsl(var(--primary-dark))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        gold: "hsl(var(--gold))",
        ember: "hsl(var(--ember))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        /** Same as fade-in-up but preserves translate(-50%,-50%) for fixed centering (e.g. Dialog). */
        "dialog-fade-in-up": {
          from: { opacity: "0", transform: "translate(-50%, calc(-50% + 10px))" },
          to: { opacity: "1", transform: "translate(-50%, -50%)" },
        },
        "float-up": {
          "0%": { opacity: "1", transform: "translateY(0) scale(1)" },
          "100%": { opacity: "0", transform: "translateY(-60px) scale(1.3)" },
        },
        "ember-glow": {
          "0%, 100%": { boxShadow: "0 0 20px hsl(var(--primary) / 0.4)" },
          "50%": { boxShadow: "0 0 30px hsl(var(--primary) / 0.7)" },
        },
        "level-up-scale": {
          "0%": { opacity: "0", transform: "scale(0.5)" },
          "50%": { opacity: "1", transform: "scale(1.1)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(100%)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "quest-flash": {
          "0%": { opacity: "0", transform: "scale(0.6)" },
          "20%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(1.2)" },
        },
        "rune-spotlight": {
          "0%, 100%": {
            boxShadow:
              "0 0 0 9999px rgba(0,0,0,0.75), 0 0 15px hsl(var(--gold) / 0.4), inset 0 0 10px hsl(var(--gold) / 0.1)",
          },
          "50%": {
            boxShadow:
              "0 0 0 9999px rgba(0,0,0,0.75), 0 0 22px hsl(var(--gold) / 0.55), inset 0 0 14px hsl(var(--gold) / 0.15)",
          },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "fade-in-up": "fade-in-up 0.4s ease-out",
        "dialog-fade-in-up": "dialog-fade-in-up 0.4s ease-out",
        "float-up": "float-up 1.5s ease-out forwards",
        "ember-glow": "ember-glow 2s ease-in-out infinite",
        "level-up-scale": "level-up-scale 0.6s ease-out",
        "slide-in-right": "slide-in-right 0.4s ease-out",
        "shimmer": "shimmer 3s linear infinite",
        "quest-flash": "quest-flash 1.4s ease-out forwards",
        "rune-spotlight": "rune-spotlight 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
