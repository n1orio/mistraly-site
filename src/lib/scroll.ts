/**
 * Прокрутка к секции главной (#launcher, #stages).
 *
 * Раньше здесь был scrollIntoView({ behavior: 'smooth' }), и в части
 * браузеров и встроенных webview кнопка «Скачать лаунчер» ничего не
 * делала: нативная плавная прокрутка там не стартует или замирает на
 * полпути. Поэтому анимируем сами и по времени, а не по кадрам: каждый
 * шаг ставит точную позицию, а в конце страница гарантированно стоит
 * на секции, даже если кадры не приходили. Отступ сверху — scroll-mt-*
 * у самой секции.
 */
export function scrollToSection(selector: string, duration = 550): boolean {
  const el = document.querySelector(selector)
  if (!el) return false

  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0
  const maxY = document.documentElement.scrollHeight - window.innerHeight
  const target = Math.max(0, Math.min(maxY, el.getBoundingClientRect().top + window.scrollY - margin))
  const from = window.scrollY
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced || Math.abs(target - from) < 2) {
    window.scrollTo(0, target)
    return true
  }

  const started = performance.now()
  let done = false
  // Колесо или касание — пользователь сам взялся прокручивать, не мешаем.
  const cancel = () => (done = true)
  window.addEventListener('wheel', cancel, { once: true, passive: true })
  window.addEventListener('touchstart', cancel, { once: true, passive: true })

  const finish = () => {
    if (!done) window.scrollTo(0, target)
    done = true
    window.removeEventListener('wheel', cancel)
    window.removeEventListener('touchstart', cancel)
  }
  const step = (now: number) => {
    if (done) return
    const t = Math.min(1, (now - started) / duration)
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    window.scrollTo(0, from + (target - from) * eased)
    if (t < 1) requestAnimationFrame(step)
    else finish()
  }
  requestAnimationFrame(step)
  // Кадры могут не прийти вовсе (вкладка в фоне, webview) — довозим таймером.
  window.setTimeout(finish, duration + 150)
  return true
}

/**
 * Ждёт появления элемента: при заходе по ссылке /#launcher главная ещё
 * не отрисована, когда роутер решает, куда прокрутить.
 */
export function waitForElement(selector: string, timeoutMs = 3000): Promise<Element | null> {
  return new Promise((resolve) => {
    const found = document.querySelector(selector)
    if (found) return resolve(found)
    const started = performance.now()
    const tick = () => {
      const el = document.querySelector(selector)
      if (el || performance.now() - started > timeoutMs) return resolve(el)
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
}
