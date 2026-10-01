<script setup lang="ts">
import { ref, computed, markRaw } from 'vue'
import { Cpu, ShieldCheck, Radio, Sparkles, AlertTriangle } from 'lucide-vue-next'

const selectedIndex = ref(0)

const faqs = [
  {
    id: 'specs',
    tag: 'ЖЕЛЕЗО',
    tagColor: '#0099FF',
    menuTitle: 'Системные требования',
    title: 'Какие системные требования у сборки?',
    desc: 'Сборка оптимизирована под моды Create и дальнюю прорисовку Distant Horizons. Вот ориентир по железу для комфортной игры:',
    icon: markRaw(Cpu),
    isSpecs: true,
    specs: {
      min: {
        title: 'Минимальные (45–60 FPS)',
        cpu: 'Intel Core i3 10-го пок. / AMD Ryzen 3 3100',
        ram: '8 ГБ (выделить 5–6 ГБ в лаунчере)',
        gpu: 'GTX 960 / GTX 1050 / Radeon RX 560 (2 ГБ VRAM)',
        disk: 'SSD обязателен (от 6 ГБ свободно)',
        note: 'Низко-средние настройки, без шейдеров, базовый Distant Horizons.'
      },
      rec: {
        title: 'Рекомендуемые (60–120+ FPS)',
        cpu: 'Intel Core i5 12400F / AMD Ryzen 5 5600',
        ram: '16 ГБ (выделить 6–8 ГБ в лаунчере)',
        gpu: 'RTX 2060 / GTX 1660 Super / RX 6600 (от 6 ГБ VRAM)',
        disk: 'Быстрый NVMe SSD накопитель',
        note: 'Высокие настройки с шейдерами, физикой дирижаблей и максимальной дальностью чанков.'
      }
    }
  },
  {
    id: 'license',
    tag: 'ДОСТУП',
    tagColor: '#22C55E',
    menuTitle: 'Нужна ли лицензия?',
    title: 'Нужна ли официальная лицензия Minecraft?',
    icon: markRaw(ShieldCheck),
    content: [
      'Нет, лицензия не требуется.',
      'В наш Mistraly Launcher встроен собственный независимый клиент. Авторизация, никнейм и синхронизация ваших скинов работают напрямую через аккаунт Discord.',
      'Скачали лаунчер, нажали «Войти через Discord» — и сборка со всеми модами запустится автоматически в один клик.'
    ]
  },
  {
    id: 'pass',
    tag: 'ПРОХОДКА',
    tagColor: '#FFCC00',
    menuTitle: 'Зачем платить за вход?',
    title: 'Зачем покупать платную проходку?',
    icon: markRaw(Sparkles),
    content: [
      'Платный вход отсекает читеров, ботов и случайных неадекватных игроков. Никто не станет рисковать платным аккаунтом ради порчи чужой постройки.',
      'Мы держим ламповое и адекватное сообщество без доната, влияющего на игровой процесс: никаких админок, креативок или покупки ресурсов за реальные деньги.',
      'Все средства с проходок идут на мощный хостинг, чтобы физика дирижаблей Create Aeronautics летала без лагов и задержек.'
    ]
  },
  {
    id: 'grief',
    tag: 'ЗАЩИТА',
    tagColor: '#EF4444',
    menuTitle: 'Защита от гриферов',
    title: 'Что делать, если загриферили или взорвали судно?',
    icon: markRaw(AlertTriangle),
    content: [
      'На сервере ведется поминутное логирование каждого блока, сундука и выстрела из орудий.',
      'Если вашу постройку или корабль сломали не по правилам — просто откройте тикет в Discord. Администрация откатит весь ущерб в пару кликов, вернув постройку и вещи в первозданный вид.',
      'Нарушитель при этом получает перманентный бан по железу без права на разбан.'
    ]
  },
  {
    id: 'voice',
    tag: 'СВЯЗЬ',
    tagColor: '#A855F7',
    menuTitle: 'Голосовой чат',
    title: 'Есть ли голосовой чат прямо в игре?',
    icon: markRaw(Radio),
    content: [
      'Да, в сборку встроен позиционный Simple Voice Chat, полностью настроенный под сервер.',
      'Звук распространяется с учетом окружения: голос затухает с расстоянием, отражается эхом в пещерах и приглушается за закрытыми дверями кают дирижабля.',
      'Громкость и микрофон настраиваются прямо во время игры по нажатию клавиши «V».'
    ]
  }
]

