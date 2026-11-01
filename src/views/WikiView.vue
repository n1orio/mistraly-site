<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search, X } from '../lib/icons'
import { api, errorMessage, unwrap } from '../api/client'
import { headHtml } from '../lib/wikiMarkup'
import { useAuthStore } from '../stores/auth'
import { loadPlayerThemes, usePageTheme } from '../lib/nameThemes'
import { BASE_AUTHOR, basePages, catIcon, cats, groups, itemById, leadText, loadPages, pageIcon, pages, uiIcon, type Revision, type RevisionFull } from '../stores/wiki'
import WikiArticle from '../components/WikiArticle.vue'
import WikiBlocks from '../components/WikiBlocks.vue'
import NameTag from '../components/NameTag.vue'
import WikiEditor from '../components/WikiEditor.vue'
import PlayerProfile, { type GameProfile } from '../components/PlayerProfile.vue'

/**
 * Вики в раскладке minecraft.wiki: боковые блоки, вкладки над статьёй и поиск.
 * Адреса разбираются здесь, потому что статьи могут появляться из базы:
 *   /wiki                     заглавная
 *   /wiki/slug                статья
 *   /wiki/slug/edit           правка
 *   /wiki/slug/history        история
 *   /wiki/slug/rev/id         старая версия
 *   /wiki/category/имя, /wiki/user/ник, /wiki/items, /wiki/recent, /wiki/my, /wiki/new
 */
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const SITE_TITLE = document.title

const parts = computed(() => {
  const r = route.params.rest
  return (Array.isArray(r) ? r : r ? [r] : []).filter(Boolean) as string[]
})
const kind = computed(() => {
  const [a, b] = parts.value
  if (!a) return 'home'
  if (a === 'category') return 'category'
  if (a === 'user') return 'user'
  if (a === 'items' || a === 'recent' || a === 'my' || a === 'new') return a
  if (b === 'edit') return 'edit'
  if (b === 'history') return 'history'
  if (b === 'rev') return 'rev'
  return 'page'
})
const isArticle = computed(() => ['page', 'edit', 'history', 'rev'].includes(kind.value))
const slug = computed(() => (isArticle.value ? parts.value[0] : ''))
const page = computed(() => pages.value.find((p) => p.slug === slug.value) ?? null)
const catName = computed(() => (kind.value === 'category' ? parts.value[1] ?? '' : ''))
const catPages = (name: string) => pages.value.filter((p) => p.cat === name)
const openCat = computed(() => page.value?.cat ?? catName.value)
const isAdmin = computed(() => auth.user?.role === 'admin')

const query = ref('')
const found = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  // Совпадение в названии важнее совпадения в тексте.
  return pages.value
    .filter((p) => `${p.title} ${p.source}`.toLowerCase().includes(q))
    .sort((a, b) => Number(b.title.toLowerCase().includes(q)) - Number(a.title.toLowerCase().includes(q)))
    .slice(0, 8)
})
function go(target: string) {
  query.value = ''
  router.push(target)
}
function submit() {
  if (found.value[0]) go(`/wiki/${found.value[0].slug}`)
}

/** Ссылки внутри статей приходят готовым HTML: внутренние ведём через роутер. */
function onBodyClick(e: MouseEvent) {
  const a = (e.target as Element).closest?.('a[data-wiki]')
  if (!a) return
  e.preventDefault()
  go(a.getAttribute('href') as string)
}

// Данные страниц, которых нет в списке статей.
const list = ref<Revision[]>([])
const old = ref<RevisionFull | null>(null)
const player = ref<{ username: string; role: string; created_at: string; edits: Revision[] } | null>(null)
const game = ref<{ name: string; data: GameProfile; updated_at: string } | null>(null)
const loadError = ref('')
// Страница игрока целиком в цветах его темы.
usePageTheme(computed(() => game.value?.data.theme))
const busy = ref(false)

