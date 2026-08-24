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
          950: "#0b0d11",
          900: "#11141a",
          850: "#171a22",
          800: "#1e222d",
          750: "#272c3a",
          700: "#32394a",
          600: "#495267",
          500: "#64708a",
          400: "#8f9cb3",
          300: "#b4bfd3",
          200: "#d9e1ee",
          100: "#f1f4fa",
        },
        copper: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
        },
        accent: {
          DEFAULT: "#e87a42",
          hover: "#f38a53",
          active: "#d96b34",
          glow: "rgba(232, 122, 66, 0.18)",
          subtle: "rgba(232, 122, 66, 0.08)",
        },
      },
      boxShadow: {
        'glow': '0 0 25px -5px rgba(232, 122, 66, 0.25)',
        'subtle': '0 4px 20px -2px rgba(0, 0, 0, 0.45)',
      }
    },
  },
  plugins: [],
};
