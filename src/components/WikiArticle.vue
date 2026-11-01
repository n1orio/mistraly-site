<script setup lang="ts">
import { computed } from 'vue'

type WikiItem = { id: string; name: string; icon: string | null; page: string | null; count?: number }
type Block =
  | { t: 'h'; text: string; id: string }
  | { t: 'p' | 'tip'; html: string }
  | { t: 'ul'; items: string[] }
  | { t: 'flow'; stages: WikiItem[][] }
  | { t: 'items'; items: WikiItem[] }
  | { t: 'table'; head: string[]; rows: string[][] }
  | { t: 'recipe'; kind: 'crafting' | 'smithing' | 'smelting' | 'blasting'; slots: (WikiItem | null)[]; result: WikiItem }

export type WikiPage = {
  slug: string
  title: string
  cat: string
  icon: string | null
  lead: string
  info: string[][]
  see: string[]
  blocks: Block[]
  search: string
}

const props = defineProps<{ page: WikiPage; all: Map<string, WikiPage> }>()

const toc = computed(() =>
  props.page.blocks.filter((b): b is Extract<Block, { t: 'h' }> => b.t === 'h')
)

const KIND: Record<string, string> = {
  crafting: 'Верстак',
  smithing: 'Кузнечный стол',
  smelting: 'Печь',
  blasting: 'Плавильная печь',
}

/** Что нужно для рецепта: картинок ванильных предметов на сайте нет, поэтому подписываем. */
function legend(slots: (WikiItem | null)[]) {
  const seen = new Map<string, { item: WikiItem; n: number }>()
  for (const s of slots) {
    if (!s) continue
    const e = seen.get(s.id)
    if (e) e.n += 1
    else seen.set(s.id, { item: s, n: 1 })
  }
  return [...seen.values()]
}

const initials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