// Исходные статьи лежат в сборке сайта, а не в ревизиях, поэтому автору базы их
// добавляем здесь. Статьи, которые он уже правил, второй раз не считаем.
const contribution = computed(() => {
  const p = player.value
  if (!p) return []
  const edits = p.edits.map((r) => ({
    key: r.id,
    slug: r.slug,
    title: r.title,
    note: `${when(r.created_at)}${r.summary ? ` · ${r.summary}` : ''}`,
  }))
  if (p.username.toLowerCase() !== BASE_AUTHOR.toLowerCase()) return edits
  const edited = new Set(p.edits.map((r) => r.slug))
  const authored = basePages
    .filter((b) => !edited.has(b.slug))
    .map((b) => ({ key: b.slug, slug: b.slug, title: b.title, note: 'исходная статья' }))
  return [...edits, ...authored]
})

const STATUS: Record<string, string> = { pending: 'На проверке', approved: 'Принята', rejected: 'Отклонена' }
function when(iso: string) {
  const d = new Date(iso.includes('T') ? iso : `${iso.replace(' ', 'T')}Z`)
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function fetchKind() {
  loadError.value = ''
  list.value = []
  old.value = null
  player.value = null
  game.value = null
  try {
    if (kind.value === 'history') list.value = await unwrap(api.get(`/wiki/pages/${slug.value}/history`))
    else if (kind.value === 'recent') list.value = await unwrap(api.get('/wiki/recent'))
    else if (kind.value === 'my' && auth.isAuthenticated) list.value = await unwrap(api.get('/wiki/my-edits'))
    else if (kind.value === 'rev') old.value = await unwrap(api.get(`/wiki/revisions/${parts.value[2]}`))
    else if (kind.value === 'user') {
      const name = encodeURIComponent(parts.value[1] ?? '')
      // Игрок мог ещё ни разу не зайти на сервер: тогда покажем только вики.
      unwrap<{ name: string; data: GameProfile; updated_at: string }>(api.get(`/players/${name}`))
        .then((p) => (game.value = p))
        .catch(() => {})
      player.value = await unwrap(api.get(`/wiki/users/${name}`))
    }
  } catch (e) {
    loadError.value = errorMessage(e, 'Не удалось загрузить данные')
  }
}

async function cancelEdit(id: string) {
  try {
    await unwrap(api.delete(`/wiki/edits/${id}`))
    await fetchKind()
  } catch (e) {
    loadError.value = errorMessage(e, 'Не удалось отменить правку')
  }
}
async function revert(rev: string) {
  busy.value = true
  try {
    await unwrap(api.post(`/admin/wiki/pages/${slug.value}/revert/${rev}`))
    await loadPages(true)
    await fetchKind()
  } catch (e) {
    loadError.value = errorMessage(e, 'Не удалось откатить статью')
  } finally {
    busy.value = false
  }
}

const TITLES: Record<string, string> = { items: 'Все предметы', recent: 'Свежие правки', my: 'Мои правки', new: 'Новая статья' }
watch(
  () => route.path,
  async () => {
    fetchKind()
    const t =
      page.value?.title ?? (kind.value === 'category' ? catName.value : kind.value === 'user' ? parts.value[1] : TITLES[kind.value])
    document.title = t ? `${t} — Вики Mistraly` : 'Вики Mistraly'
    await nextTick()
    window.scrollTo(0, 0)
  },
  { immediate: true }
)
onMounted(() => {
  loadPages()
  loadPlayerThemes()
})
onUnmounted(() => {
  document.title = SITE_TITLE
})

/** На телефоне разделы свёрнуты, иначе статья оказывается за экраном. */
const wideNav = window.matchMedia('(min-width: 861px)').matches
function login() {
  router.push({ path: '/auth/discord', query: { redirect: route.fullPath } })
}
</script>

<template>
  <main class="wiki-root text-[var(--text-main)]" @click="onBodyClick">
    <div class="wiki-grid">
      <aside class="wiki-side">
        <router-link to="/wiki" class="wiki-logo">
          <img src="/icons/server.png" alt="" />
          <span>Вики<br />Mistraly</span>
        </router-link>

        <details :key="route.path" class="wiki-sidebox" :open="wideNav">
          <summary>Навигация</summary>
          <nav aria-label="Разделы вики">
            <div class="portlet">
              <div class="portlet-title">Вики</div>
              <router-link to="/wiki" class="portlet-link"><img :src="uiIcon('home')" alt="" class="wiki-mini-img" />Заглавная</router-link>
              <router-link to="/wiki/recent" class="portlet-link"><img :src="uiIcon('clock')" alt="" class="wiki-mini-img" />Свежие правки</router-link>
              <router-link to="/wiki/items" class="portlet-link"><img :src="uiIcon('chest')" alt="" class="wiki-mini-img" />Все предметы</router-link>
              <router-link to="/wiki/formatting" class="portlet-link"><img :src="uiIcon('pencil')" alt="" class="wiki-mini-img" />Форматирование</router-link>
              <router-link to="/wiki/new" class="portlet-link"><img :src="uiIcon('new')" alt="" class="wiki-mini-img" />Создать статью</router-link>
              <router-link to="/wiki/my" class="portlet-link"><img :src="uiIcon('msg')" alt="" class="wiki-mini-img" />Мои правки</router-link>
            </div>
            <div class="portlet">
              <div class="portlet-title">Разделы</div>
              <template v-for="c in cats" :key="c.name">
                <router-link :to="`/wiki/category/${c.name}`" class="portlet-link" :class="{ 'is-cat': openCat === c.name }">
                  <img :src="catIcon(c.name)" alt="" class="wiki-mini-img" />{{ c.name }}
                </router-link>
                <template v-if="openCat === c.name">
                  <router-link
                    v-for="p in catPages(c.name)"
                    :key="p.slug"
                    :to="`/wiki/${p.slug}`"
                    class="portlet-sub"
                    :class="{ 'is-on': slug === p.slug }"
                  >
                    <img :src="pageIcon(p)" alt="" class="wiki-mini-img" />
                    {{ p.title }}
                  </router-link>
                </template>
              </template>
            </div>
          </nav>
        </details>
      </aside>

      <div class="wiki-main">
        <div class="wiki-bar">
          <nav v-if="isArticle && page" class="wiki-tabs" aria-label="Статья">
            <router-link :to="`/wiki/${page.slug}`" :class="{ 'is-on': kind === 'page' }">Читать</router-link>
            <router-link :to="`/wiki/${page.slug}/edit`" :class="{ 'is-on': kind === 'edit' }">Править</router-link>
            <router-link :to="`/wiki/${page.slug}/history`" :class="{ 'is-on': kind === 'history' || kind === 'rev' }">История</router-link>
          </nav>
          <form class="wiki-search" role="search" @submit.prevent="submit">
            <label class="wiki-search-box">
              <input v-model="query" type="search" placeholder="Поиск по вики" aria-label="Поиск по вики" autocomplete="off" />
              <button v-if="query" type="button" aria-label="Очистить" @click="query = ''"><X :size="12" /></button>
              <Search :size="24" class="shrink-0" />
            </label>
            <div v-if="query.trim()" class="wiki-found">
              <p v-if="!found.length" class="wiki-none">Ничего не найдено</p>
              <button v-for="p in found" :key="p.slug" type="button" class="wiki-hit" @click="go(`/wiki/${p.slug}`)">
                <b>{{ p.title }}</b>
                <span>{{ p.cat }}</span>
              </button>
            </div>
          </form>
        </div>

        <div class="wiki-content">
          <!-- Статья и её разделы -->
          <WikiArticle v-if="kind === 'page' && page" :page="page" />
          <WikiEditor v-else-if="kind === 'edit' && page" :key="page.slug" :page="page" />
          <WikiEditor v-else-if="kind === 'new'" key="new" :page="null" />

          <div v-else-if="kind === 'history' && page" class="wiki-sheet">
            <h1 class="wiki-title">История: {{ page.title }}</h1>
            <p v-if="loadError" class="edit-bad">{{ loadError }}</p>
            <table class="wiki-log">
              <thead><tr><th>Дата</th><th>Автор</th><th>Что изменено</th><th></th></tr></thead>
              <tbody>
                <tr v-for="(r, i) in list" :key="r.id">
                  <td><router-link :to="`/wiki/${page.slug}/rev/${r.id}`">{{ when(r.created_at) }}</router-link></td>
                  <td><router-link :to="`/wiki/user/${encodeURIComponent(r.author)}`" class="log-user"><span v-html="headHtml(r.author, 16)"></span><NameTag :name="r.author" /></router-link></td>
                  <td>{{ r.summary || '—' }}</td>
                  <td>
                    <span v-if="i === 0" class="mc-tag mc-tag--dim">Текущая</span>
                    <button v-else-if="isAdmin" type="button" class="edit-link" :disabled="busy" @click="revert(r.id)">Откатить</button>
                  </td>
                </tr>
                <tr>
                  <td colspan="4">
                    Исходная версия,
                    <router-link to="/wiki/user/NioRio" class="log-user"><span v-html="headHtml('NioRio', 16)"></span><NameTag name="NioRio" /></router-link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <template v-else-if="kind === 'rev'">
            <WikiArticle
              v-if="old && page"
              :page="{ ...page, title: old.title, authors: [old.author], updated: old.created_at }"
              :source="old.source"
              :note="`Старая версия от ${when(old.created_at)}, автор ${old.author}. Текущая может отличаться.`"
            />
            <div v-else class="wiki-sheet"><p class="edit-bad">{{ loadError }}</p></div>
          </template>

          <!-- Служебные страницы -->
          <div v-else-if="kind === 'recent'" class="wiki-sheet">
            <h1 class="wiki-title wiki-title--icon"><img :src="uiIcon('clock')" alt="" />Свежие правки</h1>
            <p v-if="!list.length" class="wiki-lead">Принятых правок пока нет. Станьте первым автором: откройте любую статью и нажмите «Править».</p>
            <table v-else class="wiki-log">
              <thead><tr><th>Дата</th><th>Статья</th><th>Автор</th><th>Что изменено</th></tr></thead>
              <tbody>
                <tr v-for="r in list" :key="r.id">
                  <td>{{ when(r.created_at) }}</td>
                  <td><router-link :to="`/wiki/${r.slug}`">{{ r.title }}</router-link></td>
                  <td><router-link :to="`/wiki/user/${encodeURIComponent(r.author)}`" class="log-user"><span v-html="headHtml(r.author, 16)"></span><NameTag :name="r.author" /></router-link></td>
                  <td>{{ r.summary || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else-if="kind === 'my'" class="wiki-sheet">
            <h1 class="wiki-title wiki-title--icon"><img :src="uiIcon('msg')" alt="" />Мои правки</h1>
            <template v-if="!auth.isAuthenticated">
              <p class="wiki-lead">Войдите, чтобы видеть свои правки и предлагать новые.</p>
              <button class="mc-btn mc-btn--discord mc-btn--sm" @click="login">Войти через Discord</button>
            </template>
            <p v-else-if="!list.length" class="wiki-lead">Правок пока нет. Откройте любую статью и нажмите «Править».</p>
            <table v-else class="wiki-log">
              <thead><tr><th>Дата</th><th>Статья</th><th>Статус</th><th>Ответ</th></tr></thead>
              <tbody>
                <tr v-for="r in list" :key="r.id">
                  <td>{{ when(r.created_at) }}</td>
                  <td><router-link :to="`/wiki/${r.slug}`">{{ r.title }}</router-link></td>
                  <td>
                    <span class="mc-tag" :class="{ 'mc-tag--ok': r.status === 'approved', 'mc-tag--bad': r.status === 'rejected', 'mc-tag--warn': r.status === 'pending' }">{{ STATUS[r.status] }}</span>
                  </td>
                  <td>
                    {{ r.review_comment || '' }}
                    <button v-if="r.status === 'pending'" type="button" class="edit-link" @click="cancelEdit(r.id)">Отменить</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else-if="kind === 'user'" class="wiki-sheet">
            <PlayerProfile v-if="game" :name="game.name" :data="game.data" :updated="game.updated_at">
              <template v-if="player">
                <h2 class="gp-h">Вклад в вики: {{ contribution.length }}</h2>
                <ul v-if="contribution.length" class="art-ul">
                  <li v-for="c in contribution" :key="c.key">
                    <router-link :to="`/wiki/${c.slug}`">{{ c.title }}</router-link>
                    <span class="log-dim"> {{ c.note }}</span>
                  </li>
                </ul>
              </template>
            </PlayerProfile>
            <template v-else-if="player">
              <div class="player-head">
                <span v-html="headHtml(player.username, 96)"></span>
                <div>
                  <h1 class="wiki-title"><NameTag :name="player.username" :size="32" /></h1>
                  <p class="wiki-lead">Участник с {{ when(player.created_at).split(',')[0] }}. На сервер ещё не заходил.</p>
                </div>
              </div>
              <h2 class="art-h2">Вклад в вики: {{ contribution.length }}</h2>
                <ul v-if="contribution.length" class="art-ul">
                  <li v-for="c in contribution" :key="c.key">
                    <router-link :to="`/wiki/${c.slug}`">{{ c.title }}</router-link>
                    <span class="log-dim"> {{ c.note }}</span>
                  </li>
                </ul>
            </template>
            <template v-else>
              <h1 class="wiki-title">{{ parts[1] }}</h1>
              <p class="wiki-lead">{{ loadError || 'Загрузка…' }}</p>
            </template>
          </div>

          <div v-else-if="kind === 'items'" class="wiki-sheet">
            <h1 class="wiki-title wiki-title--icon"><img :src="uiIcon('chest')" alt="" />Все предметы</h1>
            <p class="wiki-lead">Предметы и блоки, которых нет в обычном Minecraft. Нажмите на предмет, чтобы открыть статью о нём.</p>
            <section v-for="g in groups" :key="g.title">
              <h2 class="art-h2"><router-link :to="`/wiki/${g.page}`">{{ g.title }}</router-link></h2>
              <WikiBlocks :blocks="[{ t: 'items', items: g.items.map((id) => ({ id, ...itemById(id) })) }]" />
            </section>
          </div>

          <div v-else-if="kind === 'category' && catPages(catName).length" class="wiki-sheet">
            <h1 class="wiki-title wiki-title--icon"><img :src="catIcon(catName)" alt="" />Категория: {{ catName }}</h1>
            <p class="wiki-lead">В этой категории статей: {{ catPages(catName).length }}.</p>
            <ul class="wiki-catlist">
              <li v-for="p in catPages(catName)" :key="p.slug">
                <router-link :to="`/wiki/${p.slug}`" class="portal-link">
                  <img :src="pageIcon(p)" alt="" class="wiki-mini-img" />
                  {{ p.title }}
                </router-link>
                <p>{{ leadText(p.source) }}</p>
              </li>
            </ul>
          </div>

          <div v-else-if="kind !== 'home'" class="wiki-sheet">
            <h1 class="wiki-title">Статьи пока нет</h1>
            <p class="wiki-lead">Такой страницы нет. Можно <router-link to="/wiki/new">создать статью</router-link> или воспользоваться поиском.</p>
          </div>

          <!-- Заглавная -->
          <div v-else class="wiki-sheet">
            <h1 class="wiki-title">Добро пожаловать в вики Mistraly</h1>
            <p class="wiki-lead">
              Здесь собрано всё про сервер Mistraly: экономика, механики, предметы и рецепты. Статей: {{ pages.length }}.
              Вики пишут сами игроки: нажмите «Править» на любой странице, а после проверки ваш ник появится среди авторов.
            </p>
            <div class="wiki-portals">
              <section v-for="c in cats" :key="c.name" class="wiki-portal">
                <h2><img :src="catIcon(c.name)" alt="" class="wiki-mid-img" /><router-link :to="`/wiki/category/${c.name}`">{{ c.name }}</router-link></h2>
                <p>{{ c.text }}</p>
                <ul>
                  <li v-for="p in catPages(c.name)" :key="p.slug">
                    <router-link :to="`/wiki/${p.slug}`" class="portal-link">
                      <img :src="pageIcon(p)" alt="" class="wiki-mini-img" />
                      {{ p.title }}
                    </router-link>
                  </li>
                </ul>
              </section>
              <section class="wiki-portal">
                <h2><img :src="uiIcon('new')" alt="" class="wiki-mid-img" />Участие</h2>
                <p>Как помочь вики.</p>
                <ul>
                  <li><router-link to="/wiki/formatting">Форматирование и разметка</router-link></li>
                  <li><router-link to="/wiki/new">Создать статью</router-link></li>
                  <li><router-link to="/wiki/recent">Свежие правки</router-link></li>
                  <li><router-link to="/wiki/items">Все предметы</router-link></li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

