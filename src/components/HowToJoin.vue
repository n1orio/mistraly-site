<script setup lang="ts">
import { usePurchaseStore } from '../stores/purchase'
const purchase = usePurchaseStore()
</script>

<template>
  <section id="stages" class="w-full py-24 flex flex-col items-center relative overflow-hidden page-bg">

    <!-- Фоновая пунктирная линия (дорожная разметка как в Deadlock) -->
    <div class="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 border-r-2 border-dashed border-[#4D4B33] pointer-events-none opacity-40"></div>

    <div class="w-full max-w-4xl px-4 flex flex-col gap-16 relative z-10">

      <!-- ================= ШАГ 1 ================= -->
      <div class="relative w-full">

        <!-- Оранжевый приклеенный стикер (в стиле NEW HAUNT) -->
        <div class="absolute card-shift-l -top-[2.1rem] left-3 z-40 bg-transparent px-2.5 py-1 text-[18px] font-black tracking-[0.04em] uppercase text-[#EFEBD9] leading-none select-none">ЭТАП</div>
        <div class="absolute card-shift-l -top-2 left-3 z-30 bg-[#5865F2] text-[#FFFFFF] px-2 py-1.5 shadow-[3px_4px_0px_#1E2465] transform -rotate-2 select-none">
          <div class="text-[19px] font-black tracking-[-0.01em] uppercase text-[#181611] leading-tight">ВХОД</div>
        </div>

        <!-- Сама наклонная карточка цвета хаки -->
        <div style="--card-fill:#161926;--card-border:#2D334D;--btn-shadow:#181B38" class="relative skew-card card-shift-l p-7 sm:p-9 flex flex-col md:flex-row justify-between items-start md:items-center min-h-[190px]">

          <!-- Левая часть: текст -->
          <div class="max-w-lg z-10 pr-4">
            <span class="text-base sm:text-lg font-bold text-[#C7D2FE] tracking-tight block mb-1">
              Первым делом
            </span>
            <h3 class="text-2xl sm:text-3xl text-[#5865F2] tracking-wide mb-3 drop-shadow-[1px_2px_0px_rgba(0,0,0,0.55)]">
              Привязка Discord
            </h3>
            <p class="text-sm sm:text-base text-[#C7D2FE] leading-relaxed mb-5">
              Вход на сервер Mistraly работает только через Discord. Аккаунт создаётся мгновенно.
            </p>
            <span class="skew-wrap"><button
              @click="purchase.show"
              style="--btn-bg:#5865F2" class="skew-btn px-5 py-2.5 text-[#FFFFFF] font-black text-xs uppercase tracking-widest">
              Войти через Discord
            </button></span>
          </div>

          <!-- Правая часть: Огромная объемная цифра 01, вылезающая за край карточки -->

        </div>
          <div class="absolute card-shift-l -top-1 md:-top-3 right-4 md:right-8 select-none pointer-events-none z-20">
            <span class="deadlock-number text-[#60A5FA] transform rotate-3">
              1
            </span>
          </div>
      </div>

      <!-- ================= ШАГ 2 ================= -->
      <div class="relative w-full">

        <div class="absolute card-shift-r -top-[3.1rem] right-3 z-40 bg-transparent px-2.5 py-1 text-[18px] font-black tracking-[0.04em] uppercase text-[#EFEBD9] leading-none select-none">ЭТАП</div>
        <div class="absolute card-shift-r -top-6 right-3 z-30 bg-[#E05929] text-[#181611] px-2 py-1.5 shadow-[3px_4px_0px_#14130E] transform rotate-3 select-none">
          <div class="text-[19px] font-black tracking-[-0.01em] uppercase text-[#181611] leading-tight">ДОСТУП</div>
        </div>

        <div style="--card-fill:#383719;--card-border:#575427;--btn-shadow:#2A2912" class="relative skew-card card-shift-r skew-card-flip p-7 sm:p-9 flex flex-col md:flex-row-reverse justify-between items-start md:items-center min-h-[190px]">

          <div class="max-w-lg z-10 md:ml-auto pl-4 md:pl-0 md:pr-4 text-left md:text-right">
            <span class="text-base sm:text-lg font-bold text-[#EFEBD9] tracking-tight block mb-1">
              Билет на борт
            </span>
            <h3 class="text-2xl sm:text-3xl text-[#F6C442] tracking-wide mb-3 drop-shadow-[1px_2px_0px_rgba(0,0,0,0.55)]">
              Покупка проходки
            </h3>
            <p class="text-sm sm:text-base text-[#EFEBD9] leading-relaxed mb-5">
              Покупка Mistraly Pass навсегда открывает доступ к серверу и защищает от ботов и гриферов.
            </p>
            <span class="skew-wrap skew-end"><button              @click="purchase.show"
              style="--btn-bg:#F6C442" class="skew-btn skew-btn-flip px-5 py-2.5 text-[#1C1B0D] font-black text-xs uppercase tracking-widest">
              Купить проходку &rarr;
            </button></span>
          </div>


        </div>
          <div class="absolute card-shift-r -top-1 md:-top-3 left-4 md:left-8 select-none pointer-events-none z-20">
            <span class="deadlock-number text-[#F6C442] transform -rotate-2">
              2
            </span>
          </div>
      </div>

      <!-- ================= ШАГ 3 ================= -->
      <div class="relative w-full">

        <div class="absolute card-shift-l -top-[2.1rem] left-3 z-40 bg-transparent px-2.5 py-1 text-[18px] font-black tracking-[0.04em] uppercase text-[#EFEBD9] leading-none select-none">ЭТАП</div>
        <div class="absolute card-shift-l -top-2 left-3 z-30 bg-[#84CC16] text-[#142306] px-2 py-1.5 shadow-[3px_4px_0px_#142306] transform -rotate-2 select-none">
          <div class="text-[19px] font-black tracking-[-0.01em] uppercase text-[#181611] leading-tight">В ПОЛЁТ</div>
        </div>

        <div style="--card-fill:#19221E;--card-border:#2D3F37;--btn-shadow:#0C1512" class="relative skew-card card-shift-l p-7 sm:p-9 flex flex-col md:flex-row justify-between items-start md:items-center min-h-[190px]">

          <div class="max-w-lg z-10 pr-4">
            <span class="text-base sm:text-lg font-bold text-[#D1FAE5] tracking-tight block mb-1">
              Финал подготовки
            </span>
            <h3 class="text-2xl sm:text-3xl text-[#4ADE80] tracking-wide mb-3 drop-shadow-[1px_2px_0px_rgba(0,0,0,0.55)]">
              Mistraly Launcher
            </h3>
            <p class="text-sm sm:text-base text-[#D1FAE5] leading-relaxed mb-5">
              Скачайте лаунчер на Rust. Он в один клик загрузит Minecraft модпак со всеми удобствами.
            </p>
            <span class="skew-wrap"><a
              href="#launcher"
              style="--btn-bg:#4ADE80" class="skew-btn inline-block px-5 py-2.5 text-[#142306] font-black text-xs uppercase tracking-widest">
              Скачать лаунчер
            </a></span>
          </div>


        </div>
          <div class="absolute card-shift-l -top-1 md:-top-3 right-4 md:right-8 select-none pointer-events-none z-20">
            <span class="deadlock-number text-[#4ADE80] transform rotate-4">
              3
            </span>
          </div>
      </div>

    </div>
  </section>
