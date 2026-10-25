<script setup lang="ts">
import { useRoute } from 'vue-router'
import PurchaseModal from './components/PurchaseModal.vue'
import Navbar from './components/Navbar.vue'
import FireFooter from './components/FireFooter.vue'

const route = useRoute()

/**
 * На admin.mistraly.net показывать навигацию магазина и огненный футер
 * главной не нужно: там корень отдаёт админку, а не витрину.
 */
const isAdminHost = location.hostname === 'admin.mistraly.net'
</script>

<template>
  <div class="relative min-h-screen page-bg bg-[var(--bg-page)] text-[var(--text-main)] flex flex-col items-center">
    <!-- Фоновый скролл -->
    <div class="deadlock-scroll-bg" aria-hidden="true" />

    <Navbar v-if="!isAdminHost" />

    <main class="relative z-[1] w-full flex-1">
      <router-view />
    </main>

    <PurchaseModal />

    <!-- Огненный футер ТОЛЬКО на главной странице -->
    <FireFooter v-if="route.path === '/' && !isAdminHost" />

    <!-- Обычный строгий темный футер на остальных страницах -->
    <footer
      v-else-if="!isAdminHost"
      class="relative z-[1] w-full max-w-6xl px-4 py-8 mt-auto border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--text-muted)] gap-4"
    >
      <div>© Mistraly • Minecraft 1.21.1</div>
      <div class="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        <router-link to="/offer" class="hover:text-[var(--text-main)] transition underline underline-offset-2">Оферта</router-link>
        <router-link to="/refund" class="hover:text-[var(--text-main)] transition">Возврат</router-link>
        <router-link to="/privacy" class="hover:text-[var(--text-main)] transition">Персональные данные</router-link>
        <router-link to="/license" class="hover:text-[var(--text-main)] transition">Лицензии</router-link>
        <router-link to="/contacts" class="hover:text-[var(--text-main)] transition">Контакты</router-link>
        <router-link to="/shop" class="hover:text-[var(--text-main)] transition">Магазин</router-link>
        <router-link to="/profile" class="hover:text-[var(--text-main)] transition">Профиль</router-link>
      </div>
    </footer>
  </div>
</template>

<style>
/*
 * Общий фон под всеми страницами. Слои снизу вверх:
 *   1. виньетка и затемнение к низу страницы;
 *   2. ::after — зерно.
 * Всё статичное: фон не анимируется и не грузит видеокарту.
 */
.deadlock-scroll-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  min-height: 100%;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
  /* Без цветных пятен: только виньетка по краям и затемнение к низу. */
  background-image:
    radial-gradient(ellipse 120% 100% at 50% 0%, transparent 55%, rgba(0, 0, 0, 0.5) 100%),
    linear-gradient(
      to bottom,
      transparent 0%,
      rgba(0, 0, 0, 0.25) 600px,
      rgba(0, 0, 0, 0.5) 1600px,
      rgba(0, 0, 0, 0.7) 100%
    );
}

.deadlock-scroll-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.03;
  background-repeat: repeat;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}
</style>
