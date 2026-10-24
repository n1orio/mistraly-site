import raw from '../content/rules.md?raw'
import {
  Shield,
  BookOpen,
  Anchor,
  MessageSquare,
  Scale,
  Users,
  Cog,
  Globe,
  Hammer,
  Swords,
  Compass,
  Package
} from 'lucide-vue-next'

export interface Rule {
  num: string
  title: string
  /** Текст без разметки — используется для поиска и сниппетов */
  text: string
  /** Текст с инлайновой разметкой -> HTML */
  html: string
  penalty?: string
  isWarning: boolean
  anchor: string
}

export interface RuleChapter {
  id: string
  title: string
  badge: string
  badgeColor: string
  icon: any
  rules: Rule[]
}

export interface RulesPageMeta {
  title: string
  subtitle: string
  edition: string
  disclaimer: string
  supportTitle: string
  supportText: string
  supportLink: string
  supportLinkText: string
}

const ICONS: Record<string, any> = {
  shield: Shield,
  book: BookOpen,
  anchor: Anchor,
  message: MessageSquare,
  scale: Scale,
  users: Users,
  cog: Cog,
  cogs: Cog,
  globe: Globe,
  hammer: Hammer,
  swords: Swords,
  compass: Compass,
  package: Package
}

const META_KEYS =
  'title|subtitle|edition|disclaimer|supportTitle|supportText|supportLink|supportLinkText'
