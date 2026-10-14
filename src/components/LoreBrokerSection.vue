<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

import eyeVideo from '@/assets/images/lore/eye.mp4?url'
const fallbackPublicPath = '/images/lore/eye.mp4'

interface Props {
  heroImage?: string
  featureImage?: string
}

const props = withDefaults(defineProps<Props>(), {
  heroImage: '',
  featureImage: ''
})

const resolvedHeroImage = computed(() => {
  return props.heroImage || eyeVideo || fallbackPublicPath
})

/**
 * Раскладка: глаза стянуты к середине секции.
 *
 * Копии держатся вокруг центра, но не слипаются в кучу: разброс по
 * ширине ±28 процентных пунктов при высоте секции около 1500px.
 *
 * Подбирали дважды. Первый вариант разбрасывал глаза от 6% до 93% по
 * ширине — по краям блока оставались одинокие глаза в пустоте, группа
 * рассыпалась. Второй стянул к центру на ±17 — получилась плотная куча,
 * в которой глаза перекрывали друг друга и читались как каша. Текущий
 * разброс держит группу собранной, но оставляет между глазами воздух.
 *
 * Смещения заданы в процентах от центра (0 = середина), поэтому при
 * другой ширине экрана группа остаётся собранной.
 *
 * Трафик не растёт с числом копий: все ссылаются на два URL, каждый
 * файл качается один раз.
 */
interface EyeCopy {
  left: number
  top: number
  size: number
  rotate: number
  opacity: number
  /** Отрицательная задержка — сдвиг фазы моргания в секундах. */
  delay: number
}

/** Пропорции кадра 400x320 — иначе глаз вытянется по вертикали. */
const EYE_RATIO = 320 / 400

/** Длительность цикла моргания в секундах — по ней разводятся фазы. */
const EYE_CYCLE = 3.72

const CX = 50
const CY = 48

/**
 * Двенадцать копий, у каждой своя фаза моргания.
 *
 * Фазы разводим через currentTime у каждого элемента <video>, а не
 * разными файлами: у видео своя таймлайн на каждый элемент, поэтому
 * двенадцать копий одного файла идут независимо.
 *
 * Спрайт-лист tried, но с steps(N) кадр держится на N кадров исходника:
 * на 31 кадре из 93 это 120мс вместо 40мс, и моргание шло втрое
 * «блочнее» оригинала. Видео отдаёт все 93 кадра с полной частотой.
 */
const eyeCopies = [
  { left: CX + 0,  top: CY + 0,  size: 940, rotate: 0,   opacity: 0.46, phase: 0.00 },
  { left: CX + 14, top: CY - 15, size: 620, rotate: -11, opacity: 0.30, phase: 0.31 },
  { left: CX - 15, top: CY + 12, size: 540, rotate: 8,   opacity: 0.22, phase: 0.62 },
  { left: CX + 23, top: CY + 10, size: 430, rotate: -16, opacity: 0.16, phase: 0.93 },
  { left: CX - 22, top: CY - 12, size: 360, rotate: 6,   opacity: 0.14, phase: 1.24 },
  { left: CX + 10, top: CY + 22, size: 330, rotate: -7,  opacity: 0.13, phase: 1.55 },
  { left: CX - 11, top: CY - 22, size: 300, rotate: 13,  opacity: 0.12, phase: 1.86 },
  { left: CX + 28, top: CY - 5, size: 280, rotate: -4,  opacity: 0.11, phase: 2.17 },
  { left: CX - 27, top: CY + 5, size: 250, rotate: -13, opacity: 0.10, phase: 2.48 },
  { left: CX + 18, top: CY - 27, size: 230, rotate: 9,   opacity: 0.095, phase: 2.79 },
  { left: CX - 18, top: CY + 27, size: 210, rotate: -2,  opacity: 0.09, phase: 3.10 },
  { left: CX + 3,  top: CY + 29, size: 190, rotate: 17,  opacity: 0.085, phase: 3.41 }
]

