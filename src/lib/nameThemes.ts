import { onUnmounted, ref, watch, type Ref } from 'vue'
import { api, unwrap } from '../api/client'

/** Темы ника из NameTheme в моде: те же цвета и иконки, что в игре. */
export type NameTheme = {
  id: string
  label: string
  lock: string
  icon: string
  name: string
  shadow?: string
  bg: string
  top: string
  bottom: string
  accent: string
  border: string
  card: string
  line: string
  heading: string
}

export const THEMES: NameTheme[] = [
  { id: 'DEFAULT', label: 'Обычная', lock: '', icon: 'def', name: '#ffffff', bg: '#181a20', top: '#2a3140', bottom: '#1e222c', accent: '#3fb8b0', border: '#4a5060', card: '#20242e', line: '#3a4050', heading: '#7fe7e0' },
  { id: 'PLUS', label: 'Plus', lock: 'нужна подписка Plus', icon: 'plus', name: '#f8a200', bg: '#1c1006', top: '#5a2200', bottom: '#2e1204', accent: '#f8a200', border: '#b63600', card: '#2a1608', line: '#7a3000', heading: '#ffd27a' },
  { id: 'ADMIN', label: 'Админ', lock: 'только админам', icon: 'admin', name: '#ff5a5a', bg: '#1c0c0c', top: '#4a1414', bottom: '#2a0a0a', accent: '#e64c4c', border: '#8f1818', card: '#2a1212', line: '#602020', heading: '#ff8a8a' },
  { id: 'GLITCH', label: 'Glitch', lock: 'доступна в магазине', icon: 'glitch', name: '#ff2a3c', shadow: '#00a0ff', bg: '#0e0f18', top: '#2a1830', bottom: '#12182e', accent: '#ff2a3c', border: '#0078c0', card: '#181a28', line: '#7a2038', heading: '#66c4ff' },
  { id: 'HELPER', label: 'Хелпер', lock: 'только хелперам', icon: 'helper', name: '#7fd65a', bg: '#0c1a0e', top: '#1e4a1a', bottom: '#10280e', accent: '#6cc04a', border: '#2f6a28', card: '#14240f', line: '#2e5226', heading: '#a8ee88' },
  { id: 'BOOSTER', label: 'Бустер', lock: 'за буст Discord', icon: 'booster', name: '#f47fff', bg: '#1a0c1c', top: '#4a1650', bottom: '#2a0c30', accent: '#f47fff', border: '#8a3a96', card: '#24122a', line: '#5a2a66', heading: '#f9b8ff' },
  { id: 'BETATESTER', label: 'Бетатестер', lock: 'для участников бета-теста', icon: 'bugtester', name: '#0ad384', bg: '#081a20', top: '#026b63', bottom: '#042834', accent: '#0ad384', border: '#007e5a', card: '#10252d', line: '#02404b', heading: '#34fc97' },
  { id: 'IVA_ZOMBIE', label: 'Ива это зомби', lock: 'за покупку проходки с промокодом ETOZOMBI', icon: 'eto_zomni', name: '#83dccb', bg: '#0d1215', top: '#00414d', bottom: '#00141b', accent: '#00b68f', border: '#267266', card: '#172426', line: '#305653', heading: '#d6ece8' },
]

export const themeOf = (id?: string | null) => THEMES.find((t) => t.id === id) ?? THEMES[0]

/** Темы всех игроков: ключ в нижнем регистре, ники на сайте бывают в другом написании. */
export const playerThemes = ref<Record<string, string>>({})
let loaded = false

export function loadPlayerThemes() {
  if (loaded) return
  loaded = true
  unwrap<Record<string, string>>(api.get('/players'))
    .then((rows) => {
      playerThemes.value = Object.fromEntries(Object.entries(rows).map(([k, v]) => [k.toLowerCase(), v]))
    })
    .catch(() => {
      /* без списка ники просто обычные */
    })
}

export function setPlayerTheme(nick: string, theme: string) {
  playerThemes.value = { ...playerThemes.value, [nick.toLowerCase()]: theme }
}

export const themeOfPlayer = (nick: string) => themeOf(playerThemes.value[nick.toLowerCase()])
export const iconUrl = (t: NameTheme) => `/images/wiki/chat/${t.icon}.png`

const PAGE_VARS = (t: NameTheme): Record<string, string> => ({
  '--bg-page': t.bg,
  '--bg-void': t.bottom,
  '--panel': t.card,
  '--panel-hi': t.line,
  '--well': t.bottom,
  '--line': t.line,
  '--edge-c': t.line,
  '--head-c': t.top,
  '--head-lo': t.bottom,
  '--sky': t.heading,
  '--blue': t.border,
  '--blue-hi': t.accent,
  '--blue-lo': t.line,
  '--blue-lip': t.top,
})

/** Вся страница в цветах темы игрока: переменные палитры на html, при уходе снимаются. */
export function usePageTheme(theme: Ref<string | null | undefined>) {
  const root = document.documentElement
  const clear = () => {
    Object.keys(PAGE_VARS(THEMES[0])).forEach((k) => root.style.removeProperty(k))
    root.classList.remove('themed')
  }
  watch(
    theme,
    (id) => {
      clear()
      if (!id) return
      Object.entries(PAGE_VARS(themeOf(id))).forEach(([k, v]) => root.style.setProperty(k, v))
      root.classList.add('themed')
    },
    { immediate: true }
  )
  onUnmounted(clear)
}
