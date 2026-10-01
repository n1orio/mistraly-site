<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
let animId = 0

const VERTEX_SHADER = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`

// Настоящий процедурный шейдер пламени (Simplex Noise + Турбулентность)
const FRAGMENT_SHADER = `
  precision highp float;
  varying vec2 v_uv;
  uniform float u_time;
  uniform vec2 u_resolution;

  // 2D Simplex Noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // Фрактальный шум для завихрений языков пламени
  float fbm(vec2 p) {
    float f = 0.0;
    float w = 0.5;
    for (int i = 0; i < 4; i++) {
      f += w * snoise(p);
      p *= 2.05;
      w *= 0.5;
    }
    return f;
  }

  void main() {
    // Масштабируем координаты по пропорциям экрана, чтобы языки огня не растягивались
    float aspect = u_resolution.x / u_resolution.y;
    vec2 uv = v_uv;
    vec2 p = vec2(uv.x * aspect * 1.4, uv.y * 1.8);

    float t = u_time * 1.35;

    // 1. Боковое изгибание языков пламени при подъеме вверх (Domain Warping)
    float curl = fbm(vec2(p.x * 1.2, p.y * 1.1 - t * 1.4));
    vec2 warpedP = p;
    // Чем выше язык пламени (uv.y), тем сильнее он извивается в стороны
    warpedP.x += curl * 0.38 * pow(uv.y, 0.7);

    // 2. Основной поток огня, летящий снизу вверх
    float n1 = fbm(vec2(warpedP.x * 1.6, warpedP.y * 1.2 - t * 2.1));
    float n2 = snoise(vec2(warpedP.x * 3.5 - t * 0.4, warpedP.y * 2.8 - t * 3.4)) * 0.35;
    float noise = (n1 + n2) * 0.5 + 0.5;

    // 3. Профиль высоты: в самом низу (uv.y = 0) всегда сплошная заливка, к верху (uv.y = 1) сходит на нет
    float verticalMask = 1.0 - pow(uv.y, 0.85);

    // Формируем итоговую форму пламени
    float fireShape = verticalMask * 1.35 + (noise - 0.52) * (0.95 + uv.y * 0.5);

    // Гарантируем 100% монолитный стык в самом низу и отсутствие обрезания в самом верху
    fireShape = mix(1.0, fireShape, smoothstep(0.0, 0.12, uv.y));
    fireShape *= 1.0 - smoothstep(0.88, 0.99, uv.y);

    // Четкий векторный срез (антиалиасинг в 1 пиксель, без размытия!)
    float alpha = smoothstep(0.49, 0.51, fireShape);

    // Строго один цвет #FF5500 (R: 1.0, G: 0.3333, B: 0.0)
    vec3 flameColor = vec3(1.0, 0.333333, 0.0);
    gl_FragColor = vec4(flameColor * alpha, alpha);
  }
`

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: true })
  if (!gl) return

  const compileShader = (type: number, source: string) => {
    const shader = gl.createShader(type)!
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    return shader
  }

  const vs = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER)
  const fs = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER)

  const program = gl.createProgram()!
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  gl.useProgram(program)

  // Квадрат на весь канвас
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW
  )

  const posLoc = gl.getAttribLocation(program, 'a_position')
  gl.enableVertexAttribArray(posLoc)
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

  const timeLoc = gl.getUniformLocation(program, 'u_time')
  const resLoc = gl.getUniformLocation(program, 'u_resolution')

  const resize = () => {
    if (!canvas) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = canvas.parentElement?.clientWidth || window.innerWidth
    const h = 180
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.uniform2f(resLoc, canvas.width, canvas.height)
  }

  resize()
  window.addEventListener('resize', resize)

  const start = performance.now()
  const render = (now: number) => {
    const elapsed = (now - start) * 0.001
    gl.uniform1f(timeLoc, elapsed)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
    animId = requestAnimationFrame(render)
  }

  animId = requestAnimationFrame(render)

  onUnmounted(() => {
    cancelAnimationFrame(animId)
    window.removeEventListener('resize', resize)
  })
})
</script>

<template>
  <div class="w-full relative z-[2] mt-auto flex flex-col pointer-events-none select-none">
    <!-- WebGL-холст с настоящим физическим потоком пламени -->
    <div class="relative w-full h-[180px] overflow-hidden -mb-[2px]">
      <canvas ref="canvasRef" class="absolute bottom-0 left-0 w-full h-full block" />
    </div>

    <!-- Монолитная сплошная оранжевая основа #FF5500 -->
    <div class="w-full bg-[#FF5500] pointer-events-auto flex flex-col items-center">
      <!-- Черная массивная надпись -->
      <div class="pt-2 pb-12 sm:pt-4 sm:pb-16 text-center">
        <h2 class="fire-title font-heading font-black text-[#0d0e10] uppercase tracking-tight">
          Дальше — больше
        </h2>
      </div>

      <!-- Футер с ссылками внутри оранжевой зоны -->
      <footer class="w-full max-w-6xl px-4 py-6 border-t border-black/20 flex flex-col sm:flex-row items-center justify-between text-xs text-black/85 font-bold gap-4">
        <div>© Breeze • Minecraft 1.21.1</div>
        <div class="flex items-center gap-6">
          <router-link to="/offer" class="hover:text-black transition underline underline-offset-2">Оферта</router-link>
          <router-link to="/shop" class="hover:text-black transition">Магазин</router-link>
          <router-link to="/profile" class="hover:text-black transition">Профиль</router-link>
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.fire-title {
  font-size: clamp(2.4rem, 6vw, 4.8rem);
  line-height: 1;
  transform: rotate(-1.5deg);
  letter-spacing: -0.03em;
  text-shadow: 4px 4px 0px rgba(255, 120, 40, 0.4);
}
</style>