/*
 * Выбранный пункт и его характеристики вынесены в computed.
 * В шаблоне цепочки вида specs.min.cpu давали 12 ошибок
 * TS2532: по массиву нельзя доказать, что элемент и вложенные объекты
 * существуют. Здесь тип гарантируется явно, а v-if в разметке уже отсекает
 * пункт без характеристик — так что данные всегда есть.
 */
const selected = computed(() => faqs[selectedIndex.value])
const specs = computed(() => selected.value.specs!)
const content = computed(() => selected.value.content ?? [])
</script>

<template>
  <section id="faq" class="w-full max-w-5xl mx-auto px-4 py-16 flex flex-col items-center select-none">

    <!-- Заголовок страницы -->
    <div class="text-center mb-12 sm:mb-16">
      <h2 class="font-heading text-3xl sm:text-4xl text-[var(--text-main)] tracking-tight mb-3">
        Частые <span class="word-hl">вопросы</span>
      </h2>
      <p class="text-xs sm:text-sm text-[var(--text-muted)] max-w-xl mx-auto">
        Ответы на главные вопросы об игре, лаунчере и правилах сервера.
      </p>
    </div>

    <!-- Сетка: слева темы, справа — газета с коцками на гранях -->
    <div class="w-full grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">

      <!-- ЛЕВАЯ КОЛОНКА: Рубрики с видимыми иконками -->
      <div class="lg:col-span-5 flex flex-col gap-3">
        <div
          v-for="(item, idx) in faqs"
          :key="item.id"
          @click="selectedIndex = idx"
          class="nav-tab-item group cursor-pointer transition-all duration-200"
          :class="{ 'is-active': selectedIndex === idx }"
          :style="{
            '--accent': item.tagColor,
            clipPath: idx % 2 === 0
              ? 'polygon(0% 2%, 100% 0%, 98.5% 98%, 1.5% 100%)'
              : 'polygon(1% 0%, 99.5% 2%, 99% 100%, 0% 98%)'
          }"
        >
          <div
            class="p-4 flex items-center justify-between relative bg-[#161719] border-l-4 transition-colors duration-200"
            :style="{ borderLeftColor: selectedIndex === idx ? item.tagColor : 'transparent' }"
          >
            <!-- Блок иконки + текст -->
            <div class="flex items-center gap-3.5 min-w-0 pr-2">
              <!-- ИКОНКА (четко зафиксированный размер и flex-shrink-0) -->
              <div
                class="w-10 h-10 rounded shrink-0 flex items-center justify-center border border-white/10 transition-transform duration-200 group-hover:scale-105"
                :style="{
                  backgroundColor: selectedIndex === idx ? item.tagColor : 'rgba(255,255,255,0.05)',
                  color: selectedIndex === idx ? '#101113' : item.tagColor
                }"
              >
                <component :is="item.icon" :size="20" class="shrink-0" />
              </div>

              <!-- Текстовый блок -->
              <div class="min-w-0">
                <span
                  class="font-heading font-black text-[9px] uppercase tracking-wider px-1.5 py-0.5 inline-block mb-1 text-black"
                  :style="{ backgroundColor: item.tagColor }"
                >
                  {{ item.tag }}
                </span>
                <h4 class="font-heading font-black text-sm text-white tracking-tight truncate block">
                  {{ item.menuTitle }}
                </h4>
              </div>
            </div>

            <!-- Номер пункта -->
            <span class="font-mono text-xs text-white/30 font-bold shrink-0 group-hover:text-white transition-colors ml-2">
              #0{{ idx + 1 }}
            </span>
          </div>
        </div>
      </div>

      <!-- ПРАВАЯ КОЛОНКА: Газета с коцками и зазубринами на гранях -->
      <div class="lg:col-span-7 w-full newspaper-outer">
        <article class="newspaper-sheet p-6 sm:p-8 relative">

          <!-- Шапка газеты -->
          <header class="newspaper-header text-center pb-2 mb-4">
            <h1 class="newspaper-title font-heading font-black text-2xl sm:text-3xl text-[#1a1815] tracking-tight uppercase">
              The Mistraly Chronicle
            </h1>
            <!-- Классическая двойная газетная черта -->
            <div class="newspaper-double-rule mt-2 mb-1"></div>
            <div class="flex items-center justify-between text-[10px] font-mono font-bold tracking-widest text-[#5c5446] uppercase">
              <span>MISTRALY • Minecraft 1.21.1</span>
              <span>ВЫПУСК #0{{ selectedIndex + 1 }}</span>
            </div>
          </header>

          <!-- Заголовок статьи -->
          <div class="mb-4">
            <h2 class="font-heading font-black text-xl sm:text-2xl text-[#181613] tracking-tight leading-snug mb-2">
              {{ selected.title }}
            </h2>
            <p v-if="selected.desc" class="text-xs sm:text-sm text-[#38332a] leading-relaxed">
              {{ selected.desc }}
            </p>
          </div>

          <!-- ВАРИАНТ А: Системные требования -->
          <div v-if="selected.isSpecs && specs" class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-2">

            <!-- Минималки -->
            <div class="spec-card p-3.5 border border-[#2b2721]/35 bg-[#e2d8c3]/60">
              <span class="font-heading font-black text-xs text-[#181613] uppercase tracking-wide block pb-1 mb-2 border-b border-[#2b2721]/20">
                {{ specs.min.title }}
              </span>
              <ul class="space-y-1.5 text-xs font-mono text-[#2c2822] mb-3">
                <li><strong class="text-[#181613]">ЦП:</strong> {{ specs.min.cpu }}</li>
                <li><strong class="text-[#181613]">ОЗУ:</strong> {{ specs.min.ram }}</li>
                <li><strong class="text-[#181613]">ГПУ:</strong> {{ specs.min.gpu }}</li>
                <li><strong class="text-[#181613]">ДИСК:</strong> {{ specs.min.disk }}</li>
              </ul>
              <p class="text-[11px] text-[#4a4234] border-t border-[#2b2721]/15 pt-2 leading-tight">
                {{ specs.min.note }}
              </p>
            </div>

            <!-- Рекомендуемые -->
            <div class="spec-card p-3.5 border-2 border-[#181613] bg-[#f5ecda]">
              <span class="font-heading font-black text-xs text-[#181613] uppercase tracking-wide block pb-1 mb-2 border-b border-[#181613]/25">
                {{ specs.rec.title }}
              </span>
              <ul class="space-y-1.5 text-xs font-mono text-[#181613] mb-3">
                <li><strong>ЦП:</strong> {{ specs.rec.cpu }}</li>
                <li><strong>ОЗУ:</strong> {{ specs.rec.ram }}</li>
                <li><strong>ГПУ:</strong> {{ specs.rec.gpu }}</li>
                <li><strong>ДИСК:</strong> {{ specs.rec.disk }}</li>
              </ul>
              <p class="text-[11px] text-[#2c2822] border-t border-[#181613]/15 pt-2 leading-tight font-medium">
                {{ specs.rec.note }}
              </p>
            </div>

          </div>

          <!-- ВАРИАНТ Б: Обычный понятный текст -->
          <div v-else class="text-xs sm:text-sm text-[#24211b] leading-relaxed space-y-3 pt-1">
            <p v-for="(paragraph, pIdx) in content" :key="pIdx">
              {{ paragraph }}
            </p>
          </div>

        </article>
      </div>

    </div>
  </section>
