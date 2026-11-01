<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePurchaseStore } from '../stores/purchase'
import HowToJoin from '../components/HowToJoin.vue'
import ModHighlights from '../components/ModHighlights.vue'
import FaqSection from '../components/FaqSection.vue'
import LoreBrokerSection from '../components/LoreBrokerSection.vue'
import { Download, Gamepad } from '../lib/icons'
import { scrollToSection } from '../lib/scroll'
const route = useRoute(); const purchase = usePurchaseStore()
onMounted(() => { if (route.query.purchase === '1') purchase.showPass() })

function scrollToContent() {
  // Цель — блок этапов (#stages в HowToJoin).
  scrollToSection('#stages')
}
</script>
<template>
<main class="w-full flex-1 flex flex-col items-center text-[var(--text-main)]">
  <!-- Первый экран повторяет лаунчер: большой скриншот и снизу панель запуска -->
  <section class="hero">
    <div class="hero-art" aria-hidden="true" />
    <div class="hero-in">
      <h1 class="hero-title">MISTRALY</h1>
      <p class="hero-lead">Физика полетов, дирижабли, кастомный лаунчер и закрытое сообщество без гриферов и лишнего мусора.</p>
    </div>

    <div class="dither dither--bar" aria-hidden="true" />
    <div class="bar">
      <div class="bar-in">
        <div class="bar-side">
          <span class="mc-slot bar-slot"><Gamepad :size="24" /></span>
          <div class="min-w-0">
            <div class="bar-title">Mistraly</div>
            <div class="bar-note">Minecraft 1.21.1 · NeoForge</div>
          </div>
        </div>
        <button class="mc-btn mc-btn--lg bar-play" @click="scrollToContent">ИГРАТЬ</button>
        <div class="bar-side bar-side--end">
          <router-link to="/download" class="mc-btn mc-btn--muted mc-btn--sm">
            <Download :size="24" />
            Скачать лаунчер
          </router-link>
        </div>
      </div>
      <ul class="facts" aria-label="О сервере">
        <li><span>Модов</span> 140+</li>
        <li><span>Вход</span> через лаунчер</li>
      </ul>
    </div>
  </section>

  <ModHighlights />
  <FaqSection />
  <section id="how-to-play" class="w-full max-w-5xl px-4 pt-20">
    <div class="section-head" style="margin-bottom:8px">
      <h2 class="section-title">Но как <a href="#stages" class="word-hl" @click.prevent="scrollToContent">поиграть</a>-то?</h2>
      <p class="section-sub">3 телодвижения</p>
    </div>
  </section>
  <HowToJoin />
  <LoreBrokerSection feature-image="/images/shots/bay.webp" />
</main>
</template>

<style scoped>
.hero {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: calc(100vh - 64px);
  overflow: hidden;
}
.hero-art {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(18, 18, 18, 0.45) 0%, rgba(18, 18, 18, 0.2) 45%, rgba(18, 18, 18, 0.6) 100%),
    url(/images/shots/lake.webp) center 35% / cover no-repeat;
}
.hero-in {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px 32px;
  text-align: center;
}
/* Размеры кратны 8, иначе пиксели шрифта станут разной ширины. Тень нужна
   только для читаемости на светлом небе. */
.hero-title {
  margin: 0 0 24px;
  color: #fff;
  font-size: 120px;
  line-height: 1;
  text-shadow: 0 6px 0 rgba(5, 5, 5, 0.6);
}
.hero-lead {
  max-width: 620px;
  margin: 0;
  padding: 8px 16px;
  background: rgba(12, 12, 12, 0.72);
  color: #fff;
  font-size: 19px;
  line-height: 1.45;
}

.dither--bar {
  position: relative;
  flex: none;
  height: 32px;
  background-image: url(/images/ui/dither-panel.png);
  background-size: 16px 32px;
}
.bar {
  position: relative;
  background: var(--panel);
  box-shadow: 0 3px 0 0 var(--ink);
}
.bar-in {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px 12px;
}
.bar-play {
  margin-top: -14px;
}
.bar-side {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}
.bar-side--end {
  justify-content: flex-end;
}
.bar-slot {
  width: 48px;
  height: 48px;
}
.bar-title {
  font-family: 'Noto Sans', 'Helvetica Neue', Arial, sans-serif;
  font-weight: 700;
  font-size:16px;
  line-height: 1.2;
}
.bar-note {
  color: var(--text-muted);
  font-size: 15px;
}
.facts {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 4px 28px;
  margin: 0;
  padding: 7px 16px 8px;
  background: var(--well);
  color: var(--text-main);
  font-size: 15px;
  list-style: none;
}
.facts span {
  color: var(--text-sub);
}

@media (max-width: 860px) {
  .hero-title {
    font-size: 80px;
  }
}
@media (max-width: 640px) {
  .hero {
    min-height: calc(100vh - 56px - 64px);
  }
  .hero-title {
    font-size: 48px;
  }
  .hero-lead {
    font-size: 17px;
  }
  .bar-in {
    grid-template-columns: 1fr;
    justify-items: stretch;
    gap: 12px;
    text-align: center;
  }
  .bar-play {
    order: -1;
    width: 100%;
    padding-left: 12px;
    padding-right: 12px;
  }
  .bar-side {
    justify-content: center;
  }
  .bar-side:first-of-type {
    display: none;
  }
  .bar-side--end .mc-btn {
    flex: 1;
  }
}
</style>
