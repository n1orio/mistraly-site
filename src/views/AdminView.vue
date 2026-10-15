<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  Users,
  History,
  Package,
  RefreshCw,
  LogOut,
  ShieldCheck,
  Check,
  X,
  Search,
  CreditCard,
  Upload,
  Rocket,
  Save,
  Ticket
} from 'lucide-vue-next'
import PromoAdmin from '../components/PromoAdmin.vue'
import AuthorStats from '../components/AuthorStats.vue'
import { myAuthorStats, type AuthorStats as AuthorStatsData } from '../api/promo'
import { useAuthStore } from '../stores/auth'
import { api, errorMessage, unwrap } from '../api/client'
import {
  grantItem,
  listAudit,
  listShopItems,
  listUsers,
  ordersFeed,
  paymentStats,
  revokeItem,
  setItemPrice,
  setPass,
  userPurchases,
  type AdminPurchase,
  type AdminUser,
  type AuditEntry,
  type OrdersFeed,
  type PaymentStats,
  type ShopItem
} from '../api/admin'

/**
 * Админ-раздел: аккаунты, журнал действий, выдача и отзыв предметов.
 *
 * Доступ открыт только через Discord-аккаунт с ролью admin: сама роль
 * проверяется бэкендом (admin_middleware), здесь только прячем разделы от
 * тех, кому они всё равно вернут 403.
 */

const auth = useAuthStore()

type Tab = 'users' | 'audit' | 'stats' | 'builds' | 'promo'
const tab = ref<Tab>('users')

const users = ref<AdminUser[]>([])
const items = ref<ShopItem[]>([])
const audit = ref<AuditEntry[]>([])
const search = ref('')

// Статистика оплат
const statsDays = ref(30)
const stats = ref<PaymentStats | null>(null)
const feed = ref<OrdersFeed>({ orders: [], webhooks: [] })
const statsLoading = ref(false)

// Загрузка сборок. Раньше кнопка была заглушкой с setTimeout(1000):
// админ выбирал ZIP, ждал секунду и получал ту же форму. Теперь файл
// действительно едет в бэкенд, и после загрузки список перечитывается.
const buildFile = ref<File | null>(null)
const buildVersion = ref('')
const buildChangelog = ref('')
const builds = ref<{ id: string; version: string; file_size: number; hash: string; changelog: string | null; created_at: string }[]>([])

const loading = ref(false)
const busy = ref('')
const notice = ref('')
const problem = ref('')

// Выдача предмета
const grantUser = ref<AdminUser | null>(null)
const grantItemId = ref('')
const grantReason = ref('')

// История покупок выбранного аккаунта
const purchasesOf = ref<AdminUser | null>(null)
const purchases = ref<AdminPurchase[]>([])

// Правка цены товара: черновик отличается от item.price_kopecks,
// чтобы поле не дёргалось на каждый введённый символ.
const priceDraft = ref<Record<string, string>>({})

const filteredUsers = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return users.value
  return users.value.filter((u) =>
    [u.username, u.nickname, u.discord_username, u.id]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q))
  )
})

const ACTION_LABELS: Record<string, string> = {
  grant_pass: 'выдана проходка',
  revoke_pass: 'снята проходка',
  grant_item: 'выдан предмет',
  revoke_item: 'отозван предмет',
  set_item_price: 'изменена цена товара'
}

function actionText(action: string): string {
  return ACTION_LABELS[action] || action
}

/** Человекочитаемая дата: SQLite отдаёт «YYYY-MM-DD HH:MM:SS» без зоны. */
function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value.includes('T') ? value : value.replace(' ', 'T') + 'Z')
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString('ru-RU')
}

function flash(msg: string) {
  notice.value = msg
  problem.value = ''
  setTimeout(() => (notice.value = ''), 4000)
}

function fail(e: unknown) {
  problem.value = errorMessage(e)
  notice.value = ''
}

async function loadAll() {
  loading.value = true
  try {
    const [u, i, a] = await Promise.all([listUsers(), listShopItems(), listAudit(100)])
    users.value = u
    items.value = i
    audit.value = a
    syncPriceDraft()
  } catch (e) {
    fail(e)
  } finally {
    loading.value = false
  }
}

/** Показать цены в рублях, а не в копейках: 35000 → «350». */
function syncPriceDraft() {
  const draft: Record<string, string> = {}
  for (const i of items.value) {
    draft[i.id] = i.price_kopecks ? String(i.price_kopecks / 100) : '0'
  }
  priceDraft.value = draft
}

