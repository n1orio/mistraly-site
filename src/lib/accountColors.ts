/**
 * Цвета счетов как в AccountColors из мода: 0–15 это красители, 22 золото,
 * 24 глитч. Сервер присылает номер цвета, а не сам цвет.
 */
const DYES = [
  0xf9fffe, 0xf9801d, 0xc74ebd, 0x3ab3da, 0xfed83d, 0x80c71f, 0xf38baa, 0x474f52,
  0x9d9d97, 0x169c9c, 0x8932b8, 0x3c44aa, 0x835432, 0x5e7c16, 0xb02e26, 0x1d1d21,
]
const GOLD = 22
const GLITCH = 24

const hex = (rgb: number) => `#${rgb.toString(16).padStart(6, '0')}`

/** Как AccountColors.light: тёмные красители читаются на тёмной панели. */
function light(rgb: number) {
  const mix = (c: number) => c + Math.floor(((255 - c) * 35) / 100)
  return (mix((rgb >> 16) & 255) << 16) | (mix((rgb >> 8) & 255) << 8) | mix(rgb & 255)
}

export type AccountLook = { bar: string; text: string; cls: string }

export function accountLook(id: number): AccountLook {
  if (id === GOLD) return { bar: '#ffd84a', text: '#ffd84a', cls: 'acc-gold' }
  if (id === GLITCH) return { bar: '#ff2a3c', text: '#ff2a3c', cls: 'acc-glitch' }
  const rgb = DYES[id] ?? DYES[0]
  return { bar: hex(rgb), text: hex(light(rgb)), cls: '' }
}
