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
  // Документы, обязательные для модерации платёжного шлюза
  { path: '/contacts', name: 'Contacts', component: () => import('./views/ContactsView.vue') },
  { path: '/privacy', name: 'Privacy', component: () => import('./views/PrivacyView.vue') },
  { path: '/refund', name: 'Refund', component: () => import('./views/RefundView.vue') },
  { path: '/license', name: 'License', component: () => import('./views/LicenseView.vue') }
] })
// Инициализация темы ДО монтирования: ставим класс dark/light на <html>
// из localStorage, чтобы хеадер и страница не мигали светлой темой и
// переключатель сразу работал в обе стороны.
const { initTheme } = useTheme()
initTheme()
createApp(App).use(createPinia()).use(router).mount('#app')
