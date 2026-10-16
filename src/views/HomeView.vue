<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePurchaseStore } from '../stores/purchase'
import HowToJoin from '../components/HowToJoin.vue'
import Gear3D from '../components/Gear3D.vue'
import ModHighlights from '../components/ModHighlights.vue'
import FaqSection from '../components/FaqSection.vue'
import LoreBrokerSection from '../components/LoreBrokerSection.vue'
import { scrollToSection } from '../lib/scroll'
const route = useRoute(); const purchase = usePurchaseStore()
onMounted(() => { if (route.query.purchase === '1') purchase.showPass() })
const playHover = ref(false)
/** прозрачность шестерёнки: 1 наверху, 0 после ~260px скролла */
const gearOpacity = ref(1)
let gearRaf = 0
function updateGearOpacity() {
 if (gearRaf) return
 gearRaf = requestAnimationFrame(() => {
  gearRaf = 0
  gearOpacity.value = Math.max(0, 1 - window.scrollY / 260)
 })
}
/** каждая буква заголовка повёрнута в свою сторону */
const titleLetters = [
  { char: 'M', rotate: -4, shift: 1 },
  { char: 'I', rotate: 2, shift: -3 },
  { char: 'S', rotate: -2, shift: 4 },
  { char: 'T', rotate: 3, shift: -1 },
  { char: 'R', rotate: -3, shift: 2 },
  { char: 'A', rotate: 1, shift: -4 },
  { char: 'L', rotate: -1, shift: 3 },
  { char: 'Y', rotate: 4, shift: 4 },
]
onMounted(() => {
  updateGearOpacity()
  window.addEventListener('scroll', updateGearOpacity, { passive: true })
})
onUnmounted(() => {
  window.removeEventListener('scroll', updateGearOpacity)
  if (gearRaf) cancelAnimationFrame(gearRaf)
})

function scrollToContent() {
  // Цель — блок этапов (#stages в HowToJoin). Раньше тут был #roadmap,
  // но секция трекера удалена, и клик по «поиграть» ничего не делал.
  scrollToSection('#stages')
}

</script>
<template><main class="w-full flex-1 flex flex-col items-center page-bg bg-[var(--bg-page)] text-[var(--text-main)]"><section class="relative w-full overflow-hidden page-bg bg-[var(--bg-page)]" style="margin-top:-64px;padding-top:clamp(110px,24vw,260px);padding-bottom:40px;">
  <div class="relative">
    <div class="relative z-10 mx-auto w-full max-w-4xl px-6 pb-12 pt-4 text-center">
      <div class="relative mb-4 mt-6 sm:mt-14 inline-block">
        <!-- шестерня Create позади заголовка -->
        <div class="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[150px] md:-translate-y-[430px] -z-10 will-change-opacity" :style="{ opacity: gearOpacity }">
          <Gear3D :size="1100" :speed="20" :dim="0.55" />
        </div>
        <h1 class="font-heading text-5xl sm:text-8xl md:text-9xl text-white tracking-tight leading-[1.05] relative flex justify-center" aria-label="MISTRALY">
          <span v-for="(ch, i) in titleLetters" :key="i" aria-hidden="true"
                class="title-letter inline-block will-change-transform"
                :style="{ transform: 'rotate(' + ch.rotate + 'deg) translateY(' + ch.shift + 'px)' }">{{ ch.char }}</span>
        </h1>
      </div>
      <p class="text-base sm:text-lg text-[var(--text-muted)] max-w-2xl mx-auto mb-10 leading-relaxed">Физика полетов, дирижабли, кастомный лаунчер и закрытое сообщество без гриферов и лишнего мусора.</p>
      <div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-5">
        <div style="display:inline-flex;filter:drop-shadow(14px 14px 0 rgba(0,0,0,0.35))"><button @click="scrollToContent" @mouseenter="playHover = true" @mouseleave="playHover = false" class="font-heading font-black text-lg sm:text-xl cursor-pointer" :style="{background: playHover ? 'white' : '#0099FF', padding: '16px 48px', clipPath: 'polygon(0% 12%,100% 0%,100% 100%,0% 88%)', transform: playHover ? 'rotate(-1.5deg) scale(1.06)' : 'rotate(-1.5deg)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 'none', textAlign: 'center', color: playHover ? 'black' : 'white', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)'}">ИГРАТЬ</button></div>
        <router-link to="/download" class="hero-secondary font-heading">Скачать лаунчер</router-link>
      </div>
      <!-- Коротко о сервере: что за версия и как попасть. Раньше под кнопкой
           не было ничего, кроме пустоты до следующей секции. -->
      <ul class="hero-facts" aria-label="О сервере">
        <li><span>Minecraft</span>1.21.1</li>
        <li><span>Загрузчик</span>NeoForge</li>
        <li><span>Модов</span>140+</li>
        <li><span>Вход</span>через лаунчер</li>
      </ul>
    </div>
  </div>
</section>
<ModHighlights />
<FaqSection />
<section id="how-to-play" class="w-full max-w-5xl px-4 pt-20 pb-10">
  <div class="text-center mb-5">
    <h2 class="font-heading text-2xl sm:text-3xl text-[var(--text-main)] tracking-tight mb-2">Но как <a href="#stages" class="play-cta" @click.prevent="scrollToContent">поиграть</a>-то?</h2>
    <p class="text-xs sm:text-sm text-[var(--text-muted)]">3 телодвижения</p>
  </div>
</section>
<HowToJoin />
<LoreBrokerSection />
</main></template>

<style scoped>
/* Выделенное слово «поиграть» внутри заголовка «Но как поиграть-то?».
   Кликабельно и ведёт к этапам (#stages), но выглядит статично: без
   hover-эффектов, чтобы плашка не «оживала» под курсором. */
.play-cta {
  display: inline-block;
  color: #181611;
  background: #e05929;
  font-weight: 400;
  padding: 0 0.28em;
  margin: 0 0.04em;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
  transform: rotate(-1.5deg);
  cursor: pointer;
  user-select: none;
}

/* Вторичная кнопка hero: тот же наклон, но без заливки — не спорит
   с «Играть». */
.hero-secondary {
  /* Теперь это ссылка: без inline-block поворот не применяется. */
  display: inline-block;
  padding: 14px 6px;
  border: none;
  background: none;
  color: var(--text-main);
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  text-decoration: underline;
  text-decoration-thickness: 3px;
  text-underline-offset: 7px;
  text-decoration-color: #0099ff;
  transform: rotate(-1.5deg);
  cursor: pointer;
  transition: color 0.2s ease, text-decoration-color 0.2s ease;
}
.hero-secondary:hover {
  text-decoration-color: currentColor;
}

/* Плашки-факты под кнопками: тот же язык, что этикетки на сайте. */
.hero-facts {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin: 40px 0 0;
  padding: 0;
  list-style: none;
}
.hero-facts li {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  padding: 7px 13px;
  background: rgba(0, 0, 0, 0.45);
  clip-path: polygon(0% 10%, 100% 0%, 100% 100%, 0% 90%);
  font-size: 14px;
  color: var(--text-main);
}
.hero-facts li span {
  font-family: 'Russo One', sans-serif;
  font-weight: 400;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-sub);
}

/* Буквы заголовка «MISTRALY»: каждая чуть повёрнута в свою сторону. */
.title-letter {
  transform-origin: 50% 60%;
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

h1:hover .title-letter {
  transform: rotate(0deg) translateY(-4px) scale(1.04);
}

@media (prefers-reduced-motion: reduce) {
  .title-letter {
    transition: none;
  }
}
</style>
