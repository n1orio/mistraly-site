<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { usePurchaseStore } from '../stores/purchase'
import HowToJoin from '../components/HowToJoin.vue'
import Gear3D from '../components/Gear3D.vue'
import ModHighlights from '../components/ModHighlights.vue'
const route = useRoute(); const purchase = usePurchaseStore()
onMounted(() => { if (route.query.purchase === '1') purchase.show() })
const playHover = ref(false)
const slideCount = 3
// карусель скрыта: управляется одним флагом
const showCarousel = ref(false)
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
const screenshots = ['/2026-09-27_20.07.26.png', '/2026-09-27_20.07.35.png', '/2026-09-27_20.07.54.png']
const currentSlide = ref(0)
let slideTimer: any
function startSlideShow() { slideTimer = setInterval(() => { currentSlide.value = (currentSlide.value + 1) % screenshots.length }, 4000) }
function prevSlide() { currentSlide.value = (currentSlide.value - 1 + screenshots.length) % screenshots.length }
function nextSlide() {
 if (currentSlide.value >= screenshots.length - 1) { currentSlide.value = 0; return }
 currentSlide.value++
}
onMounted(() => {
  startSlideShow()
  updateGearOpacity()
  window.addEventListener('scroll', updateGearOpacity, { passive: true })
})
onUnmounted(() => {
  clearInterval(slideTimer)
  window.removeEventListener('scroll', updateGearOpacity)
  if (gearRaf) cancelAnimationFrame(gearRaf)
})
function scrollToContent() {
  // Цель — блок этапов (#stages в HowToJoin). Раньше тут был #roadmap,
  // но секция трекера удалена, и клик по «поиграть» ничего не делал.
  const el = document.querySelector('#stages')
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

</script>
<template><svg style="position:absolute;width:0;height:0;pointer-events:none" aria-hidden="true">
  <defs>
    <filter id="torn-1" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.045 0.05" numOctaves="4" result="noise" seed="12"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="9" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="torn-2" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.04 0.055" numOctaves="4" result="noise" seed="48"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="8" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="torn-3" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.05 0.045" numOctaves="4" result="noise" seed="91"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="10" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </defs>
</svg><main class="w-full flex-1 flex flex-col items-center page-bg bg-[var(--bg-page)] text-[var(--text-main)]"><section class="relative w-full overflow-hidden page-bg bg-[var(--bg-page)]" style="margin-top:-64px;padding-top:clamp(110px,24vw,260px);padding-bottom:64px;">
  <div class="relative">
    <div class="relative z-10 mx-auto w-full max-w-4xl px-6 pb-24 pt-4 text-center">
      <div class="relative mb-4 mt-6 sm:mt-14 inline-block">
        <!-- шестерня Create позади заголовка -->
        <div class="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[150px] md:-translate-y-[430px] -z-10 will-change-opacity" :style="{ opacity: gearOpacity }">
          <Gear3D :size="1100" :speed="20" :dim="0.55" />
        </div>
        <h1 class="font-heading text-5xl sm:text-8xl md:text-9xl text-white tracking-tight leading-[1.05] relative">MISTRALY</h1>
      </div>
      <p class="text-base sm:text-lg text-[var(--text-muted)] max-w-2xl mx-auto mb-10 leading-relaxed">Физика полетов, дирижабли, кастомный лаунчер и закрытое сообщество без гриферов и лишнего мусора.</p>
      <div class="flex flex-wrap items-center justify-center gap-2">
        <div style="display:inline-flex;filter:drop-shadow(14px 14px 0 rgba(0,0,0,0.35))"><button @click="scrollToContent" @mouseenter="playHover = true" @mouseleave="playHover = false" class="font-heading font-black text-lg sm:text-xl cursor-pointer" :style="{background: playHover ? 'white' : '#0099FF', padding: '16px 48px', clipPath: 'polygon(0% 12%,100% 0%,100% 100%,0% 88%)', transform: playHover ? 'rotate(-1.5deg) scale(1.06)' : 'rotate(-1.5deg)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 'none', textAlign: 'center', color: playHover ? 'black' : 'white', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)'}">ИГРАТЬ</button></div>
      </div>
    </div>

    <div v-if="showCarousel" class="pb-2 pt-24 overflow-hidden">
      <div class="mx-auto w-full min-w-0 px-2" style="max-width:2200px;">
        <div class="relative w-full" role="region" aria-roledescription="carousel">

          <div class="overflow-hidden py-4" style="-webkit-mask-image:linear-gradient(to right,transparent 0%,black 12%,black 88%,transparent 100%);mask-image:linear-gradient(to right,transparent 0%,black 12%,black 88%,transparent 100%)">
            <div class="flex transition-transform duration-500 ease-in-out"
                 :style="{ transform: 'translateX(calc(-' + (currentSlide * (100 / slideCount)) + '%))' }">

              <!-- Основные слайды -->
              <div v-for="(img, i) in screenshots" :key="i" role="group" aria-roledescription="slide"
                   class="min-w-0 shrink-0 grow-0 px-2.5 transition-transform duration-300 hover:scale-[1.02] hover:z-10"
                   style="flex-basis:33.3333%">
                <div class="relative"
                     :style="{
                       filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.45)) drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                       transform: 'rotate(' + (i % 3 === 0 ? '-1.2deg' : (i % 3 === 1 ? '1.4deg' : '-0.7deg')) + ')'
                     }">
                  <div class="p-2 pb-3 bg-[#f5f0e6] dark:bg-[#2B2B2B] border border-black/5 dark:border-white/5"
                       :style="{ filter: 'url(#torn-' + ((i % 3) + 1) + ')' }">
                    <div class="overflow-hidden bg-black/20">
                      <img :src="img" alt="" draggable="false" loading="lazy"
                           class="w-full aspect-video object-cover select-none block" pixel-art />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Дубликаты для бесконечного скролла -->
              <div v-for="(img, i) in screenshots.slice(0, 4)" :key="'d'+i" role="group" aria-roledescription="slide"
                   class="min-w-0 shrink-0 grow-0 px-2.5 transition-transform duration-300 hover:scale-[1.02] hover:z-10"
                   style="flex-basis:33.3333%">
                <div class="relative"
                     :style="{
                       filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.45)) drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                       transform: 'rotate(' + (i % 3 === 0 ? '-1.2deg' : (i % 3 === 1 ? '1.4deg' : '-0.7deg')) + ')'
                     }">
                  <div class="p-2 pb-3 bg-[#f5f0e6] dark:bg-[#2B2B2B] border border-black/5 dark:border-white/5"
                       :style="{ filter: 'url(#torn-' + ((i % 3) + 1) + ')' }">
                    <div class="overflow-hidden bg-black/20">
                      <img :src="img" alt="" draggable="false" loading="lazy"
                           class="w-full aspect-video object-cover select-none block" pixel-art />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- Кнопки управления -->
          <button @click="prevSlide" aria-label="Предыдущий слайд"
                  class="absolute -left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition border border-white/20 shadow-lg cursor-pointer">
            <ChevronLeft :size="20" />
          </button>
          <button @click="nextSlide" aria-label="Следующий слайд"
                  class="absolute -right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition border border-white/20 shadow-lg cursor-pointer">
            <ChevronRight :size="20" />
          </button>

        </div>
      </div>
    </div>
  </div>
</section>
<ModHighlights />
<section id="how-to-play" class="w-full max-w-5xl px-4 pt-8 pb-2">
  <div class="text-center mb-4">
    <h2 class="font-heading text-2xl sm:text-3xl text-[var(--text-main)] tracking-tight mb-2">Но как <a href="#stages" class="play-cta" @click.prevent="scrollToContent">поиграть</a>-то?</h2>
    <p class="text-xs sm:text-sm text-[var(--text-muted)]">Коротко о том, что нужно, чтобы попасть на сервер</p>
  </div>
</section>
<HowToJoin />
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
</style>
