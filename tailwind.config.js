/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}','./components/**/*.{ts,tsx}','./lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy:  { DEFAULT:'#0D1E2E', 50:'#EBF3FB', 100:'#C5D9EF', 800:'#0D1E2E' },
        gold:  { DEFAULT:'#C4964A', lt:'#E8C07A' },
        teal:  { DEFAULT:'#1A4D4A' },
        cream: '#F7F2EC',
      },
      fontFamily: { display: ['Georgia','serif'] },
    },
  },
  plugins: [],
}