const eyeEls = ref<HTMLVideoElement[]>([])

/** Системная настройка: анимацию фона не крутим без согласия. */
const reduceMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Ставит фазу и решает, играть ли.
 *
 * currentTime можно задать только после загрузки метаданных — раньше
 * браузер его отбросит. Отсюда и проверка readyState, и отдельный
 * обработчик на loadedmetadata.
 */
function syncEye(el: HTMLVideoElement, phase: number) {
  if (el.readyState >= 1 && Number.isFinite(el.duration)) {
    el.currentTime = phase % el.duration
  }
  if (reduceMotion) {
    el.pause()
  }
}

function onEyeMeta(i: number) {
  const el = eyeEls.value[i]
  if (!el) return
  syncEye(el, eyeCopies[i].phase)
  if (!reduceMotion) void el.play().catch(() => {})
}

/**
 * Двенадцать видео декодируются непрерывно, пока секция в кадре, а это
 * лишняя работа для CPU. Вне экрана останавливаем — на главной секция
 * лора длинная и пользователь может её пролистать.
 */
let observer: IntersectionObserver | null = null
onMounted(() => {
  if (reduceMotion || typeof IntersectionObserver === 'undefined') return
  const root = document.getElementById('lore')
  if (!root) return
  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries[0]?.isIntersecting ?? true
      eyeEls.value.forEach((el) => {
        if (!el) return
        if (visible) void el.play().catch(() => {})
        else el.pause()
      })
    },
    { threshold: 0.01 }
  )
  observer.observe(root)
})

onUnmounted(() => {
  observer?.disconnect()
  observer = null
})
</script>

<template>
  <!-- Секция без своего цвета фона — она живёт на твоём родном page-bg -->
  <section id="lore" class="w-full py-24 sm:py-32 px-4 flex flex-col items-center relative overflow-hidden select-none">

