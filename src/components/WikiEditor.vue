<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import WikiArticle from './WikiArticle.vue'
import { Check, Search, X } from '../lib/icons'
import { api, errorMessage, unwrap } from '../api/client'
import { useAuthStore } from '../stores/auth'
import { allAssets, allItems, cats, loadPages, pages, recipeIds, type WikiPage } from '../stores/wiki'

/** Редактор статьи: панель кнопок, просмотр, подсказка @ника. Правка уходит на проверку. */
const props = defineProps<{ page: WikiPage | null }>()

const router = useRouter()
const auth = useAuthStore()

const creating = computed(() => !props.page)
const slug = ref(props.page?.slug ?? '')
const title = ref(props.page?.title ?? '')
const cat = ref(props.page?.cat ?? cats[0].name)
const source = ref(props.page?.source ?? '')
const summary = ref('')
const view = ref<'edit' | 'preview'>('edit')
const box = ref<HTMLTextAreaElement | null>(null)
const error = ref('')
const sending = ref(false)
const done = ref<'pending' | 'approved' | ''>('')

const DRAFT = computed(() => `wiki_draft_${props.page?.slug ?? 'new'}`)
onMounted(() => {
  try {
    const saved = localStorage.getItem(DRAFT.value)
    if (saved) {
      const d = JSON.parse(saved)
      if (d.source && d.source !== props.page?.source) {
        title.value = d.title ?? title.value
        cat.value = d.cat ?? cat.value
        source.value = d.source
        slug.value = d.slug ?? slug.value
        restored.value = true
      }
    }
  } catch {
    /* черновик необязателен */
  }
})
const restored = ref(false)
watch([title, cat, source, slug], () => {
  try {
    localStorage.setItem(DRAFT.value, JSON.stringify({ title: title.value, cat: cat.value, source: source.value, slug: slug.value }))
  } catch {
    /* хранилище недоступно: просто без черновика */
  }
})
function dropDraft() {
  try {
    localStorage.removeItem(DRAFT.value)
  } catch {
    /* см. выше */
  }
}
function discard() {
  dropDraft()
  restored.value = false
  title.value = props.page?.title ?? ''
  cat.value = props.page?.cat ?? cats[0].name
  source.value = props.page?.source ?? ''
}

