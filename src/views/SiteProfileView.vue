<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import SkinViewer3D from '../components/SkinViewer3D.vue'
import {
  Download,
  LogOut,
  Upload,
  ShieldCheck,
  Check,
  Package,
  Sparkles,
  ExternalLink
} from 'lucide-vue-next'
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
      return { text: 'Ожидает входа', cls: 'text-[#FFCC00] border-[#FFCC00]/30 bg-[#FFCC00]/10' }
    case 'failed':
      return { text: 'Ошибка', cls: 'text-rose-400 border-rose-500/30 bg-rose-500/10' }
    default:
      return { text: 'Выдано', cls: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' }
  }
}
</script>

<template>
  <main class="w-full flex-1 flex flex-col items-center page-bg bg-[var(--bg-page)] text-[var(--text-main)] px-4 pt-24 pb-16 sm:pt-28 select-none">
    <div class="w-full max-w-5xl">

      <!-- ================= ВЕРХНЯЯ СТРОКА ПРОФИЛЯ ================= -->
      <div class="flex items-center justify-between border-b border-white/10 pb-5 mb-8">
        <div class="flex items-center gap-3">
          <span
            class="font-heading font-black text-xs uppercase px-2 py-0.5 text-black"
            style="background-color: #0099FF; transform: rotate(-1.5deg);"
          >
            ПРОФИЛЬ
          </span>
          <h1 class="font-heading font-black text-2xl sm:text-3xl text-white tracking-tight uppercase">
            {{ user?.username || auth.discord?.discord_username || 'Игрок' }}
          </h1>
          <span v-if="user?.role === 'admin'" class="text-[10px] font-mono px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold uppercase">
            Admin
          </span>
        </div>

        <button
          @click="logout"
          class="font-mono text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition cursor-pointer py-1.5 px-3 border border-white/10 hover:border-white/30 bg-white/[0.02]"
        >
          <LogOut :size="13" />
          <span>Выйти</span>
        </button>
      </div>

      <!-- ================= ДВУХКОЛОНОЧНЫЙ БЛОК ================= -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        <!-- ЛЕВАЯ КОЛОНКА (5/12): 3D Стенд скина + Модификатор -->
        <div class="lg:col-span-5 flex flex-col">
          <div
            class="skin-podium p-5 relative overflow-hidden"
            style="clip-path: polygon(0% 1.5%, 100% 0%, 98.5% 98.5%, 1.5% 100%);"
          >
            <!-- Фоновые риски стенда -->
            <div class="podium-grid-lines" aria-hidden="true"></div>

            <div class="relative z-10">
              <!-- Заголовок стенда -->
              <div class="flex justify-between items-center mb-2">
                <span class="font-heading font-black text-[10px] uppercase tracking-wider text-zinc-400">
                  // 3D СКИН ИГРОКА
                </span>
                <span class="text-[10px] font-mono text-zinc-500">
                  Вращайте мышью
                </span>
              </div>

              <!-- Сам 3D персонаж -->
              <div class="w-full h-[320px] flex items-center justify-center relative">
                <SkinViewer3D
                  :skin-url="skinPreviewUrl"
                  :variant="user?.skin_variant"
                  :variant-changed="onVariantChanged"
                />
              </div>

              <!-- Панель управления скином -->
              <div class="pt-4 border-t border-white/10 space-y-3 font-mono text-xs">
                <!-- Кнопка выбора файла -->
                <div class="flex gap-2">
                  <label class="flex-1 bg-black/50 border border-white/15 hover:border-[#0099FF] px-3 py-2 flex items-center justify-between cursor-pointer transition">
                    <span class="truncate text-zinc-300 text-xs">
                      {{ skinFile ? skinFile.name : 'Выбрать PNG...' }}
                    </span>
                    <Upload :size="14" class="text-[#0099FF] shrink-0 ml-2" />
                    <input type="file" accept="image/png" class="hidden" @change="onFileSelect" />
                  </label>

                  <!-- Переключатель Classic / Slim -->
                  <div class="flex bg-black/50 border border-white/15 p-0.5 shrink-0">
                    <button
                      type="button"
                      @click="variant = 'default'"
                      class="px-2 py-1 text-[11px] font-bold transition cursor-pointer"
                      :class="variant === 'default' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'"
                    >
                      Classic
                    </button>
                    <button
                      type="button"
                      @click="variant = 'slim'"
                      class="px-2 py-1 text-[11px] font-bold transition cursor-pointer"
                      :class="variant === 'slim' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'"
                    >
                      Slim
                    </button>
                  </div>
                </div>

                <!-- Кнопка сохранения скина -->
                <div class="comic-btn-wrap w-full">
                  <button
                    :disabled="!skinFile || isUploading"
                    @click="uploadSkin"
                    class="comic-btn w-full py-2.5 px-4 font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-30"
                    :style="{ '--btn-bg': '#0099FF', '--btn-color': '#FFFFFF' }"
                  >
                    <Check :size="14" />
                    {{ isUploading ? 'Загружаем…' : 'Применить скин' }}
                  </button>
                </div>

                <p v-if="statusMsg" class="text-xs font-mono text-emerald-400 text-center">
                  {{ statusMsg }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- ПРАВАЯ КОЛОНКА (7/12): Доступ + Заказы -->
        <div class="lg:col-span-7 flex flex-col gap-6">

          <!-- 1. КАРТОЧКА ДОСТУПА НА СЕРВЕР -->
          <div
            class="access-card p-6 sm:p-7 relative overflow-hidden"
            style="clip-path: polygon(0% 0%, 100% 1.5%, 99% 100%, 0.8% 98.5%);"
          >
            <div class="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <div>
                <span class="font-heading font-black text-[10px] uppercase tracking-wider text-zinc-500 block">
                  СТАТУС АККАУНТА
                </span>
                <h2 class="font-heading font-black text-2xl text-white tracking-tight uppercase">
                  Доступ на сервер
                </h2>
              </div>

              <!-- Бейдж статуса -->
              <span
                class="font-heading font-black text-xs uppercase px-2.5 py-1 tracking-wider text-black"
                :style="{
                  backgroundColor: hasPass ? '#22C55E' : '#FFCC00',
                  transform: 'rotate(-2deg)'
                }"
              >
                {{ hasPass ? 'ПРОХОДКА АКТИВНА' : 'НЕТ ПРОХОДКИ' }}
              </span>
            </div>

            <!-- Данные привязки -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs mb-6">
              <div class="p-3 bg-black/45 border border-white/10">
                <span class="text-zinc-500 text-[11px] block mb-1">Никнейм в игре:</span>
                <strong class="text-white text-sm font-bold">{{ linkedNickname?.nickname || 'Не привязан' }}</strong>
              </div>
              <div class="p-3 bg-black/45 border border-white/10">
                <span class="text-zinc-500 text-[11px] block mb-1">Discord:</span>
                <strong class="text-white text-sm font-bold flex items-center gap-1.5">
                  <ShieldCheck :size="14" class="text-[#0099FF]" />
                  {{ auth.discord?.discord_username || 'Привязан' }}
                </strong>
              </div>
            </div>

            <!-- Главное действие -->
            <div class="comic-btn-wrap w-full">
              <a
                v-if="hasPass"
                href="/#launcher"
                class="comic-btn w-full py-3.5 px-6 font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer text-decoration-none"
                :style="{ '--btn-bg': '#22C55E', '--btn-color': '#101113' }"
              >
                <Download :size="16" />
                Скачать Mistraly Launcher
              </a>

              <button
                v-else
                @click="buyPass"
                class="comic-btn w-full py-3.5 px-6 font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                :style="{ '--btn-bg': '#FFCC00', '--btn-color': '#101113' }"
              >
                Купить Mistraly Pass →
              </button>
            </div>
          </div>

          <!-- 2. ИСТОРИЯ ЗАКАЗОВ (Квитанция) -->
          <div
            class="receipt-card p-6 relative overflow-hidden"
            style="clip-path: polygon(0.6% 0%, 99.4% 1.2%, 100% 100%, 0% 98.8%);"
          >
            <div class="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <span class="font-heading font-black text-xs uppercase tracking-wider text-white">
                Журнал покупок
              </span>
              <router-link
                to="/shop"
                class="font-mono text-xs text-[#0099FF] hover:underline flex items-center gap-1"
              >
                Магазин <ExternalLink :size="12" />
              </router-link>
            </div>

            <div v-if="!purchases.length" class="text-center py-6 border border-dashed border-white/10 bg-black/30 font-mono text-xs text-zinc-500">
              Покупок пока не зарегистрировано.
            </div>

            <div v-else class="space-y-2 font-mono text-xs">
              <div
                v-for="p in purchases"
                :key="p.id"
                class="flex items-center justify-between p-2.5 bg-black/40 border border-white/10"
              >
                <div>
                  <strong class="text-white block font-bold">{{ p.item_name }}</strong>
                  <span class="text-zinc-500 text-[10px]">
                    {{ new Date(p.created_at.replace(' ', 'T') + 'Z').toLocaleDateString('ru-RU') }}
                  </span>
                </div>
                <span
                  class="px-2 py-0.5 text-[10px] font-bold border"
                  :class="statusBadge(p.status).cls"
                >
                  {{ statusBadge(p.status).text }}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  </main>