const RULE_META_KEYS = 'badge|color|icon|penalty|warning'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Инлайновая разметка: `code`, **bold**, *italic*, [link](url) */
function inline(s: string): string {
  return escapeHtml(s)
    .replace(/`([^`]+)`/g, '<code class="rule-code">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="rule-link">$1</a>'
    )
}

/** Абзацы и списки из блока строк правила */
function renderBody(lines: string[]): string {
  const html: string[] = []
  let para: string[] = []
  let list: string[] = []
  let ordered = false

  const flushPara = () => {
    if (para.length) {
      html.push(`<p>${inline(para.join(' '))}</p>`)
      para = []
    }
  }
  const flushList = () => {
    if (list.length) {
      const tag = ordered ? 'ol' : 'ul'
      html.push(
        `<${tag} class="rule-list">${list.map(i => `<li>${inline(i)}</li>`).join('')}</${tag}>`
      )
      list = []
    }
  }
  const flushAll = () => {
    flushPara()
    flushList()
  }

  for (const line of lines) {
    const t = line.trim()
    if (!t) {
      flushAll()
      continue
    }

    // Продолжение пункта списка: строка с отступом, которая не начинает новый маркер
    if (/^\s+/.test(line) && list.length && !/^([-*]|\d+\.)\s+/.test(t)) {
      list[list.length - 1] += ' ' + t
      continue
    }

    const ul = t.match(/^[-*]\s+(.*)$/)
    const ol = t.match(/^\d+\.\s+(.*)$/)
    if (ul || ol) {
      flushPara()
      const isOrdered = !!ol
      if (list.length && isOrdered !== ordered) flushList()
      ordered = isOrdered
      list.push((ul || ol)![1])
      continue
    }

    flushList()
    para.push(t)
  }

  flushAll()
  return html.join('')
}

/**
 * Разбор шапки. Поддерживает два формата:
 *   1) классический --- ... ---
 *   2) голый блок "key: value" в начале файла (до первого заголовка)
 */
function parseFrontmatter(src: string): { meta: Record<string, string>; body: string } {
  const meta: Record<string, string> = {}
  const lines = src.split(/\r?\n/)

  let start = 0
  while (start < lines.length && !lines[start]!.trim()) start++

  const setMeta = (line: string) => {
    const m = line.match(new RegExp(`^(${META_KEYS}):\\s*(.*)$`))
    if (m) meta[m[1]!] = m[2]!.trim().replace(/^["']|["']$/g, '')
  }

  if (lines[start]?.trim() === '---') {
    let end = start + 1
    while (end < lines.length && lines[end]!.trim() !== '---') end++
    for (const line of lines.slice(start + 1, end)) setMeta(line)
    return { meta, body: lines.slice(end + 1).join('\n') }
  }

  let i = start
  for (; i < lines.length; i++) {
    const t = lines[i]!.trim()
    if (!t) continue
    if (t.startsWith('#') || t.startsWith('-')) break
    if (/^\d+(\.\d+)*[.)]?\s/.test(t)) break
    if (!new RegExp(`^(${META_KEYS}):`).test(t)) break
    setMeta(t)
  }
  return { meta, body: lines.slice(i).join('\n') }
}

function slug(title: string, fallback: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
  return base || fallback
}

/** Разбор "badge: X color: "#FFF" icon: shield" -> пары ключ/значение */
function readMetaLine(line: string): [string, string][] {
  const out: [string, string][] = []
  const re = new RegExp(
    `(${RULE_META_KEYS})\\s*:\\s*("[^"]*"|.*?)(?=\\s+(?:${RULE_META_KEYS})\\s*:|$)`,
    'g'
  )
  for (const m of line.matchAll(re)) {
    out.push([m[1]!, m[2]!.trim().replace(/^["']|["']$/g, '')])
  }
  return out
}

function parse(body: string): RuleChapter[] {
  const chapters: RuleChapter[] = []
  const lines = body.split(/\r?\n/)

  let chapter: RuleChapter | null = null
  let rule: (Rule & { rawPenalty?: string }) | null = null
  let buf: string[] = []
  let index = 0

  const flushRule = () => {
    if (!chapter || !rule) return
    rule.text = buf
      .map(l => l.trim().replace(/^([-*]|\d+\.)\s+/, ''))
      .filter(Boolean)
      .join(' ')
      .replace(/`/g, '')
      .trim()
    rule.html = renderBody(buf)
    if (rule.rawPenalty) rule.penalty = rule.rawPenalty
    rule.anchor = `rule-${rule.num.replace(/\./g, '-')}`
    chapter.rules.push(rule as Rule)
    rule = null
    buf = []
  }

  const flushChapter = () => {
    flushRule()
    if (chapter) chapters.push(chapter)
    chapter = null
  }

  for (const line of lines) {
    const t = line.trim()

    // Заголовок главы: "# Заголовок" или "1. Заголовок"
    const chapterHeading =
      t.startsWith('#') && !t.startsWith('##')
        ? t.replace(/^#+\s*/, '')
        : /^\d+\.\s+\S/.test(t)
          ? t
          : undefined

    if (chapterHeading) {
      flushChapter()
      index++
      chapter = {
        id: slug(chapterHeading, `chapter-${index}`),
        title: chapterHeading.trim(),
        badge: '',
        badgeColor: '#0099FF',
        icon: Shield,
        rules: []
      }
      continue
    }

    // Заголовок правила: "## 1.1 Название" или "1.1 Название"
    const ruleMatch = t.startsWith('##')
      ? t.replace(/^#+\s*/, '').match(/^([\d.]+)\s+(.*)$/)
      : t.match(/^(\d+\.\d+)\s+(.+)$/)

    if (ruleMatch && chapter) {
      flushRule()
      rule = {
        num: ruleMatch[1]!,
        title: ruleMatch[2]!.trim(),
        text: '',
        html: '',
        isWarning: false,
        anchor: ''
      }
      continue
    }

    // Мета-строки главы или правила (могут идти несколько в одной строке)
    if (new RegExp(`^(${RULE_META_KEYS})\\s*:`).test(t) && chapter) {
      for (const [key, val] of readMetaLine(t)) {
        if (!rule) {
          if (key === 'badge') chapter.badge = val
          else if (key === 'color' && val) chapter.badgeColor = val
          else if (key === 'icon') chapter.icon = ICONS[val.toLowerCase()] || Shield
        } else if (key === 'penalty') {
          rule.rawPenalty = val
        } else if (key === 'warning') {
          rule.isWarning = ['true', 'yes', '1'].includes(val.toLowerCase())
        }
      }
      continue
    }

    if (rule) buf.push(line)
  }

  flushChapter()
  return chapters
}

const parsed = parseFrontmatter(raw)

export const rulesMeta: RulesPageMeta = {
  title: parsed.meta.title || 'Правила',
  subtitle: parsed.meta.subtitle || '',
  edition: parsed.meta.edition || '',
  disclaimer: parsed.meta.disclaimer || '',
  supportTitle: parsed.meta.supportTitle || 'Помощь',
  supportText: parsed.meta.supportText || '',
  supportLink: parsed.meta.supportLink || '',
  supportLinkText: parsed.meta.supportLinkText || 'Подробнее'
}

export const rulesData: RuleChapter[] = parse(parsed.body)

export const rulesSourceFile = 'src/content/rules.md'