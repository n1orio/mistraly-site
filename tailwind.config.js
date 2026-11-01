/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: { dark: '#121212', card: '#1A1A1A', blue: '#186EF0', cyan: '#5C9DF5' }
      },
      fontFamily: {
        sans: ['Noto Sans', 'Helvetica Neue', 'Arial', 'sans-serif'],
        heading: ['Minecraft Ten', 'Noto Sans', 'sans-serif']
      }
    }
  },
  plugins: []
}
