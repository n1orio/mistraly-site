<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search, X } from '../lib/icons'
import { api, errorMessage, unwrap } from '../api/client'
import { headHtml } from '../lib/wikiMarkup'
import { useAuthStore } from '../stores/auth'
import { cats, groups, itemById, leadText, loadPages, pages, type Revision, type RevisionFull } from '../stores/wiki'
import WikiArticle from '../components/WikiArticle.vue'
import WikiBlocks from '../components/WikiBlocks.vue'
import WikiEditor from '../components/WikiEditor.vue'

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
const loadError = ref('')
const busy = ref(false)

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
  try {
    if (kind.value === 'history') list.value = await unwrap(api.get(`/wiki/pages/${slug.value}/history`))
    else if (kind.value === 'recent') list.value = await unwrap(api.get('/wiki/recent'))
    else if (kind.value === 'my' && auth.isAuthenticated) list.value = await unwrap(api.get('/wiki/my-edits'))
    else if (kind.value === 'rev') old.value = await unwrap(api.get(`/wiki/revisions/${parts.value[2]}`))
    else if (kind.value === 'user') player.value = await unwrap(api.get(`/wiki/users/${encodeURIComponent(parts.value[1] ?? '')}`))
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
onMounted(() => loadPages())
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
              <router-link to="/wiki">Заглавная</router-link>
              <router-link to="/wiki/recent">Свежие правки</router-link>
              <router-link to="/wiki/items">Все предметы</router-link>
              <router-link to="/wiki/formatting">Форматирование</router-link>
              <router-link to="/wiki/new">Создать статью</router-link>
              <router-link to="/wiki/my">Мои правки</router-link>
            </div>
            <div class="portlet">
              <div class="portlet-title">Разделы</div>
              <template v-for="c in cats" :key="c.name">
                <router-link :to="`/wiki/category/${c.name}`" :class="{ 'is-cat': openCat === c.name }">{{ c.name }}</router-link>
                <template v-if="openCat === c.name">
                  <router-link
                    v-for="p in catPages(c.name)"
                    :key="p.slug"
                    :to="`/wiki/${p.slug}`"
                    class="portlet-sub"
                    :class="{ 'is-on': slug === p.slug }"
                  >
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
                  <td><router-link :to="`/wiki/user/${encodeURIComponent(r.author)}`" class="log-user"><span v-html="headHtml(r.author, 16)"></span>{{ r.author }}</router-link></td>
                  <td>{{ r.summary || '—' }}</td>
                  <td>
                    <span v-if="i === 0" class="mc-tag mc-tag--dim">Текущая</span>
                    <button v-else-if="isAdmin" type="button" class="edit-link" :disabled="busy" @click="revert(r.id)">Откатить</button>
                  </td>
                </tr>
                <tr><td colspan="4">Исходная версия статьи от команды Mistraly</td></tr>
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
            <h1 class="wiki-title">Свежие правки</h1>
            <p v-if="!list.length" class="wiki-lead">Принятых правок пока нет. Станьте первым автором: откройте любую статью и нажмите «Править».</p>
            <table v-else class="wiki-log">
              <thead><tr><th>Дата</th><th>Статья</th><th>Автор</th><th>Что изменено</th></tr></thead>
              <tbody>
                <tr v-for="r in list" :key="r.id">
                  <td>{{ when(r.created_at) }}</td>
                  <td><router-link :to="`/wiki/${r.slug}`">{{ r.title }}</router-link></td>
                  <td><router-link :to="`/wiki/user/${encodeURIComponent(r.author)}`" class="log-user"><span v-html="headHtml(r.author, 16)"></span>{{ r.author }}</router-link></td>
                  <td>{{ r.summary || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else-if="kind === 'my'" class="wiki-sheet">
            <h1 class="wiki-title">Мои правки</h1>
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
            <template v-if="player">
              <div class="player-head">
                <span v-html="headHtml(player.username, 96)"></span>
                <div>
                  <h1 class="wiki-title">{{ player.username }}</h1>
                  <p class="wiki-lead">Участник с {{ when(player.created_at).split(',')[0] }}. Принятых правок: {{ player.edits.length }}.</p>
                </div>
              </div>
              <h2 class="art-h2">Вклад в вики</h2>
              <p v-if="!player.edits.length" class="art-p">Правок пока нет.</p>
              <ul v-else class="art-ul">
                <li v-for="r in player.edits" :key="r.id">
                  <router-link :to="`/wiki/${r.slug}`">{{ r.title }}</router-link>
                  <span class="log-dim"> {{ when(r.created_at) }}{{ r.summary ? ` · ${r.summary}` : '' }}</span>
                </li>
              </ul>
            </template>
            <template v-else>
              <h1 class="wiki-title">{{ parts[1] }}</h1>
              <p class="wiki-lead">{{ loadError || 'Загрузка…' }}</p>
            </template>
          </div>

          <div v-else-if="kind === 'items'" class="wiki-sheet">
            <h1 class="wiki-title">Все предметы</h1>
            <p class="wiki-lead">Предметы и блоки, которых нет в обычном Minecraft. Нажмите на предмет, чтобы открыть статью о нём.</p>
            <section v-for="g in groups" :key="g.title">
              <h2 class="art-h2"><router-link :to="`/wiki/${g.page}`">{{ g.title }}</router-link></h2>
              <WikiBlocks :blocks="[{ t: 'items', items: g.items.map((id) => ({ id, ...itemById(id) })) }]" />
            </section>
          </div>

          <div v-else-if="kind === 'category' && catPages(catName).length" class="wiki-sheet">
            <h1 class="wiki-title">Категория: {{ catName }}</h1>
            <p class="wiki-lead">В этой категории статей: {{ catPages(catName).length }}.</p>
            <ul class="wiki-catlist">
              <li v-for="p in catPages(catName)" :key="p.slug">
                <router-link :to="`/wiki/${p.slug}`">{{ p.title }}</router-link>
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
              Здесь собрано всё про второй сезон сервера: экономика, механики, предметы и рецепты. Статей: {{ pages.length }}.
              Вики пишут сами игроки: нажмите «Править» на любой странице, а после проверки ваш ник появится среди авторов.
            </p>
            <div class="wiki-portals">
              <section v-for="c in cats" :key="c.name" class="wiki-portal">
                <h2><router-link :to="`/wiki/category/${c.name}`">{{ c.name }}</router-link></h2>
                <p>{{ c.text }}</p>
                <ul>
                  <li v-for="p in catPages(c.name)" :key="p.slug"><router-link :to="`/wiki/${p.slug}`">{{ p.title }}</router-link></li>
                </ul>
              </section>
              <section class="wiki-portal">
                <h2>Участие</h2>
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

<style>
/* Без scoped: разметка статей приходит из отдельных компонентов и готового HTML.
   Каркас как у minecraft.wiki: боковые блоки, вкладки, панель с плотной шапкой. */
.wiki-root {
  width: 100%;
  font-size: 15px;
}
.wiki-grid {
  display: grid;
  grid-template-columns: 190px minmax(0, 1fr);
  gap: 16px;
  max-width: 1320px;
  margin: 0 auto;
  padding: 16px 16px 56px;
  align-items: start;
}
.wiki-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  color: #fff;
  font-family: 'Minecraft Ten', 'Noto Sans', sans-serif;
  font-size: 16px;
  line-height: 1.2;
  text-decoration: none;
}
.wiki-logo img {
  width: 48px;
  height: 48px;
  image-rendering: pixelated;
}
.wiki-sidebox summary {
  display: none;
}
.portlet {
  margin-bottom: 10px;
  padding-bottom: 6px;
  background: var(--panel);
  border: 2px solid #2b2b2c;
}
.portlet-title {
  margin-bottom: 4px;
  padding: 5px 10px;
  background: #2d2d2e;
  color: #fff;
  font-weight: 700;
  font-size: 13px;
}
.portlet a {
  display: block;
  padding: 2px 10px;
  color: var(--sky);
  font-size: 14px;
  text-decoration: none;
}
.portlet a:hover {
  text-decoration: underline;
}
.portlet a.is-cat {
  color: #fff;
  font-weight: 700;
}
.portlet-sub {
  padding-left: 20px !important;
  font-size: 13px !important;
}
.portlet-sub.is-on {
  color: #fff !important;
  font-weight: 700;
}

.wiki-bar {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  min-height: 38px;
}
.wiki-tabs {
  display: flex;
  gap: 2px;
}
.wiki-tabs a {
  padding: 8px 16px;
  background: #1e1e1f;
  color: var(--sky);
  font-weight: 700;
  font-size: 13px;
  text-decoration: none;
}
.wiki-tabs a:hover {
  background: var(--panel-hi);
}
.wiki-tabs a.is-on {
  background: var(--panel);
  box-shadow: inset 0 3px 0 var(--blue);
  color: #fff;
}
.wiki-search {
  position: relative;
  width: 280px;
  margin: 0 0 4px auto;
}
.wiki-search-box {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  background: var(--well);
  border: 2px solid #2b2b2c;
  color: var(--text-muted);
}
.wiki-search-box:focus-within {
  border-color: var(--blue);
}
.wiki-search-box input {
  flex: 1;
  min-width: 0;
  padding: 3px 4px;
  background: none;
  border: 0;
  outline: 0;
  color: var(--text-main);
  font: inherit;
  font-size: 14px;
}
.wiki-search-box input::-webkit-search-cancel-button {
  display: none;
}
.wiki-search-box button {
  display: grid;
  background: none;
  border: 0;
  color: inherit;
  cursor: pointer;
}
.wiki-found {
  position: absolute;
  z-index: 40;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  padding: 4px;
  background: var(--panel);
  border: 2px solid var(--line);
}
.wiki-none {
  margin: 0;
  padding: 8px;
  color: var(--text-muted);
}
.wiki-hit {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 6px 8px;
  background: none;
  border: 0;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.wiki-hit:hover {
  background: var(--panel-hi);
}
.wiki-hit span {
  color: var(--text-sub);
  font-size: 13px;
}
.wiki-content {
  background: var(--panel);
  border: 2px solid #2b2b2c;
  border-top: 4px solid #3d3d3d;
}
.wiki-sheet {
  padding: 18px 24px 22px;
  line-height: 1.6;
}
.wiki-sheet::after {
  content: '';
  display: block;
  clear: both;
}
.wiki-sheet a:not(.mc-btn):not(.flow-item):not(.art-item):not(.art-page):not(.art-author) {
  color: var(--sky);
  text-decoration: none;
}
.wiki-sheet a:not(.mc-btn):hover {
  text-decoration: underline;
}
.wiki-title {
  margin: 0 0 12px;
  padding-bottom: 6px;
  border-bottom: 2px solid var(--line);
  font-size: 32px;
  line-height: 1.2;
}
.wiki-lead {
  margin: 0 0 14px;
}
.wiki-catlist {
  margin: 0;
  padding: 0;
  list-style: none;
}
.wiki-catlist li {
  padding: 8px 0;
  border-bottom: 2px solid #2b2b2c;
}
.wiki-catlist p {
  margin: 2px 0 0;
  color: var(--text-muted);
  font-size: 14px;
}
.wiki-portals {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}
.wiki-portal {
  background: var(--well);
  border: 2px solid #2b2b2c;
}
.wiki-portal h2 {
  margin: 0;
  padding: 6px 12px;
  background: #2d2d2e;
  font-size: 16px;
}
.wiki-portal h2 a {
  color: #fff !important;
}
.wiki-portal p {
  margin: 8px 12px 4px;
  color: var(--text-muted);
  font-size: 14px;
}
.wiki-portal ul {
  margin: 0;
  padding: 0 12px 10px;
  list-style: none;
}
.wiki-log {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.wiki-log th,
.wiki-log td {
  padding: 6px 10px;
  border: 2px solid #2b2b2c;
  text-align: left;
  vertical-align: top;
}
.wiki-log th {
  background: #2d2d2e;
}
.log-user {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.log-dim {
  color: var(--text-sub);
  font-size: 13px;
}
.player-head {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 12px;
}
.player-head .wiki-title {
  border-bottom: 0;
  margin-bottom: 4px;
}

/* Голова из развёртки скина: лицо (8,8) и слой шляпы (40,8), масштаб --u на пиксель. */
.mc-head {
  position: relative;
  display: inline-block;
  flex: none;
  vertical-align: middle;
  width: calc(var(--u) * 8);
  height: calc(var(--u) * 8);
  background: var(--skin) calc(var(--u) * -8) calc(var(--u) * -8) / calc(var(--u) * 64) calc(var(--u) * 64) no-repeat;
  image-rendering: pixelated;
}
.mc-head::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--skin) calc(var(--u) * -40) calc(var(--u) * -8) / calc(var(--u) * 64) calc(var(--u) * 64) no-repeat;
  image-rendering: pixelated;
}
.w-mention {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
}
.w-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
}
.w-item-img {
  width: 18px;
  height: 18px;
  image-rendering: pixelated;
}

.infobox {
  float: right;
  clear: right;
  width: 280px;
  margin: 0 0 12px 20px;
  background: var(--well);
  border: 2px solid var(--line);
  font-size: 14px;
}
.infobox-name {
  margin: 2px;
  padding: 6px 10px;
  background: var(--blue);
  color: #fff;
  font-weight: 700;
  text-align: center;
}
.infobox-art {
  display: grid;
  place-items: center;
  padding: 16px;
}
.infobox-art img {
  width: 96px;
  height: 96px;
  image-rendering: pixelated;
}
.infobox dl {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  margin: 0;
}
.infobox dt,
.infobox dd {
  margin: 0;
  padding: 5px 10px;
  border-top: 2px solid #2b2b2c;
}
.infobox dt {
  font-weight: 700;
}
.toc {
  display: inline-block;
  min-width: 240px;
  max-width: 100%;
  margin: 4px 0 12px;
  padding: 8px 14px 10px;
  background: var(--well);
  border: 2px solid #2b2b2c;
  font-size: 14px;
}
.toc-title {
  margin-bottom: 4px;
  font-weight: 700;
  text-align: center;
}
.toc-title button {
  margin-left: 6px;
  background: none;
  border: 0;
  color: var(--sky);
  font: inherit;
  font-weight: 400;
  font-size: 13px;
  cursor: pointer;
}
.toc ol {
  margin: 0;
  padding: 0;
  list-style: none;
}
.toc span {
  margin-right: 8px;
  color: var(--text-sub);
}
.toc-l3 {
  padding-left: 18px;
}
.toc-l4 {
  padding-left: 36px;
}
.art-note {
  margin: 0 0 12px;
  padding: 10px 14px;
  background: rgba(242, 192, 55, 0.1);
  border-left: 4px solid var(--warn);
}
.art-note p {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin: 0 0 10px;
}
.art-note--ok {
  background: rgba(43, 217, 72, 0.1);
  border-color: var(--ok);
}
.art-h2 {
  margin: 22px 0 10px;
  padding-bottom: 4px;
  border-bottom: 2px solid var(--line);
  font-size: 24px;
  line-height: 1.25;
}
.art-h3 {
  margin: 18px 0 8px;
  font-size: 16px;
  line-height: 1.3;
}
.art-h4 {
  margin: 14px 0 6px;
  font-family: 'Noto Sans', sans-serif;
  font-weight: 700;
  font-size: 15px;
}
.art-p {
  margin: 0 0 10px;
}
.art-ul,
.art-ol {
  margin: 0 0 10px;
  padding-left: 22px;
}
.art-ul {
  list-style: square;
}
.art-ol {
  list-style: decimal;
}
.art-ul li::marker {
  color: var(--blue-hi);
}
.wiki-sheet mark {
  background: none;
  color: var(--sky);
  font-weight: 600;
}
.wiki-sheet code,
.art-code {
  background: var(--well);
  font-family: ui-monospace, 'JetBrains Mono', monospace;
  font-size: 0.88em;
}
.wiki-sheet code {
  padding: 1px 5px;
}
.art-code {
  margin: 0 0 12px;
  padding: 10px 14px;
  overflow-x: auto;
  border: 2px solid #2b2b2c;
}
.art-code code {
  padding: 0;
}
.art-hr {
  margin: 16px 0;
  border: 0;
  border-top: 2px solid var(--line);
}
.art-cards {
  display: grid;
  grid-template-columns: repeat(var(--n), minmax(0, 1fr));
  gap: 10px;
  margin: 10px 0 12px;
  clear: none;
}
.art-card {
  padding: 10px 14px;
  background: rgba(24, 110, 240, 0.1);
  border-left: 4px solid var(--blue);
}
.art-card > :last-child {
  margin-bottom: 0;
}
.art-card .art-h4,
.art-card .art-h3,
.art-card .art-h2 {
  margin-top: 0;
  border: 0;
  font-size: 16px;
}
.art-hint {
  margin: 8px 0 0;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.3);
  color: var(--text-muted);
  font-size: 14px;
}
.art-pages {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
  margin: 8px 0 12px;
}
.art-page {
  display: block;
  padding: 10px 12px;
  background: var(--well);
  border: 2px solid #2b2b2c;
  color: var(--text-main);
  text-decoration: none;
}
.art-page:hover {
  border-color: var(--blue);
}
.art-page b {
  display: block;
  color: var(--sky);
}
.art-page span {
  display: -webkit-box;
  overflow: hidden;
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.art-image {
  margin: 8px 0 12px;
}
.art-image img {
  max-width: 100%;
  border: 2px solid #2b2b2c;
}
.art-image figcaption {
  color: var(--text-sub);
  font-size: 13px;
}
.demo {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  margin: 6px 0;
  padding: 6px 0;
  border-bottom: 2px solid #2b2b2c;
}
.demo-code {
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
.demo-out > :last-child {
  margin-bottom: 0;
}
.mc-slot i {
  position: absolute;
  right: 3px;
  bottom: 0;
  color: #fff;
  font-style: normal;
  font-weight: 800;
  font-size: 14px;
}
.wiki-slot {
  position: relative;
  width: 44px;
  height: 44px;
}
.wiki-slot img {
  width: 32px;
  height: 32px;
  image-rendering: pixelated;
}
.slot-text {
  color: var(--text-muted);
  font-weight: 700;
  font-size: 13px;
}
.flow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  margin: 8px 0 12px;
}
.flow-stage {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.flow-item,
.art-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-main);
  font-size: 14px;
  line-height: 1.2;
  text-decoration: none;
}
a.flow-item:hover,
a.art-item:hover {
  color: var(--sky);
}
.flow-name {
  max-width: 130px;
}
.flow-arrow,
.flow-plus {
  color: var(--blue-hi);
  font-weight: 800;
  font-size: 20px;
}
.wiki-itemlist {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 6px 14px;
  margin: 8px 0 12px;
  padding: 0;
  list-style: none;
}
.art-table {
  margin: 8px 0 12px;
  overflow-x: auto;
}
.art-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.art-table th,
.art-table td {
  padding: 5px 10px;
  border: 2px solid #2b2b2c;
  text-align: left;
}
.art-table th {
  background: #2d2d2e;
}
.art-table tbody tr:nth-child(even) {
  background: var(--well);
}
.recipes {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 8px 0 12px;
}
.recipe {
  margin: 0;
  padding: 10px 12px;
}
.recipe figcaption {
  margin-bottom: 8px;
  font-weight: 700;
  font-size: 14px;
}
.recipe-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.recipe-grid {
  display: grid;
  grid-template-columns: repeat(3, 44px);
  gap: 2px;
}
.recipe-grid--smelting,
.recipe-grid--blasting {
  grid-template-columns: 44px;
}
.recipe-legend {
  margin: 6px 0 0;
  padding: 0;
  color: var(--text-muted);
  font-size: 13px;
  list-style: none;
}
.art-see {
  clear: both;
}
.art-foot {
  clear: both;
  margin-top: 22px;
  padding-top: 10px;
  border-top: 2px solid var(--line);
}
.art-authors {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  margin-bottom: 8px;
}
.art-foot-label {
  font-weight: 700;
}
.art-author {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-main);
  text-decoration: none;
}
a.art-author:hover {
  color: var(--sky);
}
.art-team {
  width: 32px;
  height: 32px;
  image-rendering: pixelated;
}
.art-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 4px 16px;
  color: var(--text-sub);
  font-size: 13px;
}

