import { computed, ref } from 'vue'
import { api, unwrap } from '../api/client'
import base from '../data/wiki-data.json'
import { parseWiki, type Ctx, type Parsed } from '../lib/wikiMarkup'

/**
 * Статьи вики: базовые лежат в сайте, правки игроков приходят с бэкенда и
 * закрывают их поверх. Если бэкенд недоступен, вики работает на базовых.
 */
export type WikiPage = {
  slug: string
  title: string
  cat: string
  source: string
  rev: string | null
  updated: string | null
  authors: string[]
}

export type Revision = {
  id: string
  slug: string
  title: string
  cat: string
  summary: string
  author: string
  status: 'pending' | 'approved' | 'rejected'
  review_comment: string | null
  created_at: string
}

export type RevisionFull = {
  id: string
  slug: string
  title: string
  cat: string
  source: string
  summary: string
  author: string
  base_rev: string | null
  current_rev: string | null
  created_at: string
}

type ServerPage = { slug: string; title: string; cat: string; source: string; rev_id: string; updated_at: string; authors: string[] }

/** Автор исходных статей: остаётся в списке и после правок игроков. */
const BASE_AUTHOR = 'NioRio'

const server = ref<ServerPage[]>([])
let loading: Promise<void> | null = null

export const cats = base.cats
export const groups = base.groups
export const baseSource = (slug: string) => base.pages.find((p) => p.slug === slug)?.source ?? ''

export const pages = computed<WikiPage[]>(() => {
  const list = new Map<string, WikiPage>(
    base.pages.map((p) => [p.slug, { ...p, rev: null, updated: null, authors: [BASE_AUTHOR] }])
  )
  for (const s of server.value) {
    const fromBase = list.has(s.slug)
    list.set(s.slug, {
      slug: s.slug,
      title: s.title,
      cat: s.cat,
      source: s.source,
      rev: s.rev_id,
      updated: s.updated_at,
      authors: fromBase ? [...new Set([BASE_AUTHOR, ...s.authors])] : s.authors,
    })
  }
  return [...list.values()]
})

export function loadPages(force = false): Promise<void> {
  if (!loading || force) {
    loading = unwrap<ServerPage[]>(api.get('/wiki/pages'))
      .then((rows) => {
        server.value = rows
      })
      .catch(() => {
        /* бэкенд недоступен — остаёмся на базовых статьях */
      })
  }
  return loading
}

function ctxFor(slug: string): Ctx {
  return {
    slug,
    items: base.items as Ctx['items'],
    recipes: base.recipes as Ctx['recipes'],
    pages: pageIndex.value,
  }
}

const pageIndex = computed(() => pages.value.map((p) => ({ slug: p.slug, title: p.title, lead: leadOf(p.source) })))

/** Первый абзац статьи без служебных строк: подпись в карточках и списках. */
function leadOf(source: string): string {
  return (
    source
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l && !/^[<#>|:`-]/.test(l)) ?? ''
  ).replace(/[*=`\\]/g, '')
}

export const leadText = leadOf

const chatIcon = (name: string) => `/images/wiki/chat/${name}.png`

const CAT_ICONS: Record<string, string> = {
  Основы: 'book',
  Экономика: 'bank',
  Игрок: 'def',
  Добыча: 'pick',
  Снаряжение: 'sword',
}
const PAGE_ICONS: Record<string, string> = {
  start: 'home',
  chat: 'local',
  commands: 'term',
  settings: 'gear',
  punishments: 'admin',
  formatting: 'pencil',
  transfers: 'arrows',
  'co-owners': 'people',
  fines: 'fine',
  profile: 'def',
  cabinet: 'glitch',
  plus: 'plus',
  achievements: 'cup',
  death: 'skull',
}

/** Значок раздела или служебной ссылки: чатовые иконки 8×8. */
export const uiIcon = chatIcon
export const catIcon = (name: string) => chatIcon(CAT_ICONS[name] ?? 'book')

/** Значок статьи: предмет из её сноски, а если его нет — значок темы. */
export function pageIcon(page: Pick<WikiPage, 'slug' | 'cat' | 'source'>): string {
  const id = /^<icon\/([a-z0-9_:]+)>/m.exec(page.source)?.[1]
  const item = id ? itemById(id)?.icon : null
  if (item) return item
  return PAGE_ICONS[page.slug] ? chatIcon(PAGE_ICONS[page.slug]) : catIcon(page.cat)
}

export function render(source: string, slug: string): Parsed {
  return parseWiki(source, ctxFor(slug))
}

export const itemById = (id: string) => (base.items as Ctx['items'])[id]
export const allItems = Object.entries(base.items as Ctx['items']).map(([id, v]) => ({ id, ...v }))
export const recipeIds = Object.keys(base.recipes)
export const allAssets = base.assets
