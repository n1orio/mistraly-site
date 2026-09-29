<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronLeft, ChevronRight, Plane, Cpu, Shirt, ShieldCheck, Download } from 'lucide-vue-next'
import { usePurchaseStore } from '../stores/purchase'
const route = useRoute(); const purchase = usePurchaseStore(); const activePhase = ref(1)
onMounted(() => { if (route.query.purchase === '1') purchase.show() })
const screenshots = ['/2026-09-27_20.07.26.png', '/2026-09-27_20.07.35.png', '/2026-09-27_20.07.54.png']
const currentSlide = ref(0)
let slideTimer: any
function startSlideShow() { slideTimer = setInterval(nextSlide, 4000) }
function prevSlide() { currentSlide.value = (currentSlide.value - 1 + screenshots.length) % screenshots.length }
function nextSlide() {
  currentSlide.value++
  if (currentSlide.value >= screenshots.length) {
    setTimeout(() => {
      currentSlide.value = 0
    }, 500)
  }
}
onMounted(startSlideShow)
onUnmounted(() => clearInterval(slideTimer))
const phases = [
  { name: 'Красная фаза', title: 'Подготовка ядра и лаунчера', desc: 'Настройка сборки Minecraft 1.21.1, интеграция мода Create Aeronautics, разработка ядра лаунчера на Rust (Tauri) и API скинов.', color: '#EF4444', status: 'Завершена' },
  { name: 'Оранжевая фаза', title: 'Физика полетов и баланс', desc: 'Тестирование физики дирижаблей, кинетических механизмов и орудий. Оптимизация сборки и закрытые стресс-тесты.', color: '#F97316', status: 'Текущий этап' },
  { name: 'Желтая фаза', title: 'Закрытый бета-тест', desc: 'Выдача первых проходок, тест стабильности сервера с игроками, проверка синхронизации Discord-аккаунтов.', color: '#EAB308', status: 'Фаза ещё не началась' },
  { name: 'Зеленая фаза', title: 'Официальный запуск', desc: 'Открытие сервера для всех обладателей проходки, старт Первого Воздушного Сезона Breeze.', color: '#22C55E', status: 'Фаза ещё не началась' }
]
</script>
<template><main class="w-full flex-1 flex flex-col items-center bg-[var(--bg-page)] text-[var(--text-main)]"><section class="relative w-full overflow-hidden py-6 px-4 bg-[var(--bg-page)]" style="margin-top:-64px;padding-top:80px;">
  <div class="mx-auto max-w-4xl">
    <div class="relative overflow-hidden" style="mask-image:linear-gradient(to right,transparent,black 8%,black 92%,transparent)">
      <div class="flex transition-transform duration-500 ease-in-out"
           :style="{ transform: 'translateX(calc(-' + (currentSlide * 33.333) + '%))' }">
        <div v-for="(img, i) in screenshots" :key="i"
             class="shrink-0 px-2"
             style="width:33.333%">
          <img :src="img"
               class="w-full aspect-video object-cover rounded-xl ring-1 ring-black/10 dark:ring-white/10 select-none shadow-lg"
               loading="lazy" />
        </div>
        <!-- Duplicate first slides for infinite loop -->
        <div v-for="(img, i) in screenshots.slice(0,3)" :key="'dup-'+i"
             class="shrink-0 px-2"
             style="width:33.333%">
          <img :src="img"
               class="w-full aspect-video object-cover rounded-xl ring-1 ring-black/10 dark:ring-white/10 select-none shadow-lg"
               loading="lazy" />
        </div>
      </div>
    </div>
    <!-- Dots -->
    <div class="flex items-center justify-center gap-2 mt-4">
      <button v-for="(img, i) in screenshots" :key="'dot-'+i"
              @click="currentSlide = i"
              class="rounded-full transition-all duration-300"
              :class="currentSlide === i ? 'bg-[#0099FF] w-6 h-2' : 'bg-[var(--text-muted)]/30 hover:bg-[var(--text-muted)]/50 w-2 h-2'">
      </button>
    </div>
  </div>
