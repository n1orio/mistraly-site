<script setup lang="ts">
import { computed, ref } from 'vue'
import { Copy, Check } from 'lucide-vue-next'
import { formatRub, type AuthorStats } from '../api/promo'

/**
 * Кабинет автора: сколько игроков пришло по коду, сколько начислено и
 * сколько ещё не выплачено. Тот же блок видит главный админ, открыв
 * конкретного автора, — только с полными никами покупателей.
 */
const props = defineProps<{ stats: AuthorStats }>()

const s = computed(() => props.stats.summary)
const maxDaily = computed(() => Math.max(1, ...props.stats.daily.map((d) => d.reward_kopecks)))

const copied = ref('')
function refLink(code: string) {
  return `${location.origin.replace('admin.', '')}/?promo=${encodeURIComponent(code)}`
}
async function copy(code: string) {
  try {
    await navigator.clipboard.writeText(refLink(code))
    copied.value = code
    setTimeout(() => (copied.value = ''), 1500)
  } catch {
    // Буфер обмена недоступен — ссылка всё равно видна в таблице.
  }
}

function date(raw: string) {
  const d = new Date(raw.replace(' ', 'T') + (/[zZ+]/.test(raw) ? '' : 'Z'))
  return Number.isNaN(d.getTime()) ? raw : d.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })
}
</script>

<template>
  <div class="author">
    <div class="cards">
      <div class="card">
        <span class="k">Покупок по коду</span>
        <b>{{ s.uses - s.test_uses }}</b>
      </div>
      <div class="card">
        <span class="k">Из них проходок</span>
        <b>{{ s.passes }}</b>
      </div>
      <div class="card">
        <span class="k">Оплачено игроками</span>
        <b>{{ formatRub(s.revenue_kopecks) }}</b>
      </div>
      <div class="card">
        <span class="k">Начислено автору</span>
        <b>{{ formatRub(s.earned_kopecks) }}</b>
      </div>
      <div class="card">
        <span class="k">Выплачено</span>
        <b>{{ formatRub(s.paid_out_kopecks) }}</b>
      </div>
      <div class="card accent">
        <span class="k">К выплате</span>
        <b>{{ formatRub(s.owed_kopecks) }}</b>
      </div>
    </div>

    <p v-if="s.test_uses" class="warn">
      Покупок в тестовом режиме без оплаты: {{ s.test_uses }}. Они видны в списке, но к выплате не
      идут.
    </p>

    <h3>Коды</h3>
    <table>
      <thead>
        <tr>
          <th>Код</th>
          <th>Скидка игроку</th>
          <th>Автору</th>
          <th>Покупок</th>
          <th>Начислено</th>
          <th>Ссылка</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="c in stats.codes" :key="c.id" :class="{ off: !c.active }">
          <td>
            <strong class="code">{{ c.code }}</strong>
            <small v-if="!c.active">выключен</small>
          </td>
          <td>{{ c.discount_percent }}%</td>
          <td>{{ c.reward_percent }}% с проходки</td>
          <td>{{ c.uses }}{{ c.max_uses ? ` / ${c.max_uses}` : '' }}</td>
          <td>{{ formatRub(c.earned_kopecks) }}</td>
          <td>
            <button class="link" :title="refLink(c.code)" @click="copy(c.code)">
              <Check v-if="copied === c.code" :size="14" />
              <Copy v-else :size="14" />
              {{ copied === c.code ? 'Скопировано' : 'Копировать' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <template v-if="stats.daily.length">
      <h3>Начисления за 30 дней</h3>
      <div class="chart" role="img" :aria-label="`Начисления по дням, максимум ${formatRub(maxDaily)}`">
        <div v-for="d in stats.daily" :key="d.day" class="col" :title="`${d.day}: ${d.uses} покупок, ${formatRub(d.reward_kopecks)}`">
          <div class="bar" :style="{ height: Math.max(3, (d.reward_kopecks / maxDaily) * 100) + '%' }"></div>
        </div>
      </div>
    </template>

    <h3>Последние покупки</h3>
    <p v-if="!stats.recent.length" class="muted">По коду ещё никто не покупал.</p>
    <table v-else>
      <thead>
        <tr>
          <th>Когда</th>
          <th>Покупатель</th>
          <th>Товар</th>
          <th>Оплачено</th>
          <th>Автору</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(r, i) in stats.recent" :key="i" :class="{ off: r.is_test }">
          <td>{{ date(r.created_at) }}</td>
          <td>{{ r.buyer }}</td>
          <td>
            {{ r.item_name }}
            <small>{{ r.code }}<template v-if="r.is_test"> · тест</template></small>
          </td>
          <td>{{ formatRub(r.paid_kopecks) }}</td>
          <td :class="r.reward_kopecks && !r.is_test ? 'ok-text' : 'muted'">
            {{ r.is_test ? '—' : formatRub(r.reward_kopecks) }}
          </td>
        </tr>
      </tbody>
    </table>

    <h3>Выплаты</h3>
    <p v-if="!stats.payouts.length" class="muted">Выплат пока не было.</p>
    <table v-else>
      <thead>
        <tr>
          <th>Когда</th>
          <th>Сумма</th>
          <th>Комментарий</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(p, i) in stats.payouts" :key="i">
          <td>{{ date(p.created_at) }}</td>
          <td>{{ formatRub(p.amount_kopecks) }}</td>
          <td>{{ p.note || '—' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
h3 {
  font-size: 15px;
  margin: 24px 0 10px;
}
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}
.card {
  padding: 12px 14px;
  border: 1px solid rgba(128, 128, 128, 0.22);
  border-radius: 10px;
  background: rgba(128, 128, 128, 0.06);
}
.card.accent {
  border-color: rgba(110, 168, 254, 0.5);
  background: rgba(110, 168, 254, 0.1);
}
.card .k {
  display: block;
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.55;
  margin-bottom: 4px;
}
.card b {
  font-size: 19px;
}
.warn {
  padding: 10px 12px;
  border: 1px solid rgba(255, 190, 90, 0.4);
  background: rgba(255, 190, 90, 0.1);
  border-radius: 8px;
  font-size: 13px;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
th,
td {
  text-align: left;
  padding: 9px 12px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.18);
  vertical-align: top;
}
th {
  opacity: 0.65;
  font-weight: 600;
}
td small {
  display: block;
  opacity: 0.5;
  font-size: 11px;
}
tr.off td {
  opacity: 0.55;
}
.code {
  font-family: ui-monospace, monospace;
  letter-spacing: 0.04em;
}
.muted {
  opacity: 0.55;
}
.ok-text {
  color: #7ee2a8;
}
button.link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 9px;
  border-radius: 6px;
  border: 1px solid rgba(128, 128, 128, 0.35);
  background: rgba(128, 128, 128, 0.12);
  color: inherit;
  cursor: pointer;
  font-size: 12px;
}
.chart {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 110px;
  overflow-x: auto;
}
.chart .col {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  /* Фиксированная ширина: при одном дне flex растягивал столбик на всю
     ширину, и график выглядел как сплошная плашка. */
  flex: 0 0 18px;
  height: 100%;
}
.chart .bar {
  width: 100%;
  background: #6ea8fe;
  border-radius: 2px 2px 0 0;
}
@media (max-width: 640px) {
  table {
    display: block;
    overflow-x: auto;
  }
}
</style>
