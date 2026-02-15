import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef5f1',
          100: '#d7e7df',
          200: '#b0cfc0',
          300: '#88b6a0',
          400: '#5f9d80',
          500: '#2f6f56',
          600: '#174d38',
          700: '#123d2d',
          800: '#0d2c21',
          900: '#081d16',
        },
        accent: {
          50: '#f7eeee',
          100: '#ecd7d7',
          200: '#dab0b0',
          300: '#c78989',
          400: '#b56262',
          500: '#8a3434',
          600: '#6b2323',
          700: '#4d1717',
          800: '#361010',
          900: '#220909',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
