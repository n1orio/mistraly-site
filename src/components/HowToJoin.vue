<script setup lang="ts">
import { usePurchaseStore } from '../stores/purchase'
const purchase = usePurchaseStore()
</script>

<template>
  <section id="stages" class="w-full py-24 flex flex-col items-center relative overflow-hidden page-bg">

    <!-- Фоновая пунктирная линия -->
    <div class="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 border-r-2 border-dashed border-[#4D4B33] pointer-events-none opacity-40"></div>

    <div class="w-full max-w-4xl px-4 flex flex-col gap-16 relative z-10">

      <!-- ================= ШАГ 1 ================= -->
      <div class="relative w-full group">
        <div class="relative card-shift-l">

          <!-- ЕДИНЫЙ СТИКЕР ЭТАПА (слово ЭТАП + плашка двигаются синхронно) -->
          <div class="stage-sticker-wrap absolute -top-8 left-3 z-30 select-none">
            <div class="text-[17px] font-black tracking-[0.04em] uppercase text-[#EFEBD9] leading-none mb-1 pl-1">
              ЭТАП
            </div>
            <div class="bg-[#5865F2] text-white px-2.5 py-1.5 shadow-[3px_4px_0px_#1E2465] transform -rotate-2">
              <div class="text-[19px] font-black tracking-[-0.01em] uppercase text-[#181611] leading-tight">ВХОД</div>
            </div>
          </div>

          <!-- Цифра 1 -->
          <div class="absolute -top-1 md:-top-3 right-4 md:right-8 select-none pointer-events-none z-20">
            <span class="deadlock-number text-[#60A5FA] transform rotate-3">
              1
            </span>
          </div>

          <!-- Сама наклонная карточка -->
          <div style="--card-fill:#161926;--card-border:#2D334D;--btn-shadow:#181B38" class="relative skew-card p-7 sm:p-9 flex flex-col md:flex-row justify-between items-start md:items-center min-h-[190px]">
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
              <span class="skew-wrap">
                <button
                  @click="purchase.show"
                  style="--btn-bg:#5865F2; --btn-color:#FFFFFF"
                  class="skew-btn px-5 py-2.5 font-black text-xs uppercase tracking-widest cursor-pointer"
                >
                  Войти через Discord
                </button>
              </span>
            </div>
          </div>

        </div>
      </div>

      <!-- ================= ШАГ 2 ================= -->
      <div class="relative w-full group">
        <div class="relative card-shift-r">

          <!-- ЕДИНЫЙ СТИКЕР ЭТАПА (правый) -->
          <div class="stage-sticker-wrap absolute -top-8 right-3 z-30 select-none text-right">
            <div class="text-[17px] font-black tracking-[0.04em] uppercase text-[#EFEBD9] leading-none mb-1 pr-1">
              ЭТАП
            </div>
            <div class="bg-[#E05929] text-[#181611] px-2.5 py-1.5 shadow-[3px_4px_0px_#14130E] transform rotate-3">
              <div class="text-[19px] font-black tracking-[-0.01em] uppercase text-[#181611] leading-tight">ДОСТУП</div>
            </div>
          </div>

          <!-- Цифра 2 -->
          <div class="absolute -top-1 md:-top-3 left-4 md:left-8 select-none pointer-events-none z-20">
            <span class="deadlock-number text-[#F6C442] transform -rotate-2">
              2
            </span>
          </div>

          <!-- Сама наклонная карточка -->
          <div style="--card-fill:#383719;--card-border:#575427;--btn-shadow:#2A2912" class="relative skew-card skew-card-flip p-7 sm:p-9 flex flex-col md:flex-row-reverse justify-between items-start md:items-center min-h-[190px]">
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
              <span class="skew-wrap skew-end">
                <button
                  @click="purchase.show"
                  style="--btn-bg:#F6C442; --btn-color:#1C1B0D"
                  class="skew-btn skew-btn-flip px-5 py-2.5 font-black text-xs uppercase tracking-widest cursor-pointer"
                >
                  Купить проходку &rarr;
                </button>
              </span>
            </div>
          </div>

        </div>
      </div>

      <!-- ================= ШАГ 3 ================= -->
      <div class="relative w-full group">
        <div class="relative card-shift-l">

          <!-- ЕДИНЫЙ СТИКЕР ЭТАПА -->
          <div class="stage-sticker-wrap absolute -top-8 left-3 z-30 select-none">
            <div class="text-[17px] font-black tracking-[0.04em] uppercase text-[#EFEBD9] leading-none mb-1 pl-1">
              ЭТАП
            </div>
            <div class="bg-[#84CC16] text-[#142306] px-2.5 py-1.5 shadow-[3px_4px_0px_#142306] transform -rotate-2">
              <div class="text-[19px] font-black tracking-[-0.01em] uppercase text-[#181611] leading-tight">В ПОЛЁТ</div>
            </div>
          </div>

          <!-- Цифра 3 -->
          <div class="absolute -top-1 md:-top-3 right-4 md:right-8 select-none pointer-events-none z-20">
            <span class="deadlock-number text-[#4ADE80] transform rotate-4">
              3
            </span>
          </div>

          <!-- Сама наклонная карточка -->
          <div style="--card-fill:#19221E;--card-border:#2D3F37;--btn-shadow:#0C1512" class="relative skew-card p-7 sm:p-9 flex flex-col md:flex-row justify-between items-start md:items-center min-h-[190px]">
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
              <span class="skew-wrap">
                <a
                  href="#launcher"
                  style="--btn-bg:#4ADE80; --btn-color:#142306"
                  class="skew-btn inline-block px-5 py-2.5 font-black text-xs uppercase tracking-widest cursor-pointer text-decoration-none"
                >
                  Скачать лаунчер
                </a>
              </span>
            </div>
          </div>

        </div>
      </div>

    </div>
  </section>
