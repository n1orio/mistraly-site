<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { api, errorMessage, unwrap } from '../api/client'

/** Те же настройки, что в игре: «Настройки» и «Личный кабинет». Применяет их сервер. */
type Prefs = {
  off: string[]
  theme?: string | null
  show_accounts: boolean
  show_shops: boolean
  hidden_stats: string[]
  hidden_accounts: number[]
  hidden_shops: number[]
  themes: string[]
  accounts: { id: number; name: string }[]
  shops: { id: number; name: string }[]
}

const GROUPS = [
  {
    title: 'Банк',
    rows: [
      ['bank_transfers', 'Входящие переводы', 'Кто и сколько перевёл, с комментарием'],
      ['bank_sales', 'Продажи в магазинах', 'Кто, что и за сколько купил в ваших магазинах'],
      ['bank_fines_in', 'Оплата штрафов в вашу пользу', 'Когда игрок оплатил штраф, деньги которого идут вам'],
      ['bank_reminders', 'Напоминание о штрафах при входе', 'Сколько у вас неоплаченных штрафов'],
      ['bank_co_owners', 'Приглашения в совладельцы', 'Могут ли вас приглашать на чужие счета'],
    ],
  },
  {
    title: 'Чат',
    rows: [
      ['chat_local', 'Локальный чат', 'Сообщения игроков рядом с вами'],
      ['chat_global', 'Глобальный чат', 'Сообщения со знаком ! для всего сервера'],
      ['deaths', 'Сообщения о смерти', 'Как погибли другие игроки'],
      ['join_leave', 'Вход и выход с сервера', '«Ник +» при входе и «Ник -» при выходе'],
      ['advancements', 'Чужие достижения', 'Сообщения о достижениях других игроков'],
    ],
  },
  { title: 'Сообщения', rows: [['msg', 'Личные сообщения (/msg)', 'Выключите, чтобы никто не мог вам написать']] },
]
const STATS = [
  ['PLAY_TIME', 'Время в игре'],
  ['DEATHS', 'Смертей'],
  ['MAX_BALANCE', 'Макс. баланс'],
  ['ORES_MINED', 'Добыто руды'],
  ['BLOCKS_BROKEN', 'Сломано блоков'],
  ['PLAYER_KILLS', 'Убито игроков'],
  ['MOB_KILLS', 'Убито мобов'],
]
const THEMES: Record<string, string> = { DEFAULT: 'Обычная', PLUS: 'Plus', ADMIN: 'Админ', GLITCH: 'Глитч' }

const prefs = ref<Prefs | null>(null)
const pending = ref(false)
const empty = ref('')
const error = ref('')

async function load() {
  try {
    const res = await unwrap<{ prefs: Prefs; pending: boolean }>(api.get('/user/game-profile'))
    prefs.value = res.prefs
    pending.value = res.pending
  } catch (e) {
    empty.value = errorMessage(e, 'Настройки сейчас недоступны')
  }
}
onMounted(load)

const hiddenSets = computed(() => prefs.value)

async function save() {
  const p = prefs.value
  if (!p) return
  error.value = ''
  try {
    await unwrap(
      api.put('/user/game-profile', {
        off: p.off,
        theme: p.theme ?? null,
        show_accounts: p.show_accounts,
        show_shops: p.show_shops,
        hidden_stats: p.hidden_stats,
        hidden_accounts: p.hidden_accounts,
        hidden_shops: p.hidden_shops,
      })
    )
    pending.value = true
  } catch (e) {
    error.value = errorMessage(e, 'Не удалось сохранить')
  }
}

function toggle<T>(list: T[], value: T, on: boolean) {
  const i = list.indexOf(value)
  if (on && i >= 0) list.splice(i, 1)
  else if (!on && i < 0) list.push(value)
  save()
}
function setTheme(t: string) {
  if (prefs.value) prefs.value.theme = t
  save()
}
function setSection(key: 'show_accounts' | 'show_shops', on: boolean) {
  if (prefs.value) prefs.value[key] = on
  save()
}
</script>

