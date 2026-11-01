<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePurchaseStore } from '../stores/purchase'
import HowToJoin from '../components/HowToJoin.vue'
import ModHighlights from '../components/ModHighlights.vue'
import FaqSection from '../components/FaqSection.vue'
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
      <p class="hero-lead">Ванилла плюс: привычный Minecraft с продуманными улучшениями, свой лаунчер и закрытое сообщество без гриферов и лишнего мусора.</p>
    </div>

    <div class="bar">
      <div class="bar-in">
        <div class="bar-side">
          <span class="mc-slot bar-slot"><Gamepad :size="20" /></span>
          <div class="min-w-0">
            <div class="bar-title">Mistraly</div>
            <div class="bar-note">Minecraft 26.3 · NeoForge</div>
          </div>
        </div>
        <button class="mc-btn mc-btn--lg" @click="scrollToContent">ИГРАТЬ</button>
        <div class="bar-side bar-side--end">
          <router-link to="/download" class="mc-btn mc-btn--muted mc-btn--sm">
            <Download :size="24" />
            Скачать лаунчер
          </router-link>
        </div>
      </div>
    </div>
  </section>

  <ModHighlights />
  <FaqSection />
  <section id="how-to-play" class="w-full max-w-5xl px-4 pt-6">
    <div class="section-head" style="margin-bottom:0">
      <h2 class="section-title">Но как <a href="#stages" class="word-hl" @click.prevent="scrollToContent">поиграть</a>-то?</h2>
      <p class="section-sub">3 телодвижения</p>
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
  min-height: min(620px, calc(100vh - 48px));
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
/* Размеры кратны 8, иначе пиксели шрифта станут разной ширины. Тень нужна
   только для читаемости на светлом небе. */
.hero-title {
  margin: 0 0 16px;
  color: #fff;
  font-size: 80px;
  line-height: 1;
  text-shadow: 0 6px 0 rgba(5, 5, 5, 0.6);
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

.bar {
  position: relative;
  background: linear-gradient(180deg, var(--head-c), var(--head-lo));
  box-shadow: inset 0 2px 0 0 var(--blue), 0 2px 0 0 var(--ink);
}
.bar-in {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px 16px;
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
  width: 40px;
  height: 40px;
}
.bar-title {
  font-family: 'Noto Sans', 'Helvetica Neue', Arial, sans-serif;
  font-weight: 700;
  font-size: 15px;
  line-height: 1.2;
}
.bar-note {
  color: var(--text-muted);
  font-size: 13px;
}

@media (max-width: 640px) {
  .hero {
    min-height: calc(100vh - 48px - 56px);
  }
  .hero-title {
    font-size: 48px;
  }
  .bar-in {
    grid-template-columns: 1fr;
    justify-items: stretch;
    gap: 12px;
    text-align: center;
  }
  .bar-in > .mc-btn {
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
