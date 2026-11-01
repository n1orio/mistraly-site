<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import SkinViewer3D from '../components/SkinViewer3D.vue'
import GameCabinet from '../components/GameCabinet.vue'
import PlayerProfile, { type GameProfile } from '../components/PlayerProfile.vue'
import NameTag from '../components/NameTag.vue'
import { loadPlayerThemes, setPlayerTheme, usePageTheme } from '../lib/nameThemes'
import { LogOut, Upload, Check } from '../lib/icons'
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
const game = ref<{ name: string; data: GameProfile; updated_at: string } | null>(null)
usePageTheme(computed(() => game.value?.data.theme))
const isUploading = ref(false)

const hasPass = computed(() => !!pass.value?.has_pass && !pass.value?.expired)

onMounted(async () => {
  await auth.restore()
  if (!auth.isAuthenticated) return
  loadPlayerThemes()
  await Promise.all([loadProfile(), loadNickname(), loadPurchases(), loadGame()])
  const v = user.value?.skin_variant
  // В базе это строка без ограничений, а в UI допустимы только два
  // формата — мусорные значения отбрасываем, иначе select «поедет».
  if (v === 'default' || v === 'slim') {
    variant.value = v
  }
})

async function loadGame() {
  try {
    game.value = await unwrap(api.get('/user/game-profile'))
  } catch {
    game.value = null
  }
}

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

function onTheme(id: string) {
  if (!game.value) return
  game.value.data.theme = id
  setPlayerTheme(game.value.name, id)
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
  <main class="w-full flex-1 flex flex-col items-center text-[var(--text-main)] px-4 pt-6 pb-12">
    <div class="w-full max-w-6xl">
      <PlayerProfile v-if="game" :name="game.name" :data="game.data" :updated="game.updated_at" own>
        <template #actions>
          <button class="mc-btn mc-btn--muted mc-btn--sm shrink-0" @click="logout">
            <LogOut :size="24" />
            <span>Выйти</span>
          </button>
        </template>
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-3 items-stretch">
          <div class="flex flex-col gap-3 min-w-0">
            <div class="mc-panel p-4">
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
            <!-- Журнал покупок: забирает остаток высоты колонки -->
          <section class="mc-panel p-4 flex-1">
            <div class="flex items-center justify-between mb-4">
              <h2 class="sub-title ">Журнал покупок</h2>
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
          <GameCabinet :name="game.name" @theme="onTheme" />
        </div>
      </PlayerProfile>

      <template v-else>
        <div class="flex items-center justify-between gap-4 pb-6">
          <h1 class="section-title !m-0 truncate">{{ user?.username || auth.discord?.discord_username || 'Игрок' }}</h1>
          <button class="mc-btn mc-btn--muted mc-btn--sm shrink-0" @click="logout">
            <LogOut :size="24" />
            <span>Выйти</span>
          </button>
        </div>
        <section class="mc-panel p-4 max-w-xl">
          <p class="m-0 mb-4 text-[var(--text-muted)]">Профиль появится после первого входа на сервер.</p>
          <button v-if="!hasPass" class="mc-btn" @click="buyPass">Купить Mistraly Pass →</button>
        </section>
      </template>
    </div>
  </main>
</template>

<style scoped>
.sub-title {
  margin: 0;
  font-size: 16px;
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
