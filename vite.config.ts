import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      three: path.resolve(__dirname, '../breeze-launcher/node_modules/three'),
    },
  },
  server: {
    port: 5173,
  },
})