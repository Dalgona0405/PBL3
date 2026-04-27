/** @type {import('tailwindcss').Config} */
export default {
  content:[
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        olive: '#8E9775',
        earth: '#D4A373',
        cream: '#faf9f6',
        textMain: '#4A4A4A'
      }
    },
  },
  plugins: [],
}