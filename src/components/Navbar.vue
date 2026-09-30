<script setup lang="ts">
import { useRoute } from 'vue-router'
import { ref } from 'vue'

const route = useRoute()
const username = 'Nio'

const tabs = [
 { to: '/', label: 'О Breeze', icon: 'logo', exact: true },
 { to: '/shop', label: 'Магазин', icon: 'shop' },
 { to: '/faq', label: 'FAQ', icon: 'faq' },
]

function isActive(tab: { to: string; exact?: boolean }) {
 return tab.exact ? route.path === tab.to : route.path.startsWith(tab.to)
}


</script>
<template>
 <header class="fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-3 px-4 pointer-events-none" style="background:linear-gradient(to bottom,rgba(0,0,0,0.6) 0%,transparent 100%)">
  <div class="flex items-center gap-2 pointer-events-auto">
   <router-link
    v-for="(tab, i) in tabs"
    :key="tab.to"
    :to="tab.to"
    class="font-cinzel font-black text-xs text-white cursor-pointer"
    :style="{
      background: isActive(tab) ? '#0099FF' : 'rgba(255,255,255,0.08)',
      padding: '8px 28px 8px 14px',
      clipPath: 'polygon(0% 15%,100% 0%,100% 100%,0% 85%)',
      transform: i % 2 === 0 ? 'rotate(-1deg)' : 'rotate(0.5deg)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: 'none',
      textAlign: 'center',
      color: isActive(tab) ? 'white' : 'rgba(255,255,255,0.7)',
      transition: 'all 0.15s',
      textDecoration: 'none'
    }"
   >{{ tab.label }}</router-link>

<a
    href="https://t.me"
    target="_blank"
    rel="noopener"
    :style="{
      background: 'rgba(255,255,255,0.08)',
      padding: '8px 20px 8px 10px',
      clipPath: 'polygon(0% 15%,100% 0%,100% 100%,0% 85%)',
      transform: 'rotate(0.8deg)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: 'none',
      color: 'rgba(255,255,255,0.7)',
      transition: 'all 0.15s',
      textDecoration: 'none'
    }"
    title="Telegram"
   >✈</a>

<router-link
    to="/profile"
    class="font-cinzel font-black text-xs text-white"
    :style="{
      background: '#0099FF',
      padding: '8px 24px 8px 12px',
      clipPath: 'polygon(0% 15%,100% 0%,100% 100%,0% 85%)',
      transform: 'rotate(-1.2deg)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: 'none',
      textAlign: 'center',
      transition: 'all 0.15s',
      textDecoration: 'none'
    }"
   >{{ username[0] }} {{ username }}</router-link>
  </div>
 </header>
</template>>