</template>

<style scoped>
h3,
.deadlock-number {
  font-family: 'Russo One', 'Fira Sans Condensed', sans-serif;
}

/* Карточка */
.skew-card {
  background: var(--card-border, #5C592C);
  clip-path: polygon(0% 0%, 100% 12%, 100% 88%, 0% 100%);
  transform: rotate(-1.2deg) skewX(6deg);
  filter: drop-shadow(10px 14px 18px rgba(0, 0, 0, 0.5));
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
              filter 0.22s ease;
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

.group:hover .skew-card {
  transform: rotate(-1.2deg) skewX(6deg) translate(-2px, -3px);
  filter: drop-shadow(14px 18px 22px rgba(0, 0, 0, 0.65));
}

.skew-card-flip {
  clip-path: polygon(0% 12%, 100% 0%, 100% 100%, 0% 88%);
  transform: rotate(-1.2deg) skewX(-6deg);
}

.group:hover .skew-card-flip {
  transform: rotate(-1.2deg) skewX(-6deg) translate(2px, -3px);
}

/* Сдвиги карточек */
.card-shift-l { translate: -170px 0; }
.card-shift-r { translate: 170px 0; }

@media (max-width:767px) {
  .card-shift-l, .card-shift-r { translate: 0 0; }
}

/*
 * СТИКЕР (СЛОВО «ЭТАП» + ПЛАШКА):
 * Теперь это единый блок, который плавно пружинит вверх при наведении на карточку!
 */
.stage-sticker-wrap {
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-origin: bottom center;
}

.group:hover .stage-sticker-wrap {
  transform: translateY(-4px) scale(1.05);
}

/* =========================================================
   КНОПКИ: БЕЛЫЙ ХОВЕР, УВЕЛИЧЕНИЕ
   ========================================================= */
.skew-wrap {
  display: inline-block;
  filter: drop-shadow(8px 8px 0 var(--btn-shadow, rgba(0, 0, 0, 0.55)));
  transition: filter 0.2s ease;
}

.skew-end {
  display: block;
  width: fit-content;
  margin-left: auto;
  margin-right: 4px;
}

.skew-wrap:hover {
  filter: drop-shadow(10px 10px 0 var(--btn-shadow, rgba(0, 0, 0, 0.75)));
}

.skew-btn {
  --btn-ring-w: 2px;
  position: relative;
  display: inline-block;
  color: var(--btn-color, #FFFFFF);
  transform-origin: center;
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
              color 0.2s ease;
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
  transition: background-color 0.2s ease, transform 0.22s ease;
}

.skew-btn-flip::before {
  clip-path: polygon(0% 12%, 100% 0%, 100% 100%, 0% 88%);
  transform: rotate(-1.2deg) skewX(-6deg);
}

.skew-btn:hover {
  transform: scale(1.06);
  color: #0d0e10 !important;
}

.skew-btn:hover::before {
  background-color: #FFFFFF !important;
}

.skew-btn:active {
  transform: scale(0.97);
}

/* =========================================================
   ОБЪЕМНЫЕ ЦИФРЫ (БЕЗ ДОВОРОТА)
   ========================================================= */
.deadlock-number {
  font-family: 'Russo One', 'Fira Sans Condensed', sans-serif;
  font-size: clamp(90px, 14vw, 150px);
  line-height: 0.85;
  display: inline-block;
  font-weight: 400;
  font-stretch: condensed;
  opacity: 0.95;
  text-shadow:
    3px 3px 0px #242311,
    6px 6px 0px #18170B,
    9px 9px 20px rgba(0, 0, 0, 0.7);
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.group:hover .deadlock-number {
  transform: scale(1.04);
}

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
