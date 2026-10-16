<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Plus, RefreshCw, Wallet, ChevronLeft, Power } from 'lucide-vue-next'
import { errorMessage } from '../api/client'
import type { AdminUser } from '../api/admin'
import AuthorStats from './AuthorStats.vue'
import {
  authorStats,
  authorsOverview,
  createPromo,
  formatRub,
  listPromos,
  listRedemptions,
  payAuthor,
  updatePromo,
  type AuthorStats as Stats,
  type AuthorsOverview,
  type PromoCode,
  type PromoKind,
  type Redemption
} from '../api/promo'

/**
 * Промокоды для главного админа: кто сколько заработал, сколько
 * выплачено и сколько осталось выплатить, плюс заведение кодов.
 */
const props = defineProps<{ users: AdminUser[] }>()

const loading = ref(false)
const problem = ref('')
const notice = ref('')

const promos = ref<PromoCode[]>([])
const overview = ref<AuthorsOverview | null>(null)
const feed = ref<Redemption[]>([])

async function load() {
  loading.value = true
  problem.value = ''
  try {
    ;[promos.value, overview.value, feed.value] = await Promise.all([
      listPromos(),
      authorsOverview(),
      listRedemptions(undefined, 50)
    ])
  } catch (e) {
    problem.value = errorMessage(e, 'Не удалось загрузить промокоды')
  } finally {
    loading.value = false
  }
}
onMounted(load)

// ── новый код ──────────────────────────────────────────────────────────
const form = ref({
  code: '',
  kind: 'author' as PromoKind,
  discount_percent: 15,
  reward_percent: 15,
  author_user_id: '',
  max_uses: '' as number | '',
  expires_at: '',
  note: ''
})
const authorQuery = ref('')
const authorOptions = computed(() => {
  const q = authorQuery.value.trim().toLowerCase()
  const list = q
    ? props.users.filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          (u.discord_username ?? '').toLowerCase().includes(q) ||
          (u.nickname ?? '').toLowerCase().includes(q)
      )
    : props.users
  return list.slice(0, 50)
})

function setKind(kind: PromoKind) {
  form.value.kind = kind
  // Условия партнёрки — 15/15; у обычного промокода вознаграждения нет.
  if (kind === 'author') {
    form.value.discount_percent = 15
    form.value.reward_percent = 15
  } else {
    form.value.reward_percent = 0
    if (!form.value.discount_percent) form.value.discount_percent = 10
  }
}

const creating = ref(false)
async function submit() {
  creating.value = true
  problem.value = ''
  notice.value = ''
  try {
    const f = form.value
    const res = await createPromo({
      code: f.code,
      kind: f.kind,
      discount_percent: f.discount_percent,
      reward_percent: f.kind === 'author' ? f.reward_percent : 0,
      author_user_id: f.kind === 'author' ? f.author_user_id : undefined,
      max_uses: f.max_uses === '' ? undefined : Number(f.max_uses),
      // <input type="date"> даёт день; код действует до конца этого дня по UTC.
      expires_at: f.expires_at ? `${f.expires_at}T23:59:59Z` : undefined,
      note: f.note || undefined
    })
    notice.value = `Код ${res.code} создан`
    form.value.code = ''
    form.value.note = ''
    await load()
  } catch (e) {
    problem.value = errorMessage(e, 'Не удалось создать код')
  } finally {
    creating.value = false
  }
}

async function toggle(p: PromoCode) {
  problem.value = ''
  try {
    await updatePromo(p.id, { active: !p.active })
    p.active = !p.active
  } catch (e) {
    problem.value = errorMessage(e, 'Не удалось изменить код')
  }
}

// ── выплаты ────────────────────────────────────────────────────────────
const payFor = ref<string | null>(null)
const payAmount = ref<number | ''>('')
const payNote = ref('')
const paying = ref(false)

function openPay(id: string, owed: number) {
  payFor.value = id
  payAmount.value = Math.max(0, owed) / 100
  payNote.value = ''
}

