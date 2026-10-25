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
/**
 * Заголовок — «записка из вырезанных газетных букв»: каждая буква на своём
 * клочке бумаги, со своим шрифтом, наклоном и цветом. bg/fg — фон клочка и
 * цвет буквы (подобран под фон, чтобы читалось), dots — газетный растр.
 */
type Cut = { char: string; rotate: number; shift: number; scale: number; font: string; bg: string; fg: string; dots?: boolean }
const RUSSO = "'Russo One', sans-serif"
const SERIF = "'Podkova', Georgia, serif"
const COND = "'Fira Sans Condensed', sans-serif"
const GEORGIA = "Georgia, 'Times New Roman', serif"
const titleLetters: Cut[] = [
  { char: 'M', rotate: -5, shift: 2, scale: 1.05, font: RUSSO, bg: '#0099FF', fg: '#FFFFFF' },
  { char: 'I', rotate: 4, shift: -6, scale: 0.92, font: SERIF, bg: '#FFCC00', fg: '#111111' },
  { char: 'S', rotate: -2, shift: 5, scale: 1, font: COND, bg: '#ECE5D2', fg: '#111111', dots: true },
  { char: 'T', rotate: 3, shift: -3, scale: 1.08, font: GEORGIA, bg: '#FF4444', fg: '#FFFFFF' },
  { char: 'R', rotate: -4, shift: 3, scale: 0.95, font: RUSSO, bg: '#111111', fg: '#ECE5D2' },
  { char: 'A', rotate: 2, shift: -5, scale: 1.02, font: SERIF, bg: '#4ADE80', fg: '#111111' },
  { char: 'L', rotate: -3, shift: 4, scale: 0.94, font: COND, bg: '#E05929', fg: '#111111', dots: true },
  { char: 'Y', rotate: 5, shift: -2, scale: 1.04, font: GEORGIA, bg: '#8B5CF6', fg: '#FFFFFF' },
]

/** Рваный край клочка: по три зубца на сторону, у каждой буквы свой. */
function tornScrap() {
  const r = (a: number, b: number) => (a + Math.random() * (b - a)).toFixed(1)
  return `polygon(${r(0, 6)}% ${r(0, 8)}%, ${r(30, 40)}% ${r(0, 5)}%, ${r(60, 70)}% ${r(2, 8)}%, ` +
    `${r(94, 100)}% ${r(0, 6)}%, ${r(96, 100)}% ${r(40, 60)}%, ${r(93, 100)}% ${r(92, 100)}%, ` +
    `${r(60, 70)}% ${r(94, 100)}%, ${r(30, 40)}% ${r(95, 100)}%, ${r(0, 7)}% ${r(92, 100)}%, ${r(0, 4)}% ${r(40, 60)}%)`
}
const scrapClips = titleLetters.map(tornScrap)

function cutTransform(ch: Cut) {
  return `rotate(${ch.rotate}deg) translateY(${ch.shift}px) scale(${ch.scale})`
}

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
      <div class="relative mb-8 mt-6 sm:mt-14 inline-block">
        <!-- шестерня Create позади заголовка -->
        <div class="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[150px] md:-translate-y-[430px] -z-10 will-change-opacity" :style="{ opacity: gearOpacity }">
          <Gear3D :size="1100" :speed="20" :dim="0.55" />
        </div>
        <h1 class="ransom text-[2.6rem] sm:text-7xl md:text-8xl relative flex justify-center" aria-label="MISTRALY">
          <span v-for="(ch, i) in titleLetters" :key="i" aria-hidden="true"
                class="cut" :style="{ transform: cutTransform(ch) }">
            <span class="cut-in" :class="{ 'cut--dots': ch.dots }" :style="{ animationDelay: i * 70 + 'ms', '--cut-bg': ch.bg, '--cut-fg': ch.fg }">
              <span class="cut-paper" :style="{ clipPath: scrapClips[i] }" />
              <span class="cut-char" :style="{ fontFamily: ch.font, fontWeight: ch.font === RUSSO ? 400 : 800 }">{{ ch.char }}</span>
            </span>
          </span>
        </h1>
      </div>
      <p class="text-base sm:text-lg text-[var(--text-muted)] max-w-2xl mx-auto mb-10 leading-relaxed">Физика полетов, дирижабли, кастомный лаунчер и закрытое сообщество без гриферов и лишнего мусора.</p>
      <div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-5">
        <div class="comic-burst" style="display:inline-flex;filter:drop-shadow(14px 14px 0 rgba(0,0,0,0.35))"><button @click="scrollToContent" @mouseenter="playHover = true" @mouseleave="playHover = false" class="font-heading font-black text-lg sm:text-xl cursor-pointer" :style="{background: playHover ? 'var(--btn-hover-bg)' : '#0099FF', padding: '16px 48px', clipPath: 'polygon(0% 12%,100% 0%,100% 100%,0% 88%)', transform: playHover ? 'rotate(-1.5deg) scale(1.06)' : 'rotate(-1.5deg)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 'none', textAlign: 'center', color: playHover ? 'var(--btn-hover-fg)' : 'white', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)'}">ИГРАТЬ</button></div>
        <div class="comic-burst hero-dl-wrap"><router-link to="/download" class="hero-dl font-heading">Скачать лаунчер</router-link></div>
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

