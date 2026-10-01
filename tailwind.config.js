/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: { dark: '#0A0B0E', card: '#2B2B2B', blue: '#0080FF', cyan: '#00BBFF' }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Russo One', 'sans-serif']
      }
    }
  },
  plugins: []
}
