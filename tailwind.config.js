/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        water: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          300: '#7dd3fc',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          900: '#0c4a6e',
        },
        sand: {
          50:  '#fdf8f0',
          100: '#faeed8',
          200: '#f4dba8',
          400: '#e0a85a',
          600: '#9c6b1f',
        },
      },
    },
  },
  plugins: [],
}