</template>

<style scoped>
/* Фирменный стиль плашки в заголовке */
.word-hl {
  display: inline-block;
  color: #181611;
  background: #22C55E;
  font-weight: 400;
  padding: 0 0.28em;
  margin: 0 0.04em;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
  transform: rotate(-1.5deg);
  cursor: default;
  user-select: none;
}

/* Левые вкладки */
.nav-tab-item {
  filter: drop-shadow(4px 4px 0px rgba(0, 0, 0, 0.45));
}

.nav-tab-item:hover {
  transform: translate(-2px, -2px);
  filter: drop-shadow(7px 7px 0px rgba(0, 0, 0, 0.65));
}

.nav-tab-item.is-active {
  transform: translate(-3px, -3px);
  filter: drop-shadow(8px 8px 0px rgba(0, 0, 0, 0.75));
}

.nav-tab-item.is-active > div {
  background: linear-gradient(90deg, #1f2126 0%, #161719 100%);
}

/* =========================================================
   ГАЗЕТА С РЕАЛЬНЫМИ КОЦКАМИ И СКОЛАМИ НА ГРАНЯХ
   ========================================================= */
.newspaper-outer {
  position: relative;
  filter: drop-shadow(10px 12px 0px rgba(0, 0, 0, 0.7));
  transform: rotate(0.4deg);
}

.newspaper-sheet {
  background-color: #ebe3d3;
  background-image:
    radial-gradient(#d8ceba 1px, transparent 1px),
    linear-gradient(180deg, #f0e8d9 0%, #e6decb 100%);
  background-size: 16px 16px, 100% 100%;
  border: 1px solid rgba(26, 24, 21, 0.6);
  /*
   * Высота, а не ширина, вызывала прыжок вёрстки при переключении рубрик:
   * вкладка с характеристиками разворачивает две колонки и газета растёт
   * с 432 до 667px, а секция скачет на 151px. Ширина при этом стабильна
   * (газета 655, колонка 457, сетка 1141 на всех вкладках).
   *
   * min-height берётся по самой высокой вкладке, поэтому страница не
   * дёргается. На узких экранах характеристики складываются в одну
   * колонку и газета и так выше — там фиксируем меньше, чтобы не было
   * лишней пустоты.
   */
  min-height: 340px;

  /* Настоящие физические коцки, сколы и вырезы по краям листа: */
  clip-path: polygon(
    0% 2.5%,
    1.2% 0.8%,
    2.5% 0%,
    24% 0.3%,
    24.5% 1%,     /* коцка на верхнем ребре */
    25.5% 0.2%,
    62% 0.4%,
    63% 0%,
    97.5% 0%,
    99.2% 1.4%,
    100% 3%,      /* срезанный правый верхний угол */
    99.4% 32%,
    98.7% 33%,    /* зазубрина справа */
    99.6% 34.5%,
    100% 68%,
    99.3% 97.5%,
    98% 99.2%,
    96.5% 100%,   /* правый нижний угол со сколом */
    58% 99.5%,
    57.2% 98.8%,  /* выемка на нижнем ребре */
    56% 99.6%,
    18% 100%,
    2% 100%,
    0.6% 98.5%,
    0% 96.5%,
    0.6% 62%,
    1.3% 61%,     /* коцка на левом ребре */
    0.4% 59.5%,
    0% 28%
  );
}

/* Двойная черта как в классических печатных газетах */
.newspaper-double-rule {
  border-top: 3px double #1a1815;
}

.spec-card {
  box-shadow: 2px 2px 0px rgba(0, 0, 0, 0.12);
}

/*
 * Фиксируем высоту газеты на широких экранах — там характеристики
 * разложены в две колонки, и без этого вкладка «Железо» вырастает
 * относительно остальных, а страница прыгает при переключении.
 */
@media (min-width: 640px) {
  .newspaper-sheet {
    min-height: 680px;
  }
}
</style>
