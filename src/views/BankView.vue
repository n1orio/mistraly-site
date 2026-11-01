<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { api, errorMessage, unwrap } from '../api/client'
import AccountCard from '../components/AccountCard.vue'

/**
 * Банк сервера: те же счета, история и штрафы, что в игре. Деньги живут на игровом
 * сервере, поэтому операция уходит туда и выполняется за несколько секунд.
 */
type Tx = { time: number; type: string; amount: number; balance: number; party: string; comment: string; where: string }
type Account = {
  id: number
  name: string
  description: string
  color: number
  balance: number
  primary: boolean
  mine: boolean
  owner: string
  co_owners: string[]
  history: Tx[]
}
type Fine = { id: number; player: string; amount: number; reason: string; issuer: string; issued: number; due: number; victim: string }
type Shop = { id: number; goods: { name: string }; price: number; stock: number; where: string; closed: boolean; revenue: number; sold: number }
type Bank = {
  accounts: Account[]
  fines: Fine[]
  fines_for: Fine[]
  warns: number
  warns_to_ban: number
  max_accounts: number
  plus: boolean
  shops: Shop[]
}
type Action = { id: string; kind: string; status: string; error: string | null; created_at: string }
type Player = { name: string; accounts: { id: number; name: string }[] }

const bank = ref<Bank | null>(null)
const players = ref<Player[]>([])
const actions = ref<Action[]>([])
const problem = ref('')
const error = ref('')
const busy = ref(false)

const selectedId = ref<number | null>(null)
const selected = computed(() => bank.value?.accounts.find((a) => a.id === selectedId.value) ?? bank.value?.accounts[0] ?? null)
const total = computed(() => bank.value?.accounts.filter((a) => a.mine).reduce((n, a) => n + a.balance, 0) ?? 0)

let timer = 0
async function load() {
  try {
    const res = await unwrap<{ data: Bank; players: Player[]; actions: Action[] }>(api.get('/user/bank'))
    bank.value = res.data
    players.value = res.players
    actions.value = res.actions
    problem.value = ''
  } catch (e) {
    problem.value = errorMessage(e, 'Банк сейчас недоступен')
  }
  // Пока операция выполняется, обновляем чаще, чтобы сразу показать результат.
  clearTimeout(timer)
  const running = actions.value.some((a) => a.status === 'pending' || a.status === 'taken')
  timer = window.setTimeout(load, running ? 2000 : 30000)
}
onMounted(load)
onUnmounted(() => clearTimeout(timer))

const toPlayer = ref('')
const toAccount = ref<number | null>(null)
const amount = ref<number | null>(null)
const comment = ref('')
const targets = computed(() => players.value.find((p) => p.name === toPlayer.value)?.accounts ?? [])
const own = computed(() => bank.value?.accounts ?? [])
const fromId = ref<number | null>(null)

async function send(payload: object) {
  error.value = ''
  busy.value = true
  try {
    await unwrap(api.post('/user/bank/actions', payload))
    await load()
  } catch (e) {
    error.value = errorMessage(e, 'Не удалось отправить операцию')
  } finally {
    busy.value = false
  }
}

async function transfer() {
  const from = fromId.value ?? selected.value?.id
  if (!from || !toAccount.value || !amount.value) return
  await send({ kind: 'transfer', from, to: toAccount.value, amount: amount.value, comment: comment.value })
  amount.value = null
  comment.value = ''
}

const payFrom = ref<Record<number, number>>({})
function payFine(f: Fine) {
  const account = payFrom.value[f.id] ?? selected.value?.id
  if (account) send({ kind: 'pay_fine', fine: f.id, account })
}

const money = (n: number) => `${n.toLocaleString('ru-RU')} мист.`
const date = (t: number) => new Date(t).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

const TX: Record<string, string> = {
  DEPOSIT: 'Пополнение',
  WITHDRAW: 'Снятие',
  RETURN: 'Возврат невыданного',
  TRANSFER_IN: 'Перевод от',
  TRANSFER_OUT: 'Перевод',
  FINE: 'Штраф',
  FINE_IN: 'Штраф от',
  SHOP_BUY: 'Покупка у',
  SHOP_SALE: 'Продажа',
  SHOP_SLOT: 'Слот магазина',
  ADMIN_IN: 'Начисление',
  ADMIN_OUT: 'Списание',
}
const STATUS: Record<string, string> = { pending: 'Ждёт сервер', taken: 'Выполняется', done: 'Готово', failed: 'Не выполнено' }
const KIND: Record<string, string> = { transfer: 'Перевод', pay_fine: 'Оплата штрафа', reward: 'Награда за вики' }
</script>

