<script setup lang="ts">
import { computed } from 'vue'
import { headHtml } from '../lib/wikiMarkup'
import { themeOf } from '../lib/nameThemes'
import NameTag from './NameTag.vue'

/** Профиль с игрового сервера: те же разделы, что и в игре, скрытое сюда не приходит. */
type Item = { id: string; name: string; count: number }
export type GameProfile = {
  theme: string
  plus: boolean
  stats: Record<string, number>
  accounts: { id: number; name: string; description: string; color: number }[]
  shops: { id: number; goods: Item; price: number; stock: number; dimension: string; x: number; y: number; z: number; closed: boolean }[]
}

const props = defineProps<{ name: string; data: GameProfile; updated: string }>()

const theme = computed(() => themeOf(props.data.theme))

const LABELS: Record<string, string> = {
  PLAY_TIME: 'Время в игре',
  DEATHS: 'Смертей',
  MAX_BALANCE: 'Макс. баланс',
  ORES_MINED: 'Добыто руды',
  BLOCKS_BROKEN: 'Сломано блоков',
  PLAYER_KILLS: 'Убито игроков',
  MOB_KILLS: 'Убито мобов',
}

function value(key: string, n: number) {
  if (key === 'PLAY_TIME') {
    const minutes = Math.floor(n / 1200)
    const d = Math.floor(minutes / 1440)
    const h = Math.floor((minutes % 1440) / 60)
    return d ? `${d} д ${h} ч ${minutes % 60} мин` : h ? `${h} ч ${minutes % 60} мин` : `${minutes} мин`
  }
  return n.toLocaleString('ru-RU')
}

const stats = computed(() => Object.keys(LABELS).filter((k) => k in props.data.stats))
const hex = (color: number) => `#${(color & 0xffffff).toString(16).padStart(6, '0')}`
const DIM: Record<string, string> = { 'minecraft:overworld': 'Верхний мир', 'minecraft:the_nether': 'Незер', 'minecraft:the_end': 'Энд' }
const updated = computed(() => {
  const d = new Date(`${props.updated.replace(' ', 'T')}Z`)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
})
</script>

<template>
  <div
    class="gp"
    :style="{
      '--gp': theme.accent,
      '--gp-bg': theme.bg,
      '--gp-top': theme.top,
      '--gp-bottom': theme.bottom,
      '--gp-card': theme.card,
      '--gp-line': theme.line,
      '--gp-border': theme.border,
      '--gp-head': theme.heading,
    }"
  >
    <div class="gp-top">
      <span v-html="headHtml(name, 96)"></span>
      <div class="min-w-0">
        <h1 class="gp-name"><NameTag :name="name" :theme="data.theme" :size="24" /></h1>
        <p class="gp-tags">
          <span class="gp-theme">{{ theme.label }}</span>
          <span v-if="data.plus" class="gp-plus">PLUS</span>
        </p>
        <p class="gp-note">Статистика из игры, обновлено {{ updated }}</p>
      </div>
    </div>

    <section v-if="stats.length">
      <h2 class="gp-h">Статистика</h2>
      <dl class="gp-stats">
        <div v-for="k in stats" :key="k">
          <dt>{{ LABELS[k] }}</dt>
          <dd>{{ value(k, data.stats[k]) }}</dd>
        </div>
      </dl>
    </section>

    <section v-if="data.accounts.length">
      <h2 class="gp-h">Счета</h2>
      <ul class="gp-list">
        <li v-for="a in data.accounts" :key="a.id">
          <i class="gp-dot" :style="{ background: hex(a.color) }"></i>
          <b>{{ a.name }}</b>
          <span v-if="a.description" class="log-dim"> {{ a.description }}</span>
        </li>
      </ul>
    </section>

    <section v-if="data.shops.length">
      <h2 class="gp-h">Магазины</h2>
      <div class="art-table">
        <table>
          <thead><tr><th>№</th><th>Товар</th><th>Цена</th><th>В наличии</th><th>Где</th></tr></thead>
          <tbody>
            <tr v-for="s in data.shops" :key="s.id">
              <td>#{{ s.id }}</td>
              <td>{{ s.goods.name || '—' }}</td>
              <td>{{ s.price }} мист.</td>
              <td>{{ s.closed ? 'Закрыт' : s.stock }}</td>
              <td>{{ DIM[s.dimension] ?? s.dimension }}, {{ s.x }} {{ s.y }} {{ s.z }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style>
.gp {
  margin-bottom: 16px;
  padding: 0 14px 14px;
  background: var(--gp-bg);
  border: 2px solid var(--gp-border);
}
.gp-top {
  display: flex;
  align-items: center;
  gap: 18px;
  margin: 0 -14px 12px;
  padding: 12px 14px;
  background: linear-gradient(var(--gp-top), var(--gp-bottom));
  border-bottom: 2px solid var(--gp);
}
.gp-name {
  margin: 0 0 4px;
  font-size: 24px;
  line-height: 1.2;
}
.gp-h {
  margin: 14px 0 6px;
  color: var(--gp-head);
  font-size: 16px;
}
.gp-tags {
  display: flex;
  gap: 6px;
  margin: 0 0 4px;
}
.gp-theme,
.gp-plus {
  padding: 2px 8px;
  background: #2d2d2e;
  font-weight: 700;
  font-size: 13px;
}
.gp-plus {
  background: #ffd84a;
  color: #1c170c;
}
.gp-note {
  margin: 0;
  color: var(--text-sub);
  font-size: 13px;
}
.gp-stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
  margin: 0;
}
.gp-stats div {
  padding: 8px 12px;
  background: var(--gp-card);
  border: 2px solid var(--gp-line);
}
.gp-stats dt {
  color: var(--text-muted);
  font-size: 13px;
}
.gp-stats dd {
  margin: 0;
  font-weight: 700;
  font-size: 18px;
}
.gp-list {
  margin: 0;
  padding: 0;
  list-style: none;
}
.gp-list li {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px;
  padding: 4px 0;
}
.gp-dot {
  flex: none;
  width: 12px;
  height: 12px;
}
</style>