.edit-help {
  margin: 0 0 10px;
  color: var(--text-muted);
}
.edit-link {
  background: none;
  border: 0;
  color: var(--sky);
  font: inherit;
  cursor: pointer;
}
.edit-bad {
  color: var(--bad);
}
.edit-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}
.edit-fields label,
.edit-summary {
  display: block;
  font-weight: 600;
  font-size: 14px;
}
.edit-summary {
  margin: 12px 0;
}
.edit-tabs {
  display: flex;
  gap: 2px;
}
.edit-tabs button,
.edit-bar button {
  padding: 6px 10px;
  background: #1e1e1f;
  border: 0;
  color: var(--text-muted);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.edit-tabs button.is-on,
.edit-bar button.is-on {
  background: var(--blue);
  color: #fff;
}
.edit-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 4px;
  background: var(--well);
  border: 2px solid #2b2b2c;
  border-bottom: 0;
}
.edit-bar button:hover {
  background: var(--panel-hi);
  color: #fff;
}
.edit-bar span {
  width: 8px;
}
.edit-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 6px;
  background: var(--well);
  border: 2px solid #2b2b2c;
  border-bottom: 0;
}
.edit-pick-search {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-basis: 100%;
  color: var(--text-muted);
}
.edit-pick-search input {
  flex: 1;
  padding: 4px 6px;
  background: var(--panel);
  border: 0;
  outline: 0;
  color: var(--text-main);
  font: inherit;
}
.edit-pick-search button {
  background: none;
  border: 0;
  color: inherit;
  cursor: pointer;
}
.edit-pick {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  background: var(--panel);
  border: 0;
  color: var(--text-main);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}
