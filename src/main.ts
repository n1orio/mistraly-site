import './assets/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import { useTheme } from './composables/useTheme'

const router = createRouter({ history: createWebHistory(), routes: [
  { path: '/', name: 'Home', component: () => import('./views/HomeView.vue') },
  { path: '/auth/discord', name: 'DiscordAuth', component: () => import('./views/DiscordAuthView.vue') },
  { path: '/shop', name: 'Shop', component: () => import('./views/ShopView.vue') },
  { path: '/profile', name: 'Profile', component: () => import('./views/SiteProfileView.vue') },
  { path: '/offer', name: 'Offer', component: () => import('./views/OfferView.vue') },
  { path: '/faq', name: 'Faq', component: () => import('./views/FaqView.vue') }
] })
// Инициализация темы ДО монтирования: ставим класс dark/light на <html>
// из localStorage, чтобы хеадер и страница не мигали светлой темой и
// переключатель сразу работал в обе стороны.
const { initTheme } = useTheme()
initTheme()
createApp(App).use(createPinia()).use(router).mount('#app')