const TRANSLIT: Record<string, string> = { а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'c',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya' }
watch(title, (t) => {
  if (!creating.value) return
  slug.value = t
    .toLowerCase()
    .split('')
    .map((c) => TRANSLIT[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
})

const preview = computed<WikiPage>(() => ({
  slug: slug.value || 'new',
  title: title.value || 'Без названия',
  cat: cat.value,
  source: source.value,
  rev: props.page?.rev ?? null,
  updated: null,
  authors: [],
}))
const taken = computed(() => creating.value && pages.value.some((p) => p.slug === slug.value))

function wrap(before: string, after = before, placeholder = 'текст') {
  const el = box.value
  if (!el) return
  const { selectionStart: a, selectionEnd: b, value } = el
  const inner = value.slice(a, b) || placeholder
  source.value = value.slice(0, a) + before + inner + after + value.slice(b)
  nextTick(() => {
    el.focus()
    el.setSelectionRange(a + before.length, a + before.length + inner.length)
  })
}

/** Вставка с новой строки: заголовки, списки и блоки работают только в её начале. */
function line(text: string) {
  const el = box.value
  if (!el) return
  const a = el.selectionStart
  const v = el.value
  const prefix = a === 0 || v[a - 1] === '\n' ? '' : '\n'
  source.value = v.slice(0, a) + prefix + text + '\n' + v.slice(a)
  const pos = a + prefix.length + text.length
  nextTick(() => {
    el.focus()
    el.setSelectionRange(pos, pos)
  })
}

const picker = ref<'' | 'item' | 'recipe' | 'asset'>('')
const pickQuery = ref('')
const picked = computed(() => {
  const q = pickQuery.value.trim().toLowerCase()
  const list = picker.value === 'recipe' ? allItems.filter((i) => recipeIds.includes(i.id)) : allItems
  return list.filter((i) => !q || i.name.toLowerCase().includes(q) || i.id.includes(q)).slice(0, 10)
})
const pickedAssets = computed(() => {
  const q = pickQuery.value.trim().toLowerCase()
  return allAssets.filter((a) => !q || a.id.includes(q)).slice(0, 24)
})
function pickAsset(id: string) {
  line(`<asset/${id}>`)
  picker.value = ''
  pickQuery.value = ''
}

const uploading = ref(false)
async function upload(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  error.value = ''
  uploading.value = true
  try {
    const res = await unwrap<{ id: string }>(api.post('/wiki/uploads', file, { headers: { 'Content-Type': 'application/octet-stream' } }))
    line(`<image/up/${res.id}/Подпись>`)
  } catch (err) {
    error.value = errorMessage(err, 'Не удалось загрузить картинку')
  } finally {
    uploading.value = false
  }
}

function pick(id: string) {
  if (picker.value === 'item') wrap('', '', `<item/${id}>`)
  else line(`<recipes/${id}>`)
  picker.value = ''
  pickQuery.value = ''
}

// Подсказка @ника: ищем слово с @ прямо перед кареткой.
const nickHits = ref<string[]>([])
const nickIndex = ref(0)
let nickTimer = 0
let nickStart = -1
function onInput() {
  const el = box.value
  if (!el) return
  const m = /(?:^|[\s(])@([\wа-яёА-ЯЁ]{1,16})$/.exec(el.value.slice(0, el.selectionStart))
  clearTimeout(nickTimer)
  if (!m) {
    nickHits.value = []
    return
  }
  nickStart = el.selectionStart - m[1].length
  nickTimer = window.setTimeout(async () => {
    try {
      nickHits.value = await unwrap<string[]>(api.get('/wiki/players', { params: { q: m[1] } }))
      nickIndex.value = 0
    } catch {
      nickHits.value = []
    }
  }, 150)
}
function chooseNick(nick: string) {
  const el = box.value
  if (!el) return
  const end = el.selectionStart
  source.value = el.value.slice(0, nickStart) + nick + ' ' + el.value.slice(end)
  nickHits.value = []
  const pos = nickStart + nick.length + 1
  nextTick(() => {
    el.focus()
    el.setSelectionRange(pos, pos)
  })
}
function onKey(e: KeyboardEvent) {
  if (!nickHits.value.length) return
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    const n = nickHits.value.length
    nickIndex.value = (nickIndex.value + (e.key === 'ArrowDown' ? 1 : n - 1)) % n
  } else if (e.key === 'Enter' || e.key === 'Tab') {
    e.preventDefault()
    chooseNick(nickHits.value[nickIndex.value])
  } else if (e.key === 'Escape') {
    nickHits.value = []
  }
}

async function send() {
  error.value = ''
  sending.value = true
  try {
    const res = await unwrap<{ status: 'pending' | 'approved' }>(
      api.post('/wiki/edits', {
        slug: slug.value,
        title: title.value,
        cat: cat.value,
        source: source.value,
        summary: summary.value,
        base_rev: props.page?.rev ?? null,
      })
    )
    dropDraft()
    done.value = res.status
    if (res.status === 'approved') {
      await loadPages(true)
      router.push(`/wiki/${slug.value}`)
    }
  } catch (e) {
    error.value = errorMessage(e, 'Не удалось отправить правку')
  } finally {
    sending.value = false
  }
}

function login() {
  router.push({ path: '/auth/discord', query: { redirect: router.currentRoute.value.fullPath } })
}
</script>

<template>
  <div class="wiki-sheet">
    <h1 class="wiki-title">{{ creating ? 'Новая статья' : `Правка: ${page?.title}` }}</h1>

    <div v-if="!auth.isAuthenticated" class="art-note">
      <p>Чтобы предложить правку, войдите на сайт.</p>
      <button class="mc-btn mc-btn--discord mc-btn--sm" @click="login">Войти через Discord</button>
    </div>

    <div v-else-if="done === 'pending'" class="art-note art-note--ok">
      <p><Check :size="24" /> Правка отправлена на проверку. Статус виден в разделе <router-link to="/wiki/my">Мои правки</router-link>.</p>
      <router-link :to="page ? `/wiki/${page.slug}` : '/wiki'" class="mc-btn mc-btn--muted mc-btn--sm">Вернуться</router-link>
    </div>

    <template v-else>
      <p class="edit-help">
        Правка появится на сайте после проверки администрацией.
        <router-link to="/wiki/formatting">Как пользоваться разметкой</router-link>
      </p>
      <p v-if="restored" class="art-note">
        Восстановлен несохранённый черновик.
        <button type="button" class="edit-link" @click="discard">Отбросить</button>
      </p>

      <div class="edit-fields">
        <label>
          Название
          <input v-model="title" class="mc-input" maxlength="80" />
        </label>
        <label>
          Категория
          <select v-model="cat" class="mc-input">
            <option v-for="c in cats" :key="c.name">{{ c.name }}</option>
          </select>
        </label>
        <label v-if="creating">
          Адрес: /wiki/
          <input v-model="slug" class="mc-input" maxlength="64" spellcheck="false" />
          <small v-if="taken" class="edit-bad">Такая статья уже есть</small>
        </label>
      </div>

      <div class="edit-tabs" role="tablist">
        <button type="button" :class="{ 'is-on': view === 'edit' }" @click="view = 'edit'">Текст</button>
        <button type="button" :class="{ 'is-on': view === 'preview' }" @click="view = 'preview'">Просмотр</button>
      </div>

      <template v-if="view === 'edit'">
        <div class="edit-bar">
          <button type="button" title="Жирный" @click="wrap('**')"><b>Ж</b></button>
          <button type="button" title="Курсив" @click="wrap('*')"><i>К</i></button>
          <button type="button" title="Акцент" @click="wrap('==')">Акцент</button>
          <button type="button" title="Код" @click="wrap('`')">Код</button>
          <span />
          <button type="button" @click="line('# Заголовок')">H2</button>
          <button type="button" @click="line('## Подзаголовок')">H3</button>
          <button type="button" @click="line('- Пункт')">Список</button>
          <button type="button" @click="line('1. Пункт')">1. Список</button>
          <button type="button" @click="line('> Текст карточки')">Карточка</button>
          <button type="button" @click="line('| Шапка | Шапка |\n| Ячейка | Ячейка |')">Таблица</button>
          <span />
          <button type="button" @click="wrap('[', '](/wiki/адрес)', 'название')">Ссылка</button>
          <button type="button" @click="wrap('@', '', 'ник')">@Игрок</button>
          <button type="button" :class="{ 'is-on': picker === 'item' }" @click="picker = picker === 'item' ? '' : 'item'">Предмет</button>
          <button type="button" :class="{ 'is-on': picker === 'recipe' }" @click="picker = picker === 'recipe' ? '' : 'recipe'">Рецепт</button>
          <button type="button" :class="{ 'is-on': picker === 'asset' }" @click="picker = picker === 'asset' ? '' : 'asset'">Текстура мода</button>
          <label class="edit-upload">
            {{ uploading ? 'Загрузка…' : 'Картинка' }}
            <input type="file" accept="image/png,image/jpeg,image/webp" hidden :disabled="uploading" @change="upload" />
          </label>
        </div>

        <div v-if="picker" class="edit-picker">
          <label class="edit-pick-search">
            <Search :size="24" />
            <input v-model="pickQuery" placeholder="Название предмета" />
            <button type="button" aria-label="Закрыть" @click="picker = ''"><X :size="24" /></button>
          </label>
          <template v-if="picker === 'asset'">
            <button v-for="a in pickedAssets" :key="a.id" type="button" class="edit-pick" @click="pickAsset(a.id)">
              <img :src="`/images/wiki/assets/${a.id}.png`" alt="" />
              {{ a.id }}
            </button>
          </template>
          <template v-else>
            <button v-for="it in picked" :key="it.id" type="button" class="edit-pick" @click="pick(it.id)">
              <img v-if="it.icon" :src="it.icon" alt="" />
              {{ it.name }}
            </button>
          </template>
        </div>

        <div class="edit-box">
          <textarea
            ref="box"
            v-model="source"
            class="mc-input edit-text"
            spellcheck="true"
            aria-label="Текст статьи"
            @input="onInput"
            @keydown="onKey"
          ></textarea>
          <div v-if="nickHits.length" class="edit-nicks">
            <button
              v-for="(n, i) in nickHits"
              :key="n"
              type="button"
              :class="{ 'is-on': i === nickIndex }"
              @mousedown.prevent="chooseNick(n)"
            >
              @{{ n }}
            </button>
          </div>
        </div>
      </template>
      <div v-else class="edit-preview"><WikiArticle :page="preview" /></div>

      <label class="edit-summary">
        Что изменено
        <input v-model="summary" class="mc-input" maxlength="200" placeholder="Коротко для проверяющего" />
      </label>
      <p v-if="error" class="edit-bad">{{ error }}</p>
      <div class="edit-actions">
        <button class="mc-btn" :disabled="sending || taken || !source.trim() || !title.trim() || !slug" @click="send">
          {{ sending ? 'Отправляем…' : auth.user?.role === 'admin' ? 'Опубликовать' : 'Отправить на проверку' }}
        </button>
        <router-link :to="page ? `/wiki/${page.slug}` : '/wiki'" class="mc-btn mc-btn--muted">Отмена</router-link>
      </div>
    </template>
  </div>
</template>
