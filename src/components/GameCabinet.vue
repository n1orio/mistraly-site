<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { api, errorMessage, unwrap } from '../api/client'
import { THEMES, iconUrl } from '../lib/nameThemes'

/**
 * Личный кабинет и настройки из игры: те же вкладки, карточки тем и подписи.
 * Цвета тем взяты из NameTheme в моде. Сохраняет и проверяет права сервер.
 */
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

const props = defineProps<{ name: string }>()


const STATS = [
  ['PLAY_TIME', 'Время в игре'],
  ['DEATHS', 'Смертей'],
  ['MAX_BALANCE', 'Макс. баланс'],
  ['ORES_MINED', 'Добыто руды'],
  ['BLOCKS_BROKEN', 'Сломано блоков'],
  ['PLAYER_KILLS', 'Убито игроков'],
  ['MOB_KILLS', 'Убито мобов'],
]

const SETTINGS: Record<string, { note: string; rows: string[][] }> = {
  Банк: {
    note: 'Штрафы, предупреждения и ответы банка на ваши действия приходят всегда.',
    rows: [
      ['bank_transfers', 'Входящие переводы', 'Кто и сколько перевёл, с комментарием'],
      ['bank_sales', 'Продажи в магазинах', 'Кто, что и за сколько купил в ваших магазинах'],
      ['bank_fines_in', 'Оплата штрафов в вашу пользу', 'Когда игрок оплатил штраф, деньги которого идут вам'],
      ['bank_reminders', 'Напоминание о штрафах при входе', 'Сколько у вас неоплаченных штрафов'],
      ['bank_co_owners', 'Приглашения в совладельцы', 'Могут ли вас приглашать на чужие счета'],
    ],
  },
  Чат: {
    note: 'Сообщение без знака слышат игроки в радиусе 250 блоков. Начните сообщение с !, чтобы написать всему серверу.',
    rows: [
      ['chat_local', 'Локальный чат', 'Сообщения игроков рядом с вами'],
      ['chat_global', 'Глобальный чат', 'Сообщения со знаком ! для всего сервера'],
      ['deaths', 'Сообщения о смерти', 'Как погибли другие игроки (о своей смерти — всегда)'],
      ['join_leave', 'Вход и выход с сервера', '«Ник +» при входе и «Ник -» при выходе'],
      ['advancements', 'Достижения игроков', 'Кто и какое достижение получил'],
    ],
  },
  Сообщения: {
    note: 'Блокировать отдельных игроков можно в настройках в игре.',
    rows: [['msg', 'Личные сообщения (/msg)', 'Выключите, чтобы никто не мог вам написать в /msg']],
  },
}

const prefs = ref<Prefs | null>(null)
const currentTheme = ref('DEFAULT')
const pending = ref(false)
const empty = ref('')
const error = ref('')
const cabinetTab = ref<'theme' | 'profile'>('theme')
const settingsTab = ref('Банк')

async function load() {
  try {
    const res = await unwrap<{ prefs: Prefs; pending: boolean; data: { theme: string } }>(api.get('/user/game-profile'))
    prefs.value = res.prefs
    pending.value = res.pending
    currentTheme.value = res.prefs.theme || res.data.theme
  } catch (e) {
    empty.value = errorMessage(e, 'Кабинет сейчас недоступен')
  }
}
onMounted(load)

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

function toggle<T>(list: T[], value: T) {
  const i = list.indexOf(value)
  if (i >= 0) list.splice(i, 1)
  else list.push(value)
  save()
}
function section(key: 'show_accounts' | 'show_shops') {
  if (prefs.value) prefs.value[key] = !prefs.value[key]
  save()
}
const locked = (id: string) => !prefs.value?.themes.includes(id)
function pickTheme(id: string) {
  if (!prefs.value || locked(id)) return
  prefs.value.theme = id
  currentTheme.value = id
  save()
}
const rows = computed(() => SETTINGS[settingsTab.value])
</script>