async function loadStats() {
  statsLoading.value = true
  try {
    const [s, f] = await Promise.all([
      paymentStats(statsDays.value),
      ordersFeed(statsDays.value, 50)
    ])
    stats.value = s
    feed.value = f
  } catch (e) {
    fail(e)
  } finally {
    statsLoading.value = false
  }
}

async function loadBuilds() {
  try {
    const b = await unwrap<typeof builds.value>(api.get('/admin/builds'))
    builds.value = b
  } catch (e) {
    fail(e)
  }
}

async function submitPrice(item: ShopItem) {
  const raw = priceDraft.value[item.id]
  // parseFloat('350,5') даёт NaN: в русской раскладке запятая — разделитель
  // дробной части. Без этой замены цена молча превращалась бы в 0 ₽.
  const rub = parseFloat(String(raw ?? '').replace(',', '.').replace(/\s/g, ''))
  if (!Number.isFinite(rub) || rub < 0) {
    problem.value = `Цена «${raw}» не похожа на число`
    return
  }
  busy.value = item.id
  try {
    await setItemPrice(item.id, rub)
    audit.value = await listAudit(100)
    flash(`Цена «${item.name}»: ${rub} ₽`)
  } catch (e) {
    fail(e)
  } finally {
    busy.value = ''
  }
}

function pickBuildFile(ev: Event) {
  buildFile.value = (ev.target as HTMLInputElement).files?.[0] ?? null
}

async function submitBuild() {
  if (!buildFile.value) {
    problem.value = 'Выберите ZIP сборки'
    return
  }
  if (!buildVersion.value.trim()) {
    problem.value = 'Укажите версию сборки'
    return
  }
  busy.value = 'build'
  try {
    const form = new FormData()
    form.append('file', buildFile.value)
    form.append('version', buildVersion.value.trim())
    form.append('changelog', buildChangelog.value.trim())
    await unwrap(api.post('/admin/builds', form))
    flash(`Сборка ${buildVersion.value.trim()} загружена`)
    buildFile.value = null
    buildVersion.value = ''
    buildChangelog.value = ''
    // Сброс и input: иначе после загрузки выбранный файл остался бы в
    // поле и повторная отправка ушла бы со старым ZIP.
    const input = document.getElementById('build-file') as HTMLInputElement | null
    if (input) input.value = ''
    await loadBuilds()
  } catch (e) {
    fail(e)
  } finally {
    busy.value = ''
  }
}

async function removeBuild(id: string) {
  busy.value = id
  try {
    await unwrap(api.delete(`/admin/builds/${encodeURIComponent(id)}`))
    await loadBuilds()
    flash('Сборка удалена')
  } catch (e) {
    fail(e)
  } finally {
    busy.value = ''
  }
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} Б`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} КБ`
  return `${(n / 1024 / 1024).toFixed(1)} МБ`
}

function rub(kopecks: number): string {
  return `${(kopecks / 100).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽`
}

/** Человекочитаемые статусы заказа: сырые коды Lava читаются только нами. */
const STATUS_LABELS: Record<string, string> = {
  new: 'счёт не выставлен',
  created: 'ожидает оплаты',
  success: 'оплачено',
  fail: 'отказ платёжного',
  expired: 'срок истёк',
  refund: 'возврат'
}

function statusText(s: string): string {
  return STATUS_LABELS[s] || s
}

/** Максимальный день в графике — для масштаба столбиков. */
const peak = computed(() =>
  Math.max(1, ...(stats.value?.daily ?? []).map((d) => d.revenue_kopecks))
)

async function togglePass(user: AdminUser) {
  busy.value = user.id
  try {
    const next = !user.has_pass
    await setPass(user.id, next, next ? 'выдано из админки' : 'снято из админки')
    user.has_pass = next
    user.pass_expires_at = null
    await listAudit(100).then((a) => (audit.value = a))
    flash(next ? `Проходка выдана: ${user.username}` : `Проходка снята: ${user.username}`)
  } catch (e) {
    fail(e)
  } finally {
    busy.value = ''
  }
}

function openGrant(user: AdminUser) {
  grantUser.value = user
  grantItemId.value = items.value[0]?.id || ''
  grantReason.value = ''
  problem.value = ''
}

