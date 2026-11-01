<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BookOpen, Search, X } from '../lib/icons'
import wiki from '../data/wiki-data.json'
import WikiArticle, { type WikiPage } from '../components/WikiArticle.vue'

/**
 * Вики в раскладке Fandom: шапка с поиском, боковая навигация по разделам,
 * статья с инфобоксом и содержанием, категории внизу.
 * Данные собирает scripts/gen-wiki.py из исходников мода.
 */
const route = useRoute()
const router = useRouter()

const pages = wiki.pages as unknown as WikiPage[]
const bySlug = new Map(pages.map((p) => [p.slug, p]))
const cats = wiki.cats
const SITE_TITLE = document.title

const slug = computed(() => (route.params.slug as string) || '')
const catName = computed(() => (route.params.cat as string) || '')
const page = computed(() => (slug.value ? bySlug.get(slug.value) ?? null : null))
const catPages = (name: string) => pages.filter((p) => p.cat === name)
const openCat = computed(() => page.value?.cat ?? catName.value)

/** На телефоне разделы свёрнуты, иначе статья оказывается за экраном. */
const wideNav = window.matchMedia('(min-width: 861px)').matches

const query = ref('')
const found = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  // Совпадение в названии важнее совпадения в тексте.
  return pages
    .filter((p) => p.search.includes(q))
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

/** Ссылки внутри текста статей приходят готовым HTML: переводим их на роутер. */
function onBodyClick(e: MouseEvent) {
  const a = (e.target as Element).closest?.('a[data-wiki]')
  if (!a) return
  e.preventDefault()
  go(a.getAttribute('href') as string)
}

watch(
  [page, catName, slug],
  async () => {
    if (page.value) document.title = `${page.value.title} — Вики Mistraly`
    else if (catName.value) document.title = `${catName.value} — Вики Mistraly`
    else if (slug.value === 'items') document.title = 'Все предметы — Вики Mistraly'
    else document.title = 'Вики Mistraly'
    await nextTick()
    window.scrollTo(0, 0)
  },
  { immediate: true }
)
onUnmounted(() => {
  document.title = SITE_TITLE
})
</script>