</section><section id="about" class="w-full max-w-5xl py-8 px-4"><div class="mb-5 text-left"><span class="text-xs font-bold uppercase tracking-wider text-[#0099FF]">Возможности Breeze</span><h2 class="font-heading text-xl sm:text-2xl font-bold text-[var(--text-main)] mt-1">Технологии вместо лишнего шума</h2></div><div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"><div v-for="feature in [{ title: 'Create Aeronautics', text: 'Физика полетов, дирижабли, кинетические механизмы и пар.', icon: Plane }, { title: 'Лаунчер на Tauri', text: 'Быстрый Rust-клиент с автообновлением файлов сборки в один клик.', icon: Cpu }, { title: 'Кастомные скины', text: 'Поддержка Classic 64×32 и Slim 64×64 прямо через серверный API.', icon: Shirt }, { title: 'Закрытый вайтлист', text: 'Вход строго по Discord-проходке отсекает ботов и нежелательных игроков.', icon: ShieldCheck }]" :key="feature.title" class="bg-[var(--bg-card)] border-[var(--border-color)] rounded-2xl p-5 flex flex-col justify-between"><div><div class="w-10 h-10 rounded-xl bg-[#0099FF]/10 text-[#0099FF] flex items-center justify-center mb-4"><component :is="feature.icon" :size="20" /></div><h3 class="font-heading text-sm font-bold text-[var(--text-main)] mb-1.5">{{ feature.title }}</h3><p class="text-xs text-[var(--text-muted)] leading-relaxed">{{ feature.text }}</p></div></div></div></section><section id="roadmap" class="w-full max-w-5xl py-8 px-4"><div class="bg-[var(--bg-card)] border-[var(--border-color)] rounded-2xl p-6 sm:p-7"><div class="flex items-center justify-between text-xs font-semibold text-[var(--text-muted)] mb-6"><span class="uppercase tracking-wider">Трекер разработки Breeze</span><span>{{ activePhase + 1 }} из {{ phases.length }}</span></div><div class="relative w-full flex items-center justify-between mb-6 px-3"><div class="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-px bg-zinc-300 dark:bg-white/10 z-0"></div><div v-for="(phase, idx) in phases" :key="phase.name" @mouseenter="activePhase = idx" @click="activePhase = idx" class="relative z-10 flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 cursor-pointer" :class="idx === activePhase ? 'bg-zinc-200/70 dark:bg-white/10 ring-1 ring-zinc-400 dark:ring-white/20' : 'bg-transparent'"><span class="w-3.5 h-3.5 rounded-full transition-all duration-200" :style="{ backgroundColor: phase.color, boxShadow: idx === activePhase ? `0 0 12px ${phase.color}` : 'none' }"></span></div></div><div><div class="flex items-center gap-2.5 mb-1.5"><h3 class="font-heading text-xl font-bold text-[var(--text-main)]">{{ phases[activePhase].name }}</h3><span class="text-[11px] font-semibold px-2 py-0.5 rounded-md border" :style="{ color: phases[activePhase].color, borderColor: `${phases[activePhase].color}35`, backgroundColor: `${phases[activePhase].color}12` }">{{ phases[activePhase].status }}</span></div><div class="text-xs sm:text-sm font-semibold text-[var(--text-main)] mb-2">{{ phases[activePhase].title }}</div><p class="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed max-w-2xl">{{ phases[activePhase].desc }}</p></div></div></section><section class="w-full max-w-5xl py-12 pb-24 px-4"><div class="text-center mb-8"><h2 class="font-heading text-2xl sm:text-3xl font-bold text-[var(--text-main)] tracking-tight mb-2">Остались вопросы?</h2><p class="text-xs sm:text-sm text-[var(--text-muted)]">Полезные страницы сайта и соцсети</p></div><div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div class="bg-[var(--bg-card)] border-[var(--border-color)] rounded-2xl p-5 flex flex-col justify-between"><div><div class="w-9 h-9 rounded-xl bg-[#0099FF]/10 text-[#0099FF] flex items-center justify-center mb-4">?</div><h3 class="font-heading text-sm font-bold text-[var(--text-main)] mb-1">Часто задаваемые вопросы</h3><p class="text-xs text-[var(--text-muted)] leading-relaxed mb-5">Возможно ответ на ваш вопрос находится здесь</p></div><router-link to="/faq" class="w-full py-2.5 rounded-xl text-xs font-semibold text-[var(--text-muted)] dark:text-zinc-200 hover:text-[var(--text-main)] bg-zinc-100 dark:bg-white/[0.04] hover:bg-zinc-200/70 dark:hover:bg-white/[0.08] border border-zinc-200 dark:border-white/[0.08] transition flex items-center justify-center gap-1.5">Перейти к FAQ <ChevronRight :size="14" /></router-link></div><div class="bg-[var(--bg-card)] border-[var(--border-color)] rounded-2xl p-5 flex flex-col justify-between"><div><div class="w-9 h-9 rounded-xl bg-[#0099FF]/10 text-[#0099FF] flex items-center justify-center mb-4">▤</div><h3 class="font-heading text-sm font-bold text-[var(--text-main)] mb-1">Вики сервера</h3><p class="text-xs text-[var(--text-muted)] leading-relaxed mb-5">Актуальная информация по моду Create и серверу</p></div><a href="#" class="w-full py-2.5 rounded-xl text-xs font-semibold text-[var(--text-muted)] dark:text-zinc-200 hover:text-[var(--text-main)] bg-zinc-100 dark:bg-white/[0.04] hover:bg-zinc-200/70 dark:hover:bg-white/[0.08] border border-zinc-200 dark:border-white/[0.08] transition flex items-center justify-center gap-1.5">Перейти в вики <ChevronRight :size="14" /></a></div><div class="bg-[var(--bg-card)] border-[var(--border-color)] rounded-2xl p-5 flex flex-col justify-between"><div><div class="w-9 h-9 rounded-xl bg-[#0099FF]/10 text-[#0099FF] flex items-center justify-center mb-4">✈</div><h3 class="font-heading text-sm font-bold text-[var(--text-main)] mb-1">Telegram канал</h3><p class="text-xs text-[var(--text-muted)] leading-relaxed mb-5">Новости сервера, анонсы ивентов и обновлений</p></div><a href="https://t.me" target="_blank" class="w-full py-2.5 rounded-xl text-xs font-semibold text-[var(--text-muted)] dark:text-zinc-200 hover:text-[var(--text-main)] bg-zinc-100 dark:bg-white/[0.04] hover:bg-zinc-200/70 dark:hover:bg-white/[0.08] border border-zinc-200 dark:border-white/[0.08] transition flex items-center justify-center gap-1.5">Перейти в канал <ChevronRight :size="14" /></a></div><div class="bg-[var(--bg-card)] border-[var(--border-color)] rounded-2xl p-5 flex flex-col justify-between"><div><div class="w-9 h-9 rounded-xl bg-[#0099FF]/10 text-[#0099FF] flex items-center justify-center mb-4">◉</div><h3 class="font-heading text-sm font-bold text-[var(--text-main)] mb-1">Discord сервер</h3><p class="text-xs text-[var(--text-muted)] leading-relaxed mb-5">Общение, новости и тикеты поддержки</p></div><a href="https://discord.gg" target="_blank" class="w-full py-2.5 rounded-xl text-xs font-semibold text-[var(--text-muted)] dark:text-zinc-200 hover:text-[var(--text-main)] bg-zinc-100 dark:bg-white/[0.04] hover:bg-zinc-200/70 dark:hover:bg-white/[0.08] border border-zinc-200 dark:border-white/[0.08] transition flex items-center justify-center gap-1.5">Перейти на сервер <ChevronRight :size="14" /></a></div></div></section></main></template>