<template>
  <section class="mc-panel p-6">
    <h2 class="gs-title">Настройки на сервере</h2>
    <p v-if="empty" class="gs-note">{{ empty }}</p>
    <template v-else-if="hiddenSets">
      <p class="gs-note">
        Те же настройки, что в игре.
        <span v-if="pending">Сервер применит изменения в течение минуты.</span>
      </p>
      <p v-if="error" class="text-[var(--bad)]">{{ error }}</p>

      <div v-for="g in GROUPS" :key="g.title" class="gs-group">
        <h3 class="gs-h">{{ g.title }}</h3>
        <label v-for="r in g.rows" :key="r[0]" class="gs-row">
          <input type="checkbox" :checked="!hiddenSets.off.includes(r[0])" @change="toggle(hiddenSets!.off, r[0], ($event.target as HTMLInputElement).checked)" />
          <span><b>{{ r[1] }}</b><small>{{ r[2] }}</small></span>
        </label>
      </div>

      <div class="gs-group">
        <h3 class="gs-h">Тема ника</h3>
        <div class="gs-themes">
          <button
            v-for="t in hiddenSets.themes"
            :key="t"
            type="button"
            class="mc-btn mc-btn--sm"
            :class="{ 'mc-btn--muted': hiddenSets.theme !== t }"
            @click="setTheme(t)"
          >
            {{ THEMES[t] ?? t }}
          </button>
        </div>
      </div>

      <div class="gs-group">
        <h3 class="gs-h">Что видят другие в профиле</h3>
        <label class="gs-row">
          <input type="checkbox" :checked="hiddenSets.show_accounts" @change="setSection('show_accounts', ($event.target as HTMLInputElement).checked)" />
          <span><b>Счета</b></span>
        </label>
        <label class="gs-row">
          <input type="checkbox" :checked="hiddenSets.show_shops" @change="setSection('show_shops', ($event.target as HTMLInputElement).checked)" />
          <span><b>Магазины</b></span>
        </label>
        <label v-for="s in STATS" :key="s[0]" class="gs-row">
          <input type="checkbox" :checked="!hiddenSets.hidden_stats.includes(s[0])" @change="toggle(hiddenSets!.hidden_stats, s[0], ($event.target as HTMLInputElement).checked)" />
          <span><b>{{ s[1] }}</b></span>
        </label>
        <label v-for="a in hiddenSets.accounts" :key="`a${a.id}`" class="gs-row">
          <input type="checkbox" :checked="!hiddenSets.hidden_accounts.includes(a.id)" @change="toggle(hiddenSets!.hidden_accounts, a.id, ($event.target as HTMLInputElement).checked)" />
          <span><b>Счёт «{{ a.name }}»</b></span>
        </label>
        <label v-for="s in hiddenSets.shops" :key="`s${s.id}`" class="gs-row">
          <input type="checkbox" :checked="!hiddenSets.hidden_shops.includes(s.id)" @change="toggle(hiddenSets!.hidden_shops, s.id, ($event.target as HTMLInputElement).checked)" />
          <span><b>Магазин #{{ s.id }}{{ s.name ? ` · ${s.name}` : '' }}</b></span>
        </label>
      </div>
    </template>
  </section>
</template>

<style scoped>
.gs-title {
  margin: 0 0 6px;
  font-size: 24px;
}
.gs-note {
  margin: 0 0 12px;
  color: var(--text-muted);
  font-size: 15px;
}
.gs-group {
  margin-top: 14px;
}
.gs-h {
  margin: 0 0 6px;
  font-family: 'Noto Sans', sans-serif;
  font-weight: 700;
  font-size: 15px;
}
.gs-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 5px 0;
  cursor: pointer;
}
.gs-row input {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  accent-color: var(--blue);
}
.gs-row small {
  display: block;
  color: var(--text-sub);
  font-size: 13px;
}
.gs-themes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
