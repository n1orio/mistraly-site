<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { GearRenderer } from '../lib/gearRenderer'

/**
 * Пиксельная 3D-шестерня Create на Babylon.js.
 *
 * Сам рендер вынесен в src/lib/gearRenderer.ts и подключается динамическим
 * импортом: Babylon весит около мегабайта, а шестерня — фоновый декор,
 * который не должен задерживать первую отрисовку главной.
 *
 * Низ уводится в прозрачность через mask-image по альфа-каналу самого
 * рендера, а не оверлеем цвета фона: маска работает на любом фоне и не
 * оставляет шва, тогда как плашка цвета требует угадывать цвет страницы.
 *
 * Позиционирование намеренно не делаем — контейнер позиционирует
 * вызывающий код (HomeView), иначе смещения translate сложатся.
 */
const props = withDefaults(defineProps<{
  /** сторона области в CSS-пикселях */
  size?: number
  /** секунд на оборот */
  speed?: number
  /** вращать ли */
  spin?: boolean
  /** ракурс камеры как у model-viewer: «<азимут>deg <высота>deg <радиус>%» */
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

const wrap = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)

let renderer: GearRenderer | null = null
let resizeObs: ResizeObserver | null = null
/**
 * Скорость и вращение лежат в мутируемом объекте, а не в замыкании рендерера:
 * цикл читает их каждый кадр, иначе смена speed/spin на странице не дала бы
 * эффекта до пересоздания движка.
 */
const spinState = { speed: props.speed, spin: props.spin }
/** true, пока компонент жив: иначе гонка динамического импорта успевает
 *  создать движок уже после unmount и оставляет его висеть в памяти. */
let alive = false

async function init() {
  if (!canvas.value || !wrap.value) return
  const host = wrap.value
  alive = true

  // preloadGear() уже начат в main.ts, поэтому здесь импорт мгновенный —
  // к моменту монтирования чанк и модель обычно уже в памяти.
  const { createGearRenderer } = await import('../lib/gearRenderer')
  if (!alive || !canvas.value) return
  renderer = await createGearRenderer(canvas.value, {
    exposure: props.exposure,
    cameraOrbit: props.cameraOrbit,
    fieldOfView: props.fieldOfView
  }, spinState)
  if (!alive) {
    renderer.dispose()
    renderer = null
    return
  }

  resizeObs = new ResizeObserver(() => renderer?.resize())
  resizeObs.observe(host)
}

onMounted(() => { void init() })

onBeforeUnmount(() => {
  alive = false
  resizeObs?.disconnect()
  renderer?.dispose()
  renderer = null
})

watch(() => [props.cameraOrbit, props.fieldOfView], () => {
  renderer?.setCamera(props.cameraOrbit, props.fieldOfView)
})
watch(() => props.exposure, (v) => renderer?.setExposure(v))
watch(() => props.speed, (v) => { spinState.speed = v })
watch(() => props.spin, (v) => { spinState.spin = v })
</script>

<template>
  <div
    ref="wrap"
    class="gear-wrap"
    :style="{
      /*
       * Размер ограничен 150% ширины экрана: на десктопе 1100px
       * (min берёт size), на телефоне — 150vw, иначе бокс шире
       * вьюпорта и шестерня уезжает за края.
       */
      width: 'min(' + size + 'px, 150vw)',
      height: 'min(' + size + 'px, 150vw)',
      opacity: dim
    }"
    aria-hidden="true"
  >
    <canvas ref="canvas" class="gear-canvas" />
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
.gear-canvas {
  display: block;
  width: 100%;
  height: 100%;
  outline: none;
  background: transparent;
  touch-action: none;
}
</style>
