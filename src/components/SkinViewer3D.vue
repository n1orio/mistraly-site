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
import { api } from '../api/client'
import { useAuthStore } from '../stores/auth'

const props = defineProps<{
  skinUrl?: string
  /**
   * Формат скина из профиля (users.skin_variant). Приходит с сервера,
   * поэтому переживает перезагрузку страницы.
   */
  variant?: string
  /** Выбор формата нужно сохранить на сервере. */
  variantChanged?: (v: 'default' | 'slim') => void
}>()

const auth = useAuthStore()

const canvasRef = ref<HTMLCanvasElement>()
const loading = ref(true)
const failed = ref(false)
/** Идёт ли сейчас анимация ходьбы. */
const walking = ref(false)
/**
 * Тип модели: classic (обычные руки) или slim (тонкие, «Алекс»).
 *
 * Приходит с сервера (users.skin_variant) — поэтому переживает
 * перезагрузку страницы и работает на любом устройстве. В localStorage
 * выбор не клали сознательно: он слетел при первом же перезаходе, а
 * место для такого — база.
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
      // руки) и slim (тонкие).
      //
      // Автоопределение НЕ используем. skinview3d выводит slim так:
      // если хоть один пиксель в области правой руки прозрачный, скин
      // считается тонким. У скинов с незаполненными или
      // полупрозрачными областями это даёт ложное срабатывание — модель
      // собирается как slim, хотя нарисована под classic, и на экране
      // получается белая каша. Поэтому по умолчанию classic, а slim
      // выбирается кнопкой вручную и запоминается.
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

/**
 * Формат хранится на сервере, в users.skin_variant: при выборе кнопкой
 * отправляем PUT /user/skin-variant, при входе берём из /user/profile.
 * Раньше выбор клали в localStorage — он слетал при перезагрузке, и
 * человек возвращался к classic, хотя сам переключал на slim.
 */
async function saveModelChoice(value: 'default' | 'slim') {
  try {
    await api.put('/user/skin-variant', { variant: value })
  } catch {
    // Не сохранилось — на экране всё равно верный формат, просто
    // в следующий раз вернётся тот, что в базе.
  }
}

function destroyViewer() {
  observer?.disconnect()
  observer = null
  viewer?.dispose()
  viewer = null
}

/**
 * Проверяет, что текстура текстура пригодна для показа.
 *
 * Пока skinview3d грузит картинку, он рисует модель материалом по
 * умолчанию — белым. Если текстура не пришла (битый PNG, 404, CORS),
 * белый куб так и остаётся, и выглядит как «белый скин». Проверяем
 * непрозрачность заранее и в этом случае прячем модель.
 */
async function textureLooksBroken(url: string): Promise<boolean> {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.crossOrigin = 'anonymous'
      i.onload = () => resolve(i)
      i.onerror = () => reject(new Error('skin image failed to load'))
      i.src = url
    })
    if (!img.naturalWidth) return true

    const size = Math.min(64, img.naturalWidth)
    const c = document.createElement('canvas')
    c.width = size
    c.height = size
    const ctx = c.getContext('2d')
    if (!ctx) return false
    ctx.drawImage(img, 0, 0, size, size)
    const data = ctx.getImageData(0, 0, size, size).data
    let opaque = 0
    for (let i = 3; i < data.length; i += 4) if (data[i] > 200) opaque++
    // У настоящего скина непрозрачна вся развёртка; пустая текстура —
    // это 0%. Порог снизу, а не наоборот: скин может быть неполным,
    // но это всё равно лучше белого куба.
    return opaque < size * size * 0.05
  } catch {
    return true
  }
}

async function applySkin() {
  if (!viewer || !props.skinUrl) return
  const url = props.skinUrl
  try {
    await viewer.loadSkin(url, { model: model.value })
    failed.value = false
    // Если развёртка пустая, модель-«белый куб» не показываем.
    if (await textureLooksBroken(url)) failed.value = true
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

/** Переключение classic ⇄ slim. Выбор запоминается и переживает
 *  перезагрузку страницы. */
function toggleModel() {
  model.value = isSlim.value ? 'default' : 'slim'
  props.variantChanged?.(model.value)
  void saveModelChoice(model.value)
  if (!viewer || !props.skinUrl) return
  void viewer.loadSkin(props.skinUrl, { model: model.value })
}

/** Подтягивает формат из профиля (skin_variant) — источник истины. */
function syncVariantFromProfile() {
  const v = props.variant || auth.user?.skin_variant
  if (v === 'slim' || v === 'default') model.value = v
}

onMounted(async () => {
  syncVariantFromProfile()
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
    // Формат сохраняется: он относится к аккаунту, а не к конкретной
    // картинке. Но если сохранён slim, а новый скин нарисован под
    // classic, показывать кашу бессмысленно — возвращаемся к classic.
    if (await textureLooksBroken(url)) {
      model.value = 'default'
    }
    if (viewer) await applySkin()
    else await boot()
  }
)

// Формат мог прийти позже — из профиля, который догружается асинхронно.
watch(
  () => props.variant,
  async (v) => {
    if (v !== 'slim' && v !== 'default') return
    if (v === model.value) return
    model.value = v
    if (viewer && props.skinUrl) await viewer.loadSkin(props.skinUrl, { model: v })
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