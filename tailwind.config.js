/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: { dark: '#0B1A3E', card: '#122A5C', blue: '#2F80FF', cyan: '#6FD0FF' }
      },
      fontFamily: {
        sans: ['Noto Sans', 'Helvetica Neue', 'Arial', 'sans-serif'],
        heading: ['Minecraft Ten', 'Noto Sans', 'sans-serif']
      }
    }
  },
  plugins: []
}
