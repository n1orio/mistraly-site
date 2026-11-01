<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
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

// Предложение наградить автора: появляется сразу после принятия правки.
type RewardState = { status: string; error: string | null; amount: number }
const reward = ref<{ id: string; title: string; author: string } | null>(null)
const rewardAmount = ref<number | null>(null)
const rewardState = ref<RewardState | null>(null)
const rewardError = ref('')
let rewardTimer: number | undefined

function closeReward() {
  clearTimeout(rewardTimer)
  reward.value = null
  rewardState.value = null
  rewardAmount.value = null
  rewardError.value = ''
}
onUnmounted(() => clearTimeout(rewardTimer))

/** Деньги начисляет игровой сервер: ждём его ответа, пока окно открыто. */
async function watchReward(id: string) {
  try {
    const state = await unwrap<RewardState | null>(api.get(`/admin/wiki/edits/${id}/reward`))
    if (reward.value?.id !== id) return
    rewardState.value = state
    if (state?.status === 'done' || state?.status === 'failed') return
  } catch {
    /* сеть мигнула: спросим ещё раз */
  }
  rewardTimer = window.setTimeout(() => watchReward(id), 3000)
}

async function sendReward() {
  if (!reward.value || !rewardAmount.value) return
  const id = reward.value.id
  busy.value = true
  rewardError.value = ''
  try {
    await unwrap(api.post(`/admin/wiki/edits/${id}/reward`, { amount: rewardAmount.value }))
    rewardState.value = { status: 'pending', error: null, amount: rewardAmount.value }
    clearTimeout(rewardTimer)
    rewardTimer = window.setTimeout(() => watchReward(id), 3000)
  } catch (e) {
    rewardError.value = errorMessage(e, 'Не удалось начислить мисты')
  } finally {
    busy.value = false
  }
}

async function decide(action: 'approve' | 'reject') {
  if (!selected.value) return
  const edit = selected.value
  busy.value = true
  error.value = ''
  try {
    await unwrap(api.post(`/admin/wiki/edits/${edit.id}/${action}`, { comment: comment.value }))
    comment.value = ''
    if (action === 'approve') {
      closeReward()
      reward.value = { id: edit.id, title: edit.title, author: edit.author }
    }
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
  <section v-if="reward" class="wq-reward">
    <p>
      Правка «{{ reward.title }}» принята.
      <template v-if="!rewardState || rewardState.status === 'failed'">Начислить мисты игроку <b>{{ reward.author }}</b>?</template>
    </p>
    <p v-if="rewardState?.status === 'done'" class="wq-ok">{{ reward.author }} получил {{ rewardState.amount }} мист. на основной счёт.</p>
    <p v-else-if="rewardState?.status === 'failed'" class="wq-warn">{{ rewardState.error }}</p>
    <p v-else-if="rewardState" class="muted">Ждём игровой сервер: {{ rewardState.amount }} мист. начислятся, как только он заберёт операцию.</p>
    <p v-if="rewardError" class="wq-warn">{{ rewardError }}</p>
    <div class="wq-actions">
      <template v-if="!rewardState || rewardState.status === 'failed'">
        <input v-model.number="rewardAmount" class="mc-input wq-amount" type="number" min="1" max="100000" placeholder="Сумма" />
        <button class="mc-btn mc-btn--sm" :disabled="busy || !rewardAmount" @click="sendReward">Начислить</button>
      </template>
      <button class="mc-btn mc-btn--muted mc-btn--sm" @click="closeReward">
        {{ rewardState && rewardState.status !== 'failed' ? 'Закрыть' : 'Без награды' }}
      </button>
    </div>
  </section>
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
.wq-ok {
  color: var(--ok);
}
.wq-reward {
  margin-bottom: 16px;
  padding: 12px;
  background: var(--panel-hi);
  border: 2px solid var(--edge-c);
  border-left: 4px solid var(--blue);
}
.wq-reward p {
  margin: 0 0 8px;
}
.wq-reward .wq-actions {
  align-items: center;
}
.wq-amount {
  width: 120px;
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