</template>

<style scoped>
/* Стенд 3D скина с жесткой тенью и фоновой сеткой */
.skin-podium {
  background: linear-gradient(180deg, #18191c 0%, #111214 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  filter: drop-shadow(8px 8px 0px rgba(0, 0, 0, 0.6));
}

.podium-grid-lines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.15;
  background-size: 24px 24px;
  background-image:
    linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
}

/* Карточки правой части */
.access-card,
.receipt-card {
  background: linear-gradient(180deg, #18191c 0%, #121316 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  filter: drop-shadow(6px 6px 0px rgba(0, 0, 0, 0.55));
}

/* =========================================================
   ФИРМЕННЫЕ КНОПКИ САЙТА
   ========================================================= */
.comic-btn-wrap {
  position: relative;
  display: flex;
  filter: drop-shadow(5px 5px 0px rgba(0, 0, 0, 0.7));
  transition: filter 0.22s ease;
}

.comic-btn-wrap:hover {
  filter: drop-shadow(7px 7px 0px rgba(0, 0, 0, 0.85));
}

.comic-btn {
  background-color: var(--btn-bg);
  color: var(--btn-color);
  clip-path: polygon(0% 12%, 100% 0%, 100% 100%, 0% 88%);
  transform: rotate(-1.2deg);
  border: none;
  user-select: none;
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
              background-color 0.2s ease,
              color 0.2s ease;
}

.comic-btn:hover {
  transform: scale(1.04) rotate(-1.2deg);
  background-color: #FFFFFF !important;
  color: #0D0E10 !important;
}

.comic-btn:active {
  transform: scale(0.96) rotate(-1.2deg);
}
</style>
