import './assets/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import App from './App.vue'
import { useTheme } from './composables/useTheme'
import { setUnauthorizedHandler } from './api/client'
import { useAuthStore } from './stores/auth'

/**
 * На admin.mistraly.net корень — это сама админка, а не витрина магазина.
 *
 * Определяем по имени хоста, а не по Caddy-редиректу: редирект меняет
 * только запрос на сервере, в адресной строке браузера всё равно остаётся
 * «/», и vue-router отрендерил бы главную страницу сайта.
 */
const ADMIN_HOSTS = ['admin.mistraly.net']
const isAdminHost = ADMIN_HOSTS.includes(location.hostname)

const adminRoute: RouteRecordRaw = {
  path: '/',
  name: 'Admin',
  component: () => import('./views/AdminView.vue'),
  // requiresAuth гардит вход, requiresAdmin — роль. Роль проверяет и
  // бэкенд, но гард нужен, чтобы не грузить админ-таблицы тем, кому
  // они всё равно вернут 403.
  meta: { requiresAuth: true, requiresAdmin: true }
}

const routes: RouteRecordRaw[] = [
  isAdminHost
    ? adminRoute
    : { path: '/', name: 'Home', component: () => import('./views/HomeView.vue') },
  {
    path: '/auth/discord',
    name: 'DiscordAuth',
    component: () => import('./views/DiscordAuthView.vue'),
    // Возврат после OAuth: страница редиректит сама, гард её пропускает.
    meta: { public: true }
  },
  { path: '/shop', name: 'Shop', component: () => import('./views/ShopView.vue') },
  {
    path: '/admin-denied',
    name: 'AdminDenied',
    component: () => import('./views/AdminDeniedView.vue'),
    meta: { public: true }
  },
  // На основном домене админка живёт по явному пути. На admin.mistraly.net
  // она уже отдаётся корнем, и второй маршрут был бы дублем.
  ...(isAdminHost
    ? []
    : [
        {
          path: '/admin',
          name: 'Admin',
          component: () => import('./views/AdminView.vue'),
          meta: { requiresAuth: true, requiresAdmin: true }
        } as RouteRecordRaw
      ]),
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('./views/SiteProfileView.vue'),
    meta: { requiresAuth: true }
  },
  { path: '/offer', name: 'Offer', component: () => import('./views/OfferView.vue') },
  { path: '/rules', name: 'Rules', component: () => import('./views/RulesView.vue') },
  // Документы, обязательные для модерации платёжного шлюза
  { path: '/contacts', name: 'Contacts', component: () => import('./views/ContactsView.vue') },
  { path: '/privacy', name: 'Privacy', component: () => import('./views/PrivacyView.vue') },
  { path: '/refund', name: 'Refund', component: () => import('./views/RefundView.vue') },
  { path: '/license', name: 'License', component: () => import('./views/LicenseView.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

const pinia = createPinia()
const auth = useAuthStore(pinia)

/**
 * Гарды страниц. Раньше /profile был открыт всем и сам показывал
 * «требуется авторизация» — теперь редиректим сразу, чтобы не показывать
 * пустой профиль и не путать пользователя.
 */
router.beforeEach(async (to) => {
  // Сессия восстанавливается один раз за сессию страницы: refresh-cookie
  // переживает перезагрузку, localStorage с токеном больше не используется.
  await auth.restore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { path: '/auth/discord', query: { redirect: to.fullPath } }
  }
  // Не админа отправляем на страницу отказа, а не на корень: на
  // admin.mistraly.net корень — это сама админка, и редирект туда же
  // зациклил бы гард.
  if (to.meta.requiresAdmin && !auth.isAdmin) {
    return { path: '/admin-denied' }
  }
  return true
})

// Любой 401 от api означает протухшую сессию — приводим стор к логауту.
setUnauthorizedHandler(() => auth.clear())

// Инициализация темы ДО монтирования: ставим класс dark/light на <html>
// из localStorage, чтобы хеадер и страница не мигали светлой темой и
// переключатель сразу работал в обе стороны.
const { initTheme } = useTheme()
initTheme()

// Прогреваем движок и модель шестерни сразу, не дожидаясь монтирования
// HomeView. Пока качается мегабайтный чанк Babylon, роутер и компоненты
// главной успевают отрисоваться; без этого первые пару секунд после
// перезагрузки фоновая шестерня ещё не готова. import() не блокирует
// mount — он только стартует загрузку.
void import('./lib/gearRenderer').then((m) => m.preloadGear())

createApp(App).use(pinia).use(router).mount('#app')