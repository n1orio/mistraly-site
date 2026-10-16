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
    <div class="deadlock-scroll-bg" :class="{ 'deadlock-scroll-bg--home': route.path === '/' }" aria-hidden="true" />

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
 *   1. затемнение к низу страницы (как было);
 *   2. цветные подсветки — на главной под каждой секцией свой цвет,
 *      тот же, что у плашки в её заголовке;
 *   3. ::before — инженерная сетка-чертёж (отсылка к Create), тает к краям;
 *   4. ::after — зерно.
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
  background-image:
    radial-gradient(ellipse 60% 520px at 50% 120px, rgba(0, 153, 255, 0.11), transparent 70%),
    radial-gradient(ellipse 120% 100% at 50% 0%, transparent 55%, rgba(0, 0, 0, 0.45) 100%),
    linear-gradient(
      to bottom,
      transparent 0%,
      rgba(10, 11, 13, 0.22) 600px,
      rgba(8, 9, 10, 0.5) 1600px,
      rgba(5, 6, 7, 0.7) 100%
    );
}

/* Главная: подсветки по секциям — Сердце сервера (синий), FAQ (зелёный),
   этапы (оранжевый), лор (фиолетовый). Позиции в долях высоты страницы. */
.deadlock-scroll-bg--home {
  background-image:
    radial-gradient(ellipse 60% 520px at 50% 120px, rgba(0, 153, 255, 0.16), transparent 70%),
    radial-gradient(ellipse 45% 9% at 12% 21%, rgba(0, 153, 255, 0.11), transparent 70%),
    radial-gradient(ellipse 40% 8% at 88% 37%, rgba(34, 197, 94, 0.09), transparent 70%),
    radial-gradient(ellipse 45% 9% at 10% 58%, rgba(224, 89, 41, 0.12), transparent 70%),
    radial-gradient(ellipse 40% 8% at 85% 66%, rgba(246, 196, 66, 0.08), transparent 70%),
    radial-gradient(ellipse 55% 10% at 50% 84%, rgba(168, 85, 247, 0.12), transparent 70%),
    radial-gradient(ellipse 120% 100% at 50% 0%, transparent 55%, rgba(0, 0, 0, 0.45) 100%),
    linear-gradient(
      to bottom,
      transparent 0%,
      rgba(10, 11, 13, 0.22) 600px,
      rgba(8, 9, 10, 0.5) 1600px,
      rgba(5, 6, 7, 0.7) 100%
    );
}

/* Сетка-чертёж: мелкая клетка 32px и крупная 160px. */
.deadlock-scroll-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px),
    linear-gradient(rgba(255, 255, 255, 0.018) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.018) 1px, transparent 1px);
  background-size: 160px 160px, 160px 160px, 32px 32px, 32px 32px;
  background-position: center top;
  -webkit-mask-image: radial-gradient(ellipse 75% 60% at 50% 30%, #000 0%, rgba(0, 0, 0, 0.35) 60%, transparent 100%);
  mask-image: radial-gradient(ellipse 75% 60% at 50% 30%, #000 0%, rgba(0, 0, 0, 0.35) 60%, transparent 100%);
}

.deadlock-scroll-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.05;
  background-repeat: repeat;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}
</style>
