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
  <header class="fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/5 bg-black/40 backdrop-blur-xl">
  <div class="mx-auto flex h-full max-w-5xl items-center justify-between px-4">
    <div class="flex items-center gap-6">
      <a href="/" class="font-bebas text-xl text-white tracking-tight hover:text-[#0099FF] transition">MISTRALY</a>
      <div class="flex items-center gap-1">
        <a v-for="tab in tabs" :key="tab.to" :href="tab.to"
          class="px-3 py-1.5  text-sm font-medium transition"
          :class="isActive(tab) ? 'text-white bg-white/10' : 'text-white/50 hover:text-white hover:bg-white/5'"
        >{{ tab.label }}</a>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <a href="https://t.me/breeze_monster" target="_blank" rel="noopener" title="Telegram" class="text-white/50 hover:text-white transition p-1.5  hover:bg-white/5"><img src="/icons/telegram.png" class="size-5" alt="" /></a>
      <a href="https://discord.gg/nPbWMhDeus" target="_blank" rel="noopener" title="Discord" class="text-white/50 hover:text-white transition p-1.5  hover:bg-white/5"><img src="/icons/discord.png" class="size-5" alt="" /></a>
      <button @click="toggleTheme()" class="text-white/50 hover:text-white transition p-1.5  hover:bg-white/5" title="Theme">
        <img v-if="isDark" src="/icons/dark.png" class="size-5" alt="" />
        <img v-else src="/icons/light.png" class="size-5" alt="" />
      </button>
      <a href="/profile" class="flex items-center gap-2  bg-[#0099FF] px-4 py-1.5 text-sm font-semibold text-white transition shadow-lg shadow-[#0099FF]/25 hover:shadow-[#0099FF]/40">{{ username }}</a>
    </div>
  </div>
</header>
</template>