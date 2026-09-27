import { nextTick, ref } from 'vue'

const isDark = ref(true)

const THEME_BG = { light: '#F1F4F9', dark: '#0A0B0E' }

export function useTheme() {
  function applyTheme(dark: boolean) {
    isDark.value = dark
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('breeze_theme', dark ? 'dark' : 'light')
  }

  function getCenter(event?: MouseEvent) {
    let x = innerWidth / 2
    let y = innerHeight / 2
    if (event?.currentTarget) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
      x = rect.left + rect.width / 2
      y = rect.top + rect.height / 2
    } else if (event?.clientX !== undefined) {
      x = event.clientX
      y = event.clientY
    }
    const endRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
    return { x, y, endRadius }
  }

  function toggleTheme(event?: MouseEvent) {
    const nextDark = !isDark.value
    const { x, y, endRadius } = getCenter(event)

    // Основной путь: View Transitions API (Chrome/Edge/Safari)
    const svt = (document as any).startViewTransition
    if (typeof svt === 'function') {
      const transition = svt.call(document, async () => {
        applyTheme(nextDark)
        await nextTick()
      })
      // Старый снимок схлопывается в точку у кнопки, открывая новую тему
      transition.ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(${endRadius}px at ${x}px ${y}px)`,
              `circle(0px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 400,
            easing: 'ease-in-out',
            fill: 'forwards',
            pseudoElement: '::view-transition-old(root)',
          }
        )
      })
      return
    }

    // Запасной путь для браузеров без View Transitions API:
    // однотонный круг старого фона схлопывается в кнопку, открывая новую тему
    const fromBg = getComputedStyle(document.body).backgroundColor || (nextDark ? THEME_BG.light : THEME_BG.dark)
    const overlay = document.createElement('div')
    overlay.style.cssText = `position:fixed;inset:0;z-index:2147483647;pointer-events:none;background:${fromBg};clip-path:circle(${endRadius}px at ${x}px ${y}px);`
    document.body.appendChild(overlay)
    applyTheme(nextDark)
    requestAnimationFrame(() => {
      const anim = overlay.animate(
        {
          clipPath: [
            `circle(${endRadius}px at ${x}px ${y}px)`,
            `circle(0px at ${x}px ${y}px)`,
          ],
        },
        { duration: 350, easing: 'ease-in-out', fill: 'forwards' }
      )
      anim.onfinish = () => overlay.remove()
    })
  }

  function initTheme() {
    const saved = localStorage.getItem('breeze_theme')
    applyTheme(saved ? saved === 'dark' : true)
  }

  return { isDark, toggleTheme, initTheme }
}