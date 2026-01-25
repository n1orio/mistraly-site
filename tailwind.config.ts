// tailwind.config.ts
import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sf: ['var(--font-sf-pro)', 'sans-serif'],
      },
    },
  },
  corePlugins: {
    preflight: true,
  },
  important: true,
}
export default config