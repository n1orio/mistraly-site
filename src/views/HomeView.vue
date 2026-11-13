<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePurchaseStore } from '../stores/purchase'
import HowToJoin from '../components/HowToJoin.vue'
import TitleLogo from '../components/TitleLogo.vue'
import ModHighlights from '../components/ModHighlights.vue'
import FaqSection from '../components/FaqSection.vue'
import { Download, ArrowRight } from '../lib/icons'
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
      <TitleLogo />
      <p class="hero-lead">Ванилла плюс: привычный Minecraft с продуманными улучшениями, свой лаунчер и закрытое сообщество без гриферов и лишнего мусора.</p>
    </div>

    <div class="dither dither--bar" aria-hidden="true" />
    <div class="bar">
      <div class="bar-in">
        <button class="mc-btn bar-play" @click="scrollToContent">
          <span>ИГРАТЬ</span><ArrowRight :size="24" />
        </button>
        <router-link to="/download" class="mc-btn mc-btn--muted bar-download">
          <Download :size="24" />
          <span>Скачать лаунчер</span>
        </router-link>
      </div>
    </div>
  </section>

  <ModHighlights />
  <FaqSection />
  <section id="how-to-play" class="w-full max-w-5xl px-4 pt-14">
    <div class="section-head" style="margin-bottom:0">
      <h2 class="section-title">Но как <a href="#stages" class="word-hl" @click.prevent="scrollToContent">поиграть</a>-то?</h2>
    </div>
  </section>
  <HowToJoin />
</main>
</template>

<style scoped>
.hero {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: min(680px, calc(100vh - 64px));
  overflow: hidden;
}
.hero-art {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(16, 18, 24, 0.45) 0%, rgba(16, 18, 24, 0.2) 45%, rgba(16, 18, 24, 0.7) 100%),
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
.hero-lead {
  max-width: 620px;
  margin: 0;
  padding: 6px 12px;
  background: rgba(8, 9, 12, 0.72);
  color: #fff;
  font-size: 16px;
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
  box-shadow: 0 2px 0 0 var(--ink);
}
.bar-in {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: stretch;
  gap: 16px;
  width: 100%;
  max-width: 620px;
  margin: 0 auto;
  padding: 4px 20px 24px;
}
.bar-play, .bar-download {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 56px;
  gap: 12px;
  padding: 12px 20px;
}
.bar-play, .bar-download {
  transition: transform 160ms ease-out, box-shadow 160ms ease-out, filter 160ms ease-out;
}
@media (hover: hover) {
  .bar-play:hover:not(:active), .bar-download:hover:not(:active) {
    transform: translateY(-3px);
    filter: brightness(1.12);
    box-shadow: inset 0 calc(var(--inset) * -1) 0 var(--lip), inset 0 var(--inset) 0 var(--top),
      0 calc(var(--depth) + 3px) 0 var(--side), 0 calc(var(--depth) + 5px) 0 var(--ink);
  }
}
@media (prefers-reduced-motion: reduce) {
  .bar-play, .bar-download { transition: none; }
}
.bar-play { font-size: 18px; letter-spacing: .04em; }
.bar-download { font-size: 15px; }
@media (max-width: 640px) {
  .hero { min-height: calc(100vh - 56px - 64px); }
  .bar-in { grid-template-columns: 1fr; max-width: 400px; gap: 12px; }
}
</style>
