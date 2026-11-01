<script setup lang="ts">
import { useRoute } from 'vue-router'
import PurchaseModal from './components/PurchaseModal.vue'
import Navbar from './components/Navbar.vue'
import FireFooter from './components/FireFooter.vue'

const route = useRoute()

/**
 * На admin.mistraly.net показывать навигацию магазина и футер с пламенем
 * главной не нужно: там корень отдаёт админку, а не витрину.
 */
const isAdminHost = location.hostname === 'admin.mistraly.net'
</script>

<template>
  <div class="app-shell relative min-h-screen flex flex-col items-center text-[var(--text-main)]">
    <Navbar v-if="!isAdminHost" />

    <main class="relative z-[1] w-full flex-1">
      <router-view />
    </main>

    <PurchaseModal />

    <!-- Синее пламя душ ТОЛЬКО на главной странице -->
    <FireFooter v-if="route.path === '/' && !isAdminHost" />

    <footer v-else-if="!isAdminHost" class="site-foot relative z-[1] w-full mt-auto">
      <div class="dither dither--void dither--up" style="transform:none" aria-hidden="true" />
      <div class="site-foot-in">
        <div class="max-w-6xl mx-auto px-4 py-7 flex flex-col sm:flex-row items-center justify-between gap-4 text-[15px] text-[var(--text-muted)]">
          <div>© Mistraly • Minecraft 1.21.1</div>
          <div class="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <router-link to="/offer" class="foot-link">Оферта</router-link>
            <router-link to="/refund" class="foot-link">Возврат</router-link>
            <router-link to="/privacy" class="foot-link">Персональные данные</router-link>
            <router-link to="/license" class="foot-link">Лицензии</router-link>
            <router-link to="/contacts" class="foot-link">Контакты</router-link>
            <router-link to="/shop" class="foot-link">Магазин</router-link>
            <router-link to="/profile" class="foot-link">Профиль</router-link>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style>
.site-foot-in {
  background: var(--bg-void);
}
.foot-link:hover {
  color: var(--sky);
}
/* На телефоне вкладки уезжают в нижнюю панель — она не должна закрывать футер. */
@media (max-width: 640px) {
  .app-shell {
    padding-bottom: 70px;
  }
}
</style>
