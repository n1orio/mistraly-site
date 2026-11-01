<script setup lang="ts">
import { ref, computed, markRaw } from 'vue'
import { Cpu, ShieldCheck, Radio, Sparkles, AlertTriangle } from '../lib/icons'

const selectedIndex = ref(0)
const sheet = ref<HTMLElement | null>(null)

/**
 * На телефоне панель с ответом стоит под всем списком вопросов, и клик по
 * вопросу выглядел так, будто ничего не произошло. Прокручиваем к ответу.
 */
function select(idx: number) {
  selectedIndex.value = idx
  if (window.matchMedia('(max-width: 1023px)').matches) {
    requestAnimationFrame(() => sheet.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
}

const faqs = [
  {
    id: 'specs',
    tag: 'ЖЕЛЕЗО',
    menuTitle: 'Системные требования',
    title: 'Какие системные требования у сборки?',
    desc: 'Сборка оптимизирована под моды Create и дальнюю прорисовку Voxy: далёкие чанки приходят готовыми с сервера, поэтому процессор почти не нагружается, а основная работа ложится на видеокарту. Вот ориентир по железу для комфортной игры:',
    icon: markRaw(Cpu),
    isSpecs: true,
    specs: {
      min: {
        title: 'Минимальные (45–60 FPS)',
        cpu: 'Intel Core i3 10-го пок. / AMD Ryzen 3 3100',
        ram: '8 ГБ (в лаунчере по умолчанию выделено 6 ГБ)',
        gpu: 'GTX 1050 Ti / GTX 1650 / Radeon RX 570 (4 ГБ VRAM, OpenGL 4.6)',
        disk: 'SSD обязателен (от 10 ГБ свободно: сборка и кэш дальней прорисовки)',
        note: 'Низко-средние настройки, без шейдеров, небольшая дальность Voxy. На встроенной графике Voxy может не запуститься.'
      },
      rec: {
        title: 'Рекомендуемые (60–120+ FPS)',
        cpu: 'Intel Core i5 12400F / AMD Ryzen 5 5600',
        ram: '16 ГБ (выделить 6–8 ГБ в лаунчере)',
        gpu: 'RTX 2060 / GTX 1660 Super / RX 6600 (от 6 ГБ VRAM)',
        disk: 'Быстрый NVMe SSD накопитель',
        note: 'Высокие настройки с шейдерами, физикой дирижаблей и большой дальностью прорисовки Voxy.'
      }
    }
  },
  {
    id: 'license',
    tag: 'ДОСТУП',
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
  <section id="faq" class="w-full max-w-5xl mx-auto px-4 py-16">
    <div class="section-head">
      <h2 class="section-title">Частые <span class="word-hl">вопросы</span></h2>
      <p class="section-sub">Поможем разобраться</p>
    </div>

    <div class="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Слева темы, как список установок в лаунчере -->
      <div class="lg:col-span-5 flex flex-col gap-2">
        <button
          v-for="(item, idx) in faqs"
          :key="item.id"
          type="button"
          :aria-pressed="selectedIndex === idx"
          class="q"
          :class="{ 'is-active': selectedIndex === idx }"
          @click="select(idx)"
        >
          <span class="q-icon"><component :is="item.icon" :size="24" /></span>
          <span class="min-w-0">
            <span class="q-tag">{{ item.tag }}</span>
            <span class="q-title">{{ item.menuTitle }}</span>
          </span>
        </button>
      </div>

      <div ref="sheet" class="lg:col-span-7 w-full scroll-mt-24" aria-live="polite">
        <article class="answer mc-panel">
          <span class="mc-tag">{{ selected.tag }}</span>
          <h3 class="answer-title">{{ selected.title }}</h3>
          <p v-if="selected.desc" class="answer-text">{{ selected.desc }}</p>

          <!-- Системные требования -->
          <div v-if="selected.isSpecs && specs" class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div v-for="tier in [specs.min, specs.rec]" :key="tier.title" class="spec mc-well">
              <span class="spec-title">{{ tier.title }}</span>
              <ul>
                <li><b>ЦП:</b> {{ tier.cpu }}</li>
                <li><b>ОЗУ:</b> {{ tier.ram }}</li>
                <li><b>ГПУ:</b> {{ tier.gpu }}</li>
                <li><b>ДИСК:</b> {{ tier.disk }}</li>
              </ul>
              <p>{{ tier.note }}</p>
            </div>
          </div>

          <!-- Обычный текст -->
          <div v-else class="flex flex-col gap-3">
            <p v-for="(paragraph, pIdx) in content" :key="pIdx" class="answer-text">{{ paragraph }}</p>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.q {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 3px;
  padding: 10px 14px;
  background: var(--panel);
  color: var(--text-main);
  border: 0;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 -3px 0 0 var(--ink), 0 3px 0 0 var(--ink), -3px 0 0 0 var(--ink), 3px 0 0 0 var(--ink);
}
.q:hover {
  background: var(--panel-hi);
}
.q.is-active {
  background: var(--blue-lo);
  box-shadow: 0 -3px 0 0 var(--ink), 0 3px 0 0 var(--ink), -3px 0 0 0 var(--ink), 3px 0 0 0 var(--ink), inset 6px 0 0 0 var(--sky);
}
.q:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 3px;
}
.q-icon {
  display: grid;
  place-items: center;
  flex: none;
  width: 40px;
  height: 40px;
  background: var(--well);
  color: var(--sky);
}
.q-tag {
  display: block;
  color: var(--sky);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.08em;
}
.q.is-active .q-tag {
  color: #C5EEFF;
}
.q-title {
  display: block;
  font-family: 'Minecraft', 'Podkova', sans-serif;
  font-size:16px;
  line-height: 1.25;
  text-shadow: 2px 2px 0 var(--ink);
}

.answer {
  padding: 24px;
  /* Вкладка с характеристиками выше остальных: без запаса страница
     прыгала бы при переключении вопросов. */
  min-height: 340px;
}
.answer-title {
  margin: 14px 0 10px;
  font-size: 16px;
  line-height: 1.3;
}
.answer-text {
  margin: 0 0 10px;
  color: var(--text-muted);
  line-height: 1.5;
}
.spec {
  margin: 3px;
  padding: 14px;
  font-size: 15px;
  color: var(--text-muted);
}
.spec-title {
  display: block;
  margin-bottom: 8px;
  color: var(--text-main);
  font-weight: 700;
}
.spec ul {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0 0 10px;
  padding: 0;
  list-style: none;
}
.spec b {
  color: var(--sky);
}
.spec p {
  margin: 0;
  padding-top: 8px;
  border-top: 3px solid var(--panel);
  font-size: 14px;
  line-height: 1.35;
}
@media (min-width: 640px) {
  .answer {
    min-height: 640px;
  }
}
</style>
