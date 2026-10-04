<script setup lang="ts">
/**
 * 3D-просмотр скина Minecraft.
 *
 * Свою модель на three пришлось бы собирать заново: развертка UV, слои
 * брони, плащ, тонкие руки, старые скины 64×32, анимации ходьбы. Всё
 * это уже сделано в skinview3d — им и пользуемся.
 *
 * Библиотека подключается динамически: вместе со своим three она весит
 * больше мегабайта, а в профиле нужна только когда смотришь на скин.
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { SkinViewer } from 'skinview3d'

const props = defineProps<{ skinUrl?: string }>()

const canvasRef = ref<HTMLCanvasElement>()
const loading = ref(true)
const failed = ref(false)
/** Идёт ли сейчас анимация ходьбы. */
const walking = ref(false)

let viewer: SkinViewer | null = null
let observer: ResizeObserver | null = null

async function boot() {
  const canvas = canvasRef.value
  if (!canvas) return
  loading.value = true
  failed.value = false
  // Перед пересозданием освобождаем прошлый: иначе WebGL-контекст
  // течёт при каждой смене скина, и после нескольких загрузок вкладка
  // падает с «context lost».
  destroyViewer()

  try {
    const { SkinViewer: Ctor, WalkingAnimation } = await import('skinview3d')

    const host = canvas.parentElement ?? canvas
    viewer = new Ctor({
      canvas,
      width: host.clientWidth || 240,
      height: host.clientHeight || 320,
      // Непрозрачный тёмный фон: подложка карточки почти чёрная, и на
      // ней светлая модель читалась бы плохо.
      background: '#1A1811',
      // auto-detect сам определяет обычные руки или slim по размеру
      // текстуры — вручную это делать не нужно.
      model: 'auto-detect',
      zoom: 0.92,
      enableControls: true,
      animation: new WalkingAnimation()
    })

    // По умолчанию стоим на месте: шагающий на месте персонаж выглядит
    // как глюк, а крутиться он и так будет.
    // animation помечен как nullable, хотя мы его только что передали
    // в конструктор — на всякий случай проверяем.
    if (viewer.animation) viewer.animation.speed = 0

    viewer.controls.enablePan = false
    // Камеру нельзя двигать вручную до adjustCameraDistance(): вьювер
    // считает дистанцию сам от fov и zoom, и пока этого не сделано,
    // орбита стартует внутри модели — кадр заливает текстурой.
    viewer.adjustCameraDistance()
    viewer.controls.minDistance = viewer.controls.minDistance * 0.6
    viewer.controls.maxDistance = viewer.controls.maxDistance * 1.8
    viewer.controls.update()

    await applySkin()
    loading.value = false

    observer = new ResizeObserver(() => {
      const el = canvas.parentElement ?? canvas
      viewer?.setSize(el.clientWidth || 240, el.clientHeight || 320)
    })
    observer.observe(host)
  } catch {
    failed.value = true
    loading.value = false
  }
}

function destroyViewer() {
  observer?.disconnect()
  observer = null
  viewer?.dispose()
  viewer = null
}

async function applySkin() {
  if (!viewer || !props.skinUrl) return
  try {
    // loadSkin сам выбирает формат: 64×64 и старый 64×32, обычные
    // руки и slim. loadSkin возвращает промис для удалённых картинок.
    await viewer.loadSkin(props.skinUrl)
    failed.value = false
  } catch {
    failed.value = true
  }
}

/** Переключатель анимации ходьбы. */
function toggleWalk() {
  walking.value = !walking.value
  if (viewer?.animation) {
    viewer.animation.speed = walking.value ? 0.9 : 0
  }
}

onMounted(async () => {
  if (!props.skinUrl) {
    failed.value = true
    loading.value = false
    return
  }
  await boot()
})

watch(
  () => props.skinUrl,
  async (url) => {
    if (!url) {
      viewer?.loadSkin(null)
      failed.value = true
      return
    }
    if (viewer) await applySkin()
    else await boot()
  }
)

onBeforeUnmount(destroyViewer)
</script>

<template>
  <div class="skin3d">
    <canvas ref="canvasRef" class="skin3d-canvas" />

    <div v-if="loading" class="skin3d-note">Загрузка модели…</div>
    <div v-else-if="failed" class="skin3d-note">Нет скина</div>

    <template v-else>
      <div class="skin3d-controls">
        <button type="button" class="skin3d-btn" @click="toggleWalk">
          {{ walking ? 'Стоять' : 'Идти' }}
        </button>
      </div>
      <div class="skin3d-hint">тяните мышью · колесо — зум</div>
    </template>
  </div>
</template>

<style scoped>
.skin3d {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.skin3d:active {
  cursor: grabbing;
}

.skin3d-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.skin3d-note,
.skin3d-hint {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 10px;
  text-align: center;
  font-family: monospace;
  font-size: 11px;
  pointer-events: none;
}

.skin3d-note {
  color: var(--text-muted, #a1a1aa);
}

.skin3d-hint {
  color: rgba(246, 196, 66, 0.55);
}

/* Панель управления поверх холста */
.skin3d-controls {
  position: absolute;
  top: 8px;
  right: 8px;
}

.skin3d-btn {
  font-family: monospace;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #1c1b0d;
  background: #f6c442;
  border: none;
  padding: 4px 10px;
  cursor: pointer;
  clip-path: polygon(0% 0%, 100% 12%, 100% 88%, 0% 100%);
  transition: background-color 0.15s ease;
}

.skin3d-btn:hover {
  background: #fff;
}

@media (prefers-reduced-motion: reduce) {
  .skin3d {
    cursor: default;
  }
}
</style>