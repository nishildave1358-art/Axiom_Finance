const { fontFamily } = require("tailwindcss/defaultTheme");

module.exports = {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        background: "#050608", // Almost Black
        surface: "#111418", // Darker Surface
        primary: {
          DEFAULT: "#CCFF00", // Neon Lime
          hover: "#B3E600",
          glow: "#CCFF00", // Using same for consistency in glows
        },
        text: {
          primary: "#FFFFFF", // Pure White
          secondary: "#9CA3AF", // Cool Gray
        },
        accent: {
          success: "#CCFF00", // Match primary for specific "success" aesthetic in this theme
          danger: "#FF3333", // Bright Red
        },
      },
      borderRadius: {
        DEFAULT: "12px",
        xl: "24px",
        "2xl": "32px",
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
