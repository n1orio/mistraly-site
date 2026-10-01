<script setup lang="ts">
import { useRoute } from 'vue-router'
import PurchaseModal from './components/PurchaseModal.vue'
import Navbar from './components/Navbar.vue'
import FireFooter from './components/FireFooter.vue'

const route = useRoute()
</script>

<template>
  <div class="relative min-h-screen page-bg bg-[var(--bg-page)] text-[var(--text-main)] flex flex-col items-center">
    <!-- Фоновый скролл -->
    <div class="deadlock-scroll-bg" aria-hidden="true" />

    <Navbar />

    <main class="relative z-[1] w-full flex-1">
      <router-view />
    </main>

    <PurchaseModal />

    <!-- Огненный футер ТОЛЬКО на главной странице -->
    <FireFooter v-if="route.path === '/'" />

    <!-- Обычный строгий темный футер на остальных страницах -->
    <footer
      v-else
      class="relative z-[1] w-full max-w-6xl px-4 py-8 mt-auto border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--text-muted)] gap-4"
    >
      <div>© Breeze • Minecraft 1.21.1</div>
      <div class="flex items-center gap-5">
        <router-link to="/offer" class="hover:text-[var(--text-main)] transition underline underline-offset-2">Оферта</router-link>
        <router-link to="/faq" class="hover:text-[var(--text-main)] transition">FAQ</router-link>
        <router-link to="/shop" class="hover:text-[var(--text-main)] transition">Магазин</router-link>
        <router-link to="/profile" class="hover:text-[var(--text-main)] transition">Профиль</router-link>
      </div>
    </footer>
  </div>
</template>

<style>
.deadlock-scroll-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  min-height: 100%;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
  background-image: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(10, 11, 13, 0.22) 600px,
    rgba(8, 9, 10, 0.5) 1600px,
    rgba(5, 6, 7, 0.7) 100%
  );
}

.deadlock-scroll-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.025;
  background-repeat: repeat;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}
</style>