async function pay() {
  if (!payFor.value || payAmount.value === '') return
  paying.value = true
  problem.value = ''
  try {
    await payAuthor(payFor.value, Number(payAmount.value), payNote.value || undefined)
    notice.value = `Выплата ${formatRub(Math.round(Number(payAmount.value) * 100))} отмечена`
    payFor.value = null
    await load()
    if (selected.value) await openAuthor(selected.value.author.id)
  } catch (e) {
    problem.value = errorMessage(e, 'Не удалось отметить выплату')
  } finally {
    paying.value = false
  }
}

// ── карточка автора ────────────────────────────────────────────────────
const selected = ref<Stats | null>(null)
async function openAuthor(id: string) {
  problem.value = ''
  try {
    selected.value = await authorStats(id)
  } catch (e) {
    problem.value = errorMessage(e, 'Не удалось загрузить автора')
  }
}

function date(raw: string) {
  const d = new Date(raw.replace(' ', 'T') + (/[zZ+]/.test(raw) ? '' : 'Z'))
  return Number.isNaN(d.getTime()) ? raw : d.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })
}
</script>

<template>
  <div class="promo">
    <p v-if="notice" class="ok">{{ notice }}</p>
    <p v-if="problem" class="err">{{ problem }}</p>

    <!-- Один автор -->
    <template v-if="selected">
      <div class="head">
        <button class="ghost" @click="selected = null"><ChevronLeft :size="16" /> Все авторы</button>
        <h3>{{ selected.author.username }}</h3>
        <button :disabled="selected.summary.owed_kopecks <= 0" @click="openPay(selected.author.id, selected.summary.owed_kopecks)">
          <Wallet :size="15" /> Отметить выплату
        </button>
      </div>
      <form v-if="payFor === selected.author.id" class="pay" @submit.prevent="pay">
        <input v-model.number="payAmount" type="number" min="0.01" step="0.01" placeholder="Сумма, ₽" required />
        <input v-model="payNote" placeholder="Комментарий (карта, дата)" />
        <button type="submit" :disabled="paying">{{ paying ? 'Сохраняем…' : 'Выплачено' }}</button>
        <button type="button" class="ghost" @click="payFor = null">Отмена</button>
      </form>
      <AuthorStats :stats="selected" />
    </template>

    <template v-else>
      <!-- Сводка к выплате -->
      <div class="head">
        <h3>Авторы</h3>
        <button class="ghost" :disabled="loading" @click="load">
          <RefreshCw :size="16" :class="{ spin: loading }" /> Обновить
        </button>
      </div>

      <div v-if="overview" class="cards">
        <div class="card">
          <span class="k">Начислено всего</span>
          <b>{{ formatRub(overview.total.earned_kopecks) }}</b>
        </div>
        <div class="card">
          <span class="k">Выплачено</span>
          <b>{{ formatRub(overview.total.paid_out_kopecks) }}</b>
        </div>
        <div class="card accent">
          <span class="k">Осталось выплатить</span>
          <b>{{ formatRub(overview.total.owed_kopecks) }}</b>
        </div>
      </div>

      <p v-if="overview && !overview.authors.length" class="muted">Авторских кодов пока нет — создайте первый ниже.</p>
      <table v-else-if="overview">
        <thead>
          <tr>
            <th>Автор</th>
            <th>Покупок</th>
            <th>Оплачено игроками</th>
            <th>Начислено</th>
            <th>Выплачено</th>
            <th>К выплате</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <template v-for="a in overview.authors" :key="a.id">
            <tr>
              <td>
                <strong>{{ a.username }}</strong>
                <small>{{ a.codes }} {{ a.codes === 1 ? 'код' : 'кода' }}</small>
              </td>
              <td>{{ a.uses }}</td>
              <td>{{ formatRub(a.revenue_kopecks) }}</td>
              <td>{{ formatRub(a.earned_kopecks) }}</td>
              <td>{{ formatRub(a.paid_out_kopecks) }}</td>
              <td :class="a.owed_kopecks > 0 ? 'owed' : 'muted'">{{ formatRub(a.owed_kopecks) }}</td>
              <td class="acts">
                <button @click="openAuthor(a.id)">Подробнее</button>
                <button :disabled="a.owed_kopecks <= 0" @click="openPay(a.id, a.owed_kopecks)">
                  <Wallet :size="15" /> Выплатить
                </button>
              </td>
            </tr>
            <tr v-if="payFor === a.id" class="pay-row">
              <td colspan="7">
                <form class="pay" @submit.prevent="pay">
                  <input v-model.number="payAmount" type="number" min="0.01" step="0.01" placeholder="Сумма, ₽" required />
                  <input v-model="payNote" placeholder="Комментарий (карта, дата)" />
                  <button type="submit" :disabled="paying">{{ paying ? 'Сохраняем…' : 'Выплачено' }}</button>
                  <button type="button" class="ghost" @click="payFor = null">Отмена</button>
                </form>
              </td>
            </tr>
          </template>
        </tbody>
      </table>

      <!-- Новый код -->
      <h3>Новый код</h3>
      <form class="create" @submit.prevent="submit">
        <div class="kind">
          <button type="button" :class="{ on: form.kind === 'author' }" @click="setKind('author')">Код автора</button>
          <button type="button" :class="{ on: form.kind === 'promo' }" @click="setKind('promo')">Промокод</button>
        </div>
        <label>
          Код
          <input v-model.trim="form.code" required maxlength="32" placeholder="STREAMER15" class="mono" />
        </label>
        <label>
          Скидка игроку, %
          <input v-model.number="form.discount_percent" type="number" min="0" :max="form.kind === 'author' ? 90 : 100" required />
          <small v-if="form.kind === 'promo' && form.discount_percent === 100" class="hint">100% — товар выдаётся бесплатно, без оплаты. Задайте лимит использований.</small>
        </label>
        <label v-if="form.kind === 'author'">
          Автору с проходки, %
          <input v-model.number="form.reward_percent" type="number" min="0" max="90" required />
        </label>
        <label v-if="form.kind === 'author'" class="wide">
          Автор
          <input v-model="authorQuery" placeholder="Поиск по нику или Discord" />
          <select v-model="form.author_user_id" required size="4">
            <option v-for="u in authorOptions" :key="u.id" :value="u.id">
              {{ u.username }}{{ u.discord_username ? ` · @${u.discord_username}` : '' }}{{ u.nickname ? ` · ${u.nickname}` : '' }}
            </option>
          </select>
        </label>
        <label>
          Лимит использований
          <input v-model.number="form.max_uses" type="number" min="1" placeholder="без лимита" />
        </label>
        <label>
          Действует до
          <input v-model="form.expires_at" type="date" />
        </label>
        <label class="wide">
          Заметка
          <input v-model="form.note" placeholder="Например: стрим 20 октября" />
        </label>
        <button type="submit" class="primary" :disabled="creating"><Plus :size="15" /> {{ creating ? 'Создаём…' : 'Создать' }}</button>
      </form>

      <!-- Все коды -->
      <h3>Все коды</h3>
      <p v-if="!promos.length" class="muted">Кодов пока нет.</p>
      <table v-else>
        <thead>
          <tr>
            <th>Код</th>
            <th>Тип</th>
            <th>Скидка</th>
            <th>Использований</th>
            <th>Выручка</th>
            <th>Автору</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in promos" :key="p.id" :class="{ off: !p.active }">
            <td>
              <strong class="mono">{{ p.code }}</strong>
              <small v-if="p.note">{{ p.note }}</small>
              <small v-if="p.expires_at">до {{ date(p.expires_at) }}</small>
            </td>
            <td>
              <template v-if="p.kind === 'author'">автор: {{ p.author ?? '—' }}</template>
              <template v-else>промокод</template>
            </td>
            <td>{{ p.discount_percent }}%<small v-if="p.kind === 'author'">автору {{ p.reward_percent }}%</small></td>
            <td>
              {{ p.uses - p.test_uses }}{{ p.max_uses ? ` / ${p.max_uses}` : '' }}
              <small v-if="p.test_uses">+{{ p.test_uses }} тест.</small>
            </td>
            <td>{{ formatRub(p.revenue_kopecks) }}<small>скидок {{ formatRub(p.discount_kopecks) }}</small></td>
            <td>{{ p.kind === 'author' ? formatRub(p.reward_kopecks) : '—' }}</td>
            <td>
              <button :title="p.active ? 'Выключить' : 'Включить'" @click="toggle(p)">
                <Power :size="14" /> {{ p.active ? 'Выкл.' : 'Вкл.' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Лента -->
      <h3>Последние использования</h3>
      <p v-if="!feed.length" class="muted">Кодами ещё не пользовались.</p>
      <table v-else>
        <thead>
          <tr>
            <th>Когда</th>
            <th>Код</th>
            <th>Покупатель</th>
            <th>Товар</th>
            <th>Оплачено</th>
            <th>Автору</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in feed" :key="r.order_id" :class="{ off: r.is_test }">
            <td>{{ date(r.created_at) }}</td>
            <td class="mono">{{ r.code }}</td>
            <td>{{ r.buyer }}</td>
            <td>{{ r.item_name }}<small v-if="r.is_test">тест, без оплаты</small></td>
            <td>{{ formatRub(r.paid_kopecks) }}<small>было {{ formatRub(r.original_kopecks) }}</small></td>
            <td>{{ r.author ? `${r.author}: ${r.is_test ? '—' : formatRub(r.reward_kopecks)}` : '—' }}</td>
          </tr>
        </tbody>
      </table>
    </template>
  </div>
</template>

<style scoped>
.hint {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  color: #fbbf24;
}
h3 {
  font-size: 15px;
  margin: 26px 0 10px;
}
.head {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.head h3 {
  margin: 0;
  flex: 1;
}
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 10px;
  margin: 12px 0 16px;
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
.acts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.owed {
  color: #6ea8fe;
  font-weight: 600;
}
.mono {
  font-family: ui-monospace, monospace;
  letter-spacing: 0.04em;
}
.muted {
  opacity: 0.55;
}
button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid rgba(128, 128, 128, 0.35);
  background: rgba(128, 128, 128, 0.12);
  color: inherit;
  cursor: pointer;
  font-size: 13px;
}
button:hover:not(:disabled) {
  background: rgba(128, 128, 128, 0.22);
}
button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
button.ghost {
  background: none;
}
button.primary {
  background: #2f6fe0;
  border-color: #2f6fe0;
  color: #fff;
  align-self: end;
}
input,
select {
  padding: 7px 10px;
  border-radius: 6px;
  border: 1px solid rgba(128, 128, 128, 0.35);
  background: #0f1115;
  color: inherit;
  font-size: 13px;
  min-width: 0;
}
.create {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  padding: 14px;
  border: 1px solid rgba(128, 128, 128, 0.22);
  border-radius: 10px;
}
.create label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  opacity: 0.9;
}
.create .wide {
  grid-column: 1 / -1;
}
.kind {
  grid-column: 1 / -1;
  display: flex;
  gap: 6px;
}
.kind button.on {
  border-color: #6ea8fe;
  background: rgba(110, 168, 254, 0.18);
}
.pay {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 10px 0;
}
.pay input {
  flex: 1;
  min-width: 140px;
}
.pay-row td {
  background: rgba(110, 168, 254, 0.06);
}
.ok,
.err {
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
}
.ok {
  background: rgba(126, 226, 168, 0.12);
  color: #7ee2a8;
}
.err {
  background: rgba(255, 120, 120, 0.12);
  color: #ff9c9c;
}
.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (max-width: 640px) {
  table {
    display: block;
    overflow-x: auto;
  }
}
</style>
