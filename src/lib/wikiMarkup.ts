/**
 * Разметка вики: текст игрока → блоки и HTML для отображения.
 *
 * Текст пишут игроки, поэтому разбор строится от запрета: всё экранируется, и
 * HTML появляется только из конструкций ниже. Адреса ссылок и картинок проверяются
 * отдельно, ники и идентификаторы предметов подставляются только после проверки.
 * Справка для авторов — статья «Форматирование» (scripts/wiki-formatting.md).
 */
import { API_URL } from '../api/client'

export type WikiItem = { id: string; name: string; icon: string | null; page: string | null; count?: number }
export type RecipeData = { kind: string; slots: (string | null)[]; result: { id: string; count: number } }
export type Recipe = { kind: string; slots: (WikiItem | null)[]; result: WikiItem }
export type PageCard = { slug: string; title: string; text: string }

export type Block =
  | { t: 'h'; level: 2 | 3 | 4; html: string; text: string; id: string }
  | { t: 'p'; html: string }
  | { t: 'ul' | 'ol'; items: string[] }
  | { t: 'code'; text: string }
  | { t: 'hr' }
  | { t: 'cards'; cards: { blocks: Block[]; hints: string[] }[] }
  | { t: 'table'; head: string[]; rows: string[][] }
  | { t: 'flow'; stages: WikiItem[][] }
  | { t: 'items'; items: WikiItem[] }
  | { t: 'recipes'; recipes: Recipe[] }
  | { t: 'pages'; pages: PageCard[] }
  | { t: 'image'; src: string; caption: string }
  | { t: 'demo'; code: string; blocks: Block[] }

export type Parsed = {
  blocks: Block[]
  icon: string | null
  info: { key: string; html: string }[]
  see: string[]
  lead: string
}

export type Ctx = {
  slug: string
  items: Record<string, Omit<WikiItem, 'id'>>
  recipes: Record<string, RecipeData[]>
  /** Страницы вики: нужны для карточек и автоссылок. */
  pages: { slug: string; title: string; lead?: string }[]
}

const NICK = '[A-Za-z0-9_\\u0400-\\u04FF]{2,32}'

/** Падежи основных терминов: название страницы одно, а в тексте слово склоняется. */
const AUTOLINKS: [RegExp, string][] = [
  [/^[Бб]анкомат[а-я]*/, 'atm'],
  [/^[Сс]овладельц[а-я]*/, 'co-owners'],
  [/^[Шш]траф[а-я]*/, 'fines'],
  [/^[Мм]агазин[а-я]*/, 'shops'],
  [/^[Рр]ын(?:ок|к[а-я]*)/, 'shops'],
  [/^[Мм]огил[а-я]*/, 'death'],
  [/^[Тт]очил[а-я]*/, 'ores'],
  [/^[Лл]ичн[а-я]+ кабинет[а-я]*/, 'cabinet'],
  [/^[Нн]астройк[а-я]*/, 'settings'],
  [/^[Пп]еревод[а-я]*/, 'transfers'],
  [/^Plus\b/, 'plus'],
  [/^[Мм]ист(?:а|у|ом|е|ы|ов|ам|ами|ах|овая|овой|овую)?(?![а-я])/, 'mist'],
  [/^[Пп]рофил[а-я]*/, 'profile'],
  [/^[Дд]остижени[а-я]*/, 'achievements'],
]

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
}

export function skinUrl(nick: string): string {
  return `${API_URL}/user/skin/png/${encodeURIComponent(nick)}`
}

/** Голова из скина: CSS вырезает её прямо из развёртки, так не нужен отдельный запрос. */
export function headHtml(nick: string, size: number): string {
  const px = Math.min(128, Math.max(12, size))
  return `<span class="mc-head" style="--skin:url('${escapeHtml(skinUrl(nick))}');--u:${px / 8}px" aria-hidden="true"></span>`
}

