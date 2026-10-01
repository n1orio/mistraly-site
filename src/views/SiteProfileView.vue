<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import SkinPreview3D from '../components/SkinPreview3D.vue'
import { AlertTriangle, Download, LogOut, ShieldCheck, Upload } from 'lucide-vue-next'
import { usePurchaseStore } from '../stores/purchase'
import { useAuthStore } from '../stores/auth'
import { api, unwrap, errorMessage } from '../api/client'
import type { ShopItem } from '../stores/purchase'

const purchaseStore = usePurchaseStore()
const auth = useAuthStore()

const user = computed(() => auth.user)
const pass = ref<{ has_pass: boolean; expired: boolean; expires_at: string | null } | null>(null)
const linkedNickname = ref<{ nickname: string; minecraft_uuid: string | null } | null>(null)
const purchases = ref<
  { id: string; item_name: string; item_type: string; status: string; created_at: string }[]
>([])

const skinFile = ref<File | null>(null)
const variant = ref('default')
const statusMsg = ref('')

const hasPass = computed(() => !!pass.value?.has_pass && !pass.value?.expired)

onMounted(async () => {
  await auth.restore()
  if (!auth.isAuthenticated) return
  await Promise.all([loadProfile(), loadNickname(), loadPurchases()])
})

async function loadProfile() {
  try {
    pass.value = await unwrap(api.get('/pass/status'))
  } catch {
    pass.value = null
  }
}

async function loadNickname() {
  try {
    linkedNickname.value = await unwrap(api.get('/user/nickname'))
  } catch {
    linkedNickname.value = null
  }
}

async function loadPurchases() {
  try {
    purchases.value = await unwrap(api.get('/user/purchases'))
  } catch {
    purchases.value = []
  }
}

async function buyPass() {
  try {
    const items = await unwrap<ShopItem[]>(api.get('/shop/items'))
    const passItem = items.find((i) => i.item_type === 'pass')
    if (!passItem) {
      statusMsg.value = 'Проходка сейчас недоступна'
      return
    }
    purchaseStore.showItem(passItem, 1)
  } catch (e) {
    statusMsg.value = errorMessage(e)
  }
}

function onFileSelect(e: Event) {
  skinFile.value = (e.target as HTMLInputElement).files?.[0] || null
}

async function uploadSkin() {
  if (!skinFile.value) return
  statusMsg.value = ''
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(skinFile.value as File)
  })
  try {
    await unwrap(api.put('/user/skin', { skin_data: base64, variant: variant.value }))
    statusMsg.value = 'Скин успешно обновлён!'
    skinFile.value = null
  } catch (e) {
    statusMsg.value = errorMessage(e, 'Ошибка при загрузке скина.')
  }
}

async function logout() {
  await auth.logout()
  window.location.assign('/')
}

const skinPreviewUrl = computed(() =>
  user.value?.username ? `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/user/skin/${user.value.username}` : undefined
)

/** Статус выдачи для игровых покупок. */
function deliveryLabel(status: string): { text: string; cls: string } {
  switch (status) {
    case 'pending':
      return { text: 'Будет выдано при входе', cls: 'text-amber-400' }
    case 'failed':
      return { text: 'Ошибка выдачи — напишите в поддержку', cls: 'text-rose-400' }
    default:
      return { text: 'Выдано', cls: 'text-emerald-400' }
  }
}
</script>

