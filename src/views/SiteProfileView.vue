<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import SkinViewer3D from '../components/SkinViewer3D.vue'
import {
  Download,
  LogOut,
  Upload,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  PackageCheck
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
const variant = ref('default')
const statusMsg = ref('')
const isUploading = ref(false)

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
  skinFile.value = (e.target as HTMLInputElement).files?.[0] || null
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

function deliveryLabel(status: string): { text: string; badgeCls: string } {
  switch (status) {
    case 'pending':
      return { text: 'Ожидает входа', badgeCls: 'bg-[#FFCC00]/15 text-[#FFCC00] border-[#FFCC00]/30' }
    case 'failed':
      return { text: 'Ошибка (тикет)', badgeCls: 'bg-rose-500/15 text-rose-400 border-rose-500/30' }
    default:
      return { text: 'Выдано', badgeCls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' }
  }
}
</script>

<template>
  <main class="w-full flex-1 flex flex-col items-center justify-start page-bg text-[var(--text-main)] px-4 pt-28 pb-16 sm:pt-32 sm:pb-20 select-none">
    <div class="w-full max-w-5xl">

      <!-- ================= ШАПКА КАБИНЕТА ================= -->
      <div class="card-outer mb-8 group">
        <div
          class="card-box p-6 sm:p-7 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 relative overflow-hidden"
          style="clip-path: polygon(0% 1.8%, 100% 0%, 99.2% 98.2%, 0.6% 100%); --accent: #0099FF;"
        >
          <div class="comic-dots-pattern" aria-hidden="true" />

          <div class="relative z-10 flex items-center gap-4">
            <!-- Аватарка / иконка пилота -->
            <div
              class="w-14 h-14 bg-black/60 border border-white/15 flex items-center justify-center text-[#0099FF] shrink-0"
              style="clip-path: polygon(0% 8%, 100% 0%, 92% 100%, 0% 92%);"
            >
              <User :size="28" />
            </div>

            <div>
              <div class="flex items-center gap-2 mb-1">
                <span
                  class="font-heading font-black text-[10px] tracking-wider uppercase px-2 py-0.5 text-black"
                  :style="{ backgroundColor: user?.role === 'admin' ? '#FF4444' : '#0099FF', transform: 'rotate(-1.5deg)' }"
                >
                  {{ user?.role === 'admin' ? 'АДМИНИСТРАТОР' : 'ПИЛОТ MISTRALY' }}
                </span>
                <span v-if="linkedNickname?.nickname" class="text-[11px] font-mono text-zinc-400">
                  ID: <span class="text-white font-bold">{{ linkedNickname.nickname }}</span>
                </span>
              </div>

              <h1 class="font-heading font-black text-2xl sm:text-3xl text-white tracking-tight uppercase">
                {{ user?.username || auth.discord?.discord_username || 'Игрок' }}
              </h1>
            </div>
          </div>

          <div class="relative z-10 flex items-center gap-3 w-full sm:w-auto justify-end border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0">
            <div class="comic-btn-wrap">
              <button
                @click="logout"
                class="comic-btn px-4 py-2 font-heading font-black text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                :style="{ '--btn-bg': '#24262b', '--btn-color': '#FFFFFF' }"
              >
                <LogOut :size="13" />
                Выйти
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ================= ОСНОВНАЯ СЕТКА ================= -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        <!-- ЛЕВАЯ КОЛОНКА (Статус проходки + Связка профиля) -->
        <div class="lg:col-span-1 flex flex-col gap-6">

          <!-- КАРТОЧКА: ПРОХОДКА (СТАТУС ДОСТУПА) -->
          <div class="card-outer group">
            <div
              class="card-box p-6 relative overflow-hidden flex flex-col justify-between"
              :style="{
                clipPath: 'polygon(0% 1.5%, 100% 0%, 98.8% 98.5%, 1.2% 100%)',
                '--accent': hasPass ? '#4ADE80' : '#FFCC00'
              }"
            >
              <div class="comic-dots-pattern" aria-hidden="true" />

              <div class="relative z-10">
                <div class="flex items-center justify-between mb-4">
                  <span
                    class="font-heading font-black text-[10px] uppercase tracking-wider px-2 py-0.5 text-black"
                    :style="{
                      backgroundColor: hasPass ? '#4ADE80' : '#FFCC00',
                      transform: 'rotate(-1.5deg)'
                    }"
                  >
                    {{ hasPass ? 'ДОСТУП ОТКРЫТ' : 'ТРЕБУЕТСЯ БИЛЕТ' }}
                  </span>

                  <span class="text-[11px] font-mono font-bold" :class="hasPass ? 'text-[#4ADE80]' : 'text-zinc-500'">
                    {{ hasPass ? 'АКТИВЕН' : 'ЗАКРЫТ' }}
                  </span>
                </div>

                <h2 class="font-heading font-black text-xl text-white tracking-tight uppercase mb-2">
                  {{ hasPass ? 'Mistraly Pass' : 'Проходка отсутствует' }}
                </h2>

                <p class="text-xs text-zinc-400 font-mono leading-relaxed mb-6">
                  {{
                    pass?.expires_at
                      ? `Истекает: ${new Date(pass.expires_at).toLocaleDateString('ru-RU')}`
                      : hasPass
                        ? 'Бессрочный пропуск на сервер и в закрытый чат.'
                        : 'Для подключения к серверу и загрузки модпака нужен пропуск.'
                  }}
                </p>
              </div>

              <div class="relative z-10 pt-2 border-t border-white/10">
                <div class="comic-btn-wrap w-full">
                  <button
                    v-if="!hasPass"
                    @click="buyPass"
                    class="comic-btn w-full py-3 px-4 font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                    :style="{ '--btn-bg': '#FFCC00', '--btn-color': '#101113' }"
                  >
                    Купить пропуск →
                  </button>
                  <a
                    v-else
                    href="/#launcher"
                    class="comic-btn w-full py-3 px-4 font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer text-decoration-none"
                    :style="{ '--btn-bg': '#4ADE80', '--btn-color': '#101113' }"
                  >
                    <Download :size="14" />
                    Скачать лаунчер
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- КАРТОЧКА: ДАННЫЕ СВЯЗКИ -->
          <div class="card-outer group">
            <div
              class="card-box p-5 relative overflow-hidden"
              style="clip-path: polygon(0.6% 0%, 99.4% 1.8%, 98.8% 100%, 0% 98.2%); --accent: #0099FF;"
            >
              <div class="comic-dots-pattern" aria-hidden="true" />

              <div class="relative z-10 space-y-3 font-mono text-xs">
                <span class="text-[10px] font-heading font-black uppercase tracking-wider text-zinc-500 block mb-2">
                  // ПРИВЯЗАННЫЕ ДАННЫЕ
                </span>

                <div class="flex items-center justify-between p-2.5 bg-black/40 border border-white/10">
                  <span class="text-zinc-500">Никнейм в игре:</span>
                  <strong class="text-white font-bold">
                    {{ linkedNickname?.nickname || 'Не привязан' }}
                  </strong>
                </div>

                <div class="flex items-center justify-between p-2.5 bg-black/40 border border-white/10">
                  <span class="text-zinc-500">Discord:</span>
                  <strong class="text-white font-bold flex items-center gap-1.5">
                    <ShieldCheck :size="13" class="text-[#0099FF]" />
                    {{ auth.discord?.discord_username || 'Привязан' }}
                  </strong>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- ПРАВАЯ КОЛОНКА (Скин + Журнал покупок) -->
        <div class="lg:col-span-2 flex flex-col gap-6">

          <!-- КАРТОЧКА: ГАРДЕРОБ / 3D СКИН -->
          <div class="card-outer group">
            <div
              class="card-box p-6 sm:p-7 relative overflow-hidden"
              style="clip-path: polygon(0% 1%, 100% 0%, 99.2% 99%, 0.8% 100%); --accent: #0099FF;"
            >
              <div class="comic-dots-pattern" aria-hidden="true" />

              <div class="relative z-10">
                <div class="flex items-center justify-between mb-4">
                  <span
                    class="font-heading font-black text-[10px] uppercase tracking-wider px-2 py-0.5 text-black"
                    style="background-color: #0099FF; transform: rotate(-1.5deg);"
                  >
                    ГАРДЕРОБ // 3D
                  </span>
                  <span class="text-[11px] font-mono text-zinc-500">
                    Classic & Slim (PNG)
                  </span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <!-- Загрузчик и параметры -->
                  <div class="space-y-4">
                    <h2 class="font-heading font-black text-xl text-white tracking-tight uppercase">
                      Кастомизация скина
                    </h2>
                    <p class="text-xs text-zinc-400 font-mono leading-relaxed">
                      Загрузите текстуру скина. Изменения синхронизируются с сервером при входе.
                    </p>

                    <label class="w-full border border-dashed border-white/20 hover:border-[#0099FF] bg-black/40 p-4 flex flex-col items-center justify-center cursor-pointer text-center transition group/drop">
                      <Upload :size="22" class="text-[#0099FF] group-hover/drop:scale-110 transition mb-2" />
                      <span class="text-xs font-mono font-bold text-white block">
                        {{ skinFile ? skinFile.name : 'ВЫБРАТЬ .PNG ФАЙЛ' }}
                      </span>
                      <span class="text-[10px] font-mono text-zinc-500 mt-1">До 1 МБ (64×64 или 64×32)</span>
                      <input type="file" accept="image/png" class="hidden" @change="onFileSelect" />
                    </label>

                    <div class="flex items-center justify-between bg-black/40 border border-white/10 px-3 py-2 font-mono text-xs">
                      <span class="text-zinc-400">Формат модели:</span>
                      <select
                        v-model="variant"
                        class="bg-transparent text-white font-bold outline-none cursor-pointer text-xs"
                      >
                        <option value="default" class="bg-[#151619] text-white">Classic (4px)</option>
                        <option value="slim" class="bg-[#151619] text-white">Slim (3px)</option>
                      </select>
                    </div>

                    <div class="comic-btn-wrap w-full">
                      <button
                        :disabled="!skinFile || isUploading"
                        @click="uploadSkin"
                        class="comic-btn w-full py-2.5 px-4 font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                        :style="{ '--btn-bg': '#0099FF', '--btn-color': '#FFFFFF' }"
                      >
                        {{ isUploading ? 'Загрузка…' : 'Применить скин' }}
                      </button>
                    </div>

                    <p v-if="statusMsg" class="text-xs font-mono text-[#4ADE80] flex items-center gap-1.5 mt-2">
                      <CheckCircle2 :size="14" /> {{ statusMsg }}
                    </p>
                  </div>

                  <!-- 3D просмотрщик -->
                  <div
                    class="flex justify-center items-center bg-black/50 p-4 border border-white/10 min-h-[250px] relative overflow-hidden"
                    style="clip-path: polygon(0% 2%, 100% 0%, 98% 98%, 2% 100%);"
                  >
                    <SkinViewer3D
                      :skin-url="skinPreviewUrl"
                      :variant="user?.skin_variant"
                      :variant-changed="onVariantChanged"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- КАРТОЧКА: ЖУРНАЛ ПОКУПОК -->
          <div class="card-outer group">
            <div
              class="card-box p-6 relative overflow-hidden"
              style="clip-path: polygon(0.5% 0%, 100% 1.4%, 99% 100%, 0% 98.6%); --accent: #FFCC00;"
            >
              <div class="comic-dots-pattern" aria-hidden="true" />

              <div class="relative z-10">
                <div class="flex items-center justify-between mb-4">
                  <span
                    class="font-heading font-black text-[10px] uppercase tracking-wider px-2 py-0.5 text-black"
                    style="background-color: #FFCC00; transform: rotate(-1.5deg);"
                  >
                    ЖУРНАЛ // ЗАКАЗЫ
                  </span>
                  <span class="text-[11px] font-mono text-zinc-500">
                    Автоматическая выдача
                  </span>
                </div>

                <div v-if="!purchases.length" class="text-xs font-mono text-zinc-500 py-6 text-center border border-dashed border-white/10 bg-black/30">
                  <PackageCheck :size="24" class="mx-auto mb-2 opacity-40" />
                  Заказов пока не зарегистрировано.
                </div>

                <div v-else class="space-y-2.5 font-mono text-xs">
                  <div
                    v-for="p in purchases"
                    :key="p.id"
                    class="flex items-center justify-between bg-black/40 border border-white/10 p-3 hover:border-white/20 transition"
                  >
                    <div>
                      <strong class="text-white block font-bold text-xs">{{ p.item_name }}</strong>
                      <span class="text-zinc-500 text-[10px]">
                        {{ new Date(p.created_at.replace(' ', 'T') + 'Z').toLocaleDateString('ru-RU') }}
                      </span>
                    </div>

                    <span
                      class="px-2 py-0.5 border text-[10px] font-bold"
                      :class="deliveryLabel(p.status).badgeCls"
                    >
                      {{ deliveryLabel(p.status).text }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  </main>
</template>

<style scoped>
/* =========================================================
   КАРТОЧКИ В СТИЛЕ САЙТА:
   Жесткие тени, аккуратный градиент и полутоновый растр
   ========================================================= */
.card-outer {
  position: relative;
  filter: drop-shadow(8px 8px 0px rgba(0, 0, 0, 0.5));
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
              filter 0.22s ease;
}

.card-outer:hover {
  transform: translate(-2px, -3px);
  filter: drop-shadow(12px 12px 0px rgba(0, 0, 0, 0.7));
}

.card-box {
  background: linear-gradient(180deg, #18191c 0%, #111214 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* Растр Ben-Day dots */
.comic-dots-pattern {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.04;
  background-image: radial-gradient(var(--accent, #0099FF) 1.5px, transparent 1.5px);
  background-size: 9px 9px;
  background-position: 0 0;
  z-index: 1;
}

/* =========================================================
   ФИРМЕННЫЕ КНОПКИ САЙТА:
   Наклон, жесткая тень, при ховере растут и БЕЛЕЮТ
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
  color: #0d0e10 !important;
}

.comic-btn:active {
  transform: scale(0.96) rotate(-1.2deg);
}
</style>
