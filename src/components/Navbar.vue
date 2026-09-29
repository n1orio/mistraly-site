<script setup lang="ts">
import { useRoute } from 'vue-router'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useTheme } from '../composables/useTheme'

const route = useRoute()
const { isDark, toggleTheme } = useTheme()
const username = 'Nio'

const tabs = [
  { to: '/', label: 'О Breeze', icon: 'logo', exact: true },
  { to: '/shop', label: 'Магазин', icon: 'shop' },
  { to: '/faq', label: 'FAQ', icon: 'faq' },
]

function isActive(tab: { to: string; exact?: boolean }) {
  return tab.exact ? route.path === tab.to : route.path.startsWith(tab.to)
}

const navEl = ref<HTMLElement | null>(null)
const indicatorEl = ref<HTMLElement | null>(null)

function updateIndicator() {
  const nav = navEl.value
  const ind = indicatorEl.value
  if (!nav || !ind) return
  const links = Array.from(nav.querySelectorAll<HTMLElement>('[data-nav-tab]'))
  const activeIdx = tabs.findIndex((t) => isActive(t))
  const el = links[activeIdx]
  if (!el) {
    ind.style.opacity = '0'
    return
  }
  ind.style.opacity = '1'
  ind.style.left = el.offsetLeft + 'px'
  ind.style.width = el.offsetWidth + 'px'
}

watch(
  () => route.path,
  async () => {
    await nextTick()
    updateIndicator()
  },
  { immediate: true }
)

