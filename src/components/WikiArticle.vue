<script setup lang="ts">
import { computed, ref } from 'vue'
import WikiBlocks from './WikiBlocks.vue'
import { buildToc, headHtml } from '../lib/wikiMarkup'
import { pages, render, type WikiPage } from '../stores/wiki'

const props = defineProps<{ page: WikiPage; source?: string; note?: string }>()

const parsed = computed(() => render(props.source ?? props.page.source, props.page.slug))
const toc = computed(() => buildToc(parsed.value.blocks))
const tocOpen = ref(true)

const titleOf = (slug: string) => pages.value.find((p) => p.slug === slug)?.title ?? slug

function jump(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function when(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso.includes('T') ? iso : `${iso.replace(' ', 'T')}Z`)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<template>
  <article class="wiki-sheet">
    <p v-if="note" class="art-note">{{ note }}</p>
    <h1 class="wiki-title">{{ page.title }}</h1>

    <aside v-if="parsed.info.length || parsed.icon" class="infobox" :aria-label="`Кратко: ${page.title}`">
      <div class="infobox-name">{{ page.title }}</div>
      <div v-if="parsed.icon" class="infobox-art"><img :src="parsed.icon" alt="" /></div>
      <dl>
        <template v-for="row in parsed.info" :key="row.key">
          <dt>{{ row.key }}</dt>
          <dd v-html="row.html"></dd>
        </template>
      </dl>
    </aside>

    <WikiBlocks :blocks="parsed.blocks.slice(0, 1)" />

    <nav v-if="toc.length > 1" class="toc" aria-label="Содержание">
      <div class="toc-title">
        Содержание
        <button type="button" @click="tocOpen = !tocOpen">[{{ tocOpen ? 'скрыть' : 'показать' }}]</button>
      </div>
      <ol v-if="tocOpen">
        <li v-for="h in toc" :key="h.id" :class="`toc-l${h.level}`">
          <a :href="`#${h.id}`" @click.prevent="jump(h.id)"><span>{{ h.num }}</span>{{ h.text }}</a>
        </li>
      </ol>
    </nav>

    <WikiBlocks :blocks="parsed.blocks.slice(1)" />

    <section v-if="parsed.see.length" class="art-see">
      <h2 class="art-h2">См. также</h2>
      <ul class="art-ul">
        <li v-for="s in parsed.see" :key="s">
          <router-link :to="`/wiki/${s}`">{{ titleOf(s) }}</router-link>
        </li>
      </ul>
    </section>

    <footer class="art-foot">
      <div class="art-authors">
        <span class="art-foot-label">Авторы:</span>
        <router-link v-for="a in page.authors" :key="a" :to="`/wiki/user/${encodeURIComponent(a)}`" class="art-author">
          <span v-html="headHtml(a, 32)"></span>
          {{ a }}
        </router-link>
      </div>
      <div class="art-meta">
        <span v-if="page.updated">Последнее изменение: {{ when(page.updated) }}</span>
        <span>Категория: <router-link :to="`/wiki/category/${page.cat}`">{{ page.cat }}</router-link></span>
      </div>
    </footer>
  </article>
</template>
