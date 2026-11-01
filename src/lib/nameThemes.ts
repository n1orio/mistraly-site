import { ref } from 'vue'
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
  { id: 'PLUS', label: 'Plus', lock: 'нужна подписка Plus', icon: 'plus', name: '#ffd84a', bg: '#1c170c', top: '#4a3812', bottom: '#2a1f0a', accent: '#ffd84a', border: '#8a6e2a', card: '#2a2312', line: '#6a5420', heading: '#ffe27a' },
  { id: 'ADMIN', label: 'Админ', lock: 'только админам', icon: 'admin', name: '#ff5a5a', bg: '#1c0c0c', top: '#4a1414', bottom: '#2a0a0a', accent: '#e64c4c', border: '#8f1818', card: '#2a1212', line: '#602020', heading: '#ff8a8a' },
  { id: 'GLITCH', label: 'Глитч', lock: 'недоступна', icon: 'glitch', name: '#ff2a3c', shadow: '#00a0ff', bg: '#0e0f18', top: '#2a1830', bottom: '#12182e', accent: '#ff2a3c', border: '#0078c0', card: '#181a28', line: '#7a2038', heading: '#66c4ff' },
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

export const themeOfPlayer = (nick: string) => themeOf(playerThemes.value[nick.toLowerCase()])
export const iconUrl = (t: NameTheme) => `/images/wiki/chat/${t.icon}.png`
