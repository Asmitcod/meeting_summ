/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        ink: {
          950: "#090a0d",
          900: "#101217",
          850: "#161920",
          800: "#1d212b",
          750: "#262b38",
          700: "#32384a",
          600: "#464e65",
          500: "#606b88",
          400: "#8b96b2",
          300: "#b5bfd6",
          200: "#dbe2f0",
          100: "#f3f6fc",
        },
        teal: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
          950: "#042f2e",
        },
        accent: {
          DEFAULT: "#0d9488",
          hover: "#14b8a6",
          active: "#0f766e",
          light: "#2dd4bf",
          glow: "rgba(13, 148, 136, 0.18)",
          subtle: "rgba(13, 148, 136, 0.08)",
        },
      },
      boxShadow: {
        'glow': '0 0 20px -3px rgba(20, 184, 166, 0.22)',
        'subtle': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
};
