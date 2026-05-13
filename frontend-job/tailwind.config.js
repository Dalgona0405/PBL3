/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FAF9F6',     // Màu nền kem ấm áp (Màu nền chính)
        olive: '#8A9A86',     // Xanh lá mạ dịu nhẹ (Màu chủ đạo)
        earth: '#C19A6B',     // Nâu đất ấm áp (Màu nhấn, nút bấm)
        textmain: '#4A4A4A',  // Xám đậm (Dùng cho chữ để đọc không bị chói như màu đen tuyền)
      },
      // ĐỊNH NGHĨA FONT CHỮ
      fontFamily: {
        sans: ['Nunito', 'sans-serif'], // Font chữ bo tròn, thân thiện, chuẩn Omotenashi
      }
    },
  },
  plugins: [],
}