/* Вторичная кнопка hero: чёрная плашка формы «Играть», но со скосом в
   другую сторону (зеркально), со светлым контуром (две подложки: бумага и тушь поверх с отступом — у
   clip-path нет border). На ховере заливка пропадает и за кнопкой
   проявляется газетная вырезка (lib/newsBurst.ts), как у «Играть». */
.hero-dl-wrap {
  display: inline-flex;
  /* Газетная вырезка на ховере тоже зеркальная. */
  --np-flip: 1;
  filter: drop-shadow(10px 10px 0 rgba(0, 0, 0, 0.35));
}
.hero-dl {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 14px 30px;
  color: #ECE5D2;
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  text-decoration: none;
  transform: rotate(1.5deg);
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.2s ease;
}
.hero-dl::before,
.hero-dl::after {
  content: '';
  position: absolute;
  z-index: -1;
  clip-path: polygon(0% 0%, 100% 12%, 100% 88%, 0% 100%);
  transition: background-color 0.2s ease;
}
.hero-dl::before {
  inset: 0;
  background-color: #ECE5D2;
}
.hero-dl::after {
  inset: 2.5px;
  background-color: #111;
}
.hero-dl:hover {
  color: #111;
  transform: rotate(1.5deg) scale(1.05);
}
.hero-dl:hover::before,
.hero-dl:hover::after {
  background-color: transparent;
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

/* =========================================================
   ЗАГОЛОВОК ИЗ ВЫРЕЗАННЫХ БУКВ
   Russo One — только 400 (синтетическое утолщение ломает её), остальные
   шрифты — 800, иначе засечные буквы выглядят тонкими рядом с рубленой.
   .cut — наклон (inline transform), .cut-in — появление:
   анимация на отдельном элементе, иначе её transform перебил бы inline.
   ========================================================= */
.ransom {
  gap: 0.02em;
  line-height: 1;
  font-weight: 400;
}
.cut {
  display: inline-block;
  will-change: transform;
}
.cut-in {
  position: relative;
  display: inline-block;
  padding: 0.1em 0.14em 0.06em;
  /* Контур тушью и жёсткая тень — на элементе без clip-path. */
  filter: drop-shadow(2px 0 0 #111) drop-shadow(-2px 0 0 #111) drop-shadow(0 2px 0 #111)
          drop-shadow(0 -2px 0 #111) drop-shadow(6px 6px 0 rgba(0, 0, 0, 0.45));
  animation: cut-in 0.4s steps(1, end) both;
}
@keyframes cut-in {
  0% { opacity: 0; }
  1% { opacity: 1; transform: scale(0.35) rotate(-16deg); }
  25% { transform: scale(0.8) rotate(9deg); }
  50% { transform: scale(1.12) rotate(-4deg); }
  75% { transform: scale(0.97) rotate(1deg); }
  100% { opacity: 1; transform: none; }
}
.cut-paper {
  position: absolute;
  inset: 0;
  background: var(--cut-bg);
}
.cut-char {
  position: relative;
  display: block;
  color: var(--cut-fg);
}
/* Растр проступает к краям клочка, в центре под буквой — чистый фон. */
.cut--dots .cut-paper {
  background:
    radial-gradient(ellipse closest-side, var(--cut-bg) 50%, transparent 100%),
    radial-gradient(circle, rgba(17, 17, 17, 0.5) 32%, transparent 38%) 0 0 / 6px 6px,
    var(--cut-bg);
}

@media (prefers-reduced-motion: reduce) {
  .cut-in {
    animation: none;
  }
}
</style>
