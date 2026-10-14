import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    // Импорты вида `@/assets/...` в компонентах. Без этого алиаса Vite
    // резолвит `@` как имя пакета и падает «Failed to resolve import»
    // ещё до того, как проверит, есть ли файл.
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
  },
})