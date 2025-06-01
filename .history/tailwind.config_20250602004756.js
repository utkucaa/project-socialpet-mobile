/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        'purple-300': '#AB75C2',
        'purple-400': '#9B6BB0',
        'orange-300': '#FFB347',
      }
    },
  },
  plugins: [],
}

