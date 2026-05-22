import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#faf8ff",
        "surface-dim": "#d2d9f4",
        "on-tertiary": "#ffffff",
        "surface-bright": "#faf8ff",
        "surface-variant": "#dae2fd",
        "on-tertiary-fixed": "#00201b",
        "on-background": "#131b2e",
        "surface-container-lowest": "#ffffff",
        "secondary-container": "#d8e5e2",
        outline: "#6c7a77",
        "primary-fixed-dim": "#4fdbc8",
        "tertiary-fixed-dim": "#4ddcc6",
        "surface-tint": "#006b5f",
        "secondary-fixed": "#d8e5e2",
        "on-surface": "#131b2e",
        "on-tertiary-fixed-variant": "#005047",
        secondary: "#55615f",
        "on-error-container": "#93000a",
        tertiary: "#006b5e",
        "secondary-fixed-dim": "#bcc9c6",
        "inverse-on-surface": "#eef0ff",
        "on-surface-variant": "#3c4947",
        "inverse-primary": "#4fdbc8",
        "surface-container": "#eaedff",
        "on-primary-fixed": "#00201c",
        background: "#faf8ff",
        "surface-container-low": "#f2f3ff",
        "on-error": "#ffffff",
        "tertiary-fixed": "#6ef9e2",
        "outline-variant": "#bbcac6",
        "on-tertiary-container": "#00423a",
        "tertiary-container": "#09b8a4",
        "surface-container-high": "#e2e7ff",
        "on-secondary-fixed": "#121e1c",
        primary: "#006b5f",
        "primary-fixed": "#71f8e4",
        "primary-container": "#14b8a6",
        "surface-container-highest": "#dae2fd",
        "on-secondary-fixed-variant": "#3d4947",
        "on-primary-fixed-variant": "#005048",
        "on-primary": "#ffffff",
        "on-primary-container": "#00423b",
        error: "#ba1a1a",
        "on-secondary-container": "#5b6765",
        "on-secondary": "#ffffff",
        "inverse-surface": "#283044",
        "error-container": "#ffdad6"
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        full: "9999px"
      },
      spacing: {
        gutter: "1.5rem",
        base: "4px",
        "card-padding": "1.5rem",
        "container-padding": "2rem",
        "section-gap": "4rem"
      },
      fontFamily: {
        "headline-xl": ["Inter", "sans-serif"],
        "body-md": ["Inter", "sans-serif"],
        "headline-lg-mobile": ["Inter", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        "mono-data": ["Inter", "sans-serif"],
        "label-caps": ["Inter", "sans-serif"],
        "headline-md": ["Inter", "sans-serif"],
        "headline-lg": ["Inter", "sans-serif"]
      },
      fontSize: {
        "headline-xl": [
          "48px",
          {
            lineHeight: "56px",
            letterSpacing: "-0.02em",
            fontWeight: "700"
          }
        ],
        "body-md": [
          "16px",
          {
            lineHeight: "24px",
            fontWeight: "400"
          }
        ],
        "headline-lg-mobile": [
          "28px",
          {
            lineHeight: "36px",
            fontWeight: "600"
          }
        ],
        "body-lg": [
          "18px",
          {
            lineHeight: "28px",
            fontWeight: "400"
          }
        ],
        "mono-data": [
          "14px",
          {
            lineHeight: "20px",
            letterSpacing: "0.02em",
            fontWeight: "500"
          }
        ],
        "label-caps": [
          "12px",
          {
            lineHeight: "16px",
            letterSpacing: "0.05em",
            fontWeight: "700"
          }
        ],
        "headline-md": [
          "24px",
          {
            lineHeight: "32px",
            fontWeight: "600"
          }
        ],
        "headline-lg": [
          "32px",
          {
            lineHeight: "40px",
            letterSpacing: "-0.01em",
            fontWeight: "600"
          }
        ]
      },
      boxShadow: {
        glass: "0 20px 45px -25px rgba(19, 27, 46, 0.25)",
        soft: "0 14px 38px -20px rgba(19, 27, 46, 0.22)"
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(135deg, #14b8a6 0%, #dae2fd 100%)"
      }
    }
  },
  plugins: []
};

export default config;
