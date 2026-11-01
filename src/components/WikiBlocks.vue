<script setup lang="ts">
import type { Block, WikiItem } from '../lib/wikiMarkup'

defineProps<{ blocks: Block[] }>()

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
</script>

<template>
  <template v-for="(b, i) in blocks" :key="i">
    <component :is="`h${b.level}`" v-if="b.t === 'h'" :id="b.id" class="scroll-mt-24" :class="`art-h${b.level}`" v-html="b.html" />
    <p v-else-if="b.t === 'p'" class="art-p" v-html="b.html"></p>
    <ul v-else-if="b.t === 'ul'" class="art-ul">
      <li v-for="(li, n) in b.items" :key="n" v-html="li"></li>
    </ul>
    <ol v-else-if="b.t === 'ol'" class="art-ol">
      <li v-for="(li, n) in b.items" :key="n" v-html="li"></li>
    </ol>
    <pre v-else-if="b.t === 'code'" class="art-code"><code>{{ b.text }}</code></pre>
    <hr v-else-if="b.t === 'hr'" class="art-hr" />

    <div v-else-if="b.t === 'cards'" class="art-cards" :style="{ '--n': b.cards.length }">
      <div v-for="(c, n) in b.cards" :key="n" class="art-card">
        <WikiBlocks :blocks="c.blocks" />
        <p v-for="(h, k) in c.hints" :key="k" class="art-hint" v-html="h"></p>
      </div>
    </div>

    <div v-else-if="b.t === 'table'" class="art-table">
      <table>
        <thead>
          <tr><th v-for="(c, n) in b.head" :key="n" v-html="c"></th></tr>
        </thead>
        <tbody>
          <tr v-for="(row, r) in b.rows" :key="r">
            <td v-for="(c, k) in row" :key="k" v-html="c"></td>
          </tr>
        </tbody>
      </table>
    </div>

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
        <component :is="it.page ? 'router-link' : 'span'" :to="it.page ? `/wiki/${it.page}` : undefined" class="art-item">
          <span class="mc-slot wiki-slot">
            <img v-if="it.icon" :src="it.icon" :alt="it.name" />
            <span v-else class="slot-text">{{ initials(it.name) }}</span>
          </span>
          <span>{{ it.name }}</span>
        </component>
      </li>
    </ul>

    <div v-else-if="b.t === 'recipes'" class="recipes">
      <figure v-for="(r, n) in b.recipes" :key="n" class="recipe mc-well">
        <figcaption>{{ KIND[r.kind] }}: {{ r.result.name }}</figcaption>
        <div class="recipe-row">
          <div class="recipe-grid" :class="`recipe-grid--${r.kind}`">
            <span v-for="(s, k) in r.slots" :key="k" class="mc-slot wiki-slot" :title="s?.name">
              <template v-if="s">
                <img v-if="s.icon" :src="s.icon" :alt="s.name" />
                <span v-else class="slot-text">{{ initials(s.name) }}</span>
              </template>
            </span>
          </div>
          <span class="flow-arrow">→</span>
          <span class="mc-slot wiki-slot" :title="r.result.name">
            <img v-if="r.result.icon" :src="r.result.icon" :alt="r.result.name" />
            <span v-else class="slot-text">{{ initials(r.result.name) }}</span>
            <i v-if="r.result.count && r.result.count > 1">{{ r.result.count }}</i>
          </span>
        </div>
        <ul class="recipe-legend">
          <li v-for="e in legend(r.slots)" :key="e.item.id">
            <b v-if="!e.item.icon">{{ initials(e.item.name) }}</b>
            {{ e.item.name }} × {{ e.n }}
          </li>
        </ul>
      </figure>
    </div>

    <div v-else-if="b.t === 'pages'" class="art-pages">
      <router-link v-for="p in b.pages" :key="p.slug" :to="`/wiki/${p.slug}`" class="art-page">
        <b>{{ p.title }}</b>
        <span>{{ p.text }}</span>
      </router-link>
    </div>

    <figure v-else-if="b.t === 'image'" class="art-image">
      <img :src="b.src" :alt="b.caption" loading="lazy" :class="{ 'art-pixel': b.pixel }" />
      <figcaption v-if="b.caption">{{ b.caption }}</figcaption>
    </figure>

    <div v-else-if="b.t === 'demo'" class="demo">
      <code class="demo-code">{{ b.code }}</code>
      <span class="flow-arrow">→</span>
      <div class="demo-out"><WikiBlocks :blocks="b.blocks" /></div>
    </div>
  </template>
</template>
