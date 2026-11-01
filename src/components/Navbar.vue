<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Home, ShoppingBag, ScrollText, Download, Discord } from '../lib/icons'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const auth = useAuthStore()

// Раньше здесь стояла заглушка 'Nio' — любой посетитель видел чужой ник.
const username = computed(() => auth.user?.username || auth.discord?.discord_username || '')

/** Аватар Discord, если он есть; иначе первая буква ника. */
const avatarUrl = computed(() => {
  const hash = auth.discord?.discord_avatar
  if (!hash || !auth.discord?.discord_id) return undefined
  return `https://cdn.discordapp.com/avatars/${auth.discord.discord_id}/${hash}.png?size=64`
})

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
        <img src="/images/ui/logo.png" alt="" class="brand-logo pixel-img" width="184" height="37" />
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
          <span class="me-face">
            <img v-if="avatarUrl" :src="avatarUrl" :alt="username" />
            <template v-else>{{ username.charAt(0) }}</template>
          </span>
          <span class="me-name">{{ username }}</span>
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
  box-shadow: 0 3px 0 0 var(--ink), inset 0 -3px 0 0 var(--panel);
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
}
.brand-logo {
  width: 184px;
  height: 37px;
}
.tabs {
  display: flex;
  align-items: stretch;
  gap: 4px;
  flex: 1;
}
.tab {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  color: var(--text-muted);
  font-family: 'Minecraft', 'Podkova', sans-serif;
  font-size:16px;
  text-decoration: none;
  white-space: nowrap;
}
.tab:hover {
  color: #fff;
  background: var(--panel);
}
.tab.is-active {
  color: #fff;
}
.tab.is-active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 6px;
  background: var(--sky);
  box-shadow: inset 0 3px 0 0 #C5EEFF;
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
  font-family: 'Minecraft', 'Podkova', sans-serif;
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
.me-face {
  display: grid;
  place-items: center;
  flex: none;
  width: 32px;
  height: 32px;
  overflow: hidden;
  background: var(--blue-lo);
  box-shadow: 0 0 0 3px var(--ink);
}
.me-face img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
}

/* Логотип 184 px и пять пунктов в ряд не влезают уже чем в 900 px. */
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
    box-shadow: 0 -3px 0 0 var(--ink), inset 0 3px 0 0 var(--panel);
  }
  .tab {
    flex: 1;
    flex-direction: column;
    justify-content: center;
    gap: 3px;
    padding: 0;
    font-family: 'Podkova', serif;
    font-weight: 700;
    font-size: 13px;
  }
  .tab span {
    display: inline;
  }
  .tab.is-active::after {
    top: 0;
    bottom: auto;
  }
}
</style>