</template>

<style scoped>
/* Шрифт тот же, что у заголовков сайта */
h3,
.deadlock-number {
  font-family: 'Russo One', 'Fira Sans Condensed', sans-serif;
}

/* Обводка рисуется двумя слоями: внешний — цвет рамки, внутренний — заливка.
   Так рамка не срезается clip-path по скошенным граням. */
.skew-card {
  background: var(--card-border, #5C592C);
  clip-path: polygon(0% 0%, 100% 12%, 100% 88%, 0% 100%);
  transform: rotate(-1.2deg) skewX(6deg);
  filter: drop-shadow(10px 14px 18px rgba(0, 0, 0, 0.5));
}

.skew-card::before {
  content: '';
  position: absolute;
  inset: 4px;
  background: var(--card-fill, #403F1E);
  clip-path: inherit;
  z-index: 0;
}

.skew-card > * {
  position: relative;
  z-index: 1;
}

/*
 * Сдвиг карточек вбок задаёт «разбросанный» вид в стиле Deadlock.
 * На телефоне ±170px уводили карточку целиком за экран, поэтому
 * ниже md сдвиг выключен, а его эффект заменён накидкой в углах.
 */
.card-shift-l { translate: -170px 0; }
.card-shift-r { translate: 170px 0; }

@media (max-width:767px) {
  .card-shift-l, .card-shift-r { translate: 0 0; }
}

.skew-card-flip {
  clip-path: polygon(0% 12%, 100% 0%, 100% 100%, 0% 88%);
  transform: rotate(-1.2deg) skewX(-6deg);
}

/* Форма задаётся псевдоэлементом: сама кнопка не клипается,
   поэтому hover-scale не меняет её силуэт */

/* Обёртка даёт кнопке грубую смещённую тень и не клипается */
.skew-wrap {
  display: inline-block;
  filter: drop-shadow(8px 8px 0 var(--btn-shadow, rgba(0, 0, 0, 0.55)));
}

.skew-end {
  display: block;
  width: fit-content;
  margin-left: auto;
  margin-right: 4px;
}

.skew-btn {
  --btn-ring-w: 2px;
  position: relative;
  display: inline-block;
  transform-origin: center;
  transition: transform 0.18s ease;
  will-change: transform;
}

.skew-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: var(--btn-bg, #E05929);
  clip-path: polygon(0% 0%, 100% 12%, 100% 88%, 0% 100%);
  transform: rotate(-1.2deg) skewX(6deg);
  box-shadow: inset 0 0 0 var(--btn-ring-w, 0px) var(--btn-ring, transparent);
  transition: filter 0.15s ease;
}

.skew-btn-flip::before {
  clip-path: polygon(0% 12%, 100% 0%, 100% 100%, 0% 88%);
  transform: rotate(-1.2deg) skewX(-6deg);
}

.skew-btn:hover {
  transform: scale(1.08);
}

.skew-btn:active {
  transform: scale(1.02);
}

.skew-btn:hover::before {
  filter: brightness(1.12);
}

.deadlock-number {
  /* Раньше тут стоял Titan One — правило ниже по файлу перебивало общий
     h3/.deadlock-number, и цифры рендерились не тем шрифтом, что заголовки.
     Держим Russo One, как и на сайте. */
  font-family: 'Russo One', 'Fira Sans Condensed', sans-serif;
  font-size: clamp(90px, 14vw, 150px);
  line-height: 0.85;
  display: inline-block;
  font-weight: 400;
  font-stretch: condensed;
  opacity: 0.95;
  /* 3D-сдвиг и объем как у графики Valve */
  text-shadow:
    3px 3px 0px #242311,
    6px 6px 0px #18170B,
    9px 9px 20px rgba(0, 0, 0, 0.7);
}

/*
 * Цифры этапа на телефоне перекрывали заголовок карточки: clamp(90px, 14vw, 150px)
 * на 375px даёт 90px (минимум шкалы), а карточка во всю ширину экрана,
 * поэтому «2» и «3» наезжали на текст. Уменьшаем и приглушаем.
 *
 * Правило обязано идти ПОСЛЕ базового .deadlock-number выше: при равной
 * специфичности CSS побеждает последнее объявление, иначе переопределение
 * молча не применяется.
 */
@media (max-width:767px) {
  .deadlock-number {
    font-size: 52px;
    opacity: 0.35;
    text-shadow:
      2px 2px 0px #242311,
      4px 4px 12px rgba(0, 0, 0, 0.7);
  }
}
</style>
