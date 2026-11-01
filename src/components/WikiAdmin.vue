<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import WikiArticle from './WikiArticle.vue'
import { api, errorMessage, unwrap } from '../api/client'
import { diffLines } from '../lib/wikiMarkup'
import { baseSource, loadPages, pages, type RevisionFull, type WikiPage } from '../stores/wiki'

/** Очередь правок вики: сравнение с текущей статьёй, просмотр, решение. */
const queue = ref<RevisionFull[]>([])
const selected = ref<RevisionFull | null>(null)
const comment = ref('')
const error = ref('')
const busy = ref(false)
const view = ref<'diff' | 'page'>('diff')

async function load() {
  try {
    queue.value = await unwrap<RevisionFull[]>(api.get('/admin/wiki/edits'))
    selected.value = queue.value[0] ?? null
  } catch (e) {
    error.value = errorMessage(e, 'Не удалось загрузить очередь')
  }
}
onMounted(async () => {
  await loadPages()
  await load()
})

const current = computed(() => (selected.value ? pages.value.find((p) => p.slug === selected.value?.slug) : undefined))
const diff = computed(() =>
  selected.value ? diffLines(current.value?.source ?? baseSource(selected.value.slug), selected.value.source) : []
)
/** Пока правка ждала, статью успели изменить: её принятие затрёт чужой текст. */
const stale = computed(() => {
  const s = selected.value
  return !!s && (s.current_rev ?? null) !== (s.base_rev ?? null)
})
const preview = computed<WikiPage | null>(() =>
  selected.value
    ? { slug: selected.value.slug, title: selected.value.title, cat: selected.value.cat, source: selected.value.source, rev: null, updated: null, authors: [selected.value.author] }
    : null
)

async function decide(action: 'approve' | 'reject') {
  if (!selected.value) return
  busy.value = true
  error.value = ''
  try {
    await unwrap(api.post(`/admin/wiki/edits/${selected.value.id}/${action}`, { comment: comment.value }))
    comment.value = ''
    await load()
    await loadPages(true)
  } catch (e) {
    error.value = errorMessage(e, 'Не удалось сохранить решение')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="wq">
    <p v-if="!queue.length" class="muted">Новых правок нет.</p>
    <template v-else>
      <ul class="wq-list">
        <li v-for="e in queue" :key="e.id">
          <button type="button" :class="{ on: selected?.id === e.id }" @click="selected = e">
            <b>{{ e.title }}</b>
            <small>{{ e.author }} · {{ e.summary || 'без описания' }}</small>
          </button>
        </li>
      </ul>
      <div v-if="selected" class="wq-body">
        <p v-if="stale" class="wq-warn">Статью изменили, пока правка ждала проверки. Если принять, те изменения будут заменены.</p>
        <p v-if="!current" class="wq-warn">Это новая статья: /wiki/{{ selected.slug }}</p>
        <nav class="wq-tabs">
          <button :class="{ on: view === 'diff' }" @click="view = 'diff'">Изменения</button>
          <button :class="{ on: view === 'page' }" @click="view = 'page'">Как будет выглядеть</button>
        </nav>
        <pre v-if="view === 'diff'" class="wq-diff"><span v-for="(l, i) in diff" :key="i" :class="l.kind">{{ l.kind === 'add' ? '+ ' : l.kind === 'del' ? '- ' : '  ' }}{{ l.text || ' ' }}</span></pre>
        <div v-else-if="preview" class="wiki-root"><WikiArticle :page="preview" /></div>
        <textarea v-model="comment" placeholder="Комментарий автору. При отклонении обязателен" maxlength="500"></textarea>
        <p v-if="error" class="wq-warn">{{ error }}</p>
        <div class="wq-actions">
          <button class="mc-btn mc-btn--sm" :disabled="busy" @click="decide('approve')">Принять</button>
          <button class="mc-btn mc-btn--muted mc-btn--sm" :disabled="busy || !comment.trim()" @click="decide('reject')">Отклонить</button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.wq {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 16px;
}
.wq-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.wq-list button {
  display: block;
  width: 100%;
  text-align: left;
}
.wq-list button.on {
  border-color: var(--blue);
}
.wq-list small {
  display: block;
  opacity: 0.7;
}
.wq-warn {
  padding: 8px 12px;
  border-left: 4px solid var(--warn);
  background: rgba(242, 192, 55, 0.1);
}
.wq-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}
.wq-tabs button.on {
  border-color: var(--blue);
}
.wq-diff {
  max-height: 460px;
  margin: 0 0 10px;
  padding: 10px;
  overflow: auto;
  background: var(--well);
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
}
.wq-diff .add {
  display: block;
  background: rgba(43, 217, 72, 0.15);
}
.wq-diff .del {
  display: block;
  background: rgba(235, 90, 78, 0.18);
}
.wq-diff .same {
  display: block;
  opacity: 0.65;
}
.wq textarea {
  width: 100%;
  min-height: 70px;
  padding: 8px;
  background: var(--well);
  color: inherit;
  border: 2px solid var(--line);
  font: inherit;
}
.wq-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
@media (max-width: 800px) {
  .wq {
    grid-template-columns: 1fr;
  }
}
</style>