<template>
  <main class="w-full flex-1 flex flex-col items-center justify-start page-bg bg-[var(--bg-page)] text-[var(--text-main)] px-4 py-12">
    <div class="w-full max-w-4xl">
      <div class="flex items-center justify-between mb-8 pb-6 border-b border-[var(--border-color)]">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-[#0099FF]">Личный кабинет</span>
          <h1 class="font-heading text-3xl font-black text-[var(--text-main)] mt-1">
            {{ user?.username || auth.discord?.discord_username || 'Игрок' }}
          </h1>
        </div>
        <div class="flex items-center gap-3">
          <span class="px-3 py-1 rounded-full bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-muted)]">
            {{ user?.role === 'admin' ? 'Администратор' : 'Игрок' }}
          </span>
          <button
            @click="logout"
            class="px-3 py-1.5 rounded-lg border border-[var(--border-color)] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition flex items-center gap-1.5"
          >
            <LogOut :size="13" /> Выйти
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="md:col-span-1 space-y-6">
          <div class="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6">
            <span class="text-xs text-[var(--text-muted)] font-medium">Статус проходки</span>
            <div class="mt-2 mb-4">
              <div
                v-if="hasPass"
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold"
              >
                <ShieldCheck :size="14" /> Проходка активна
              </div>
              <div
                v-else
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold"
              >
                <AlertTriangle :size="14" /> Без проходки
              </div>
            </div>
            <p v-if="pass?.expires_at" class="text-[11px] text-[var(--text-muted)] mb-4">
              Действует до {{ new Date(pass.expires_at).toLocaleDateString('ru-RU') }}
            </p>
            <button
              v-if="!hasPass"
              @click="buyPass"
              class="w-full py-2.5 rounded-xl font-bold text-xs text-[var(--text-main)] bg-gradient-to-r from-[#0080FF] to-[#00BBFF] hover:opacity-90 transition"
            >
              Купить проходку
            </button>
            <a
              v-else
              href="http://localhost:1420"
              class="w-full py-2.5 rounded-xl font-bold text-xs text-center text-[var(--text-main)] bg-gradient-to-r from-[#0080FF] to-[#00BBFF] hover:opacity-90 transition flex items-center justify-center gap-2"
            >
              <Download :size="14" /> Скачать лаунчер
            </a>
          </div>

          <div class="bg-[var(--bg-card)] border-[var(--border-color)] rounded-2xl p-6 text-xs space-y-3 text-[var(--text-muted)]">
            <div class="flex justify-between">
              <span class="text-slate-500">Игровой ник:</span>
              <strong class="text-[var(--text-main)]">{{ linkedNickname?.nickname || 'не привязан' }}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Discord:</span>
              <strong class="text-[var(--text-main)]">{{ auth.discord?.discord_username || 'привязан' }}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Баланс:</span>
              <strong class="text-[var(--text-main)]">{{ user?.balance ?? 0 }}</strong>
            </div>
          </div>
        </div>

        <div class="md:col-span-2 space-y-6">
          <div class="bg-[var(--bg-card)] border-[var(--border-color)] rounded-2xl p-6">
            <h3 class="font-heading text-lg font-bold text-[var(--text-main)] mb-2">История покупок</h3>
            <p class="text-xs text-[var(--text-muted)] mb-6 leading-relaxed">
              Игровые предметы выдаются модом сразу, если вы в сети, иначе — при следующем входе.
            </p>
            <p v-if="!purchases.length" class="text-xs text-[var(--text-muted)]">Покупок пока нет.</p>
            <ul v-else class="space-y-2">
              <li
                v-for="p in purchases"
                :key="p.id"
                class="flex items-center justify-between bg-white/[0.02] border border-[var(--border-color)] rounded-xl px-4 py-3 text-xs"
              >
                <div>
                  <strong class="text-[var(--text-main)] block">{{ p.item_name }}</strong>
                  <span class="text-[var(--text-muted)]">
                    {{ new Date(p.created_at.replace(' ', 'T') + 'Z').toLocaleDateString('ru-RU') }}
                  </span>
                </div>
                <span class="font-semibold" :class="deliveryLabel(p.status).cls">
                  {{ deliveryLabel(p.status).text }}
                </span>
              </li>
            </ul>
          </div>

          <div class="bg-[var(--bg-card)] border-[var(--border-color)] rounded-2xl p-6">
            <h3 class="font-heading text-lg font-bold text-[var(--text-main)] mb-2">Кастомный скин</h3>
            <p class="text-xs text-[var(--text-muted)] mb-6 leading-relaxed">
              Поддерживаются стандартные PNG-скины. Скин моментально синхронизируется на сервере.
            </p>
            <div class="space-y-4 max-w-md">
              <label
                class="w-full border border-dashed border-white/10 hover:border-[#0080FF]/50 bg-white/[0.02] hover:bg-[var(--bg-card-hover)] transition rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer text-center group"
              >
                <Upload :size="20" class="text-[var(--text-muted)] group-hover:text-[#0099FF] transition mb-2" />
                <span class="text-xs font-medium text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition">
                  {{ skinFile ? skinFile.name : 'Нажмите для выбора файла скина' }}
                </span>
                <span class="text-[11px] text-slate-500 mt-1">Стандартный PNG-скин до 1 МБ</span>
                <input type="file" accept="image/png" class="hidden" @change="onFileSelect" />
              </label>
              <button
                :disabled="!skinFile"
                @click="uploadSkin"
                class="px-5 py-2.5 rounded-xl font-bold text-xs text-[var(--text-main)] bg-gradient-to-r from-[#0080FF] to-[#00BBFF] disabled:opacity-40 transition flex items-center gap-2"
              >
                <Upload :size="14" /> Загрузить скин
              </button>
              <p v-if="statusMsg" class="text-xs text-emerald-400 mt-2">{{ statusMsg }}</p>
            </div>
            <div class="mt-3"><SkinPreview3D :skin-url="skinPreviewUrl" /></div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>