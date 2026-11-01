<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import SkinViewer3D from '../components/SkinViewer3D.vue'
import GameSettings from '../components/GameSettings.vue'
import {
  Download,
  LogOut,
  Upload,
  ShieldCheck,
  Check,
  Wallet
} from '../lib/icons'
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
const variant = ref<'default' | 'slim'>('default')
const statusMsg = ref('')
const isUploading = ref(false)

const hasPass = computed(() => !!pass.value?.has_pass && !pass.value?.expired)

onMounted(async () => {
  await auth.restore()
  if (!auth.isAuthenticated) return
  await Promise.all([loadProfile(), loadNickname(), loadPurchases()])
  const v = user.value?.skin_variant
  // В базе это строка без ограничений, а в UI допустимы только два
  // формата — мусорные значения отбрасываем, иначе select «поедет».
  if (v === 'default' || v === 'slim') {
    variant.value = v
  }
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
  if (hasPass.value) {
    statusMsg.value = 'У вас уже есть бессрочная проходка'
    return
  }
  try {
    const items = await unwrap<ShopItem[]>(api.get('/shop/items'))
    const passItem = items.find((i) => i.item_type === 'pass')
    if (!passItem) {
      statusMsg.value = 'Проходка сейчас недоступна'
      return
    }
    purchaseStore.showPass()
  } catch (e) {
    statusMsg.value = errorMessage(e)
  }
}

function onFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files?.[0]) skinFile.value = target.files[0]
}

async function uploadSkin() {
  if (!skinFile.value) return
  statusMsg.value = ''
  isUploading.value = true
  try {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result).split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(skinFile.value as File)
    })
    await unwrap(api.put('/user/skin', { skin_data: base64, variant: variant.value }))
    statusMsg.value = 'Скин успешно обновлён!'
    skinFile.value = null
  } catch (e) {
    statusMsg.value = errorMessage(e, 'Ошибка при загрузке скина.')
  } finally {
    isUploading.value = false
  }
}

function onVariantChanged(v: 'default' | 'slim') {
  variant.value = v
  if (auth.user) auth.user.skin_variant = v
}

async function logout() {
  await auth.logout()
  window.location.assign('/')
}

const skinPreviewUrl = computed(() =>
  user.value?.username
    ? `${import.meta.env.VITE_API_URL || '/api'}/user/skin/png/${user.value.username}`
    : undefined
)

function statusBadge(status: string) {
  switch (status) {
    case 'pending':
      return { text: 'Ожидает входа', cls: 'mc-tag--warn' }
    case 'failed':
      return { text: 'Ошибка', cls: 'mc-tag--bad' }
    default:
      return { text: 'Выдано', cls: 'mc-tag--ok' }
  }
}
</script>