<!-- ================================================================= -->
    <!-- КОПИИ ГЛАЗА. Фон у GIF прозрачный, поэтому каждая копия —
         самостоятельный слой, а не один растянутый кадр. -->
    <!-- ================================================================= -->
    <div
      class="lore-eyes pointer-events-none select-none"
      aria-hidden="true"
    >
      <!-- Свечение лежит под глазами, иначе анимация пересвечивала бы его -->
      <div class="lore-glow"></div>

      <video
        v-for="(eye, i) in eyeCopies"
        :key="i"
        :ref="(el) => (eyeEls[i] = el as HTMLVideoElement)"
        class="lore-eye"
        :src="resolvedHeroImage"
        :style="{
          left: eye.left + '%',
          top: eye.top + '%',
          width: eye.size + 'px',
          height: Math.round(eye.size * EYE_RATIO) + 'px',
          transform: `translate(-50%, -50%) rotate(${eye.rotate}deg)`,
          opacity: eye.opacity
        }"
        muted
        loop
        playsinline
        preload="auto"
        disablepictureinpicture
        @loadedmetadata="onEyeMeta(i)"
      ></video>
    </div>

    <!-- ================================================================= -->
    <!-- ЗАГОЛОВОК СЕКЦИИ (КАК В МОДАХ) -->
    <!-- ================================================================= -->
    <div class="text-center mb-12 sm:mb-16 relative z-10">
      <h2 class="font-heading text-2xl sm:text-3xl text-[var(--text-main)] tracking-tight mb-2">
        Лор <span class="word-hl">сервера</span>
      </h2>
      <p class="text-xs sm:text-sm text-[var(--text-muted)] max-w-2xl mx-auto">
        Погрузись в историю
      </p>
    </div>

    <div class="w-full max-w-4xl relative z-10 flex flex-col items-center">

      <!-- ================= СРЕДНИЙ БЛОК: ДОСЬЕ + ТЕКСТ ================= -->
      <div class="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start my-6 text-left">

        <!-- ЛЕВАЯ КОЛОНКА: Досье -->
        <div class="lg:col-span-5 flex flex-col gap-4">
          <div
            class="p-6 bg-[#161719]/90 backdrop-blur-md border border-white/10 relative"
            style="clip-path: polygon(0% 1.5%, 100% 0%, 98.5% 98.5%, 1.5% 100%); filter: drop-shadow(6px 6px 0px rgba(0,0,0,0.6));"
          >

            <h3 class="font-heading font-black text-xl text-white tracking-tight uppercase mb-3">
              Что скрывают Эльфы?
            </h3>

            <p class="font-mono text-xs text-zinc-300 leading-relaxed mb-4">
              Тысячи лет мы не знаем ничего об их истории, но теперь всё изменится. Старые летописи и дневники помогут приоткрыть завесу тайны.
            </p>

          </div>
        </div>

        <!-- ПРАВАЯ КОЛОНКА: Текст -->
        <div class="lg:col-span-7 flex flex-col justify-center space-y-4">
          <h3 class="font-heading font-black text-2xl sm:text-3xl text-[#EFEBD9] tracking-tight uppercase leading-snug">
            Что на самом деле скрывают облака?
          </h3>

          <div class="space-y-4 font-mono text-xs sm:text-[13px] text-zinc-300/90 leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            <p>
              В небесном секторе Mistraly можно найти всё: от мирных паровых заводов до гигантских дирижаблей с тяжелой артиллерией. Но для тех, кто ищет истинно разрушительную мощь, существуют места, о которых не говорят открыто.
            </p>
            <p>
              Сегодня подпольного торговца или странного механика видят в глухом доке Нижнего Города, а через пару недель — в заброшенном портовом ангаре среди штормовых высот. Ни один небесный патруль не знает, где он всплывёт в следующий раз.
            </p>
            <p>
              За хорошую плату здесь можно получить чертежи, выходящие за рамки законов физики. Но будьте начеку: цена таких апгрейдов никогда не измеряется одними лишь деньгами.
            </p>
          </div>
        </div>
      </div>

      <!-- ================= ВТОРОЙ АРТ В РАМКЕ ================= -->
      <div class="w-full my-8 max-w-2xl">
        <div class="feature-photo-frame p-2 bg-[#EFEBD9] border-2 border-[#181611] shadow-[8px_8px_0px_#000]">
          <img
            v-if="featureImage"
            :src="featureImage"
            alt="Иллюстрация"
            class="w-full h-56 sm:h-72 object-cover"
          />
          <div
            v-else
            class="w-full h-56 sm:h-72 bg-[#141518] flex flex-col items-center justify-center p-6 text-center border border-black/40 relative overflow-hidden"
          >
            <div class="relative z-10 space-y-1.5">
              <span class="font-heading font-black text-xs uppercase tracking-wider text-[#A855F7]">
                [ МЕСТО ДЛЯ СКРИНШОТА / АРТА В РАМКЕ ]
              </span>
              <p class="font-mono text-[11px] text-zinc-400 max-w-xs">
                Сюда отлично встанет скриншот корабля, локации или ритуала
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  </section>
</template>

<style scoped>
/*
 * СЛОЙ КАРТИНКИ:
 * Одна простая эллиптическая маска без mask-composite,
 * которая поддерживается всеми браузерами.
 * Радиус по X: 38% — гарантированно срезает бока в 0% задолго до границы картинки!
 */
/*
 * УВЕЛИЧЕННАЯ КАРТИНКА С СУПЕР-ПЛАВНЫМ ПЕРЕХОДОМ В ФОН
 */
/*
 * ОГРОМНАЯ КАРТИНКА С УЗКОЙ МАСКОЙ ПО БОКАМ:
 * Бока гарантированно гасятся в 0% задолго до реальных краев картинки!
 */
/*
 * КРУПНАЯ, ЧЕТКАЯ КАРТИНКА С ШИРОКИМ ЦЕНТРОМ И МЯГКИМ СХОДОМ В ФОН
 */
