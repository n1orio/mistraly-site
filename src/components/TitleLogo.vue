<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import layout from '../data/title-layout.json'
const canvas = ref<HTMLCanvasElement | null>(null)
const ready = ref(false)
const letters = layout.parts.filter(part => part.name.length === 1)
const height = layout.height + 32
let scene: Awaited<ReturnType<typeof import('../lib/titleScene')['createTitleScene']>> | undefined
let disposed = false
onMounted(async () => {
  try {
    const { createTitleScene } = await import('../lib/titleScene')
    if (disposed || !canvas.value) return
    const next = await createTitleScene(canvas.value)
    if (disposed) { next.destroy(); return }
    scene = next; ready.value = true
  } catch { /* The complete, original title remains visible if WebGL is unavailable. */ }
})
onBeforeUnmount(() => { disposed = true; scene?.destroy() })
function pointer(event: PointerEvent) { if (event.pointerType !== 'touch') scene?.pointer(event.clientX, event.clientY) }
</script>

<template>
  <h1 class="title-logo" aria-label="Mistraly" :style="{ aspectRatio: `${layout.width} / ${height}` }" @pointermove="pointer" @pointerleave="scene?.focus('')">
    <img v-if="!ready" class="title-fallback" src="/images/title/preview.png" alt="" :style="{ top: `${32 / height * 100}%`, height: `${layout.height / height * 100}%` }" />
    <canvas ref="canvas" class="title-canvas" :class="{ 'is-ready': ready }" aria-hidden="true" />
    <span v-for="part in letters" :key="part.name" class="title-focus" tabindex="0" role="img" :aria-label="`Буква ${part.name.toUpperCase()}`"
      :style="{ left: `${part.x / layout.width * 100}%`, width: `${part.width / layout.width * 100}%`, top: `${32 / height * 100}%`, height: `${layout.height / height * 100}%` }"
      @focus="scene?.focus(part.name)" @blur="scene?.focus('')" />
  </h1>
</template>

<style scoped>
.title-logo { position: relative; width: min(960px, 100%); flex: none; margin: 0 0 32px; }
.title-canvas, .title-fallback { position: absolute; left: 0; width: 100%; display: block; }
.title-canvas { inset: 0; height: 100%; opacity: 0; }
.title-canvas.is-ready { opacity: 1; }
.title-focus { position: absolute; }
.title-focus:focus-visible { outline: 2px solid #a3eaff; outline-offset: 3px; }
</style>