function jump(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <article class="wiki-sheet mc-panel">
    <p class="wiki-crumbs">
      <router-link to="/wiki">Вики</router-link> ›
      <router-link :to="`/wiki/category/${page.cat}`">{{ page.cat }}</router-link>
    </p>
    <h1 class="wiki-title">{{ page.title }}</h1>

    <!-- Инфобокс: справа от текста, как на вики -->
    <aside class="infobox" :aria-label="`Кратко: ${page.title}`">
      <div class="infobox-name">{{ page.title }}</div>
      <div v-if="page.icon" class="infobox-art"><img :src="page.icon" alt="" /></div>
      <dl>
        <template v-for="row in page.info" :key="row[0]">
          <dt>{{ row[0] }}</dt>
          <dd>{{ row[1] }}</dd>
        </template>
      </dl>
    </aside>

    <p class="wiki-lead">{{ page.lead }}</p>

    <nav v-if="toc.length > 1" class="toc mc-well" aria-label="Содержание">
      <div class="toc-title">Содержание</div>
      <ol>
        <li v-for="h in toc" :key="h.id">
          <a :href="`#${h.id}`" @click.prevent="jump(h.id)">{{ h.text }}</a>
        </li>
      </ol>
    </nav>

    <template v-for="(b, i) in page.blocks" :key="i">
      <h2 v-if="b.t === 'h'" :id="b.id" class="wiki-h2 scroll-mt-24">{{ b.text }}</h2>
      <p v-else-if="b.t === 'p'" class="art-p" v-html="b.html"></p>
      <ul v-else-if="b.t === 'ul'" class="art-ul">
        <li v-for="(li, n) in b.items" :key="n" v-html="li"></li>
      </ul>
      <p v-else-if="b.t === 'tip'" class="art-tip" v-html="b.html"></p>

      <!-- Цепочка: руда → сырьё → готовый предмет -->
      <div v-else-if="b.t === 'flow'" class="flow">
        <template v-for="(stage, n) in b.stages" :key="n">
          <span v-if="n" class="flow-arrow">→</span>
          <span class="flow-stage">
            <template v-for="(it, k) in stage" :key="it.id">
              <span v-if="k" class="flow-plus">+</span>
              <component :is="it.page ? 'router-link' : 'span'" :to="it.page ? `/wiki/${it.page}` : undefined" class="flow-item" :title="it.name">
                <span class="mc-slot wiki-slot">
                  <img v-if="it.icon" :src="it.icon" :alt="it.name" />
                  <span v-else class="slot-text">{{ initials(it.name) }}</span>
                  <i v-if="it.count && it.count > 1">{{ it.count }}</i>
                </span>
                <span class="flow-name">{{ it.name }}</span>
              </component>
            </template>
          </span>
        </template>
      </div>

      <ul v-else-if="b.t === 'items'" class="wiki-itemlist art-items">
        <li v-for="it in b.items" :key="it.id">
          <span class="art-item">
            <span class="mc-slot wiki-slot"><img v-if="it.icon" :src="it.icon" :alt="it.name" /></span>
            <span>{{ it.name }}</span>
          </span>
        </li>
      </ul>

      <div v-else-if="b.t === 'table'" class="art-table">
        <table>
          <thead>
            <tr><th v-for="c in b.head" :key="c">{{ c }}</th></tr>
          </thead>
          <tbody>
            <tr v-for="(row, r) in b.rows" :key="r">
              <td v-for="(c, k) in row" :key="k">{{ c }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Рецепт как в игре -->
      <figure v-else-if="b.t === 'recipe'" class="recipe mc-well">
        <figcaption>{{ KIND[b.kind] }}: {{ b.result.name }}</figcaption>
        <div class="recipe-row">
          <div class="recipe-grid" :class="`recipe-grid--${b.kind}`">
            <span v-for="(s, n) in b.slots" :key="n" class="mc-slot wiki-slot" :title="s?.name">
              <template v-if="s">
                <img v-if="s.icon" :src="s.icon" :alt="s.name" />
                <span v-else class="slot-text">{{ initials(s.name) }}</span>
              </template>
            </span>
          </div>
          <span class="flow-arrow">→</span>
          <span class="mc-slot wiki-slot recipe-out" :title="b.result.name">
            <img v-if="b.result.icon" :src="b.result.icon" :alt="b.result.name" />
            <span v-else class="slot-text">{{ initials(b.result.name) }}</span>
            <i v-if="b.result.count && b.result.count > 1">{{ b.result.count }}</i>
          </span>
        </div>
        <ul class="recipe-legend">
          <li v-for="e in legend(b.slots)" :key="e.item.id">
            <b v-if="!e.item.icon">{{ initials(e.item.name) }}</b>
            {{ e.item.name }} × {{ e.n }}
          </li>
        </ul>
      </figure>
    </template>

    <section v-if="page.see.length" class="art-see">
      <h2 class="wiki-h2">См. также</h2>
      <ul>
        <li v-for="s in page.see" :key="s">
          <router-link :to="`/wiki/${s}`">{{ all.get(s)?.title }}</router-link>
        </li>
      </ul>
    </section>

    <footer class="art-cats">
      Категория:
      <router-link :to="`/wiki/category/${page.cat}`">{{ page.cat }}</router-link>
    </footer>
  </article>
</template>

<style>
.infobox {
  float: right;
  width: 270px;
  margin: 0 0 16px 24px;
  background: var(--well);
  border: 2px solid var(--line);
}
.infobox-name {
  padding: 8px 12px;
  background: var(--blue);
  color: #fff;
  font-family: 'Minecraft Ten', 'Noto Sans', sans-serif;
  font-size: 16px;
  text-align: center;
}
.infobox-art {
  display: grid;
  place-items: center;
  padding: 18px;
  background: var(--bg-void);
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
  font-size: 15px;
}
.infobox dt,
.infobox dd {
  margin: 0;
  padding: 7px 12px;
  border-top: 2px solid #2b2b2c;
}
.infobox dt {
  color: var(--text-muted);
  font-weight: 700;
}
.toc {
  display: inline-block;
  min-width: 240px;
  margin: 4px 0 8px;
  padding: 12px 18px 14px;
}
.toc-title {
  margin-bottom: 6px;
  font-weight: 700;
}
.toc ol {
  margin: 0;
  padding-left: 22px;
  list-style: decimal;
  color: var(--text-sub);
}
.toc a {
  color: var(--sky);
  text-decoration: none;
}
.toc a:hover {
  text-decoration: underline;
}
.art-p {
  margin: 0 0 12px;
  line-height: 1.6;
}
.art-ul {
  margin: 0 0 12px;
  padding-left: 22px;
  line-height: 1.6;
  list-style: square;
}
.art-ul li::marker {
  color: var(--blue-hi);
}
.art-tip {
  margin: 12px 0;
  padding: 10px 14px;
  background: rgba(24, 110, 240, 0.1);
  border-left: 4px solid var(--blue);
  line-height: 1.5;
}
.wiki-sheet a[data-wiki] {
  color: var(--sky);
  text-decoration: none;
}
.wiki-sheet a[data-wiki]:hover {
  text-decoration: underline;
}
.w-hl {
  color: var(--sky);
  font-weight: 600;
}
.w-gold {
  color: #f2c037;
  font-weight: 600;
}
.w-bad {
  color: var(--bad);
  font-weight: 600;
}
.w-good {
  color: var(--ok);
  font-weight: 600;
}
.w-plain {
  font-weight: 600;
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
  margin: 10px 0 14px;
}
.flow-stage {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.flow-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-main);
  text-decoration: none;
}
a.flow-item:hover .flow-name {
  color: var(--sky);
}
.flow-name {
  max-width: 130px;
  font-size: 14px;
  line-height: 1.2;
}
.flow-arrow,
.flow-plus {
  color: var(--blue-hi);
  font-weight: 800;
  font-size: 20px;
}
.art-items {
  margin: 8px 0 14px;
}
.art-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
}
.art-table {
  margin: 10px 0 14px;
  overflow-x: auto;
}
.art-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 15px;
}
.art-table th,
.art-table td {
  padding: 8px 12px;
  border: 2px solid #2b2b2c;
  text-align: left;
}
.art-table th {
  background: var(--panel-hi);
}
.art-table tbody tr:nth-child(even) {
  background: var(--well);
}
.recipe {
  display: inline-block;
  vertical-align: top;
  margin: 6px 12px 10px 0;
  padding: 12px 14px;
}
.recipe figcaption {
  margin-bottom: 8px;
  font-weight: 700;
  font-size: 15px;
}
.recipe-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.recipe-grid {
  display: grid;
  grid-template-columns: repeat(3, 48px);
  gap: 2px;
}
.recipe-grid--smelting,
.recipe-grid--blasting {
  grid-template-columns: 48px;
}
.recipe-legend {
  margin: 8px 0 0;
  padding: 0;
  color: var(--text-muted);
  font-size: 14px;
  list-style: none;
}
.art-see {
  clear: both;
}
.art-see ul {
  margin: 0;
  padding-left: 22px;
  list-style: square;
}
.art-see a,
.art-cats a {
  color: var(--sky);
  text-decoration: none;
}
.art-cats {
  clear: both;
  margin-top: 24px;
  padding-top: 10px;
  border-top: 2px solid #2b2b2c;
  color: var(--text-sub);
  font-size: 14px;
}
@media (max-width: 700px) {
  .infobox {
    float: none;
    width: 100%;
    margin: 0 0 16px;
  }
  .toc {
    display: block;
  }
  .recipe {
    display: block;
    margin-right: 0;
  }
}
</style>