.lore-eyes {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

/*
 * Одна копия глаза.
 *
 * Кадр 400x320 показывается целиком: contain обязателен, потому что
 * cover обрезал бы глаз по краям прямо в момент моргания.
 *
 * Маска нужна для растворения краёв вырезки: у GIF прозрачность
 * бинарная, поэтому кромка после порога остаётся жёсткой и без маски
 * глаз выглядит вырезанным трафаретом.
 */
/*
 * Позиция, размер, поворот и прозрачность приходят инлайном из данных
 * eyeCopies, здесь только общая часть слоя.
 */
.lore-eye {
  /*
   * Кадр приходит готовым видео со всеми 93 кадрами, поэтому анимация
   * идёт с исходной частотой и глаз моргает плавно. Раньше здесь был
   * спрайт-лист с steps(31): каждый кадр держался 120 мс вместо 40,
   * и моргание шло втрое «блочнее» оригинала.
   *
   * object-fit: contain обязателен — cover обрезал бы глаз по краям
   * ровно в момент моргания.
   *
   * Маска растворяет края вырезки: прозрачность в исходнике бинарная,
   * поэтому кромка жёсткая и без маски глаз выглядит трафаретом.
   */
  position: absolute;
  object-fit: contain;
  filter: grayscale(1) contrast(1.12) brightness(1.04);
  -webkit-mask-image: radial-gradient(ellipse 58% 58% at 50% 50%, #000 42%, transparent 99%);
  mask-image: radial-gradient(ellipse 58% 58% at 50% 50%, #000 42%, transparent 99%);
}



/* Крупный центральный глаз — задаёт тон всей секции */

/*
 * Фиолетовое свечение ровно посередине.
 *
 * Отдельный слой под глазами: если светить самим глазам через filter,
 * засветка ложилась бы поверх анимации и дёргалась вместе с кадрами.
 * Здесь статичный радиальный градиент — он держит середину секции
 * собранной, пока глаза вокруг него моргают.
 *
 * Размер небольшой намеренно: при 500px и альфе 0.2 фиолетовый уходил
 * в заливку всего блока, а нужен был локальный свет за главным глазом.
 */
.lore-glow {
  position: absolute;
  left: 50%;
  top: 48%;
  width: 420px;
  height: 420px;
  margin: -210px 0 0 -210px;
  background: radial-gradient(
    circle,
    rgba(168, 85, 247, 0.2) 0%,
    rgba(168, 85, 247, 0.09) 38%,
    rgba(168, 85, 247, 0.03) 62%,
    transparent 74%
  );
  filter: blur(46px);
  z-index: 0;
}

/* Фоторамка под нижний арт */
/*
 * Фиолетовая плашка на заголовке.
 *
 * Геометрия один в один как на остальных секциях (FaqSection,
 * ModHighlights, ShopView) — различается только цвет акцента: там
 * зелёный, синий и жёлтый, здесь фиолетовый под палитру секции.
 *
 * Правило обязательно: стили в компоненте scoped, поэтому класс из
 * соседних секций сюда не подтягивается. Без него `.word-hl` в шаблоне
 * оставался обычным словом без плашки — заголовок выглядел иначе, чем
 * все остальные на сайте.
 */
.word-hl {
  display: inline-block;
  color: #181611;
  background: #A855F7;
  font-weight: 400;
  padding: 0 0.28em;
  margin: 0 0.04em;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
  transform: rotate(-1.5deg);
  cursor: default;
  user-select: none;
}

/* Рамка под нижний арт */
.feature-photo-frame {
  transform: rotate(-0.6deg);
  filter: drop-shadow(8px 8px 0px rgba(0, 0, 0, 0.85));
  transition: transform 0.22s ease;
}

.feature-photo-frame:hover {
  transform: rotate(0deg) scale(1.01);
}
</style>