<template>
  <main class="w-full flex-1 flex flex-col items-center text-[var(--text-main)] px-4 pt-12 pb-16 sm:pt-16">
    <div class="w-full max-w-5xl">
      <div class="flex items-center justify-between gap-4 pb-6">
        <div class="flex items-center gap-3 min-w-0 flex-wrap">
          <span class="mc-tag">Профиль</span>
          <h1 class="section-title !m-0 truncate">{{ user?.username || auth.discord?.discord_username || 'Игрок' }}</h1>
          <span v-if="user?.role === 'admin'" class="mc-tag mc-tag--bad">Admin</span>
        </div>
        <button class="mc-btn mc-btn--muted mc-btn--sm shrink-0" @click="logout">
          <LogOut :size="24" />
          <span>Выйти</span>
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <!-- Стенд скина -->
        <div class="lg:col-span-5 mc-panel p-5">
          <div class="flex justify-between items-center mb-2">
            <span class="font-bold text-[17px]">3D скин игрока</span>
            <span class="text-[14px] text-[var(--text-sub)]">Вращайте мышью</span>
          </div>

          <div class="mc-well mb-4 h-[320px] flex items-center justify-center relative">
            <SkinViewer3D
              :skin-url="skinPreviewUrl"
              :variant="user?.skin_data ? user.skin_variant : 'slim'"
              :variant-changed="onVariantChanged"
            />
          </div>

          <div class="flex flex-col gap-3">
            <div class="flex gap-2 items-stretch">
              <label class="file mc-well">
                <span class="truncate">{{ skinFile ? skinFile.name : 'Выбрать PNG...' }}</span>
                <Upload :size="24" class="text-[var(--sky)] shrink-0" />
                <input type="file" accept="image/png" class="hidden" @change="onFileSelect" />
              </label>

              <!-- Переключатель Classic / Slim -->
              <div class="seg mc-well">
                <button type="button" :class="{ 'is-on': variant === 'default' }" @click="variant = 'default'">Classic</button>
                <button type="button" :class="{ 'is-on': variant === 'slim' }" @click="variant = 'slim'">Slim</button>
              </div>
            </div>

            <button class="mc-btn mc-btn--block" :disabled="!skinFile || isUploading" @click="uploadSkin">
              <Check :size="24" />
              {{ isUploading ? 'Загружаем…' : 'Применить скин' }}
            </button>

            <p v-if="statusMsg" class="text-[15px] text-[var(--ok)] text-center m-0">{{ statusMsg }}</p>
          </div>
        </div>

        <div class="lg:col-span-7 flex flex-col gap-6">
          <!-- Доступ на сервер -->
          <section class="mc-panel p-6">
            <div class="flex items-start justify-between gap-3 flex-wrap mb-4">
              <div>
                <span class="text-[14px] font-bold text-[var(--text-sub)] block">Статус аккаунта</span>
                <h2 class="sub-title">Доступ на сервер</h2>
              </div>
              <span class="mc-tag" :class="hasPass ? 'mc-tag--ok' : 'mc-tag--warn'">
                {{ hasPass ? 'Проходка активна' : 'Нет проходки' }}
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              <div class="mc-well p-3">
                <span class="text-[14px] text-[var(--text-sub)] block">Никнейм в игре</span>
                <router-link v-if="linkedNickname?.nickname" :to="`/wiki/user/${encodeURIComponent(linkedNickname.nickname)}`" class="mc-link font-bold">{{ linkedNickname.nickname }}</router-link>
                <strong v-else>Не привязан</strong>
              </div>
              <div class="mc-well p-3">
                <span class="text-[14px] text-[var(--text-sub)] block">Discord</span>
                <strong class="flex items-center gap-1.5">
                  <ShieldCheck :size="24" class="text-[var(--sky)]" />
                  {{ auth.discord?.discord_username || 'Привязан' }}
                </strong>
              </div>
            </div>

            <router-link v-if="hasPass" to="/download" class="mc-btn mc-btn--block">
              <Download :size="24" />
              Скачать Mistraly Launcher
            </router-link>
            <button v-else class="mc-btn mc-btn--block" @click="buyPass">Купить Mistraly Pass →</button>
          </section>

          <router-link to="/bank" class="mc-btn mc-btn--block">
            <Wallet :size="24" />
            Открыть банк
          </router-link>

          <GameSettings />

          <!-- Журнал покупок -->
          <section class="mc-panel p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="sub-title !text-[24px]">Журнал покупок</h2>
              <router-link to="/shop" class="mc-link inline-flex items-center gap-1">Магазин</router-link>
            </div>

            <div v-if="!purchases.length" class="mc-well text-center py-6 text-[var(--text-muted)]">
              Покупок пока не зарегистрировано.
            </div>

            <div v-else class="flex flex-col gap-2">
              <div v-for="p in purchases" :key="p.id" class="mc-well flex items-center justify-between gap-3 p-3">
                <div class="min-w-0">
                  <strong class="block">{{ p.item_name }}</strong>
                  <span class="text-[14px] text-[var(--text-sub)]">
                    {{ new Date(p.created_at.replace(' ', 'T') + 'Z').toLocaleDateString('ru-RU') }}
                  </span>
                </div>
                <span class="mc-tag shrink-0" :class="statusBadge(p.status).cls">{{ statusBadge(p.status).text }}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.sub-title {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
}
.file {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  padding: 6px 10px;
  font-size: 15px;
  cursor: pointer;
}
.file:hover {
  --edge: var(--sky);
}
.seg {
  display: flex;
  flex: none;
  padding: 3px;
}
.seg button {
  padding: 4px 8px;
  background: none;
  border: 0;
  color: var(--text-sub);
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
.seg button:hover {
  color: #fff;
}
.seg button.is-on {
  background: var(--blue);
  color: #fff;
}
</style>