<template>
  <main class="wiki w-full text-[var(--text-main)]" @click="onBodyClick">
    <header class="wiki-head">
      <div class="wiki-head-in">
        <router-link to="/wiki" class="wiki-brand">
          <BookOpen :size="24" />
          <span>Вики Mistraly</span>
        </router-link>
        <span class="wiki-count">{{ pages.length }} статей</span>

        <form class="wiki-search" role="search" @submit.prevent="submit">
          <label class="wiki-search-box mc-input">
            <Search :size="24" class="shrink-0" />
            <input v-model="query" type="search" placeholder="Поиск по вики" aria-label="Поиск по вики" autocomplete="off" />
            <button v-if="query" type="button" aria-label="Очистить" @click="query = ''"><X :size="24" /></button>
          </label>
          <div v-if="query.trim()" class="wiki-found mc-panel">
            <p v-if="!found.length" class="wiki-none">Ничего не найдено</p>
            <button v-for="p in found" :key="p.slug" type="button" class="wiki-hit" @click="go(`/wiki/${p.slug}`)">
              <b>{{ p.title }}</b>
              <span>{{ p.cat }}</span>
            </button>
          </div>
        </form>
      </div>
    </header>

    <div class="wiki-grid">
      <!-- Навигация: на телефоне сворачивается в список над статьёй -->
      <details :key="route.path" class="wiki-nav" :open="wideNav">
        <summary>Разделы</summary>
        <nav aria-label="Разделы вики">
          <router-link to="/wiki" class="wiki-nav-home" :class="{ 'is-on': !slug && !catName }">Заглавная</router-link>
          <div v-for="c in cats" :key="c.name" class="wiki-nav-group">
            <router-link :to="`/wiki/category/${c.name}`" class="wiki-nav-cat" :class="{ 'is-on': openCat === c.name }">
              {{ c.name }}
            </router-link>
            <template v-if="openCat === c.name">
              <router-link
                v-for="p in catPages(c.name)"
                :key="p.slug"
                :to="`/wiki/${p.slug}`"
                class="wiki-nav-link"
                :class="{ 'is-on': slug === p.slug }"
              >
                {{ p.title }}
              </router-link>
            </template>
          </div>
          <router-link to="/wiki/items" class="wiki-nav-cat" :class="{ 'is-on': slug === 'items' }">Все предметы</router-link>
        </nav>
      </details>

      <div class="min-w-0">
        <!-- Статья -->
        <WikiArticle v-if="page" :page="page" :all="bySlug" />

        <!-- Все предметы -->
        <article v-else-if="slug === 'items'" class="wiki-sheet mc-panel">
          <p class="wiki-crumbs"><router-link to="/wiki">Вики</router-link> › Все предметы</p>
          <h1 class="wiki-title">Все предметы</h1>
          <p class="wiki-lead">Предметы и блоки, которых нет в обычном Minecraft. Нажмите на предмет, чтобы открыть статью о нём.</p>
          <section v-for="g in wiki.groups" :key="g.title">
            <h2 class="wiki-h2"><router-link :to="`/wiki/${g.page}`">{{ g.title }}</router-link></h2>
            <ul class="wiki-itemlist">
              <li v-for="it in g.items" :key="it.id">
                <router-link :to="`/wiki/${it.page}`">
                  <span class="mc-slot wiki-slot"><img :src="it.icon ?? ''" :alt="it.name" /></span>
                  <span>{{ it.name }}</span>
                </router-link>
              </li>
            </ul>
          </section>
        </article>

        <!-- Категория -->
        <article v-else-if="catName && catPages(catName).length" class="wiki-sheet mc-panel">
          <p class="wiki-crumbs"><router-link to="/wiki">Вики</router-link> › Категория</p>
          <h1 class="wiki-title">Категория: {{ catName }}</h1>
          <p class="wiki-lead">В этой категории статей: {{ catPages(catName).length }}.</p>
          <ul class="wiki-catlist">
            <li v-for="p in catPages(catName)" :key="p.slug">
              <router-link :to="`/wiki/${p.slug}`">{{ p.title }}</router-link>
              <p>{{ p.lead }}</p>
            </li>
          </ul>
        </article>

        <!-- Статьи нет -->
        <article v-else-if="slug || catName" class="wiki-sheet mc-panel">
          <h1 class="wiki-title">Статья не найдена</h1>
          <p class="wiki-lead">Такой страницы нет. Попробуйте поиск или <router-link to="/wiki" class="mc-link">вернитесь на заглавную</router-link>.</p>
        </article>

        <!-- Заглавная -->
        <template v-else>
          <section class="wiki-welcome">
            <h1 class="wiki-title">Добро пожаловать в вики Mistraly</h1>
            <p>Здесь собрано всё про второй сезон сервера: экономика, механики, предметы и рецепты. Те же подсказки есть в игре, кнопка «Вики» над инвентарём.</p>
            <router-link to="/wiki/start" class="mc-btn">С чего начать</router-link>
          </section>

          <section class="wiki-portals">
            <article v-for="c in cats" :key="c.name" class="wiki-portal mc-panel">
              <h2><router-link :to="`/wiki/category/${c.name}`">{{ c.name }}</router-link></h2>
              <p>{{ c.text }}</p>
              <ul>
                <li v-for="p in catPages(c.name)" :key="p.slug">
                  <router-link :to="`/wiki/${p.slug}`">{{ p.title }}</router-link>
                </li>
              </ul>
            </article>
            <article class="wiki-portal mc-panel">
              <h2><router-link to="/wiki/items">Предметы</router-link></h2>
              <p>Все новые предметы и блоки сезона одним списком.</p>
              <ul class="wiki-mini">
                <template v-for="g in wiki.groups" :key="g.title">
                  <li v-for="it in g.items.slice(0, 2)" :key="it.id">
                    <router-link :to="`/wiki/${it.page}`" :title="it.name" class="mc-slot wiki-slot">
                      <img :src="it.icon ?? ''" :alt="it.name" />
                    </router-link>
                  </li>
                </template>
              </ul>
            </article>
          </section>
        </template>
      </div>
    </div>
  </main>
</template>

<style>
/* Без scoped: разметка общая для заглавной и компонента статьи. */
.wiki-head {
  background: linear-gradient(0deg, rgba(12, 12, 12, 0.82), rgba(12, 12, 12, 0.82)), url(/images/shots/forest.webp) center 40% / cover;
  border-bottom: 2px solid #2b2b2c;
}
.wiki-head-in {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 16px;
  max-width: 1240px;
  margin: 0 auto;
  padding: 18px 16px;
}
.wiki-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
  font-family: 'Minecraft Ten', 'Noto Sans', sans-serif;
  font-size: 24px;
  text-decoration: none;
}
.wiki-count {
  color: var(--text-muted);
  font-size: 14px;
}
.wiki-search {
  position: relative;
  flex: 1;
  min-width: 240px;
  max-width: 380px;
  margin-left: auto;
}
.wiki-search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  color: var(--text-muted);
}
.wiki-search-box input {
  flex: 1;
  min-width: 0;
  background: none;
  border: 0;
  outline: 0;
  color: var(--text-main);
  font: inherit;
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
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  padding: 6px;
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
  padding: 8px 10px;
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
  font-size: 14px;
}