onMounted(() => {
  updateIndicator()
  window.addEventListener('resize', updateIndicator)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateIndicator)
})
</script>
<template>
  <header class="sticky top-4 z-50 flex w-full justify-center px-6 pointer-events-none select-none">
    <nav ref="navEl" class="no-scrollbar pointer-events-auto relative flex shrink-0 grow-0 flex-row flex-nowrap items-center overflow-x-auto overflow-y-clip max-w-full rounded-xl px-2 py-px ring-1 ring-inset bg-[var(--nav-bg)] backdrop-saturate-150 backdrop-blur-lg ring-[var(--nav-border)] *:shrink-0">
      <div ref="indicatorEl" class="pointer-events-none absolute inset-y-0 z-10 transition-all duration-300 ease-out" style="opacity: 0;">
        <div class="absolute inset-x-3 top-0" data-ray="">
          <div class="absolute h-1.5 w-full rounded-full bg-gradient-to-r from-transparent via-[#0099FF]/50 to-transparent opacity-90 blur-md"></div>
        </div>
        <div class="absolute inset-x-3 bottom-0" data-highlight="">
          <div class="absolute h-1.5 w-full rounded-full bg-gradient-to-r from-transparent via-[#0099FF]/50 to-transparent blur-md"></div>
          <div class="absolute bottom-0 h-px w-full rounded-full bg-gradient-to-r from-transparent via-[#0099FF]/75 to-transparent"></div>
        </div>
      </div>
      <router-link
        v-for="(tab, i) in tabs"
        :key="tab.to"
        :data-nav-tab="i"
        :to="tab.to"
        class="group relative flex py-[0.45rem] text-sm font-medium transition focus-visible:outline-none"
        :class="isActive(tab)
          ? 'text-[#0099FF] hover:text-[#0099FF]'
          : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'"
      >
        <div class="relative z-30 grid grid-flow-col items-center gap-2 group-hover:bg-[var(--bg-card-hover)] px-3 py-2 rounded-full transition group-focus-visible:ring-2 group-focus-visible:ring-inset" data-content="">
          <img :src="`/icons/${tab.icon}.png`" class="size-6" alt="" />
          <span>{{ tab.label }}</span>
        </div>
      </router-link>

      <div class="relative z-30 mx-1 h-5 w-px self-center bg-[var(--border-color)]"></div>

      <button
        type="button"
        @click="toggleTheme"
        class="relative z-30 flex cursor-pointer rounded-full p-2 text-[var(--text-muted)] transition hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-main)]"
        title="Сменить тему"
        aria-label="Сменить тему"
      >
        <img v-if="isDark" src="/icons/dark.png" class="size-6" alt="" />
        <img v-else src="/icons/light.png" class="size-6" alt="" />
      </button>
      <a
        href="https://t.me"
        target="_blank"
        rel="noopener"
        class="relative z-30 flex rounded-full p-2 text-[var(--text-muted)] transition hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-main)]"
        title="Telegram"
        aria-label="Telegram"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="20" height="20" fill="currentColor" shape-rendering="crispEdges" class="shrink-0"><rect x="20" y="4" width="2" height="2"/><rect x="22" y="4" width="2" height="2"/><rect x="24" y="4" width="2" height="2"/><rect x="26" y="4" width="2" height="2"/><rect x="16" y="6" width="2" height="2"/><rect x="18" y="6" width="2" height="2"/><rect x="20" y="6" width="2" height="2"/><rect x="22" y="6" width="2" height="2"/><rect x="26" y="6" width="2" height="2"/><rect x="12" y="8" width="2" height="2"/><rect x="14" y="8" width="2" height="2"/><rect x="16" y="8" width="2" height="2"/><rect x="18" y="8" width="2" height="2"/><rect x="20" y="8" width="2" height="2"/><rect x="24" y="8" width="2" height="2"/><rect x="26" y="8" width="2" height="2"/><rect x="8" y="10" width="2" height="2"/><rect x="10" y="10" width="2" height="2"/><rect x="12" y="10" width="2" height="2"/><rect x="14" y="10" width="2" height="2"/><rect x="16" y="10" width="2" height="2"/><rect x="18" y="10" width="2" height="2"/><rect x="22" y="10" width="2" height="2"/><rect x="24" y="10" width="2" height="2"/><rect x="26" y="10" width="2" height="2"/><rect x="4" y="12" width="2" height="2"/><rect x="6" y="12" width="2" height="2"/><rect x="8" y="12" width="2" height="2"/><rect x="10" y="12" width="2" height="2"/><rect x="12" y="12" width="2" height="2"/><rect x="14" y="12" width="2" height="2"/><rect x="16" y="12" width="2" height="2"/><rect x="20" y="12" width="2" height="2"/><rect x="22" y="12" width="2" height="2"/><rect x="24" y="12" width="2" height="2"/><rect x="4" y="14" width="2" height="2"/><rect x="6" y="14" width="2" height="2"/><rect x="8" y="14" width="2" height="2"/><rect x="10" y="14" width="2" height="2"/><rect x="12" y="14" width="2" height="2"/><rect x="14" y="14" width="2" height="2"/><rect x="18" y="14" width="2" height="2"/><rect x="20" y="14" width="2" height="2"/><rect x="22" y="14" width="2" height="2"/><rect x="24" y="14" width="2" height="2"/><rect x="4" y="16" width="2" height="2"/><rect x="6" y="16" width="2" height="2"/><rect x="8" y="16" width="2" height="2"/><rect x="10" y="16" width="2" height="2"/><rect x="12" y="16" width="2" height="2"/><rect x="16" y="16" width="2" height="2"/><rect x="18" y="16" width="2" height="2"/><rect x="20" y="16" width="2" height="2"/><rect x="22" y="16" width="2" height="2"/><rect x="4" y="18" width="2" height="2"/><rect x="6" y="18" width="2" height="2"/><rect x="8" y="18" width="2" height="2"/><rect x="10" y="18" width="2" height="2"/><rect x="14" y="18" width="2" height="2"/><rect x="16" y="18" width="2" height="2"/><rect x="18" y="18" width="2" height="2"/><rect x="20" y="18" width="2" height="2"/><rect x="22" y="18" width="2" height="2"/><rect x="4" y="20" width="2" height="2"/><rect x="6" y="20" width="2" height="2"/><rect x="8" y="20" width="2" height="2"/><rect x="12" y="20" width="2" height="2"/><rect x="14" y="20" width="2" height="2"/><rect x="16" y="20" width="2" height="2"/><rect x="18" y="20" width="2" height="2"/><rect x="20" y="20" width="2" height="2"/><rect x="10" y="22" width="2" height="2"/><rect x="12" y="22" width="2" height="2"/><rect x="14" y="22" width="2" height="2"/><rect x="16" y="22" width="2" height="2"/><rect x="18" y="22" width="2" height="2"/><rect x="20" y="22" width="2" height="2"/><rect x="10" y="24" width="2" height="2"/><rect x="12" y="24" width="2" height="2"/><rect x="14" y="24" width="2" height="2"/><rect x="16" y="24" width="2" height="2"/><rect x="18" y="24" width="2" height="2"/><rect x="10" y="26" width="2" height="2"/><rect x="12" y="26" width="2" height="2"/><rect x="14" y="26" width="2" height="2"/><rect x="16" y="26" width="2" height="2"/><rect x="18" y="26" width="2" height="2"/></svg>
      </a>
      <a
        href="https://discord.gg"
        target="_blank"
        rel="noopener"
        class="relative z-30 flex rounded-full p-2 text-[var(--text-muted)] transition hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-main)]"
        title="Discord"
        aria-label="Discord"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="20" height="20" fill="currentColor" shape-rendering="crispEdges" class="shrink-0"><rect x="6" y="6" width="2" height="2"/><rect x="8" y="6" width="2" height="2"/><rect x="10" y="6" width="2" height="2"/><rect x="20" y="6" width="2" height="2"/><rect x="22" y="6" width="2" height="2"/><rect x="24" y="6" width="2" height="2"/><rect x="6" y="8" width="2" height="2"/><rect x="8" y="8" width="2" height="2"/><rect x="10" y="8" width="2" height="2"/><rect x="12" y="8" width="2" height="2"/><rect x="14" y="8" width="2" height="2"/><rect x="16" y="8" width="2" height="2"/><rect x="18" y="8" width="2" height="2"/><rect x="20" y="8" width="2" height="2"/><rect x="22" y="8" width="2" height="2"/><rect x="24" y="8" width="2" height="2"/><rect x="4" y="10" width="2" height="2"/><rect x="6" y="10" width="2" height="2"/><rect x="8" y="10" width="2" height="2"/><rect x="10" y="10" width="2" height="2"/><rect x="12" y="10" width="2" height="2"/><rect x="14" y="10" width="2" height="2"/><rect x="16" y="10" width="2" height="2"/><rect x="18" y="10" width="2" height="2"/><rect x="20" y="10" width="2" height="2"/><rect x="22" y="10" width="2" height="2"/><rect x="24" y="10" width="2" height="2"/><rect x="26" y="10" width="2" height="2"/><rect x="4" y="12" width="2" height="2"/><rect x="6" y="12" width="2" height="2"/><rect x="8" y="12" width="2" height="2"/><rect x="10" y="12" width="2" height="2"/><rect x="12" y="12" width="2" height="2"/><rect x="14" y="12" width="2" height="2"/><rect x="16" y="12" width="2" height="2"/><rect x="18" y="12" width="2" height="2"/><rect x="20" y="12" width="2" height="2"/><rect x="22" y="12" width="2" height="2"/><rect x="24" y="12" width="2" height="2"/><rect x="26" y="12" width="2" height="2"/><rect x="4" y="14" width="2" height="2"/><rect x="6" y="14" width="2" height="2"/><rect x="12" y="14" width="2" height="2"/><rect x="14" y="14" width="2" height="2"/><rect x="16" y="14" width="2" height="2"/><rect x="18" y="14" width="2" height="2"/><rect x="24" y="14" width="2" height="2"/><rect x="26" y="14" width="2" height="2"/><rect x="2" y="16" width="2" height="2"/><rect x="4" y="16" width="2" height="2"/><rect x="6" y="16" width="2" height="2"/><rect x="14" y="16" width="2" height="2"/><rect x="16" y="16" width="2" height="2"/><rect x="24" y="16" width="2" height="2"/><rect x="26" y="16" width="2" height="2"/><rect x="28" y="16" width="2" height="2"/><rect x="2" y="18" width="2" height="2"/><rect x="4" y="18" width="2" height="2"/><rect x="6" y="18" width="2" height="2"/><rect x="8" y="18" width="2" height="2"/><rect x="12" y="18" width="2" height="2"/><rect x="14" y="18" width="2" height="2"/><rect x="16" y="18" width="2" height="2"/><rect x="18" y="18" width="2" height="2"/><rect x="22" y="18" width="2" height="2"/><rect x="24" y="18" width="2" height="2"/><rect x="26" y="18" width="2" height="2"/><rect x="28" y="18" width="2" height="2"/><rect x="2" y="20" width="2" height="2"/><rect x="4" y="20" width="2" height="2"/><rect x="6" y="20" width="2" height="2"/><rect x="8" y="20" width="2" height="2"/><rect x="10" y="20" width="2" height="2"/><rect x="12" y="20" width="2" height="2"/><rect x="14" y="20" width="2" height="2"/><rect x="16" y="20" width="2" height="2"/><rect x="18" y="20" width="2" height="2"/><rect x="20" y="20" width="2" height="2"/><rect x="22" y="20" width="2" height="2"/><rect x="24" y="20" width="2" height="2"/><rect x="26" y="20" width="2" height="2"/><rect x="28" y="20" width="2" height="2"/><rect x="2" y="22" width="2" height="2"/><rect x="4" y="22" width="2" height="2"/><rect x="6" y="22" width="2" height="2"/><rect x="8" y="22" width="2" height="2"/><rect x="10" y="22" width="2" height="2"/><rect x="12" y="22" width="2" height="2"/><rect x="14" y="22" width="2" height="2"/><rect x="16" y="22" width="2" height="2"/><rect x="18" y="22" width="2" height="2"/><rect x="20" y="22" width="2" height="2"/><rect x="22" y="22" width="2" height="2"/><rect x="24" y="22" width="2" height="2"/><rect x="26" y="22" width="2" height="2"/><rect x="28" y="22" width="2" height="2"/><rect x="4" y="24" width="2" height="2"/><rect x="6" y="24" width="2" height="2"/><rect x="8" y="24" width="2" height="2"/><rect x="10" y="24" width="2" height="2"/><rect x="20" y="24" width="2" height="2"/><rect x="22" y="24" width="2" height="2"/><rect x="24" y="24" width="2" height="2"/><rect x="26" y="24" width="2" height="2"/><rect x="6" y="26" width="2" height="2"/><rect x="8" y="26" width="2" height="2"/><rect x="10" y="26" width="2" height="2"/><rect x="20" y="26" width="2" height="2"/><rect x="22" y="26" width="2" height="2"/><rect x="24" y="26" width="2" height="2"/></svg>
      </a>

      <router-link
        to="/profile"
        class="relative z-30 ml-1 flex items-center gap-2 rounded-full py-1.5 pl-1 pr-3.5 text-xs font-semibold text-[var(--text-main)] ring-1 ring-inset ring-[var(--border-color)] transition hover:bg-[var(--bg-card-hover)]"
        title="Профиль"
      >
        <span class="flex h-5 w-5 items-center justify-center rounded-full bg-[#0080FF] text-[10px] font-bold text-white">{{ username[0] }}</span>
        <span>{{ username }}</span>
      </router-link>
    </nav>
  </header>
</template>