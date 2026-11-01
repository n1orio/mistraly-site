import { computed, ref, type Component } from 'vue'
import { api, unwrap } from '../api/client'
import base from '../data/wiki-data.json'
import { parseWiki, type Ctx, type Parsed } from '../lib/wikiMarkup'
import {
  Anchor, BookOpen, Check, Cog, Compass, CreditCard, Home, Key, MessageSquare, Monitor, ScrollText, Shield, Sparkles, Swords,
  Terminal, Users, Wallet,
} from '../lib/icons'

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

const CAT_ICONS: Record<string, Component> = {
  Основы: BookOpen,
  Экономика: Wallet,
  Игрок: Users,
  Добыча: Compass,
  Снаряжение: Swords,
}
const PAGE_ICONS: Record<string, Component> = {
  start: Home,
  chat: MessageSquare,
  commands: Terminal,
  settings: Cog,
  punishments: Shield,
  formatting: ScrollText,
  transfers: CreditCard,
  'co-owners': Users,
  fines: Key,
  profile: Users,
  cabinet: Monitor,
  plus: Sparkles,
  achievements: Check,
  death: Anchor,
}

export const catIcon = (name: string): Component => CAT_ICONS[name] ?? BookOpen

/** Иконка статьи: предмет из её сноски, а если его нет — значок темы. */
export function pageIcon(page: Pick<WikiPage, 'slug' | 'cat' | 'source'>): { img: string | null; icon: Component } {
  const id = /^<icon\/([a-z0-9_:]+)>/m.exec(page.source)?.[1]
  return { img: id ? itemById(id)?.icon ?? null : null, icon: PAGE_ICONS[page.slug] ?? catIcon(page.cat) }
}

export function render(source: string, slug: string): Parsed {
  return parseWiki(source, ctxFor(slug))
}

export const itemById = (id: string) => (base.items as Ctx['items'])[id]
export const allItems = Object.entries(base.items as Ctx['items']).map(([id, v]) => ({ id, ...v }))
export const recipeIds = Object.keys(base.recipes)