/** Разрешены только свои пути и http(s): иначе в ссылку можно спрятать javascript:. */
function safeUrl(url: string): { href: string; internal: boolean } | null {
  const u = url.trim()
  if (/^\/(?!\/)[\w\-./?=&#%а-яёА-ЯЁ]*$/.test(u)) return { href: u, internal: true }
  if (/^https?:\/\/[^\s"'<>]+$/i.test(u)) return { href: u, internal: false }
  return null
}

type Inline = { ctx: Ctx; linked: Set<string>; auto: boolean }

function item(ctx: Ctx, id: string, count?: number): WikiItem | null {
  const known = ctx.items[id]
  return known ? { id, ...known, ...(count ? { count } : {}) } : null
}

function itemChip(it: WikiItem): string {
  const img = it.icon ? `<img src="${escapeHtml(it.icon)}" alt="" class="w-item-img">` : ''
  const label = `${img}${escapeHtml(it.name)}`
  return it.page
    ? `<a href="/wiki/${escapeHtml(it.page)}" data-wiki class="w-item">${label}</a>`
    : `<span class="w-item">${label}</span>`
}

/** Автоссылка на первое упоминание термина, на своей странице её нет. */
function autolink(text: string, st: Inline): string {
  if (!st.auto) return escapeHtml(text)
  const titles = st.ctx.pages
  let out = ''
  let i = 0
  while (i < text.length) {
    const boundary = i === 0 || !/[\wа-яёА-ЯЁ]/.test(text[i - 1])
    let hit: { slug: string; word: string } | null = null
    if (boundary) {
      const rest = text.slice(i)
      for (const [re, slug] of AUTOLINKS) {
        const m = re.exec(rest)
        if (m) {
          hit = { slug, word: m[0] }
          break
        }
      }
      if (!hit) {
        const p = titles.find((x) => rest.startsWith(x.title) && x.title.length > 2)
        if (p) hit = { slug: p.slug, word: p.title }
      }
    }
    if (hit && hit.slug !== st.ctx.slug && !st.linked.has(hit.slug)) {
      st.linked.add(hit.slug)
      out += `<a href="/wiki/${escapeHtml(hit.slug)}" data-wiki>${escapeHtml(hit.word)}</a>`
      i += hit.word.length
    } else if (hit) {
      out += escapeHtml(hit.word)
      i += hit.word.length
    } else {
      out += escapeHtml(text[i])
      i += 1
    }
  }
  return out
}

const TOKENS = new RegExp(
  [
    '\\\\([\\\\`*=!@<>\\[\\]()|#-])', // 1 экранирование
    '`([^`\\n]+)`', // 2 код
    '\\*\\*(.+?)\\*\\*', // 3 жирный
    '\\*(?!\\s)(.+?)\\*', // 4 курсив
    '==(.+?)==', // 5 акцент
    '\\[([^\\]\\n]*)\\]\\(([^)\\s]+)\\)', // 6, 7 ссылка
    `(?<![\\w@/])@(${NICK})`, // 8 игрок
    '<item/([a-z0-9_:]+)>', // 9 предмет
    `<avatar/(${NICK})(?:/(\\d{1,3}))?>`, // 10, 11 голова
    '(?<![\\wа-яёА-ЯЁ])!(?=[\\wа-яёА-ЯЁ])([\\wа-яёА-ЯЁ]+)', // 12 слово без автоссылки
  ].join('|'),
  'g'
)

export function inline(text: string, st: Inline): string {
  let out = ''
  let last = 0
  TOKENS.lastIndex = 0
  const re = new RegExp(TOKENS.source, 'g')
  for (let m = re.exec(text); m; m = re.exec(text)) {
    out += autolink(text.slice(last, m.index), st)
    last = m.index + m[0].length
    const plain = { ...st, auto: false }
    if (m[1] !== undefined) out += escapeHtml(m[1])
    else if (m[2] !== undefined) out += `<code>${escapeHtml(m[2])}</code>`
    else if (m[3] !== undefined) out += `<strong>${inline(m[3], plain)}</strong>`
    else if (m[4] !== undefined) out += `<em>${inline(m[4], st)}</em>`
    else if (m[5] !== undefined) out += `<mark>${inline(m[5], plain)}</mark>`
    else if (m[7] !== undefined) {
      const url = safeUrl(m[7])
      const label = inline(m[6] || m[7], plain)
      if (!url) out += escapeHtml(m[0])
      else if (url.internal) out += `<a href="${escapeHtml(url.href)}" data-wiki>${label}</a>`
      else out += `<a href="${escapeHtml(url.href)}" target="_blank" rel="noopener noreferrer nofollow ugc">${label}</a>`
    } else if (m[8] !== undefined) {
      out += `<a href="/wiki/user/${encodeURIComponent(m[8])}" data-wiki class="w-mention">${headHtml(m[8], 16)}${escapeHtml(m[8])}</a>`
    } else if (m[9] !== undefined) {
      const it = item(st.ctx, m[9])
      out += it ? itemChip(it) : escapeHtml(m[0])
    } else if (m[10] !== undefined) {
      out += headHtml(m[10], Number(m[11] || 24))
    } else if (m[12] !== undefined) out += escapeHtml(m[12])
  }
  return out + autolink(text.slice(last), st)
}

function flowStages(ctx: Ctx, spec: string): WikiItem[][] {
  return spec
    .split('>')
    .map((stage) =>
      stage
        .split('+')
        .map((s) => {
          const [id, n] = s.trim().split('*')
          return item(ctx, id, n ? Math.min(999, Number(n)) || undefined : undefined)
        })
        .filter((x): x is WikiItem => !!x)
    )
    .filter((s) => s.length)
}

function recipesOf(ctx: Ctx, id: string): Recipe[] {
  return (ctx.recipes[id] ?? []).flatMap((r) => {
    const result = item(ctx, r.result.id, r.result.count)
    return result ? [{ kind: r.kind, slots: r.slots.map((s) => (s ? item(ctx, s) : null)), result }] : []
  })
}

const stripInline = (s: string) => s.replace(/[*=`\\]/g, '').trim()

function parseBlocks(lines: string[], st: Inline, toc: { n: number }): Block[] {
  const out: Block[] = []
  let para: string[] = []
  const flush = () => {
    if (para.length) out.push({ t: 'p', html: inline(para.join(' '), st) })
    para = []
  }
  let i = 0
  while (i < lines.length) {
    const line = lines[i].trim()
    i += 1
    if (line.startsWith('```')) {
      flush()
      const code: string[] = []
      while (i < lines.length && !lines[i].trim().startsWith('```')) code.push(lines[i++])
      i += 1
      out.push({ t: 'code', text: code.join('\n') })
      continue
    }
    if (!line) {
      flush()
      continue
    }
    let m: RegExpExecArray | null
    if ((m = /^(#{1,3})\s+(.+)$/.exec(line))) {
      flush()
      toc.n += 1
      out.push({
        t: 'h',
        level: (m[1].length + 1) as 2 | 3 | 4,
        html: inline(m[2], { ...st, auto: false }),
        text: stripInline(m[2]),
        id: `s${toc.n}`,
      })
    } else if (line === '---') {
      flush()
      out.push({ t: 'hr' })
    } else if (line.startsWith(':: ')) {
      flush()
      const code = line.slice(3)
      // Пример не должен влиять на автоссылки и содержание самой статьи.
      const demo: Inline = { ...st, linked: new Set() }
      out.push({ t: 'demo', code, blocks: parseBlocks(expand(code), demo, { n: 1000 + toc.n * 10 }) })
    } else if (/^>(\s|$)/.test(line)) {
      flush()
      const cards = line
        .split(/(?:^|\s)>(?=\s)(?!>)/)
        .map((c) => c.trim())
        .filter(Boolean)
        .slice(0, 5)
        .map((c) => {
          const parts = c.split(/\\n/).map((x) => x.trim())
          const hints = parts.filter((x) => x.startsWith('>>')).map((x) => inline(x.slice(2).trim(), st))
          return { blocks: parseBlocks(parts.filter((x) => !x.startsWith('>>')), st, toc), hints }
        })
      out.push({ t: 'cards', cards })
    } else if (line.startsWith('|')) {
      flush()
      const rows = [line]
      while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(lines[i++].trim())
      const cells = rows.map((r) =>
        r
          .replace(/^\||\|$/g, '')
          .split('|')
          .map((c) => inline(c.trim(), { ...st, auto: false }))
      )
      out.push({ t: 'table', head: cells[0], rows: cells.slice(1) })
    } else if (/^[-•]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      flush()
      const ordered = /^\d/.test(line)
      const re = ordered ? /^\d+\.\s+/ : /^[-•]\s+/
      const items = [inline(line.replace(re, ''), st)]
      while (i < lines.length && re.test(lines[i].trim())) items.push(inline(lines[i++].trim().replace(re, ''), st))
      out.push({ t: ordered ? 'ol' : 'ul', items })
    } else if ((m = /^<flow\/(.+)>$/.exec(line))) {
      flush()
      out.push({ t: 'flow', stages: flowStages(st.ctx, m[1]) })
    } else if ((m = /^<items\/(.+)>$/.exec(line))) {
      flush()
      out.push({
        t: 'items',
        items: m[1].split(/\s+/).flatMap((id) => {
          const it = item(st.ctx, id)
          return it ? [it] : []
        }),
      })
    } else if ((m = /^<recipes\/([a-z0-9_:]+)>$/.exec(line))) {
      flush()
      const recipes = recipesOf(st.ctx, m[1])
      const prev = out[out.length - 1]
      if (prev?.t === 'recipes') prev.recipes.push(...recipes)
      else if (recipes.length) out.push({ t: 'recipes', recipes })
    } else if ((m = /^<wiki\/(.+)>$/.exec(line))) {
      flush()
      const pages = m[1].split(/\s+/).flatMap((slug) => {
        const p = st.ctx.pages.find((x) => x.slug === slug)
        return p ? [{ slug, title: p.title, text: p.lead ?? '' }] : []
      })
      if (pages.length) out.push({ t: 'pages', pages })
    } else if ((m = /^<image\/(images\/[\w\-./]+)(?:\/(.*))?>$/.exec(line)) && !m[1].includes('..')) {
      flush()
      out.push({ t: 'image', src: `/${m[1]}`, caption: m[2] ?? '' })
    } else {
      para.push(line)
    }
  }
  flush()
  return out
}

/** Демо пишется в одну строку, поэтому \n внутри него — настоящий перенос только в карточках. */
function expand(code: string): string[] {
  return /^>/.test(code) ? [code] : code.split(/\\n/)
}

export function parseWiki(source: string, ctx: Ctx): Parsed {
  const body: string[] = []
  const info: Parsed['info'] = []
  const see: string[] = []
  let icon: string | null = null
  const st: Inline = { ctx, linked: new Set(), auto: true }
  let fenced = false
  for (const raw of source.replace(/\r/g, '').split('\n')) {
    const line = raw.trim()
    if (line.startsWith('```')) fenced = !fenced
    let m: RegExpExecArray | null
    if (!fenced && (m = /^<icon\/([a-z0-9_:]+)>$/.exec(line))) {
      icon = ctx.items[m[1]]?.icon ?? null
    } else if (!fenced && (m = /^<info\/([^/>]+)\/(.+)>$/.exec(line))) {
      info.push({ key: stripInline(m[1]), html: inline(m[2], { ...st, auto: false }) })
    } else if (!fenced && (m = /^<see\/(.+)>$/.exec(line))) {
      see.push(...m[1].split(/\s+/).filter((s) => ctx.pages.some((p) => p.slug === s)))
    } else {
      body.push(raw)
    }
  }
  const blocks = parseBlocks(body, st, { n: 0 })
  const first = blocks.find((b) => b.t === 'p')
  const lead = first && first.t === 'p' ? first.html.replace(/<[^>]+>/g, '') : ''
  return { blocks, icon, info, see, lead }
}

/** Вложенные пункты содержания собираются по уровню заголовка. */
export type TocEntry = { id: string; text: string; num: string; level: number }

export function buildToc(blocks: Block[]): TocEntry[] {
  const out: TocEntry[] = []
  const n = [0, 0, 0]
  for (const b of blocks) {
    if (b.t !== 'h') continue
    const lvl = b.level - 2
    n[lvl] += 1
    n.fill(0, lvl + 1)
    out.push({ id: b.id, text: b.text, level: b.level, num: n.slice(0, lvl + 1).filter(Boolean).join('.') })
  }
  return out
}

/** Построчное сравнение для проверки правок: классический LCS. */
export type DiffLine = { kind: 'same' | 'add' | 'del'; text: string }

export function diffLines(before: string, after: string): DiffLine[] {
  const a = before.split('\n')
  const b = after.split('\n')
  let start = 0
  while (start < a.length && start < b.length && a[start] === b[start]) start += 1
  let endA = a.length
  let endB = b.length
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA -= 1
    endB -= 1
  }
  const midA = a.slice(start, endA)
  const midB = b.slice(start, endB)
  const t = Array.from({ length: midA.length + 1 }, () => new Array<number>(midB.length + 1).fill(0))
  for (let i = midA.length - 1; i >= 0; i--) {
    for (let j = midB.length - 1; j >= 0; j--) {
      t[i][j] = midA[i] === midB[j] ? t[i + 1][j + 1] + 1 : Math.max(t[i + 1][j], t[i][j + 1])
    }
  }
  const out: DiffLine[] = a.slice(0, start).map((text) => ({ kind: 'same', text }))
  let i = 0
  let j = 0
  while (i < midA.length || j < midB.length) {
    if (i < midA.length && j < midB.length && midA[i] === midB[j]) {
      out.push({ kind: 'same', text: midA[i] })
      i += 1
      j += 1
    } else if (j < midB.length && (i === midA.length || t[i][j + 1] >= t[i + 1][j])) {
      out.push({ kind: 'add', text: midB[j++] })
    } else {
      out.push({ kind: 'del', text: midA[i++] })
    }
  }
  return out.concat(a.slice(endA).map((text) => ({ kind: 'same', text })))
}
