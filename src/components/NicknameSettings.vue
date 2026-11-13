<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { api, errorMessage, unwrap } from '../api/client'

const props = defineProps<{ nickname: string }>()
const emit = defineEmits<{ changed: [nickname: string] }>()
interface RenameStatus { can_change: boolean; next_change_at: string | null }
const policy = ref<RenameStatus | null>(null)
const wanted = ref('')
const busy = ref(false)
const loading = ref(true)
const error = ref('')
const success = ref('')
const valid = computed(() => /^[A-Za-z0-9_]{3,16}$/.test(wanted.value.trim()) && wanted.value.trim() !== props.nickname)
const nextDate = computed(() => policy.value?.next_change_at
  ? new Date(policy.value.next_change_at).toLocaleString('ru-RU', { dateStyle: 'long', timeStyle: 'short' }) : '')

async function loadPolicy() {
  loading.value = true
  error.value = ''
  try {
    policy.value = await unwrap<RenameStatus>(api.get('/launcher/rename/status'))
  } catch (e) {
    policy.value = null
    error.value = errorMessage(e, 'Не удалось проверить дату следующей смены ника.')
  } finally { loading.value = false }
}
onMounted(loadPolicy)

async function rename() {
  if (busy.value || !policy.value?.can_change || !valid.value) return
  busy.value = true
  error.value = ''
  success.value = ''
  try {
    const result = await unwrap<{ nickname: string; next_change_at: string }>(
      api.post('/launcher/rename', { nickname: wanted.value.trim() })
    )
    policy.value = { can_change: false, next_change_at: result.next_change_at }
    wanted.value = ''
    success.value = `Ник изменён на ${result.nickname}. Перезапустите игру и войдите через лаунчер заново.`
    emit('changed', result.nickname)
  } catch (e) {
    // Read the policy again: a concurrent request may already have changed the name.
    await loadPolicy()
    error.value = errorMessage(e, 'Не удалось изменить ник.')
  } finally { busy.value = false }
}
</script>

<template>
  <section class="mc-panel p-4" aria-labelledby="nickname-settings-title">
    <h2 id="nickname-settings-title" class="font-bold text-[17px] m-0 mb-2">Игровой ник</h2>
    <p class="m-0 mb-2">Текущий ник: <strong>{{ nickname }}</strong></p>
    <p class="text-[var(--text-sub)] text-[15px] m-0 mb-3">
      Менять ник можно раз в месяц. Инвентарь, опыт, достижения, банк, постройки,
      покупки и настройки сохраняются. Варны и блокировки тоже сохраняются.
    </p>
    <p v-if="loading" role="status" class="text-[var(--text-sub)]">Проверяем доступность…</p>
    <p v-else-if="policy && !policy.can_change" class="text-[var(--text-sub)] m-0 mb-3">
      Следующая смена доступна {{ nextDate }}.
    </p>
    <form v-else-if="policy?.can_change" class="flex flex-col gap-3" @submit.prevent="rename">
      <label for="new-minecraft-nickname">Новый ник</label>
      <input id="new-minecraft-nickname" v-model="wanted" class="mc-input w-full" name="nickname"
        type="text" minlength="3" maxlength="16" pattern="[A-Za-z0-9_]{3,16}" required
        autocomplete="off" spellcheck="false" :disabled="busy" aria-describedby="nickname-help" />
      <p id="nickname-help" class="text-[var(--text-sub)] text-[14px] m-0">
        3–16 латинских букв, цифр или _. После смены следующая будет доступна через месяц.
      </p>
      <button type="submit" class="mc-btn" :disabled="busy || !valid">
        {{ busy ? 'Сохраняем…' : 'Изменить ник' }}
      </button>
    </form>
    <p v-if="error" role="alert" class="text-[var(--bad)] mt-3 mb-0">{{ error }}</p>
    <button v-if="!loading && !policy" type="button" class="mc-btn mc-btn--muted mt-3" @click="loadPolicy">Повторить</button>
    <p v-if="success" role="status" class="text-[var(--ok)] mt-3 mb-0">{{ success }}</p>
  </section>
</template>
