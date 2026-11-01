<script setup lang="ts">
import { computed } from 'vue'
import { headHtml } from '../lib/wikiMarkup'
import { themeOf } from '../lib/nameThemes'
import AccountCard from './AccountCard.vue'
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

const props = defineProps<{ name: string; data: GameProfile; updated: string; own?: boolean }>()

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
const goods = (it: Item) => (!it.name || it.id === 'minecraft:air' ? 'Без товара' : it.name)
const DIM: Record<string, string> = { 'minecraft:overworld': 'Верхний мир', 'minecraft:the_nether': 'Незер', 'minecraft:the_end': 'Энд' }
const updated = computed(() => {
  const d = new Date(`${props.updated.replace(' ', 'T')}Z`)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
})
</script>

<template>
  <div
    class="gp"
    :style="{ '--gp': theme.accent, '--gp-top': theme.top, '--gp-bottom': theme.bottom, '--gp-head': theme.heading }"
  >
    <div class="gp-top">
      <span v-html="headHtml(name, 64)"></span>
      <div class="min-w-0 flex-1">
        <h1 class="gp-name">
          <NameTag :name="name" :theme="data.theme" :size="24" />
          <span v-if="data.plus" class="gp-plus">PLUS</span>
        </h1>
        <p class="gp-note">Статистика из игры, обновлено {{ updated }}</p>
      </div>
      <slot name="actions" />
    </div>

    <div class="gp-grid">
      <div class="gp-main">
        <section v-if="!own && data.accounts.length">
          <h2 class="gp-h">Счета</h2>
          <AccountCard v-for="a in data.accounts" :key="a.id" :name="a.name" :description="a.description" :color="a.color" :tag="`#${a.id}`" />
        </section>

        <section v-if="!own && data.shops.length">
          <h2 class="gp-h">Магазины</h2>
          <div class="art-table">
            <table>
              <thead><tr><th>№</th><th>Товар</th><th>Цена</th><th>В наличии</th><th>Где</th></tr></thead>
              <tbody>
                <tr v-for="s in data.shops" :key="s.id">
                  <td>#{{ s.id }}</td>
                  <td>{{ goods(s.goods) }}</td>
                  <td>{{ s.price }} мист.</td>
                  <td>{{ s.closed ? 'Закрыт' : s.stock }}</td>
                  <td>{{ DIM[s.dimension] ?? s.dimension }}, {{ s.x }} {{ s.y }} {{ s.z }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        <slot />
      </div>

      <aside v-if="stats.length" class="gp-side">
        <h2 class="gp-h">Статистика</h2>
        <dl class="gp-stats">
          <div v-for="k in stats" :key="k">
            <dt>{{ LABELS[k] }}</dt>
            <dd>{{ value(k, data.stats[k]) }}</dd>
          </div>
        </dl>
      </aside>
    </div>
  </div>
</template>

<style>
.gp {
  margin-bottom: 16px;
}
.gp-top {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 14px;
  padding: 12px 14px;
  background: linear-gradient(var(--gp-top), var(--gp-bottom));
  border-bottom: 2px solid var(--gp);
}
.gp-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 240px;
  gap: 20px;
  align-items: start;
}
.gp-main {
  min-width: 0;
}
.gp-side {
  position: sticky;
  top: 80px;
}
.gp-side .gp-h {
  margin-top: 0;
}
.gp-name {
  display: flex;
  align-items: center;
  margin: 0 0 4px;
  font-size: 16px;
  line-height: 1.2;
}
.gp-h {
  margin: 14px 0 6px;
  color: var(--gp-head);
  font-size: 16px;
}
.gp-plus {
  margin-left: 8px;
  padding: 2px 6px;
  background: #ffd84a;
  color: #1c170c;
  font-family: 'Noto Sans', sans-serif;
  font-weight: 800;
  font-size: 12px;
  text-shadow: none;
  vertical-align: middle;
}
.gp-note {
  margin: 0;
  color: var(--text-sub);
  font-size: 13px;
}
.gp-stats {
  margin: 0;
  background: var(--well);
  border: 2px solid var(--edge-c);
}
.gp-stats div {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
  padding: 6px 10px;
}
.gp-stats div + div {
  border-top: 2px solid var(--edge-c);
}
.gp-stats dt {
  color: var(--text-muted);
  font-size: 13px;
}
.gp-stats dd {
  margin: 0;
  font-weight: 700;
  font-size: 15px;
  white-space: nowrap;
}
@media (max-width: 800px) {
  .gp-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .gp-side {
    position: static;
    order: -1;
  }
}
</style>
