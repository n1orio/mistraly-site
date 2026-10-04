<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  Users,
  History,
  Package,
  RefreshCw,
  LogOut,
  ShieldCheck,
  Check,
  X,
  Search
} from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
import { errorMessage } from '../api/client'
import {
  grantItem,
  listAudit,
  listShopItems,
  listUsers,
  revokeItem,
  setPass,
  userPurchases,
  type AdminPurchase,
  type AdminUser,
  type AuditEntry,
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

type Tab = 'users' | 'audit'
const tab = ref<Tab>('users')

const users = ref<AdminUser[]>([])
const items = ref<ShopItem[]>([])
const audit = ref<AuditEntry[]>([])
const search = ref('')

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
  revoke_item: 'отозван предмет'
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
  } catch (e) {
    fail(e)
  } finally {
    loading.value = false
  }
}

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

onMounted(async () => {
  await auth.restore()
  if (auth.isAdmin) await loadAll()
})
</script>

<template>
  <div class="admin">
    <header class="bar">
      <h1><ShieldCheck :size="22" /> Админка</h1>
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

    <p v-if="!auth.isAdmin" class="denied">
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
</style>