.edit-pick:hover {
  background: var(--panel-hi);
}
.edit-pick img {
  width: 18px;
  height: 18px;
  image-rendering: pixelated;
}
.edit-box {
  position: relative;
}
.edit-text {
  min-height: 460px;
  resize: vertical;
  font-family: ui-monospace, 'JetBrains Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
}
.edit-nicks {
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: flex;
  flex-direction: column;
  min-width: 180px;
  background: var(--panel);
  border: 2px solid var(--line);
}
.edit-nicks button {
  padding: 5px 10px;
  background: none;
  border: 0;
  color: var(--text-main);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.edit-nicks button.is-on {
  background: var(--blue);
}
.edit-preview {
  border: 2px solid #2b2b2c;
}
.edit-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

@media (max-width: 860px) {
  .wiki-grid {
    grid-template-columns: minmax(0, 1fr);
    padding: 10px 10px 40px;
  }
  .wiki-logo {
    display: none;
  }
  .wiki-sidebox summary {
    display: block;
    margin-bottom: 8px;
    padding: 8px 12px;
    background: var(--panel);
    border: 2px solid #2b2b2c;
    font-weight: 700;
    cursor: pointer;
  }
  .wiki-bar {
    flex-wrap: wrap;
  }
  .wiki-search {
    order: -1;
    flex-basis: 100%;
    width: auto;
    margin-left: 0;
  }
  .wiki-sheet {
    padding: 14px 12px 16px;
  }
  .infobox {
    float: none;
    width: 100%;
    margin: 0 0 12px;
  }
  .toc {
    display: block;
  }
  .art-cards {
    grid-template-columns: minmax(0, 1fr);
  }
  .demo {
    grid-template-columns: minmax(0, 1fr);
  }
  .demo .flow-arrow {
    display: none;
  }
  .wiki-log {
    display: block;
    overflow-x: auto;
  }
}
</style>
