<script setup lang="ts">
import '@google/model-viewer'

/**
 * Пиксельная 3D-шестерня Create на <model-viewer>.
 *
 * Модель не нарисована вручную: scripts/make-cogwheel-glb.mjs конвертирует
 * блочную модель create:block/cogwheel из create-1.21.1-6.0.10.jar
 * (assets/create/models/block/cogwheel.json + текстуры block/*.png)
 * в public/models/create/cogwheel.glb с кубическим освещением граней
 * и nearest-фильтром — тем же пиксельным видом, что и в игре.
 *
 * Низ уводится в прозрачность через mask-image по альфа-каналу самого
 * рендера, а не оверлеем цвета фона: маска работает на любом фоне и не
 * оставляет шва, тогда как плашка цвета требует угадывать цвет страницы.
 *
 * Позиционирование намеренно не делаем — контейнер позиционирует
 * вызывающий код (HomeView), иначе смещения translate сложатся.
 */
withDefaults(defineProps<{
  /** сторона области в CSS-пикселях */
  size?: number
  /** секунд на оборот */
  speed?: number
  /** вращать ли */
  spin?: boolean
  /** наклон/ракурс камеры: «30deg 65deg 105m» */
  cameraOrbit?: string
  /** поле зрения камеры, градусы */
  fieldOfView?: string
  /** общая прозрачность, чтобы шестерня читалась как фоновый декор */
  dim?: number
  /** экспозиция рендера */
  exposure?: number
}>(), {
  size: 1100,
  speed: 20,
  spin: true,
  cameraOrbit: '225deg 160deg 140%',
  fieldOfView: '26deg',
  dim: 0.55,
  exposure: 1.1
})
</script>

<template>
  <div
    class="gear-wrap"
    :style="{
      width: size + 'px',
      height: size + 'px',
      opacity: dim
    }"
    aria-hidden="true"
  >
    <model-viewer
      src="/models/create/cogwheel.glb"
      loading="eager"
      reveal="auto"
      disable-zoom
      disable-pan
      disable-tap
      interpolation-decay="120"
      :camera-orbit="cameraOrbit"
      :field-of-view="fieldOfView"
      :auto-rotate="spin ? true : false"
      :rotation-speed="spin ? `${(360 / speed).toFixed(2)}deg` : '0deg'"
      min-camera-orbit="auto 0deg auto"
      max-camera-orbit="auto 180deg 600%"
      shadow-intensity="0"
      shadow-root="none"
      environment-image="legacy"
      interaction-prompt="none"
      :exposure="exposure"
    />
  </div>
</template>

<style scoped>
.gear-wrap {
  display: block;
  line-height: 0;
  pointer-events: none;
  user-select: none;
  /*
   * Маска по альфа-каналу рендера: сверху видно полностью, к 65% высоты
   * alpha уже на нуле — то есть растворение короче высоты бокса, и нижние
   * зубья не свисают под ним.
   *
   * Стопы обязаны идти по возрастанию (0 → 25 → 45 → 58 → 65), иначе
   * движок их клампит и градиент ломается.
   */
  -webkit-mask-image: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 1) 0%,
    rgba(0, 0, 0, 1) 25%,
    rgba(0, 0, 0, 0.6) 45%,
    rgba(0, 0, 0, 0.15) 58%,
    rgba(0, 0, 0, 0) 65%
  );
  mask-image: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 1) 0%,
    rgba(0, 0, 0, 1) 25%,
    rgba(0, 0, 0, 0.6) 45%,
    rgba(0, 0, 0, 0.15) 58%,
    rgba(0, 0, 0, 0) 65%
  );
  -webkit-mask-size: 100% 100%;
  mask-size: 100% 100%;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
}
.gear-wrap :deep(model-viewer) {
  width: 100%;
  height: 100%;
  background: transparent !important;
  --poster-color: transparent;
  --progress-bar-color: transparent;
  --progress-mask: transparent;
}
.gear-wrap :deep(model-viewer::part(default-progress-bar)) {
  display: none;
}
</style>