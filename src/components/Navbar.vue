<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Home, ShoppingBag, ScrollText, Download, Discord, BookOpen } from '../lib/icons'
import { api, unwrap } from '../api/client'
import { useAuthStore } from '../stores/auth'
import { loadPlayerThemes } from '../lib/nameThemes'
import NameTag from './NameTag.vue'
import { headHtml } from '../lib/wikiMarkup'

const route = useRoute()
loadPlayerThemes()
const auth = useAuthStore()

// Раньше здесь стояла заглушка 'Nio' — любой посетитель видел чужой ник.
const gameName = ref('')
const username = computed(() => gameName.value || auth.user?.username || auth.discord?.discord_username || '')

// Имя аккаунта может отличаться от ника в игре, а цвет и иконка темы привязаны к нику.
watch(
  () => auth.isAuthenticated,
  async (on) => {
    gameName.value = ''
    if (!on) return
    try {
      gameName.value = (await unwrap<{ nickname: string } | null>(api.get('/user/nickname')))?.nickname ?? ''
    } catch {
      /* останется имя аккаунта */
    }
  },
  { immediate: true }
)

function startAuth() {
  const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID || ''
  const redirect = encodeURIComponent(`${location.origin}/auth/discord`)
  location.href =
    `https://discord.com/api/oauth2/authorize?client_id=${clientId}` +
    `&redirect_uri=${redirect}&response_type=code&scope=identify`
}

const tabs = [
  { to: '/', label: 'Главная', icon: Home, exact: true },
  { to: '/shop', label: 'Магазин', icon: ShoppingBag },
  { to: '/wiki', label: 'Вики', icon: BookOpen },
  { to: '/rules', label: 'Правила', icon: ScrollText },
  { to: '/download', label: 'Скачать', icon: Download },
]

function isActive(tab: { to: string; exact?: boolean }) {
  return tab.exact ? route.path === tab.to : route.path.startsWith(tab.to)
}
</script>

<template>
  <header class="top">
    <div class="top-in">
      <router-link to="/" class="brand" aria-label="Mistraly, на главную">
        <img src="/icons/server.png" alt="" class="brand-icon" width="32" height="32" />
        <span>MISTRALY</span>
      </router-link>

      <!-- Вкладки как в лаунчере: активная подчёркнута яркой полосой -->
      <nav class="tabs" aria-label="Разделы сайта">
        <router-link
          v-for="tab in tabs"
          :key="tab.to"
          :to="tab.to"
          class="tab"
          :class="{ 'is-active': isActive(tab) }"
        >
          <component :is="tab.icon" :size="24" />
          <span>{{ tab.label }}</span>
        </router-link>
      </nav>

      <!-- Вход / профиль: без сессии это кнопка авторизации -->
      <div class="who">
        <button v-if="!auth.isAuthenticated" type="button" class="mc-btn mc-btn--discord mc-btn--sm" @click="startAuth">
          <Discord :size="24" />
          Войти
        </button>
        <router-link v-else to="/profile" class="me" :class="{ 'is-active': route.path === '/profile' }">
          <span class="me-head" v-html="headHtml(username, 32)"></span>
          <NameTag class="me-name" :name="username" />
        </router-link>
      </div>
    </div>
  </header>
</template>

<style scoped>
.top {
  position: sticky;
  top: 0;
  z-index: 50;
  width: 100%;
  background: var(--bg-void);
  box-shadow: inset 0 -2px 0 0 var(--edge-c);
}
.top-in {
  display: flex;
  align-items: stretch;
  gap: 28px;
  max-width: 1200px;
  height: 64px;
  margin: 0 auto;
  padding: 0 16px;
}
.brand {
  display: flex;
  align-items: center;
  flex: none;
  gap: 10px;
  color: #fff;
  font-family: 'Minecraft Ten', 'Noto Sans', sans-serif;
  font-size: 24px;
  text-decoration: none;
}
.brand-icon {
  /* Рисунок 16×16: только целый масштаб и без сглаживания. */
  width: 32px;
  height: 32px;
  image-rendering: pixelated;
}
.tabs {
  display: flex;
  align-items: center;
  flex: 1;
}
/* Вкладки как хотбар: ряд слотов, выбранный обведён белой рамкой. */
.tab {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  margin-left: -2px;
  padding: 0 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid var(--ink);
  box-shadow: inset 2px 2px 0 rgba(0, 0, 0, 0.5), inset -2px -2px 0 rgba(255, 255, 255, 0.08);
  color: var(--text-muted);
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
}
.tab:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.12);
}
.tab.is-active {
  z-index: 1;
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 0 0 2px var(--ink), 0 0 0 3px #e8e8e8, 0 0 0 5px var(--ink);
}
.tab:focus-visible,
.me:focus-visible {
  outline: 3px solid #fff;
  outline-offset: -3px;
}
.who {
  display: flex;
  align-items: center;
  flex: none;
}
.me {
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 200px;
  padding: 6px 10px;
  color: var(--text-main);
  font-weight: 600;
  font-size:16px;
  text-decoration: none;
}
.me:hover,
.me.is-active {
  background: var(--panel);
}
.me-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.me-head {
  display: flex;
  flex: none;
  box-shadow: 0 0 0 2px var(--ink);
}

/* Название и пять пунктов в ряд не влезают уже чем в 900 px. */
@media (max-width: 900px) {
  .top-in {
    gap: 12px;
  }
  .tab span {
    display: none;
  }
}

/* Телефон: сверху логотип и вход, вкладки — нижней панелью, под большой палец. */
@media (max-width: 640px) {
  .top-in {
    justify-content: space-between;
    height: 56px;
  }
  .me-name {
    max-width: 120px;
  }
  .tabs {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 50;
    gap: 0;
    height: 64px;
    background: var(--bg-void);
    box-shadow: inset 0 2px 0 0 var(--edge-c);
  }
  .tab {
    flex: 1;
    flex-direction: column;
    justify-content: center;
    gap: 3px;
    padding: 0;
    font-weight: 700;
    font-size: 12px;
  }
  .tab span {
    display: inline;
  }
  .tab {
    height: 56px;
    margin-left: 0;
  }
  .tab.is-active {
    box-shadow: inset 0 0 0 3px #e8e8e8;
  }
}
</style>
