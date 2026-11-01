<script setup lang="ts">
import { ref, computed, markRaw } from 'vue'
import { Cpu, Radio, ShieldCheck, Sparkles, AlertTriangle } from '../lib/icons'

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
    desc: 'Сборка лёгкая: это ванилла плюс на 56 модов. Игра работает на Vulkan, а дальнюю прорисовку даёт наш мод Uno, поэтому главная нагрузка ложится на видеокарту. Вот ориентир по железу:',
    icon: markRaw(Cpu),
    isSpecs: true,
    specs: {
      min: {
        title: 'Минимальные',
        cpu: 'Intel Core i3 10-го пок. / AMD Ryzen 3 3100',
        ram: '8 ГБ (лаунчер сам выделит игре 4 ГБ)',
        gpu: 'GTX 1050 / RX 560 с поддержкой Vulkan (от 2 ГБ VRAM)',
        disk: 'От 5 ГБ свободно: игра, сборка и кэш дальней прорисовки',
        note: 'Низко-средние настройки, небольшая дальность Uno, без шейдеров. На встроенной графике дальнюю прорисовку лучше выключить.'
      },
      rec: {
        title: 'Рекомендуемые',
        cpu: 'Intel Core i5 12400F / AMD Ryzen 5 5600',
        ram: '16 ГБ (лаунчер сам выделит игре 8 ГБ)',
        gpu: 'GTX 1660 Super / RX 6600 (от 6 ГБ VRAM)',
        disk: 'SSD, от 10 ГБ свободно',
        note: 'Высокие настройки, большая дальность Uno. Для шейдеров лучше RTX 2060 или мощнее.'
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
      'Все средства с проходок идут на мощный хостинг, чтобы сервер работал без лагов и задержек.'
    ]
  },
  {
    id: 'grief',
    tag: 'ЗАЩИТА',
    menuTitle: 'Защита от гриферов',
    title: 'Что делать, если загриферили постройку?',
    icon: markRaw(AlertTriangle),
    content: [
      'На сервере ведется поминутное логирование каждого блока и сундука.',
      'Если вашу постройку сломали не по правилам — просто откройте тикет в Discord. Администрация откатит весь ущерб в пару кликов, вернув постройку и вещи в первозданный вид.',
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
      'Да, голосовой чат встроен в сборку: ничего отдельно ставить не нужно.',
      'Он работает по расстоянию: вас слышат игроки поблизости, и чем дальше собеседник, тем тише голос.',
      'Говорить голосом необязательно: текстовый чат никуда не делся, а принуждать к голосовому запрещено правилами.'
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
  <section id="faq" class="w-full max-w-5xl mx-auto px-4 py-8">
    <div class="section-head">
      <h2 class="section-title">Частые <span class="word-hl">вопросы</span></h2>
      <p class="section-sub">Поможем разобраться</p>
    </div>

    <div class="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      <!-- Слева темы, как список установок в лаунчере -->
      <div class="lg:col-span-5 flex flex-col gap-3">
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
  /* Список тянется на высоту ответа, поэтому рядом с ним нет пустоты. */
  flex: 1;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 14px;
  background: var(--panel);
  color: var(--text-main);
  border: 2px solid var(--ink);
  text-align: left;
  cursor: pointer;
}
.q:active {
  transform: translateY(2px);
}
.q:hover {
  background: var(--panel-hi);
}
.q.is-active {
  background: var(--blue);
  box-shadow: inset 6px 0 0 0 var(--sky);
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
  color: #fff;
}
.q-title {
  font-family: 'Noto Sans', 'Helvetica Neue', Arial, sans-serif;
  font-weight: 700;
  display: block;
  font-size:16px;
  line-height: 1.25;
}

.answer {
  height: 100%;
  padding: 24px;
}
.answer-title {
  margin: 14px 0 10px;
  font-size: 24px;
  line-height: 1.3;
}
.answer-text {
  margin: 0 0 10px;
  color: var(--text-muted);
  line-height: 1.5;
}
.spec {
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
</style>
