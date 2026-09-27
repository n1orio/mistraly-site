<template>
  <div class="skin-preview-wrap" :class="{ loaded: skinLoaded }">
    <canvas ref="canvasRef" width="64" height="128" class="skin-canvas"></canvas>
    <div v-if="!skinLoaded" class="skin-placeholder">
      <span>{{ props.skinUrl ? 'Загрузка...' : 'Нет скина' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

const props = defineProps<{ skinUrl?: string }>()
const canvasRef = ref<HTMLCanvasElement>()
const skinLoaded = ref(false)

function renderSkin(img: HTMLImageElement) {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Scale up for sharp pixel display
  canvas.style.width = '128px'
  canvas.style.height = '256px'
  canvas.width = 64
  canvas.height = 128

  ctx.clearRect(0, 0, 64, 128)
  ctx.imageSmoothingEnabled = false

  // === Minecraft skin UV map: front view ===
  // Head (front): UV(8,8) 8x8 → draw at (24,0) 8x8
  // Head (top): UV(8,0) 8x8 → draw at (24,-8) 8x8
  // Head (side-left): UV(0,8) 8x8 → draw at (16,0) 8x8
  // Head (side-right): UV(16,8) 8x8 → draw at (32,0) 8x8
  
  const SKIN = img
  const scale = 2

  // ---- HEAD ----
  // Top
  ctx.drawImage(SKIN, 8, 0, 8, 8, 24, -scale*8, 8*scale, 8*scale)
  // Front
  ctx.drawImage(SKIN, 8, 8, 8, 8, 24, 0, 8*scale, 8*scale)
  // Left side
  ctx.drawImage(SKIN, 0, 8, 8, 8, 16, 0, 8*scale, 8*scale)
  // Right side
  ctx.drawImage(SKIN, 16, 8, 8, 8, 32, 0, 8*scale, 8*scale)
  // Bottom
  ctx.drawImage(SKIN, 24, 0, 8, 8, 24, 8*scale, 8*scale, 8*scale)
  // Back
  ctx.drawImage(SKIN, 24, 8, 8, 8, 40, 0, 8*scale, 8*scale)

  // Hat overlay
  ctx.drawImage(SKIN, 40, 8, 8, 8, 24, 0, 8*scale, 8*scale)  // front
  ctx.drawImage(SKIN, 32, 8, 8, 8, 16, 0, 8*scale, 8*scale)  // left
  ctx.drawImage(SKIN, 48, 8, 8, 8, 32, 0, 8*scale, 8*scale)  // right
  ctx.drawImage(SKIN, 56, 8, 8, 8, 40, 0, 8*scale, 8*scale)  // back
  ctx.drawImage(SKIN, 40, 0, 8, 8, 24, -scale*8, 8*scale, 8*scale) // top

  // ---- BODY ----
  // Body front
  ctx.drawImage(SKIN, 20, 20, 8, 12, 24, 8*scale, 8*scale, 12*scale)
  // Body back
  ctx.drawImage(SKIN, 32, 20, 8, 12, 40, 8*scale, 8*scale, 12*scale)
  // Body left
  ctx.drawImage(SKIN, 16, 20, 4, 12, 20, 8*scale, 4*scale, 12*scale)
  // Body right
  ctx.drawImage(SKIN, 28, 20, 4, 12, 36, 8*scale, 4*scale, 12*scale)
  // Body top
  ctx.drawImage(SKIN, 20, 16, 8, 4, 24, 8*scale, 8*scale, 4*scale)
  // Body bottom
  ctx.drawImage(SKIN, 28, 16, 8, 4, 24, 20*scale, 8*scale, 4*scale)

  // Jacket overlay
  ctx.drawImage(SKIN, 20, 36, 8, 12, 24, 8*scale, 8*scale, 12*scale)

  // ---- LEFT ARM ----
  // Front
  ctx.drawImage(SKIN, 44, 20, 4, 12, 14, 8*scale, 4*scale, 12*scale)
  // Back
  ctx.drawImage(SKIN, 52, 20, 4, 12, 18, 8*scale, 4*scale, 12*scale)
  // Top
  ctx.drawImage(SKIN, 44, 16, 4, 4, 14, 8*scale, 4*scale, 4*scale)
  // Bottom
  ctx.drawImage(SKIN, 48, 16, 4, 4, 14, 20*scale, 4*scale, 4*scale)
  // Left (inner)
  ctx.drawImage(SKIN, 40, 20, 4, 12, 10, 8*scale, 4*scale, 12*scale)
  // Right (outer)
  ctx.drawImage(SKIN, 48, 20, 4, 12, 22, 8*scale, 4*scale, 12*scale)

  // Left arm overlay
  ctx.drawImage(SKIN, 44, 36, 4, 12, 14, 8*scale, 4*scale, 12*scale)

  // ---- RIGHT ARM ----
  // Front
  ctx.drawImage(SKIN, 36, 52, 4, 12, 46, 8*scale, 4*scale, 12*scale)
  // Back
  ctx.drawImage(SKIN, 44, 52, 4, 12, 50, 8*scale, 4*scale, 12*scale)
  // Top
  ctx.drawImage(SKIN, 36, 48, 4, 4, 46, 8*scale, 4*scale, 4*scale)
  // Bottom
  ctx.drawImage(SKIN, 40, 48, 4, 4, 46, 20*scale, 4*scale, 4*scale)
  // Left (inner)
  ctx.drawImage(SKIN, 32, 52, 4, 12, 42, 8*scale, 4*scale, 12*scale)
  // Right (outer)
  ctx.drawImage(SKIN, 40, 52, 4, 12, 54, 8*scale, 4*scale, 12*scale)

  // Right arm overlay
  ctx.drawImage(SKIN, 36, 36, 4, 12, 46, 8*scale, 4*scale, 12*scale)

  // ---- LEFT LEG ----
  // Front
  ctx.drawImage(SKIN, 4, 20, 4, 12, 24, 20*scale, 4*scale, 12*scale)
  // Back
  ctx.drawImage(SKIN, 12, 20, 4, 12, 28, 20*scale, 4*scale, 12*scale)
  // Top
  ctx.drawImage(SKIN, 4, 16, 4, 4, 24, 20*scale, 4*scale, 4*scale)
  // Bottom
  ctx.drawImage(SKIN, 8, 16, 4, 4, 24, 32*scale, 4*scale, 4*scale)
  // Left
  ctx.drawImage(SKIN, 0, 20, 4, 12, 20, 20*scale, 4*scale, 12*scale)
  // Right
  ctx.drawImage(SKIN, 8, 20, 4, 12, 32, 20*scale, 4*scale, 12*scale)

  // Left leg overlay
  ctx.drawImage(SKIN, 4, 36, 4, 12, 24, 20*scale, 4*scale, 12*scale)

  // ---- RIGHT LEG ----
  // Front
  ctx.drawImage(SKIN, 20, 52, 4, 12, 32, 20*scale, 4*scale, 12*scale)
  // Back
  ctx.drawImage(SKIN, 28, 52, 4, 12, 36, 20*scale, 4*scale, 12*scale)
  // Top
  ctx.drawImage(SKIN, 20, 48, 4, 4, 32, 20*scale, 4*scale, 4*scale)
  // Bottom
  ctx.drawImage(SKIN, 24, 48, 4, 4, 32, 32*scale, 4*scale, 4*scale)
  // Left
  ctx.drawImage(SKIN, 16, 52, 4, 12, 28, 20*scale, 4*scale, 12*scale)
  // Right
  ctx.drawImage(SKIN, 24, 52, 4, 12, 40, 20*scale, 4*scale, 12*scale)

  // Right leg overlay
  ctx.drawImage(SKIN, 52, 52, 4, 12, 32, 20*scale, 4*scale, 12*scale)

  skinLoaded.value = true
}

function loadSkin() {
  if (!props.skinUrl) {
    skinLoaded.value = false
    return
  }
  skinLoaded.value = false
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => renderSkin(img)
  img.onerror = () => { skinLoaded.value = false }
  img.src = props.skinUrl
}

watch(() => props.skinUrl, loadSkin)
onMounted(loadSkin)
</script>

<style scoped>
.skin-preview-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-card-hover);
  border-radius: 12px;
  overflow: hidden;
  min-height: 120px;
}
.skin-preview-wrap.loaded {
  background: none;
}
.skin-canvas {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
.skin-placeholder {
  position: absolute;
  font-size: 11px;
  color: var(--text-muted);
  text-align: center;
  pointer-events: none;
}
</style>