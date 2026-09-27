<script setup lang="ts">
import { useRoute } from 'vue-router'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Cloud, HelpCircle, Moon, Send, ShoppingBag, Sun } from 'lucide-vue-next'
import { useTheme } from '../composables/useTheme'

const route = useRoute()
const { isDark, toggleTheme } = useTheme()
const username = 'Nio'

const tabs = [
  { to: '/', label: 'О Breeze', icon: Cloud, exact: true },
  { to: '/shop', label: 'Магазин', icon: ShoppingBag },
  { to: '/faq', label: 'FAQ', icon: HelpCircle },
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
          <component :is="tab.icon" class="size-5" />
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
        <Moon v-if="isDark" :size="16" class="text-[#0099FF]" />
        <Sun v-else :size="16" class="text-[#0099FF]" />
      </button>
      <a
        href="https://t.me"
        target="_blank"
        rel="noopener"
        class="relative z-30 flex rounded-full p-2 text-[var(--text-muted)] transition hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-main)]"
        title="Telegram"
        aria-label="Telegram"
      >
        <Send :size="16" />
      </a>
      <a
        href="https://discord.gg"
        target="_blank"
        rel="noopener"
        class="relative z-30 flex rounded-full p-2 text-[var(--text-muted)] transition hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-main)]"
        title="Discord"
        aria-label="Discord"
      >
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="size-4"><path d="M20.317 4.3698a19.7913 19.7913 0 0 0-4.8851-1.5152.0741.0741 0 0 0-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 0 0-.0785-.037 19.7363 19.7363 0 0 0-4.8852 1.515.0699.0699 0 0 0-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 0 0 .0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 0 0 .0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 0 0-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 0 1-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 0 1 .0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 0 1 .0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 0 1-.0066.1276 12.2986 12.2986 0 0 1-1.873.8914.0766.0766 0 0 0-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 0 0 .0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 0 0 .0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 0 0-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>
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