<template>
  <main class="w-full flex-1 text-[var(--text-main)] px-4 pt-6 pb-12">
    <div class="w-full max-w-5xl mx-auto">
      <div class="section-head">
        <h1 class="section-title bk-h1"><img src="/images/wiki/chat/bank.png" alt="" />Банк <span class="word-hl">сервера</span></h1>
      </div>

      <p v-if="problem" class="mc-panel p-4 text-center">{{ problem }}</p>

      <template v-else-if="bank">
        <p v-if="bank.warns" class="bk-warn">
          Предупреждений: {{ bank.warns }} из {{ bank.warns_to_ban }}. На {{ bank.warns_to_ban }}-м бан на неделю, оплатите штрафы.
        </p>

        <div class="bk-grid">
          <section class="mc-panel p-4">
            <div class="bk-head">
              <h2 class="bk-title">Счета</h2>
              <span class="log-dim">Всего: {{ money(total) }}</span>
            </div>
            <p v-if="!bank.accounts.length" class="bk-dim">Счетов нет. Откройте счёт в банкомате в игре.</p>
            <button
              v-for="a in bank.accounts"
              :key="a.id"
              type="button"
              class="bk-acc"
              @click="selectedId = a.id"
            >
              <AccountCard
                :name="a.name"
                :description="a.description"
                :color="a.color"
                :balance="a.balance"
                :selected="selected?.id === a.id"
                :tag="`${a.primary ? 'основной · ' : ''}${a.mine ? `#${a.id}` : `владелец ${a.owner}`}`"
              />
            </button>
            <p class="bk-dim">Счетов можно открыть: {{ bank.max_accounts }}. Пополнение и снятие только в банкомате.</p>
          </section>

          <section class="mc-panel p-4">
            <h2 class="bk-title">Перевод</h2>
            <label class="bk-field">Со счёта
              <select v-model.number="fromId" class="mc-input">
                <option :value="null">{{ selected?.name ?? 'Выберите счёт' }}</option>
                <option v-for="a in own" :key="a.id" :value="a.id">{{ a.name }} · {{ money(a.balance) }}</option>
              </select>
            </label>
            <label class="bk-field">Кому
              <select v-model="toPlayer" class="mc-input" @change="toAccount = targets[0]?.id ?? null">
                <option value="">Выберите игрока</option>
                <option v-for="p in players" :key="p.name">{{ p.name }}</option>
              </select>
            </label>
            <label v-if="targets.length" class="bk-field">На счёт
              <select v-model.number="toAccount" class="mc-input">
                <option v-for="t in targets" :key="t.id" :value="t.id">{{ t.name }}</option>
              </select>
            </label>
            <label class="bk-field">Сумма
              <input v-model.number="amount" class="mc-input" type="number" min="1" />
            </label>
            <label class="bk-field">Комментарий
              <input v-model="comment" class="mc-input" maxlength="100" />
            </label>
            <p v-if="error" class="text-[var(--bad)]">{{ error }}</p>
            <button class="mc-btn mc-btn--block" :disabled="busy || !toAccount || !amount" @click="transfer">Перевести</button>
          </section>
        </div>

        <section v-if="actions.length" class="mc-panel p-4 mt-3">
          <h2 class="bk-title">Операции с сайта</h2>
          <ul class="bk-actions">
            <li v-for="a in actions" :key="a.id">
              <span>{{ KIND[a.kind] ?? a.kind }}</span>
              <span class="mc-tag" :class="{ 'mc-tag--ok': a.status === 'done', 'mc-tag--bad': a.status === 'failed', 'mc-tag--warn': a.status === 'pending' || a.status === 'taken' }">{{ STATUS[a.status] }}</span>
              <span v-if="a.error" class="log-dim">{{ a.error }}</span>
            </li>
          </ul>
        </section>

        <section class="mc-panel p-4 mt-3">
          <h2 class="bk-title">Штрафы</h2>
          <p v-if="!bank.fines.length" class="bk-dim">Неоплаченных штрафов нет.</p>
          <div v-for="f in bank.fines" :key="f.id" class="bk-fine">
            <div class="min-w-0">
              <b>{{ money(f.amount) }}</b> · {{ f.reason }}
              <small>Выписал {{ f.issuer }}, деньги получит {{ f.victim }}. Оплатить до {{ date(f.due) }}</small>
            </div>
            <div class="bk-pay">
              <select v-model.number="payFrom[f.id]" class="mc-input">
                <option v-for="a in own" :key="a.id" :value="a.id">{{ a.name }} · {{ money(a.balance) }}</option>
              </select>
              <button class="mc-btn mc-btn--sm" :disabled="busy" @click="payFine(f)">Оплатить</button>
            </div>
          </div>
          <template v-if="bank.fines_for.length">
            <h3 class="bk-sub">Штрафы в вашу пользу</h3>
            <div v-for="f in bank.fines_for" :key="`for${f.id}`" class="bk-fine">
              <div><b>{{ money(f.amount) }}</b> · {{ f.player }}: {{ f.reason }}<small>Срок до {{ date(f.due) }}</small></div>
            </div>
          </template>
        </section>

        <section v-if="selected" class="mc-panel p-4 mt-3">
          <h2 class="bk-title">История: {{ selected.name }}</h2>
          <p v-if="selected.co_owners.length" class="bk-dim">Совладельцы: {{ selected.co_owners.join(', ') }}</p>
          <p v-if="!selected.history.length" class="bk-dim">Операций пока нет.</p>
          <div v-else class="art-table">
            <table>
              <thead><tr><th>Дата</th><th>Операция</th><th>Сумма</th><th>Остаток</th><th>Комментарий</th></tr></thead>
              <tbody>
                <tr v-for="(t, i) in selected.history" :key="i">
                  <td>{{ date(t.time) }}</td>
                  <td>{{ TX[t.type] ?? t.type }} {{ t.party }}</td>
                  <td :class="t.amount > 0 ? 'bk-in' : 'bk-out'">{{ t.amount > 0 ? '+' : '' }}{{ t.amount.toLocaleString('ru-RU') }}</td>
                  <td>{{ t.balance.toLocaleString('ru-RU') }}</td>
                  <td>{{ t.comment || t.where }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section v-if="bank.shops.length" class="mc-panel p-4 mt-3">
          <h2 class="bk-title">Мои магазины</h2>
          <div class="art-table">
            <table>
              <thead><tr><th>№</th><th>Товар</th><th>Цена</th><th>В наличии</th><th>Продано</th><th>Выручка</th><th>Где</th></tr></thead>
              <tbody>
                <tr v-for="s in bank.shops" :key="s.id">
                  <td>#{{ s.id }}</td>
                  <td>{{ s.goods.name || '—' }}</td>
                  <td>{{ s.price }}</td>
                  <td>{{ s.closed ? 'Закрыт' : s.stock }}</td>
                  <td>{{ s.sold }}</td>
                  <td>{{ s.revenue.toLocaleString('ru-RU') }}</td>
                  <td>{{ s.where }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </template>
    </div>
  </main>
</template>

<style scoped>
.bk-h1 {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.bk-h1 img {
  width: 32px;
  height: 32px;
  image-rendering: pixelated;
}
.bk-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 24px;
  align-items: stretch;
}
.bk-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
}
.bk-title {
  margin: 0 0 10px;
  font-size: 16px;
}
.bk-sub {
  margin: 14px 0 6px;
  font-family: 'Noto Sans', sans-serif;
  font-weight: 700;
  font-size: 15px;
}
.bk-dim,
.log-dim {
  color: var(--text-muted);
  font-size: 14px;
}
.bk-warn {
  margin: 0 0 16px;
  padding: 10px 14px;
  background: rgba(235, 90, 78, 0.12);
  border-left: 4px solid var(--bad);
}
.bk-acc {
  display: block;
  width: 100%;
  padding: 0;
  background: none;
  border: 0;
  color: inherit;
  font: inherit;
  cursor: pointer;
}
.bk-fine small {
  display: block;
  color: var(--text-sub);
  font-size: 13px;
}
.bk-field {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 14px;
}
.bk-actions {
  margin: 0;
  padding: 0;
  list-style: none;
}
.bk-actions li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}
.bk-fine {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 0;
  border-top: 2px solid var(--edge-c);
}
.bk-pay {
  display: flex;
  align-items: center;
  gap: 8px;
}
.bk-pay select {
  width: 200px;
}
.bk-in {
  color: var(--ok);
}
.bk-out {
  color: var(--bad);
}
@media (max-width: 800px) {
  .bk-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
