<script setup lang="ts">
import { computed } from 'vue'
import { headHtml } from '../lib/wikiMarkup'

/** Профиль с игрового сервера: те же разделы, что и в игре, скрытое сюда не приходит. */
type Item = { id: string; name: string; count: number }
export type GameProfile = {
  theme: string
  plus: boolean
  stats: Record<string, number>
  equipment: Item[]
  accounts: { id: number; name: string; description: string; color: number }[]
  shops: { id: number; goods: Item; price: number; stock: number; dimension: string; x: number; y: number; z: number; closed: boolean }[]
}

const props = defineProps<{ name: string; data: GameProfile; updated: string }>()

const THEMES: Record<string, { label: string; color: string }> = {
  DEFAULT: { label: 'Обычная', color: '#3fb8b0' },
  PLUS: { label: 'Plus', color: '#ffd84a' },
  ADMIN: { label: 'Админ', color: '#e64c4c' },
  GLITCH: { label: 'Глитч', color: '#00a0ff' },
}
const theme = computed(() => THEMES[props.data.theme] ?? THEMES.DEFAULT)

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
  <div class="gp" :style="{ '--gp': theme.color }">
    <div class="gp-top">
      <span v-html="headHtml(name, 96)"></span>
      <div class="min-w-0">
        <h1 class="gp-name">{{ name }}</h1>
        <p class="gp-tags">
          <span class="gp-theme">{{ theme.label }}</span>
          <span v-if="data.plus" class="gp-plus">PLUS</span>
        </p>
        <p class="gp-note">Данные с сервера, обновлено {{ updated }}</p>
      </div>
    </div>

    <section v-if="stats.length">
      <h2 class="art-h2">Статистика</h2>
      <dl class="gp-stats">
        <div v-for="k in stats" :key="k">
          <dt>{{ LABELS[k] }}</dt>
          <dd>{{ value(k, data.stats[k]) }}</dd>
        </div>
      </dl>
    </section>

    <section v-if="data.equipment.length">
      <h2 class="art-h2">Снаряжение</h2>
      <ul class="gp-list">
        <li v-for="(it, i) in data.equipment" :key="i">{{ it.name }}<template v-if="it.count > 1"> × {{ it.count }}</template></li>
      </ul>
    </section>

    <section v-if="data.accounts.length">
      <h2 class="art-h2">Счета</h2>
      <ul class="gp-list">
        <li v-for="a in data.accounts" :key="a.id">
          <i class="gp-dot" :style="{ background: hex(a.color) }"></i>
          <b>{{ a.name }}</b>
          <span v-if="a.description" class="log-dim"> {{ a.description }}</span>
        </li>
      </ul>
    </section>

    <section v-if="data.shops.length">
      <h2 class="art-h2">Магазины</h2>
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
.gp-top {
  display: flex;
  align-items: center;
  gap: 18px;
  padding-bottom: 12px;
  border-bottom: 4px solid var(--gp);
}
.gp-name {
  margin: 0 0 4px;
  color: var(--gp);
  font-size: 32px;
  line-height: 1.2;
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
  background: var(--well);
  border: 2px solid #2b2b2c;
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
