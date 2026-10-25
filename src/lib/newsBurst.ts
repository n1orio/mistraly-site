/**
 * Газетный стоп-моушен за кнопками: на ховере за кнопкой появляется
 * газетная вырезка почти той же формы, что и кнопка, только чуть больше и
 * с рваным краем. Каждые FRAME_MS кадр меняется рывком — сдвиг, наклон и
 * «дрожащий» край, как в покадровой анимации. Появляется и исчезает
 * вырезка тоже рывками (np-in / np-out в main.css).
 *
 * Один делегированный обработчик на документ, а не директива на каждой
 * кнопке: обёртки кнопок разбросаны по десятку компонентов.
 */

const WRAPS = '.comic-btn-wrap, .skew-wrap, .dl-btn-wrap, .comic-burst, .nav-tab'
// ~8 кадров в секунду — «съёмка на двойках», рывок заметен, но не мельтешит.
const FRAME_MS = 120

// Насколько вырезка выступает за кнопку (px). Обёртка может задать свои
// --np-pad-x / --np-pad-y: мелким вкладкам навигации нужна вырезка меньше.
const PAD = { x: 11, y: 8 }

type Pad = { x: number; y: number; flip: boolean }

function padOf(wrap: HTMLElement): Pad {
  const cs = getComputedStyle(wrap)
  const x = parseFloat(cs.getPropertyValue('--np-pad-x'))
  const y = parseFloat(cs.getPropertyValue('--np-pad-y'))
  return {
    x: Number.isNaN(x) ? PAD.x : x,
    y: Number.isNaN(y) ? PAD.y : y,
    flip: cs.getPropertyValue('--np-flip').trim() === '1'
  }
}

const rand = (min: number, max: number) => min + Math.random() * (max - min)

/** Край вырезки: четырёхугольник кнопки (скос как у clip-path кнопок),
 *  по длинным сторонам — мелкие зубцы рваной бумаги. Каждый кадр новый. */
function tornEdge(flip: boolean): string {
  const top: string[] = []
  const bottom: string[] = []
  const steps = 12
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * 100
    const jx = i % steps ? rand(-2, 2) : 0
    // Верх идёт от 9% слева к 0% справа, низ — от 91% к 100%: тот же скос.
    top.push(`${x + jx}% ${9 - (x / 100) * 9 + rand(-2.5, 2.5)}%`)
    bottom.unshift(`${x + jx}% ${91 + (x / 100) * 9 + rand(-2.5, 2.5)}%`)
  }
  const pts = [...top, ...bottom]
  // Зеркальная кнопка (--np-flip: 1) — скос в другую сторону: отражаем x.
  if (flip) return `polygon(${pts.map((p) => p.replace(/^([\d.-]+)%/, (_, x) => `${100 - parseFloat(x)}%`)).join(',')})`
  return `polygon(${pts.join(',')})`
}

/** Один кадр: рывок в пару пикселей, новый рваный край и сдвиг растра. */
function frame(layer: HTMLElement, w: number, h: number, pad: Pad) {
  const holder = layer.firstElementChild as HTMLElement
  holder.style.left = `${-pad.x + rand(-2, 2)}px`
  holder.style.top = `${-pad.y + rand(-2, 2)}px`
  holder.style.width = `${w + pad.x * 2 + rand(-3, 3)}px`
  holder.style.height = `${h + pad.y * 2 + rand(-2, 2)}px`
  holder.style.transform = `rotate(${rand(-2, 1.5)}deg)`
  const sheet = holder.firstElementChild as HTMLElement
  sheet.style.clipPath = tornEdge(pad.flip)
  sheet.style.setProperty('--np-dots', `${rand(0, 5)}px ${rand(0, 5)}px`)
}

let active: { wrap: HTMLElement; layer: HTMLElement; timer: number } | null = null

function start(wrap: HTMLElement) {
  if (active?.wrap === wrap) return
  stop()
  if (wrap.querySelector(':disabled')) return

  // offsetWidth, а не getBoundingClientRect: размеры нужны без поворота
  // и масштаба кнопки, вырезки сами лежат в её системе координат.
  const w = wrap.offsetWidth
  const h = wrap.offsetHeight
  const pad = padOf(wrap)
  const layer = document.createElement('div')
  layer.className = 'np-layer'
  layer.setAttribute('aria-hidden', 'true')
  const holder = document.createElement('div')
  holder.className = 'np-holder'
  const sheet = document.createElement('div')
  sheet.className = 'np'
  holder.appendChild(sheet)
  layer.appendChild(holder)
  wrap.prepend(layer)
  frame(layer, w, h, pad)

  const still = matchMedia('(prefers-reduced-motion: reduce)').matches
  const timer = still ? 0 : window.setInterval(() => frame(layer, w, h, pad), FRAME_MS)
  active = { wrap, layer, timer }
}

function stop() {
  if (!active) return
  clearInterval(active.timer)
  // Даём доиграть np-out (0.2 с) и только потом убираем слой.
  const layer = active.layer
  layer.classList.add('np-layer--out')
  setTimeout(() => layer.remove(), 220)
  active = null
}

export function installNewsBurst() {
  document.addEventListener('pointerover', (e) => {
    // На тач-экранах «ховер» залипает после тапа — там эффект не нужен.
    if (e.pointerType === 'touch') return
    const wrap = (e.target as Element).closest?.<HTMLElement>(WRAPS)
    if (wrap) start(wrap)
    else stop()
  })
  document.addEventListener('pointerout', (e) => {
    if (!active) return
    const to = e.relatedTarget as Node | null
    if (!to || !active.wrap.contains(to)) stop()
  })
  // Клавиатура: Tab до кнопки показывает то же самое.
  document.addEventListener('focusin', (e) => {
    const t = e.target as Element
    const wrap = t.closest?.<HTMLElement>(WRAPS)
    if (wrap && t.matches(':focus-visible')) start(wrap)
  })
  document.addEventListener('focusout', (e) => {
    if (active && !active.wrap.contains(e.relatedTarget as Node | null)) stop()
  })
}