.wiki-grid {
  display: grid;
  grid-template-columns: 230px minmax(0, 1fr);
  gap: 24px;
  max-width: 1240px;
  margin: 0 auto;
  padding: 24px 16px 64px;
  align-items: start;
}
.wiki-nav {
  position: sticky;
  top: 84px;
}
.wiki-nav summary {
  display: none;
}
.wiki-nav nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.wiki-nav a {
  display: block;
  padding: 6px 10px;
  color: var(--text-muted);
  text-decoration: none;
}
.wiki-nav a:hover {
  background: var(--panel);
  color: #fff;
}
.wiki-nav-home,
.wiki-nav-cat {
  font-weight: 700;
}
.wiki-nav a.is-on {
  color: #fff;
}
.wiki-nav-link {
  padding-left: 22px !important;
  font-size: 15px;
}
.wiki-nav-link.is-on {
  background: var(--panel);
  box-shadow: inset 4px 0 0 var(--blue);
}

.wiki-sheet {
  padding: 24px 28px 28px;
}
.wiki-sheet::after {
  content: '';
  display: block;
  clear: both;
}
.wiki-crumbs {
  margin: 0 0 6px;
  color: var(--text-sub);
  font-size: 14px;
}
.wiki-crumbs a {
  color: var(--sky);
  text-decoration: none;
}
.wiki-title {
  margin: 0 0 14px;
  font-size: 32px;
  line-height: 1.2;
}
.wiki-lead {
  margin: 0 0 16px;
  color: var(--text-main);
  line-height: 1.6;
}
.wiki-h2 {
  clear: none;
  margin: 28px 0 12px;
  padding-bottom: 6px;
  border-bottom: 2px solid var(--line);
  font-size: 24px;
  line-height: 1.2;
}
.wiki-h2 a {
  color: inherit;
  text-decoration: none;
}
.wiki-slot {
  width: 48px;
  height: 48px;
}
.wiki-slot img {
  width: 32px;
  height: 32px;
  image-rendering: pixelated;
}
.wiki-itemlist {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 8px 16px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.wiki-itemlist a {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-main);
  font-size: 15px;
  text-decoration: none;
}
.wiki-itemlist a:hover {
  color: var(--sky);
}
.wiki-catlist {
  margin: 0;
  padding: 0;
  list-style: none;
}
.wiki-catlist li {
  padding: 12px 0;
  border-top: 2px solid #2b2b2c;
}
.wiki-catlist a {
  color: var(--sky);
  font-weight: 700;
  text-decoration: none;
}
.wiki-catlist p {
  margin: 4px 0 0;
  color: var(--text-muted);
  font-size: 15px;
}

.wiki-welcome {
  margin-bottom: 24px;
  padding: 28px;
  background: linear-gradient(90deg, rgba(12, 12, 12, 0.92) 40%, rgba(12, 12, 12, 0.5)), url(/images/shots/lake.webp) center / cover;
  border: 2px solid #2b2b2c;
}
.wiki-welcome p {
  max-width: 620px;
  margin: 0 0 18px;
  color: var(--text-muted);
  line-height: 1.6;
}
.wiki-portals {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.wiki-portal {
  padding: 18px;
}
.wiki-portal h2 {
  margin: 0 0 6px;
  font-size: 24px;
}
.wiki-portal h2 a {
  color: #fff;
  text-decoration: none;
}
.wiki-portal > p {
  margin: 0 0 10px;
  color: var(--text-muted);
  font-size: 15px;
}
.wiki-portal ul {
  margin: 0;
  padding: 0;
  list-style: none;
}
.wiki-portal li a {
  color: var(--sky);
  text-decoration: none;
}
.wiki-portal li a:hover {
  text-decoration: underline;
}
.wiki-mini {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

@media (max-width: 860px) {
  .wiki-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
    padding-top: 16px;
  }
  .wiki-nav {
    position: static;
  }
  .wiki-nav summary {
    display: block;
    padding: 10px 12px;
    background: var(--panel);
    border: 2px solid #2b2b2c;
    font-weight: 700;
    cursor: pointer;
  }
  .wiki-search {
    flex-basis: 100%;
    max-width: none;
    margin-left: 0;
  }
  .wiki-sheet {
    padding: 18px 16px 20px;
  }
}
</style>