<template>
  <section class="mc-panel p-5">
    <p v-if="empty" class="gc-note">{{ empty }}</p>
    <template v-else-if="prefs">
      <h2 class="gc-title">Личный кабинет</h2>
      <nav class="gc-tabs">
        <button type="button" :class="{ 'is-on': cabinetTab === 'theme' }" @click="cabinetTab = 'theme'">Тема ника</button>
        <button type="button" :class="{ 'is-on': cabinetTab === 'profile' }" @click="cabinetTab = 'profile'">Профиль</button>
      </nav>

      <div v-if="cabinetTab === 'theme'" class="gc-themes">
        <button
          v-for="t in THEMES"
          :key="t.id"
          type="button"
          class="gc-theme"
          :class="{ 'is-on': currentTheme === t.id, 'is-locked': locked(t.id) }"
          :style="{ background: t.bg, borderColor: currentTheme === t.id ? t.accent : t.border, '--line': t.accent }"
          :disabled="locked(t.id)"
          @click="pickTheme(t.id)"
        >
          <span class="gc-theme-head" :style="{ background: `linear-gradient(${t.top}, ${t.bottom})`, color: t.name }">{{ t.label }}</span>
          <span class="gc-theme-name" :style="{ color: t.name }">
            <img :src="iconUrl(t)" alt="" />{{ props.name }}
          </span>
          <span class="gc-slots">
            <i v-for="n in 6" :key="n" :style="{ background: t.card, borderColor: t.line }"></i>
          </span>
          <span class="gc-state" :class="{ 'is-lock': locked(t.id), 'is-sel': currentTheme === t.id }">
            {{ locked(t.id) ? t.lock : currentTheme === t.id ? 'выбрана' : 'выбрать' }}
          </span>
        </button>
      </div>

      <div v-else>
        <p class="gc-note">Что видят другие, когда открывают ваш профиль (Shift+ПКМ по вам). Скрытое просто не показывается.</p>
        <h3 class="gc-h">Разделы</h3>
        <button type="button" class="gc-row" @click="section('show_accounts')"><span>Счета</span><i :class="{ on: prefs.show_accounts }"></i></button>
        <button type="button" class="gc-row" @click="section('show_shops')"><span>Магазины</span><i :class="{ on: prefs.show_shops }"></i></button>
        <h3 class="gc-h">Статистика</h3>
        <button v-for="s in STATS" :key="s[0]" type="button" class="gc-row" @click="toggle(prefs!.hidden_stats, s[0])">
          <span>{{ s[1] }}</span><i :class="{ on: !prefs.hidden_stats.includes(s[0]) }"></i>
        </button>
        <template v-if="prefs.accounts.length && prefs.show_accounts">
          <h3 class="gc-h">Мои счета</h3>
          <button v-for="a in prefs.accounts" :key="a.id" type="button" class="gc-row" @click="toggle(prefs!.hidden_accounts, a.id)">
            <span>{{ a.name }}</span><i :class="{ on: !prefs.hidden_accounts.includes(a.id) }"></i>
          </button>
        </template>
        <template v-if="prefs.shops.length && prefs.show_shops">
          <h3 class="gc-h">Мои магазины</h3>
          <button v-for="s in prefs.shops" :key="s.id" type="button" class="gc-row" @click="toggle(prefs!.hidden_shops, s.id)">
            <span>#{{ s.id }} {{ s.name || 'Без товара' }}</span><i :class="{ on: !prefs.hidden_shops.includes(s.id) }"></i>
          </button>
        </template>
      </div>

      <h2 class="gc-title gc-title--next">Настройки</h2>
      <nav class="gc-tabs">
        <button v-for="(_, t) in SETTINGS" :key="t" type="button" :class="{ 'is-on': settingsTab === t }" @click="settingsTab = t">{{ t }}</button>
      </nav>
      <button v-for="r in rows.rows" :key="r[0]" type="button" class="gc-row gc-row--tall" @click="toggle(prefs!.off, r[0])">
        <span><b>{{ r[1] }}</b><small>{{ r[2] }}</small></span>
        <i :class="{ on: !prefs.off.includes(r[0]) }"></i>
      </button>
      <p class="gc-note gc-note--end">{{ rows.note }}</p>

      <p v-if="pending" class="gc-note">Сервер применит изменения в течение минуты.</p>
      <p v-if="error" class="text-[var(--bad)]">{{ error }}</p>
    </template>
  </section>
</template>

<style scoped>
.gc-title {
  margin: 0 0 8px;
  font-size: 24px;
}
.gc-title--next {
  margin-top: 22px;
}
.gc-tabs {
  display: flex;
  gap: 2px;
  margin-bottom: 12px;
}
.gc-tabs button {
  flex: 1;
  padding: 8px 10px;
  background: #1e1e1f;
  border: 0;
  color: var(--text-muted);
  font: inherit;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
}
.gc-tabs button.is-on {
  background: var(--blue);
  color: #fff;
}
.gc-themes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.gc-theme {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 0 0 22px;
  border: 2px solid;
  color: #fff;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.gc-theme.is-on {
  box-shadow: 0 0 0 2px var(--line);
}
.gc-theme.is-locked {
  cursor: not-allowed;
  opacity: 0.6;
}
.gc-theme-head {
  padding: 4px 8px;
  border-bottom: 2px solid var(--line);
  font-weight: 700;
  font-size: 14px;
}
.gc-theme-name {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 8px 6px;
  overflow: hidden;
  font-weight: 700;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.gc-theme-name img {
  width: 16px;
  height: 16px;
  image-rendering: pixelated;
}
.gc-slots {
  display: flex;
  gap: 2px;
  padding: 0 8px;
}
.gc-slots i {
  width: 18px;
  height: 18px;
  border: 2px solid;
}
.gc-state {
  position: absolute;
  right: 8px;
  bottom: 4px;
  color: var(--text-muted);
  font-size: 13px;
}
.gc-state.is-sel {
  color: var(--ok);
}
.gc-state.is-lock {
  color: var(--bad);
}
.gc-note {
  margin: 0 0 8px;
  color: var(--text-muted);
  font-size: 14px;
}
.gc-note--end {
  margin-top: 8px;
}
.gc-h {
  margin: 12px 0 4px;
  font-family: 'Noto Sans', sans-serif;
  font-weight: 700;
  font-size: 14px;
  color: var(--sky);
}
.gc-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  margin-bottom: 2px;
  padding: 6px 10px;
  background: var(--well);
  border: 0;
  color: var(--text-main);
  font: inherit;
  font-size: 15px;
  text-align: left;
  cursor: pointer;
}
.gc-row:hover {
  background: var(--panel-hi);
}
.gc-row small {
  display: block;
  color: var(--text-sub);
  font-size: 13px;
}
/* Переключатель как в игре: квадратный ползунок. */
.gc-row i {
  position: relative;
  flex: none;
  width: 32px;
  height: 16px;
  background: var(--head-c);
  border: 2px solid #464747;
}
.gc-row i::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 12px;
  height: 12px;
  background: #81868f;
}
.gc-row i.on {
  background: var(--blue-lo);
  border-color: var(--blue);
}
.gc-row i.on::after {
  left: auto;
  right: 0;
  background: #fff;
}
</style>
