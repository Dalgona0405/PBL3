/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        olive: '#7A8266',    // Xanh rêu nhạt (Màu chủ đạo)
        earth: '#5C634A',    // Xanh rêu đậm (Màu nhấn/Hover)
        cream: '#EAE6DF',    // Be xám nhạt (Màu nền)
        textmain: '#333331', // Xám than (Màu chữ)
      }
    },
  },
  plugins: [],
}