import animate from "tailwindcss-animate";

export default {
  darkMode: "class", 
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [animate],
};