async function submitGrant() {
  if (!grantUser.value || !grantItemId.value) return
  busy.value = 'grant'
  try {
    const res = await grantItem(grantUser.value.id, grantItemId.value, grantReason.value)
    audit.value = await listAudit(100)
    flash(`Выдано: ${res.item} → ${res.nickname}`)
    grantUser.value = null
  } catch (e) {
    fail(e)
  } finally {
    busy.value = ''
  }
}

async function openPurchases(user: AdminUser) {
  purchasesOf.value = user
  problem.value = ''
  try {
    purchases.value = await userPurchases(user.id)
  } catch (e) {
    fail(e)
  }
}

async function revoke(user: AdminUser, purchaseId: string) {
  busy.value = purchaseId
  try {
    await revokeItem(user.id, purchaseId, 'отозвано из админки')
    audit.value = await listAudit(100)
    flash('Предмет отозван')
    if (purchasesOf.value) purchases.value = await userPurchases(user.id)
  } catch (e) {
    fail(e)
  } finally {
    busy.value = ''
  }
}

/** Отозвать можно только то, что ещё не выдано: статус pending. */
function canRevoke(p: AdminPurchase): boolean {
  return p.status === 'pending'
}

// Кабинет автора промокода: всё, что ему положено видеть в админке.
const authorData = ref<AuthorStatsData | null>(null)
const authorError = ref('')

async function loadAuthor() {
  authorError.value = ''
  try {
    authorData.value = await myAuthorStats()
  } catch (e) {
    authorError.value = errorMessage(e, 'Не удалось загрузить статистику')
  }
}

onMounted(async () => {
  await auth.restore()
  if (auth.isAdmin) await loadAll()
  else if (await auth.checkAuthor()) await loadAuthor()
})

// Данные вкладок грузим при переходе, а не все сразу: статистика и список
// сборок нужны админу раз в день, а аккаунты — постоянно.
watch(tab, async (t) => {
  if (t === 'stats') await loadStats()
  if (t === 'builds') await loadBuilds()
})
</script>

