<script setup lang="ts">
import { useRoute } from 'vue-router'
import {
  Home,
  ShoppingBag,
  ScrollText,
} from 'lucide-vue-next'

const route = useRoute()
const username = 'Nio'

// У каждой вкладки своя индивидуальная форма среза (clipPath)
const tabs = [
  {
    to: '/',
    label: 'Главная',
    icon: Home,
    exact: true,
    color: '#0099FF',
    clipPath: 'polygon(0% 0%, 100% 0%, 100% 86%, 0% 100%)' // легкий скос влево-вниз
  },
  {
    to: '/shop',
    label: 'Магазин',
    icon: ShoppingBag,
    color: '#FFCC00',
    clipPath: 'polygon(0% 0%, 100% 0%, 98% 100%, 2% 88%)' // скос вправо-вниз
  },
  {
    to: '/rules',
    label: 'Правила',
    icon: ScrollText,
    color: '#FF4444',
    clipPath: 'polygon(0% 0%, 100% 0%, 99% 88%, 1% 100%)' // диагональный срез
  },
]

function isActive(tab: { to: string; exact?: boolean }) {
  return tab.exact ? route.path === tab.to : route.path.startsWith(tab.to)
}
</script>

<template>
  <header class="fixed top-0 left-0 right-0 z-50 flex items-start justify-center pointer-events-none">
    <nav class="nav-scroll flex items-start gap-1.5 pointer-events-auto">
      <!-- Навигационные вкладки разной формы -->
      <router-link
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        class="nav-tab group"
        :class="{ 'is-active': isActive(tab) }"
        :style="{ '--accent': tab.color }"
      >
        <!-- Персональный срез формы для каждой кнопки (БЕЗ BORDER!) -->
        <span
          class="tab-shape"
          :style="{ clipPath: tab.clipPath }"
        />

        <!-- Контент вкладки -->
        <span class="tab-body">
          <component :is="tab.icon" class="tab-icon shrink-0" :size="15" />
          <span class="tab-text font-heading font-black tracking-tight">
            {{ tab.label }}
          </span>
        </span>
      </router-link>

      <!-- Тонкий разделитель -->
      <div class="h-6 w-px bg-white/10 mx-1 mt-2 self-start" />

      <!-- Профиль игрока со своей формой -->
      <router-link
        to="/profile"
        class="nav-tab profile-tab group"
        :class="{ 'is-active': route.path === '/profile' }"
        :style="{ '--accent': '#0099FF' }"
      >
        <span
          class="tab-shape"
          style="clip-path: polygon(0% 0%, 100% 0%, 100% 89%, 0% 100%);"
        />
        <span class="tab-body">
          <span class="avatar-badge font-heading font-black">
            {{ username[0] }}
          </span>
          <span class="tab-text font-heading font-black tracking-tight">
            {{ username }}
          </span>
        </span>
      </router-link>
    </nav>
  </header>
</template>

<style scoped>
/*
 * Позиционирование вкладок:
 * В покое подняты вверх (-7px).
 * Жесткая тень 6px 6px без блюра в стиле сайта.
 */
.nav-tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  cursor: pointer;
  user-select: none;
  transform: translateY(-7px);
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1),
              filter 0.2s ease;
  filter: drop-shadow(6px 6px 0px rgba(0, 0, 0, 0.45));
}

/*
 * 100% ЧИСТАЯ ФОРМА:
 * Никаких border, outline или box-shadow!
 * Только сплошная заливка, чтобы видеокарта не рисовала белые пиксели по краям.
 */
.tab-shape {
  position: absolute;
  inset: 0;
  background-color: #161719;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  transition: background-color 0.18s ease;
  z-index: 0;
}

/* Содержимое вкладки */
.tab-body {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 13px 16px 9px 14px;
  color: rgba(255, 255, 255, 0.65);
  transition: color 0.18s ease;
}

.tab-text {
  font-size: 13px;
  white-space: nowrap;
}

.tab-icon {
  opacity: 0.75;
  transition: opacity 0.18s ease, transform 0.18s ease;
}

/* =========================================
   НАВЕДЕНИЕ (ВЫЕЗД ВНИЗ)
   ========================================= */
.nav-tab:hover {
  transform: translateY(0px);
  z-index: 10;
  filter: drop-shadow(8px 8px 0px rgba(0, 0, 0, 0.55));
}

.nav-tab:hover .tab-shape {
  background-color: var(--accent);
}

.nav-tab:hover .tab-body {
  color: #FFFFFF;
}

.nav-tab:hover .tab-icon {
  opacity: 1;
  transform: scale(1.08);
}

/* =========================================
   АКТИВНАЯ ВКЛАДКА (ВСЕГДА ВЫДВИНУТА)
   ========================================= */
.nav-tab.is-active {
  transform: translateY(1px);
  z-index: 5;
}

.nav-tab.is-active .tab-shape {
  background-color: var(--accent);
}

.nav-tab.is-active .tab-body {
  color: #FFFFFF;
}

.nav-tab.is-active .tab-icon {
  opacity: 1;
}

/* =========================================
   ПРОФИЛЬ
   ========================================= */
.avatar-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 17px;
  height: 17px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 2px;
  font-size: 11px;
  line-height: 1;
  color: #FFFFFF;
}

/* ============================================
   ТЕЛЕФОНЫ
   ============================================
   Шесть вкладок не помещались в 375px: nav был 639px шириной,
   поэтому «Магазин» и «Загрузки» обрезались по краям экрана.
   Ужимаем вкладки и разрешаем горизонтальную прокрутку,
   если всё равно не влезло. */
@media (max-width:640px) {
  .nav-tab {
    transform: translateY(-5px);
    filter: drop-shadow(4px 4px 0px rgba(0, 0, 0, 0.45));
  }

  .tab-body {
    gap: 5px;
    padding: 10px 10px 7px 9px;
  }

  .tab-text {
    font-size: 11px;
  }

  .avatar-badge {
    width: 14px;
    height: 14px;
    font-size: 9px;
  }

  /* Подстраховка: если вкладки всё же шире экрана — прокрутка,
     иначе крайние пункты просто недоступны. */
  .nav-scroll {
    overflow-x: auto;
    max-width: 100vw;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }

  .nav-scroll::-webkit-scrollbar {
    display: none;
  }
}
</style>
