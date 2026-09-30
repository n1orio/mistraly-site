<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronLeft, ChevronRight, Plane, Cpu, Shirt, ShieldCheck, Download } from 'lucide-vue-next'
import { usePurchaseStore } from '../stores/purchase'
const route = useRoute(); const purchase = usePurchaseStore(); const activePhase = ref(1)
onMounted(() => { if (route.query.purchase === '1') purchase.show() })
const playHover = ref(false)
const screenshots = ['/2026-09-27_20.07.26.png', '/2026-09-27_20.07.35.png', '/2026-09-27_20.07.54.png', '/placeholder1.svg']
const currentSlide = ref(0)
let slideTimer: any
function startSlideShow() { slideTimer = setInterval(() => { currentSlide.value = (currentSlide.value + 1) % screenshots.length }, 4000) }
function prevSlide() { currentSlide.value = (currentSlide.value - 1 + screenshots.length) % screenshots.length }
function nextSlide() {
 if (currentSlide.value >= screenshots.length - 1) { currentSlide.value = 0; return }
 currentSlide.value++
}
onMounted(startSlideShow)
onUnmounted(() => clearInterval(slideTimer))
const phases = [
 { name: 'Красная фаза', title: 'Подготовка ядра и лаунчера', desc: 'Настройка сборки Minecraft 1.21.1, интеграция мода Create Aeronautics, разработка ядра лаунчера на Rust (Tauri) и API скинов.', color: '#EF4444', status: 'Завершена' },
 { name: 'Оранжевая фаза', title: 'Физика полетов и баланс', desc: 'Тестирование физики дирижаблей, кинетических механизмов и орудий. Оптимизация сборки и закрытые стресс-тесты.', color: '#F97316', status: 'Текущий этап' },
 { name: 'Желтая фаза', title: 'Закрытый бета-тест', desc: 'Выдача первых проходок, тест стабильности сервера с игроками, проверка синхронизации Discord-аккаунтов.', color: '#EAB308', status: 'Фаза ещё не началась' },
 { name: 'Зеленая фаза', title: 'Официальный запуск', desc: 'Открытие сервера для всех обладателей проходки, старт Первого Воздушного Сезона Breeze.', color: '#22C55E', status: 'Фаза ещё не началась' }
]
function scrollToContent() {
  const el = document.querySelector('#roadmap')
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
</svg><main class="w-full flex-1 flex flex-col items-center bg-[var(--bg-page)] text-[var(--text-main)]"><section class="relative w-full overflow-hidden bg-[var(--bg-page)]" style="margin-top:-64px;padding-top:64px;">
  <div class="relative">
    <div class="bg-gradient-to-b from-zinc-50/50 to-zinc-50 dark:from-black dark:to-zinc-950 pb-6 pt-28 overflow-hidden">
      <div class="mx-auto w-full min-w-0 px-2" style="max-width:2200px;">
        <div class="relative w-full" role="region" aria-roledescription="carousel">
          
          <div class="overflow-hidden py-4" style="-webkit-mask-image:linear-gradient(to right,transparent 0%,black 12%,black 88%,transparent 100%);mask-image:linear-gradient(to right,transparent 0%,black 12%,black 88%,transparent 100%)">
            <div class="flex transition-transform duration-500 ease-in-out"
                 :style="{ transform: 'translateX(calc(-' + (currentSlide * 25) + '%))' }">
              
              <!-- Основные слайды -->
              <div v-for="(img, i) in screenshots" :key="i" role="group" aria-roledescription="slide"
                   class="min-w-0 shrink-0 grow-0 px-2.5 transition-transform duration-300 hover:scale-[1.02] hover:z-10" 
                   style="flex-basis:25%">
                <div class="relative" 
                     :style="{ 
                       filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.45)) drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                       transform: 'rotate(' + (i % 3 === 0 ? '-1.2deg' : (i % 3 === 1 ? '1.4deg' : '-0.7deg')) + ')'
                     }">
                  <div class="p-2 pb-3 bg-[#f5f0e6] dark:bg-[#201d19] border border-black/5 dark:border-white/5"
                       :style="{ filter: 'url(#torn-' + ((i % 3) + 1) + ')' }">
                    <div class="overflow-hidden bg-black/20">
                      <img :src="img" alt="" draggable="false" loading="lazy" 
                           class="w-full aspect-video object-cover select-none block" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Дубликаты для бесконечного скролла -->
              <div v-for="(img, i) in screenshots.slice(0, 4)" :key="'d'+i" role="group" aria-roledescription="slide"
                   class="min-w-0 shrink-0 grow-0 px-2.5 transition-transform duration-300 hover:scale-[1.02] hover:z-10" 
                   style="flex-basis:25%">
                <div class="relative" 
                     :style="{ 
                       filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.45)) drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                       transform: 'rotate(' + (i % 3 === 0 ? '-1.2deg' : (i % 3 === 1 ? '1.4deg' : '-0.7deg')) + ')'
                     }">
                  <div class="p-2 pb-3 bg-[#f5f0e6] dark:bg-[#201d19] border border-black/5 dark:border-white/5"
                       :style="{ filter: 'url(#torn-' + ((i % 3) + 1) + ')' }">
                    <div class="overflow-hidden bg-black/20">
                      <img :src="img" alt="" draggable="false" loading="lazy" 
                           class="w-full aspect-video object-cover select-none block" />
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
</section><section id="roadmap" class="w-full max-w-5xl py-8 px-4"><div class="bg-[var(--bg-card)] border-[var(--border-color)] p-6 sm:p-7"><div class="flex items-center justify-between text-xs font-semibold text-[var(--text-muted)] mb-6"><span class="font-heading font-bold tracking-wider">ТРЕКЕР РАЗРАБОТКИ <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="inline -mt-1 size-4"><path d="M6.5 18C4.47 18 3 16.53 3 14.5C3 12.47 4.47 11 6.5 11C6.57 11 6.64 11 6.71 11.01C6.2 10.16 6 9.22 6 8.25C6 5.36 8.36 3 11.25 3C13.76 3 15.91 4.84 16.5 7.21C17.08 7.13 17.65 7.08 18.25 7.08C20.19 7.08 21.93 7.97 23.09 9.37C21.93 8.27 20.47 7.5 18.8 7.5C15.86 7.5 13.44 9.7 13.07 12.57C12.67 12.21 12.12 12 11.5 12C10.12 12 9 13.12 9 14.5C9 15.18 9.27 15.79 9.69 16.25H6.5Z"/></svg></span><span>{{ activePhase + 1 }} из {{ phases.length }}</span></div><div class="relative w-full flex items-center justify-between mb-6 px-3"><div class="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-px bg-zinc-300 dark:bg-white/10 z-0"></div><div v-for="(phase, idx) in phases" :key="phase.name" @mouseenter="activePhase = idx" @click="activePhase = idx" class="relative z-10 flex items-center justify-center w-8 h-8 transition-all duration-200 cursor-pointer" :class="idx === activePhase ? 'bg-zinc-200/70 dark:bg-white/10 ring-1 ring-zinc-400 dark:ring-white/20' : 'bg-transparent'"><span class="w-3.5 h-3.5 transition-all duration-200" :style="{ backgroundColor: phase.color, boxShadow: idx === activePhase ? `0 0 12px ${phase.color}` : 'none' }"></span></div></div><div><div class="flex items-center gap-2.5 mb-1.5"><h3 class="font-heading font-black text-xl text-[var(--text-main)]">{{ phases[activePhase].name }}</h3><span class="text-[11px] font-semibold px-2 py-0.5 border" :style="{ color: phases[activePhase].color, borderColor: `${phases[activePhase].color}35`, backgroundColor: `${phases[activePhase].color}12` }">{{ phases[activePhase].status }}</span></div><div class="text-xs sm:text-sm font-semibold text-[var(--text-main)] mb-2">{{ phases[activePhase].title }}</div><p class="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed max-w-2xl">{{ phases[activePhase].desc }}</p></div></div></section><section class="w-full max-w-5xl py-12 pb-24 px-4"><div class="text-center mb-8"><h2 class="font-heading font-black text-2xl sm:text-3xl text-[var(--text-main)] tracking-tight mb-2">Остались вопросы?</h2><p class="text-xs sm:text-sm text-[var(--text-muted)]">Полезные страницы сайта и соцсети</p></div><div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div class="bg-[var(--bg-card)] border-[var(--border-color)] p-5 flex flex-col justify-between"><div><div class="w-9 h-9 bg-[#0099FF]/10 text-[#0099FF] flex items-center justify-center mb-4">?</div><h3 class="font-heading text-sm text-[var(--text-main)] mb-1">Часто задаваемые вопросы</h3><p class="text-xs text-[var(--text-muted)] leading-relaxed mb-5">Возможно ответ на ваш вопрос находится здесь</p></div><router-link to="/faq" class="w-full py-2.5 text-xs font-semibold text-[var(--text-muted)] dark:text-zinc-200 hover:text-[var(--text-main)] bg-zinc-100 dark:bg-white/[0.04] hover:bg-zinc-200/70 dark:hover:bg-white/[0.08] border border-zinc-200 dark:border-white/[0.08] transition flex items-center justify-center gap-1.5">Перейти к FAQ <ChevronRight :size="14" /></router-link></div><div class="bg-[var(--bg-card)] border-[var(--border-color)] p-5 flex flex-col justify-between"><div><div class="w-9 h-9 bg-[#0099FF]/10 text-[#0099FF] flex items-center justify-center mb-4">▤</div><h3 class="font-heading text-sm text-[var(--text-main)] mb-1">Вики сервера</h3><p class="text-xs text-[var(--text-muted)] leading-relaxed mb-5">Актуальная информация по моду Create и серверу</p></div><a href="#" class="w-full py-2.5 text-xs font-semibold text-[var(--text-muted)] dark:text-zinc-200 hover:text-[var(--text-main)] bg-zinc-100 dark:bg-white/[0.04] hover:bg-zinc-200/70 dark:hover:bg-white/[0.08] border border-zinc-200 dark:border-white/[0.08] transition flex items-center justify-center gap-1.5">Перейти в вики <ChevronRight :size="14" /></a></div><div class="bg-[var(--bg-card)] border-[var(--border-color)] p-5 flex flex-col justify-between"><div><div class="w-9 h-9 bg-[#0099FF]/10 text-[#0099FF] flex items-center justify-center mb-4">✈</div><h3 class="font-heading text-sm text-[var(--text-main)] mb-1">Telegram канал</h3><p class="text-xs text-[var(--text-muted)] leading-relaxed mb-5">Новости сервера, анонсы ивентов и обновлений</p></div><a href="https://t.me" target="_blank" class="w-full py-2.5 text-xs font-semibold text-[var(--text-muted)] dark:text-zinc-200 hover:text-[var(--text-main)] bg-zinc-100 dark:bg-white/[0.04] hover:bg-zinc-200/70 dark:hover:bg-white/[0.08] border border-zinc-200 dark:border-white/[0.08] transition flex items-center justify-center gap-1.5">Перейти в канал <ChevronRight :size="14" /></a></div><div class="bg-[var(--bg-card)] border-[var(--border-color)] p-5 flex flex-col justify-between"><div><div class="w-9 h-9 bg-[#0099FF]/10 text-[#0099FF] flex items-center justify-center mb-4">◉</div><h3 class="font-heading text-sm text-[var(--text-main)] mb-1">Discord сервер</h3><p class="text-xs text-[var(--text-muted)] leading-relaxed mb-5">Общение, новости и тикеты поддержки</p></div><a href="https://discord.gg" target="_blank" class="w-full py-2.5 text-xs font-semibold text-[var(--text-muted)] dark:text-zinc-200 hover:text-[var(--text-main)] bg-zinc-100 dark:bg-white/[0.04] hover:bg-zinc-200/70 dark:hover:bg-white/[0.08] border border-zinc-200 dark:border-white/[0.08] transition flex items-center justify-center gap-1.5">Перейти на сервер <ChevronRight :size="14" /></a></div></div></section></main></template>