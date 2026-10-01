<script setup lang="ts">
import PurchaseModal from './components/PurchaseModal.vue'
import Navbar from './components/Navbar.vue'
</script>

<template>
  <div class="relative min-h-screen page-bg bg-[var(--bg-page)] text-[var(--text-main)] flex flex-col items-center">
    <!--
      Атмосферный слой в стиле PlayDeadlock: зернистость бумаги и мягкое
      затемнение вглубь по мере прокрутки.

      position: absolute (не fixed) — холст привязан к документу, поэтому
      текстура скроллится вместе с содержимым и ощущается единым
      бесконечным листом, а не стеклом поверх страницы. Родитель выше
      имеет relative, иначе слой позиционировался бы от body.

      Обходится без JS: раньше зерно двигалось через transform и
      обработчик scroll, теперь положение задаёт сам документ.
    -->
    <div class="deadlock-scroll-bg" aria-hidden="true" />

    <Navbar />
    <main class="relative z-[1] w-full flex-1"><router-view /></main>
    <PurchaseModal />
    <footer class="relative z-[1] w-full max-w-6xl px-4 py-8 mt-auto border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--text-muted)] gap-4">
      <div>© Breeze • Minecraft 1.21.1</div>
      <div class="flex items-center gap-5">
        <router-link to="/offer" class="hover:text-[var(--text-main)] transition underline underline-offset-2">Оферта</router-link>
        <router-link to="/faq" class="hover:text-[var(--text-main)] transition">FAQ</router-link>
        <router-link to="/shop" class="hover:text-[var(--text-main)] transition">Магазин</router-link>
        <router-link to="/profile" class="hover:text-[var(--text-main)] transition">Профиль</router-link>
      </div>
    </footer>
  </div>
</template>

<style>
/*
 * Холст страницы: зерно бумаги и затемнение вглубь.
 *
 * absolute, а не fixed — слой принадлежит документу и уезжает вместе с
 * контентом. Без этого текстура стояла стеклом и читалась как отдельный
 * слой поверх сайта. z-index: 0 держит его под контентом: main и footer
 * подняты на z-[1], Navbar и модалка уже на z-50.
 */
.deadlock-scroll-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  min-height: 100%;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
  background-image:
    /* Растровые точки убраны: на тёмном фоне они читались как сетка
       поверх интерфейса. Остался только градиент глубины — от света
       у заголовка к плотному архиву внизу. */
    linear-gradient(
      to bottom,
      transparent 0%,
      rgba(10, 11, 13, 0.22) 600px,
      rgba(8, 9, 10, 0.5) 1600px,
      rgba(5, 6, 7, 0.7) 100%
    );
}

/*
 * Зернистость бумаги. Запечена в SVG data-URI: это один статичный растр,
 * а не анимированный фильтр, поэтому на скролле ничего не пересчитывается.
 *
 * Режимы наложения пробовались и отброшены: на почти чёрном фоне
 * soft-light и overlay высветляли его сильнее обычного смешивания
 * (замерено: soft-light 0.35 поднимал среднюю яркость с 17 до 46 из 255).
 */
.deadlock-scroll-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.025;
  background-repeat: repeat;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}

/*
 * Тёмные слои перекрыли бы содержимое в светлой теме, поэтому там растр
 * делаем темнее на светлом фоне, градиент глубины — мягче, зерно слабее.
 */
html:not(.dark) .deadlock-scroll-bg {
  background-image: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(11, 15, 25, 0.04) 600px,
    rgba(11, 15, 25, 0.09) 1600px,
    rgba(11, 15, 25, 0.14) 100%
  );
}

html:not(.dark) .deadlock-scroll-bg::after {
  opacity: 0.03;
}
</style>