<template>
  <div class="admin">
    <header class="bar">
      <h1><ShieldCheck :size="22" /> {{ !auth.isAdmin && auth.isAuthor ? 'Кабинет автора' : 'Админка' }}</h1>
      <div class="right">
        <span class="who">
          {{ auth.user?.username }}
          <em v-if="auth.user?.role">· {{ auth.user.role }}</em>
        </span>
        <button class="ghost" :disabled="loading" @click="loadAll">
          <RefreshCw :size="16" :class="{ spin: loading }" /> Обновить
        </button>
        <button class="ghost" @click="auth.logout()"><LogOut :size="16" /> Выйти</button>
      </div>
    </header>

    <!-- Автор промокода видит только свою статистику -->
    <section v-if="!auth.isAdmin && auth.isAuthor">
      <h2 class="author-title"><Ticket :size="18" /> Партнёрская программа</h2>
      <p class="muted">
        Игроки получают скидку по вашему коду, а вы — процент с каждой оплаченной проходки.
        Делитесь ссылкой из таблицы: код подставится в покупку сам.
      </p>
      <p v-if="authorError" class="err"><X :size="16" /> {{ authorError }}</p>
      <AuthorStats v-if="authorData" :stats="authorData" />
    </section>

    <p v-else-if="!auth.isAdmin" class="denied">
      Этот раздел доступен только администратору. Войдите через Discord-аккаунт с ролью admin.
    </p>

    <template v-else>
      <nav class="tabs">
        <button :class="{ on: tab === 'users' }" @click="tab = 'users'">
          <Users :size="16" /> Аккаунты
        </button>
        <button :class="{ on: tab === 'audit' }" @click="tab = 'audit'">
          <History :size="16" /> Журнал действий
        </button>
        <button :class="{ on: tab === 'stats' }" @click="tab = 'stats'">
          <CreditCard :size="16" /> Оплаты
        </button>
        <button :class="{ on: tab === 'builds' }" @click="tab = 'builds'">
          <Rocket :size="16" /> Сборки
        </button>
        <button :class="{ on: tab === 'promo' }" @click="tab = 'promo'">
          <Ticket :size="16" /> Промокоды
        </button>
      </nav>

      <p v-if="notice" class="ok"><Check :size="16" /> {{ notice }}</p>
      <p v-if="problem" class="err"><X :size="16" /> {{ problem }}</p>

      <!-- Аккаунты -->
      <section v-if="tab === 'users'">
        <div class="search">
          <Search :size="16" />
          <input v-model="search" placeholder="Поиск по нику, Discord или id" />
        </div>

        <p v-if="!loading && !filteredUsers.length" class="muted">Никого не найдено.</p>

        <table v-else>
          <thead>
            <tr>
              <th>Аккаунт</th>
              <th>Discord</th>
              <th>Ник в Minecraft</th>
              <th>Проходка</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in filteredUsers" :key="u.id">
              <td>
                <strong>{{ u.username }}</strong>
                <small>{{ u.id }}</small>
              </td>
              <td>
                <span v-if="u.discord_username">@{{ u.discord_username }}</span>
                <span v-else class="muted">не привязан</span>
              </td>
              <td>
                <span v-if="u.nickname">{{ u.nickname }}</span>
                <span v-else class="muted">—</span>
              </td>
              <td>
                <span :class="u.has_pass ? 'pass yes' : 'pass no'">
                  {{ u.has_pass ? 'бессрочная' : 'нет' }}
                </span>
              </td>
              <td class="acts">
                <button :disabled="busy === u.id" @click="togglePass(u)">
                  <Check v-if="!u.has_pass" :size="15" />
                  <X v-else :size="15" />
                  {{ u.has_pass ? 'Снять' : 'Выдать' }}
                </button>
                <button :disabled="!u.nickname" :title="u.nickname ? '' : 'Нет ника в Minecraft'" @click="openGrant(u)">
                  <Package :size="15" /> Выдать предмет
                </button>
                <button @click="openPurchases(u)"><History :size="15" /> Покупки</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Оплаты -->
      <section v-else-if="tab === 'stats'">
        <div class="stats-bar">
          <label>
            Период
            <select v-model.number="statsDays">
              <option :value="7">7 дней</option>
              <option :value="30">30 дней</option>
              <option :value="90">90 дней</option>
              <option :value="365">год</option>
            </select>
          </label>
          <button class="ghost" :disabled="statsLoading" @click="loadStats">
            <RefreshCw :size="16" :class="{ spin: statsLoading }" /> Обновить
          </button>
        </div>

        <!-- Предупреждение о режиме: пока FREE_PURCHASES=1, выручка в
             статистике всегда ноль, и легко сделать вывод, что Lava не
             работает. -->
        <p v-if="stats?.free_purchases_mode" class="warn">
          Включён FREE_PURCHASES: товары выдаются без оплаты, реальных платежей пока нет.
        </p>

        <div v-if="stats" class="cards">
          <div class="card">
            <span class="k">Выручка</span>
            <b>{{ rub(stats.summary.revenue_kopecks) }}</b>
          </div>
          <div class="card">
            <span class="k">Заказов</span>
            <b>{{ stats.summary.total_orders }}</b>
          </div>
          <div class="card">
            <span class="k">Оплачено</span>
            <b class="ok-text">{{ stats.summary.paid_orders }}</b>
          </div>
          <div class="card">
            <span class="k">Ждут оплаты</span>
            <b>{{ stats.summary.pending_orders }}</b>
          </div>
          <div class="card">
            <span class="k">Средний чек</span>
            <b>{{ stats.summary.avg_check.toLocaleString('ru-RU') }} ₽</b>
          </div>
          <div class="card">
            <span class="k">Конверсия</span>
            <b>{{ (stats.summary.conversion * 100).toFixed(1) }}%</b>
          </div>
          <div class="card">
            <span class="k">Не получено</span>
            <b class="err-text">{{ rub(stats.summary.lost_kopecks) }}</b>
          </div>
          <div class="card">
            <span class="k">Отказов / истекло</span>
            <b>{{ stats.summary.failed_orders }} / {{ stats.summary.expired_orders }}</b>
          </div>
        </div>

        <p v-if="statsLoading && !stats" class="muted">Считаем…</p>

        <!-- Выручка по дням -->
        <h3 v-if="stats?.daily.length">Выручка по дням</h3>
        <div v-if="stats?.daily.length" class="chart">
          <div v-for="d in stats.daily" :key="d.day" class="col">
            <div
              class="bar"
              :style="{ height: Math.max(2, (d.revenue_kopecks / peak) * 100) + '%' }"
              :title="`${d.day}: ${rub(d.revenue_kopecks)} за ${d.paid_orders} из ${d.orders}`"
            />
            <span class="day">{{ d.day.slice(8) }}</span>
          </div>
        </div>
        <p v-else-if="stats && !statsLoading" class="muted">За выбранный период платежей не было.</p>

        <!-- Расклад по товарам и статусам -->
        <div v-if="stats" class="split">
          <div>
            <h3>По товарам</h3>
            <p v-if="!stats.by_item.length" class="muted">Пусто.</p>
            <table v-else>
              <thead><tr><th>Товар</th><th>Заказов</th><th>Выручка</th></tr></thead>
              <tbody>
                <tr v-for="r in stats.by_item" :key="r.status">
                  <td>{{ r.status }}</td>
                  <td>{{ r.count }}</td>
                  <td>{{ rub(r.amount_kopecks) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <h3>По статусам</h3>
            <p v-if="!stats.by_status.length" class="muted">Пусто.</p>
            <table v-else>
              <thead><tr><th>Статус</th><th>Заказов</th><th>Сумма</th></tr></thead>
              <tbody>
                <tr v-for="r in stats.by_status" :key="r.status">
                  <td>{{ statusText(r.status) }}</td>
                  <td>{{ r.count }}</td>
                  <td>{{ rub(r.amount_kopecks) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Заказы -->
        <h3>Последние заказы</h3>
        <p v-if="!feed.orders.length" class="muted">Заказов нет.</p>
        <table v-else>
          <thead>
            <tr><th>Когда</th><th>Покупатель</th><th>Товар</th><th>Сумма</th><th>Статус</th></tr>
          </thead>
          <tbody>
            <tr v-for="o in feed.orders" :key="o.id">
              <td>{{ formatDate(o.created_at) }}</td>
              <td>{{ o.user }}</td>
              <td>{{ o.item_name }}</td>
              <td>{{ rub(o.amount_kopecks) }}</td>
              <td>
                <span :class="['st', o.status]">{{ statusText(o.status) }}</span>
                <small v-if="o.error_message" class="err-text">{{ o.error_message }}</small>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Сырые вебхуки: подпись проверяется, но тело сохраняется
             всегда — без этого «подпись не совпала» значило бы
             «данные потеряны». -->
        <h3>Вебхуки Lava</h3>
        <p v-if="!feed.webhooks.length" class="muted">Вебхуков не было.</p>
        <table v-else>
          <thead>
            <tr><th>Когда</th><th>Заказ</th><th>Статус</th><th>Подпись</th><th>Ошибка</th></tr>
          </thead>
          <tbody>
            <tr v-for="h in feed.webhooks" :key="h.id">
              <td>{{ formatDate(h.created_at) }}</td>
              <td><small>{{ h.order_id || h.invoice_id || '—' }}</small></td>
              <td>{{ h.status || '—' }}</td>
              <td>
                <span :class="h.signature_valid ? 'ok-text' : 'err-text'">
                  {{ h.signature_valid ? 'верна' : 'не совпала' }}
                </span>
              </td>
              <td><small class="err-text">{{ h.error || '—' }}</small></td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Сборки -->
      <section v-else-if="tab === 'promo'">
        <PromoAdmin :users="users" />
      </section>

      <section v-else-if="tab === 'builds'">
        <div class="box-inline">
          <h2>Загрузить сборку</h2>
          <p class="muted">
            Новая сборка становится активной сразу: игроки получат её вместо текущей.
            Файл проверяется на сервере, лаунчер скачивает по хешу.
          </p>
          <label>
            ZIP-файл сборки
            <input id="build-file" type="file" accept=".zip" @change="pickBuildFile" />
          </label>
          <label>
            Версия
            <input v-model="buildVersion" placeholder="например: 1.2.0" />
          </label>
          <label>
            Что изменилось <em>(попадёт в лаунчер)</em>
            <textarea v-model="buildChangelog" rows="3" />
          </label>
          <button :disabled="busy === 'build'" @click="submitBuild">
            <Upload :size="16" /> {{ busy === 'build' ? 'Заливаем…' : 'Загрузить' }}
          </button>
        </div>

        <h3>История сборок</h3>
        <p v-if="!builds.length" class="muted">
          Сборок пока нет. Лаунчер честно показывает «Сборки пока нет» — это не ошибка.
        </p>
        <table v-else>
          <thead>
            <tr><th>Версия</th><th>Размер</th><th>SHA-256</th><th>Когда</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="b in builds" :key="b.id">
              <td>
                <strong>{{ b.version }}</strong>
                <small v-if="b.changelog">{{ b.changelog }}</small>
              </td>
              <td>{{ formatBytes(b.file_size) }}</td>
              <td><small>{{ b.hash.slice(0, 16) }}…</small></td>
              <td>{{ formatDate(b.created_at) }}</td>
              <td class="acts">
                <button :disabled="busy === b.id" @click="removeBuild(b.id)">
                  <X :size="15" /> Удалить
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Журнал -->
      <section v-else>
        <p v-if="!audit.length" class="muted">Журнал пуст.</p>
        <ul v-else class="audit">
          <li v-for="a in audit" :key="a.id">
            <b>{{ actionText(a.action) }}</b>
            <span class="actor">{{ a.actor }}</span>
            <span v-if="a.details?.reason" class="reason">— «{{ a.details.reason }}»</span>
            <time>{{ formatDate(a.created_at) }}</time>
          </li>
        </ul>
      </section>

      <!-- Цены товаров: единственное, что влияет на реальные деньги. -->
      <section v-if="tab === 'users'" class="prices">
        <h3>Цены товаров</h3>
        <p class="muted">
          Цена в рублях — её и списывает Lava. Поле price в монетах на витрине
          для денег не используется.
        </p>
        <table>
          <thead>
            <tr><th>Товар</th><th>Рублей</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="i in items" :key="i.id">
              <td>{{ i.name }}</td>
              <td>
                <input
                  v-model="priceDraft[i.id]"
                  class="price-in"
                  inputmode="decimal"
                  placeholder="0"
                />
              </td>
              <td class="acts">
                <button :disabled="busy === i.id" @click="submitPrice(i)">
                  <Save :size="15" /> {{ busy === i.id ? 'Сохраняем…' : 'Сохранить' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>

    <!-- Выдача предмета -->
    <div v-if="grantUser" class="modal" @click.self="grantUser = null">
      <div class="box">
        <h2>Выдать предмет</h2>
        <p class="muted">Игрок: {{ grantUser.username }} ({{ grantUser.nickname }})</p>
        <label>
          Предмет
          <select v-model="grantItemId">
            <option v-for="i in items" :key="i.id" :value="i.id">{{ i.name }}</option>
          </select>
        </label>
        <label>
          Причина <em>(попадёт в журнал)</em>
          <input v-model="grantReason" placeholder="например: компенсация за баг" />
        </label>
        <div class="modal-acts">
          <button class="ghost" @click="grantUser = null">Отмена</button>
          <button :disabled="busy === 'grant'" @click="submitGrant">Выдать</button>
        </div>
      </div>
    </div>

    <!-- Покупки -->
    <div v-if="purchasesOf" class="modal" @click.self="purchasesOf = null">
      <div class="box">
        <h2>Покупки: {{ purchasesOf.username }}</h2>
        <p v-if="!purchases.length" class="muted">Покупок нет.</p>
        <table v-else>
          <thead>
            <tr><th>Предмет</th><th>Когда</th><th>Статус</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="p in purchases" :key="p.id">
              <td>{{ p.item_name }}</td>
              <td>{{ formatDate(p.created_at) }}</td>
              <td>{{ p.status || '—' }}</td>
              <td>
                <button v-if="canRevoke(p)" :disabled="busy === p.id" @click="revoke(purchasesOf!, p.id)">
                  Отозвать
                </button>
                <span v-else class="muted">выдано</span>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="modal-acts">
          <button class="ghost" @click="purchasesOf = null">Закрыть</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 20px 64px;
  color: var(--text, #e8eaed);
}
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.bar h1 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 22px;
  margin: 0;
}
.right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.who {
  font-size: 14px;
  opacity: 0.8;
}
.who em {
  font-style: normal;
  opacity: 0.6;
}
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.25);
}
.tabs button {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: inherit;
  opacity: 0.7;
}
.tabs button.on {
  opacity: 1;
  border-bottom-color: #6ea8fe;
}
.search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 14px;
  border: 1px solid rgba(128, 128, 128, 0.3);
  border-radius: 8px;
}
.search input {
  flex: 1;
  border: none;
  background: none;
  outline: none;
  color: inherit;
  font-size: 14px;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
th,
td {
  text-align: left;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.18);
  vertical-align: top;
}
th {
  opacity: 0.65;
  font-weight: 600;
}
td small {
  display: block;
  opacity: 0.45;
  font-size: 11px;
  word-break: break-all;
}
.acts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
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
.pass.yes {
  color: #7ee2a8;
}
.pass.no {
  opacity: 0.6;
}
.muted {
  opacity: 0.55;
}
.denied {
  padding: 16px;
  border: 1px solid rgba(255, 120, 120, 0.4);
  border-radius: 8px;
  background: rgba(255, 120, 120, 0.08);
}
.ok,
.err {
  display: flex;
  align-items: center;
  gap: 8px;
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
.stats-bar {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  margin-bottom: 16px;
}
.stats-bar label {
  font-size: 13px;
}
.stats-bar select {
  margin-top: 6px;
  padding: 7px 10px;
  border-radius: 6px;
  border: 1px solid rgba(128, 128, 128, 0.35);
  background: #0f1115;
  color: inherit;
}
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
  margin-bottom: 24px;
}
.card {
  padding: 12px 14px;
  border: 1px solid rgba(128, 128, 128, 0.22);
  border-radius: 10px;
  background: rgba(128, 128, 128, 0.06);
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
.ok-text {
  color: #7ee2a8;
}
.err-text {
  color: #ff9c9c;
}
.warn {
  padding: 10px 12px;
  border: 1px solid rgba(255, 190, 90, 0.4);
  background: rgba(255, 190, 90, 0.1);
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 16px;
}
.chart {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 130px;
  margin-bottom: 24px;
  overflow-x: auto;
}
.chart .col {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  min-width: 16px;
  height: 100%;
}
.chart .bar {
  width: 100%;
  background: #6ea8fe;
  border-radius: 2px 2px 0 0;
}
.chart .day {
  font-size: 9px;
  opacity: 0.45;
  margin-top: 4px;
  font-family: monospace;
}
.split {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}
h3 {
  font-size: 15px;
  margin: 20px 0 10px;
}
.st {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(128, 128, 128, 0.18);
}
.st.success {
  background: rgba(126, 226, 168, 0.2);
  color: #7ee2a8;
}
.st.fail,
.st.expired {
  background: rgba(255, 120, 120, 0.18);
  color: #ff9c9c;
}
.st.created {
  background: rgba(255, 190, 90, 0.18);
  color: #ffbe5a;
}
.box-inline {
  border: 1px solid rgba(128, 128, 128, 0.25);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
}
.box-inline h2 {
  margin: 0 0 6px;
  font-size: 17px;
}
.box-inline label {
  display: block;
  margin: 12px 0;
  font-size: 13px;
}
.box-inline label em {
  opacity: 0.5;
  font-style: normal;
}
.box-inline input,
.box-inline textarea {
  width: 100%;
  margin-top: 6px;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid rgba(128, 128, 128, 0.35);
  background: #0f1115;
  color: inherit;
  font-family: inherit;
}
.prices {
  margin-top: 32px;
}
.price-in {
  width: 110px;
  padding: 6px 9px;
  border-radius: 6px;
  border: 1px solid rgba(128, 128, 128, 0.35);
  background: #0f1115;
  color: inherit;
  font-family: monospace;
}
.audit {
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 14px;
}
.audit li {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: baseline;
  padding: 9px 0;
  border-bottom: 1px solid rgba(128, 128, 128, 0.15);
}
.audit .actor {
  opacity: 0.75;
}
.audit .reason {
  opacity: 0.6;
}
.audit time {
  margin-left: auto;
  opacity: 0.45;
  font-size: 12px;
}
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 50;
}
.box {
  background: #16181d;
  border: 1px solid rgba(128, 128, 128, 0.25);
  border-radius: 12px;
  padding: 20px;
  width: 100%;
  max-width: 520px;
  max-height: 85vh;
  overflow: auto;
}
.box h2 {
  margin: 0 0 6px;
  font-size: 18px;
}
.box label {
  display: block;
  margin: 14px 0;
  font-size: 13px;
}
.box label em {
  opacity: 0.5;
  font-style: normal;
}
.box select,
.box input {
  width: 100%;
  margin-top: 6px;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid rgba(128, 128, 128, 0.35);
  background: #0f1115;
  color: inherit;
}
.modal-acts {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 18px;
}
.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.author-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  margin: 0 0 6px;
}
</style>
