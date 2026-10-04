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
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { SkinViewer } from 'skinview3d'

const props = defineProps<{ skinUrl?: string }>()

const canvasRef = ref<HTMLCanvasElement>()
const loading = ref(true)
const failed = ref(false)
/** Идёт ли сейчас анимация ходьбы. */
const walking = ref(false)
/**
 * Тип модели: classic (обычные руки) или slim (тонкие, «Алекс»).
 * Определяется по размеру текстуры — 64×64 это classic, 64×32 с
 * вытянутыми слоями — slim, — но его можно переключить вручную,
 * если определение ошиблось.
 */
const model = ref<'default' | 'slim'>('default')
const isSlim = computed(() => model.value === 'slim')

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
      // Только два формата, как и задумано игрой: classic (обычные
      // руки) и slim (тонкие). Никаких legacy-64×32 и прочих.
      model: model.value,
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

    // Скин мылился в кашу, потому что skinview3d прогоняет кадр через
    // FXAA — сглаживание рассчитано на 3D, а пиксель-арт после него
    // теряет чёткие границы кубов. Проход отключаем, границы рёбер
    // и так рисуются точно.
    if (viewer.fxaaPass) {
      viewer.fxaaPass.enabled = false
    }

    applySkinSize()

    await applySkin()
    loading.value = false

    observer = new ResizeObserver(() => applySkinSize())
    observer.observe(host)
  } catch {
    failed.value = true
    loading.value = false
  }
}

/**
 * Ставит размер холста по контейнеру, в целых пикселях.
 *
 * skinview3d рисует в буфер своего размера, а CSS растягивает canvas
 * до 100%. Если размеры дробные и разные (261×300 против 317×352),
 * браузер интерполирует картинку — пиксели скина размываются. Поэтому
 * задаём холсту ровно тот размер, который он занимает на экране.
 */
function applySkinSize() {
  const canvas = canvasRef.value
  if (!canvas || !viewer) return
  const host = canvas.parentElement ?? canvas
  const w = Math.max(1, Math.round(host.clientWidth))
  const h = Math.max(1, Math.round(host.clientHeight))
  canvas.style.width = `${w}px`
  canvas.style.height = `${h}px`
  viewer.setSize(w, h)
}

/**
 * Угадывает формат по размеру текстуры.
 *
 * Классический скин 64×64; у slim-скина в правой половине головы
 * третья «дымка» слоя, из-за чего старая развёртка 64×32 вытягивается
 * в 64×64 с прозрачной полосой. Надёжнее смотреть на соотношение
 * сторон: 1:2 — slim, 1:1 — classic.
 */
async function detectModel() {
  const url = props.skinUrl
  if (!url) return
  const img = new Image()
  img.crossOrigin = 'anonymous'
  await new Promise<void>((resolve) => {
    img.onload = () => {
      model.value = img.height * 2 === img.width ? 'slim' : 'default'
      resolve()
    }
    img.onerror = () => resolve()
    img.src = url
  })
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
    // Формат передаём явно, а не auto-detect: определение по размеру
    // текстуры ошибается на скинах, где прозрачная полоса slim-развёртки
    // не доходит до края.
    await viewer.loadSkin(props.skinUrl, { model: model.value })
    failed.value = false
    // Размер мог измениться вместе с текстурой — пересчитываем буфер,
    // иначе картинка растягивается и мылится.
    applySkinSize()
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

/** Переключение classic ⇄ slim. */
function toggleModel() {
  model.value = isSlim.value ? 'default' : 'slim'
  if (!viewer || !props.skinUrl) return
  void viewer.loadSkin(props.skinUrl, { model: model.value })
}

onMounted(async () => {
  if (!props.skinUrl) {
    failed.value = true
    loading.value = false
    return
  }
  // Формат определяем ДО создания вьювера: иначе модель соберётся в
  // classic, а потом придётся пересобирать её заново.
  await detectModel()
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
    // Новый скин — заново угадываем формат. Без этого подставленная
    // в шаблоне модель оставалась от прошлого скина, и до перезагрузки
    // страницы картинка не появлялась.
    await detectModel()
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
        <button type="button" class="skin3d-btn" @click="toggleModel">
          {{ isSlim ? 'SLIM' : 'CLASSIC' }}
        </button>
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

/*
 * Размер холста задаётся из JS (applySkinSize) — нам нужны ЦЕЛЫЕ
 * пиксели, совпадающие с буфером WebGL. Поэтому здесь нет width:100%:
 * растягивание до дробного размера контейнера заставляло браузер
 * интерполировать кадр, и пиксель-арт мылился.
 */
.skin3d-canvas {
  display: block;
  max-width: 100%;
  max-height: 100%;
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
  display: flex;
  gap: 6px;
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