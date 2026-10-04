<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import SkinViewer3D from '../components/SkinViewer3D.vue'
import {
  Download,
  LogOut,
  Upload,
  User,
  ShieldCheck,
  Check,
  Compass,
  FileText,
  Sparkles,
  ArrowRight
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
const dragActive = ref(false)

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

function onDrop(e: DragEvent) {
  dragActive.value = false
  if (e.dataTransfer?.files?.[0]) {
    const f = e.dataTransfer.files[0]
    if (f.type === 'image/png') skinFile.value = f
  }
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

function deliveryInfo(status: string): { label: string; stampCls: string } {
  switch (status) {
    case 'pending':
      return { label: 'В ПУТИ // ОЖИДАНИЕ', stampCls: 'stamp-yellow' }
    case 'failed':
      return { label: 'ОШИБКА ДОСТАВКИ', stampCls: 'stamp-red' }
    default:
      return { label: 'ВЫДАНО В ТРЮМ', stampCls: 'stamp-green' }
  }
}
</script>

<template>
  <main class="w-full flex-1 flex flex-col items-center page-bg bg-[var(--bg-page)] text-[var(--text-main)] px-4 pt-28 pb-20 select-none relative overflow-hidden">

    <!-- Центральная пунктирная навигационная ось дирижабля (как на лендинге) -->
    <div class="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 border-r-2 border-dashed border-[#4D4B33] pointer-events-none opacity-20"></div>

    <div class="w-full max-w-5xl relative z-10">

      <!-- ================= ШАПКА: БОРТОВОЙ ЖУРНАЛ / СТАТУС ПИЛОТА ================= -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div class="flex items-center gap-2 mb-1.5">
            <span class="inline-block bg-[#0099FF] text-black font-heading font-black text-xs uppercase px-2 py-0.5 tracking-wider rotate-[-1.5deg] shadow-[3px_3px_0px_rgba(0,0,0,0.6)]">
              MISTRALY // FLIGHT DECK
            </span>
            <span class="text-xs font-mono text-zinc-500">// СЕРВЕРНЫЙ ПРОФИЛЬ</span>
          </div>
          <h1 class="font-heading font-black text-3xl sm:text-5xl text-white tracking-tight uppercase">
            Каюта <span class="word-hl">пилота</span>
          </h1>
        </div>

        <button
          @click="logout"
          class="font-mono text-xs uppercase tracking-wider text-zinc-400 hover:text-white flex items-center gap-2 py-2 px-3 border border-white/10 hover:border-white/30 bg-black/40 transition cursor-pointer"
        >
          <LogOut :size="13" /> Завершить сеанс
        </button>
      </div>

      <!-- ================= ОСНОВНАЯ СЕТКА ================= -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-10">

        <!-- ================= ЛЕВАЯ КОЛОНКА: ПОЛЁТНЫЙ ПАСПОРТ (ID CARD) ================= -->
        <div class="lg:col-span-5 relative group">

          <!-- Выносная печать-шеврон слева вверху (как в секции модов) -->
          <div class="popout-badge pointer-events-none">
            <div class="w-16 h-16 rounded-xl bg-[#1e2333] border-2 border-[#0099FF]/40 text-[#0099FF] flex items-center justify-center badge-shadow rotate-[-4deg] group-hover:rotate-0 group-hover:scale-105 transition-all">
              <Compass :size="30" />
            </div>
          </div>

          <!-- Наклонный стикер статуса справа вверху -->
          <div class="absolute -top-3.5 right-4 z-20 pointer-events-none">
            <div
              :class="hasPass ? 'bg-[#4ADE80] text-[#0d2310]' : 'bg-[#E05929] text-white'"
              class="font-heading font-black text-xs uppercase tracking-wider px-3 py-1 shadow-[4px_4px_0px_rgba(0,0,0,0.7)] rotate-[2deg]"
            >
              {{ hasPass ? 'ДОПУЩЕН К ПОЛЁТУ' : 'ТРЕБУЕТСЯ ВИЗА' }}
            </div>
          </div>

          <!-- Само удостоверение пилота -->
          <div
            class="flight-pass-card bg-gradient-to-b from-[#18191d] to-[#121316] p-6 pt-9 border border-white/10 relative overflow-hidden"
            style="clip-path: polygon(0% 1.8%, 100% 0%, 98.8% 98.8%, 1.2% 100%);"
          >
            <div class="comic-dots-pattern" aria-hidden="true" />

            <div class="relative z-10">

              <!-- Заголовок паспорта -->
              <div class="pl-14 mb-4">
                <span class="text-[10px] font-mono uppercase text-zinc-500 tracking-widest block">
                  PILOT IDENTIFICATION CARD
                </span>
                <h2 class="font-heading font-black text-2xl text-white tracking-tight uppercase leading-none">
                  {{ user?.username || auth.discord?.discord_username || 'Неизвестный' }}
                </h2>
              </div>

              <!-- 3D ГОЛОГРАММА / ФОТОГРАФИЯ В ПАСПОРТЕ -->
              <div class="relative w-full aspect-[4/3] bg-black/60 border border-white/15 my-4 flex items-center justify-center overflow-hidden pilot-photo-frame">
                <div class="absolute top-2 left-2 z-10 flex items-center gap-1 font-mono text-[9px] text-[#0099FF] bg-black/70 px-2 py-0.5 border border-white/10">
                  <span class="w-1.5 h-1.5 rounded-full bg-[#0099FF] animate-pulse"></span>
                  LIVE 3D
                </div>

                <div class="absolute bottom-2 right-2 z-10 font-mono text-[9px] text-zinc-500 bg-black/70 px-2 py-0.5">
                  ТЯНИТЕ ДЛЯ ВРАЩЕНИЯ
                </div>

                <SkinViewer3D
                  :skin-url="skinPreviewUrl"
                  :variant="user?.skin_variant"
                  :variant-changed="onVariantChanged"
                />
              </div>

              <!-- БЛОК ДАННЫХ ПИЛОТА (Табличка) -->
              <div class="space-y-2 font-mono text-xs mb-6 bg-black/40 p-3.5 border border-dashed border-white/15">
                <div class="flex justify-between items-center border-b border-white/10 pb-1.5">
                  <span class="text-zinc-500">Позывной Minecraft:</span>
                  <strong class="text-white font-bold">{{ linkedNickname?.nickname || 'Не привязан' }}</strong>
                </div>
                <div class="flex justify-between items-center border-b border-white/10 pb-1.5">
                  <span class="text-zinc-500">Discord ID:</span>
                  <strong class="text-[#60A5FA] font-bold flex items-center gap-1">
                    <ShieldCheck :size="13" />
                    {{ auth.discord?.discord_username || 'Привязан' }}
                  </strong>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-zinc-500">Mistraly Pass:</span>
                  <strong :class="hasPass ? 'text-[#4ADE80]' : 'text-[#E05929]'" class="font-bold">
                    {{ hasPass ? 'Бессрочный допуск' : 'Не оформлен' }}
                  </strong>
                </div>
              </div>

              <!-- ГЛАВНАЯ КНОПКА ДЕЙСТВИЯ -->
              <div class="comic-btn-wrap w-full">
                <button
                  v-if="!hasPass"
                  @click="buyPass"
                  class="comic-btn w-full py-3.5 px-6 font-heading font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                  :style="{ '--btn-bg': '#E05929', '--btn-color': '#FFFFFF' }"
                >
                  Оформить проходку &rarr;
                </button>
                <a
                  v-else
                  href="/#launcher"
                  class="comic-btn w-full py-3.5 px-6 font-heading font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer text-decoration-none"
                  :style="{ '--btn-bg': '#4ADE80', '--btn-color': '#112211' }"
                >
                  <Download :size="16" /> Скачать Mistraly Launcher
                </a>
              </div>

            </div>
          </div>
        </div>

        <!-- ================= ПРАВАЯ КОЛОНКА: ГАРДЕРОБ И МАНИФЕСТ ================= -->
        <div class="lg:col-span-7 flex flex-col gap-8">

          <!-- БЛОК 1: МОДИФИКАЦИЯ ЭКИПИРОВКИ (Скин) -->
          <div class="relative group">
            <!-- Стикер заголовка -->
            <div class="absolute -top-3 left-4 z-20 pointer-events-none">
              <span class="bg-[#FFCC00] text-black font-heading font-black text-[11px] uppercase tracking-wider px-2.5 py-1 rotate-[-2deg] shadow-[3px_3px_0px_rgba(0,0,0,0.6)]">
                МАСТЕРСКАЯ // ГАРДЕРОБ
              </span>
            </div>

            <div
              class="panel-card bg-gradient-to-b from-[#18191d] to-[#121316] p-6 sm:p-7 pt-8 border border-white/10 relative overflow-hidden"
              style="clip-path: polygon(0.4% 0%, 100% 1.2%, 99.2% 100%, 0% 98.8%);"
            >
              <div class="comic-dots-pattern" aria-hidden="true" />

              <div class="relative z-10">
                <div class="mb-4">
                  <h3 class="font-heading font-black text-xl text-white tracking-tight uppercase mb-1">
                    Смена формы пилота
                  </h3>
                  <p class="text-xs font-mono text-zinc-400">
                    // Перетащите .PNG файл скина или выберите с устройства. Изменения мгновенно применяются на сервере.
                  </p>
                </div>

                <!-- Drag & Drop Зона -->
                <div
                  class="border-2 border-dashed p-6 text-center transition cursor-pointer relative bg-black/40 mb-4 group/drop"
                  :class="dragActive ? 'border-[#0099FF] bg-[#0099FF]/10' : 'border-white/20 hover:border-white/40'"
                  @dragover.prevent="dragActive = true"
                  @dragleave.prevent="dragActive = false"
                  @drop.prevent="onDrop"
                >
                  <input type="file" accept="image/png" class="absolute inset-0 opacity-0 cursor-pointer" @change="onFileSelect" />
                  <Upload :size="28" class="mx-auto mb-2 text-[#FFCC00] group-hover/drop:scale-110 transition" />
                  <p class="font-mono text-xs font-bold text-white mb-1">
                    {{ skinFile ? skinFile.name : 'ПЕРЕТАЩИТЕ .PNG СКИЙН ИЛИ НАЖМИТЕ ДЛЯ ВЫБОРА' }}
                  </p>
                  <p class="font-mono text-[10px] text-zinc-500">
                    Поддерживаются 64×64 (современный) и 64×32 (классический) • до 1 МБ
                  </p>
                </div>

                <!-- Переключатель формата и кнопка сохранения -->
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
                  <div class="flex items-center gap-2 font-mono text-xs bg-black/60 p-1.5 border border-white/10 w-fit">
                    <span class="text-zinc-500 px-2">Формат рук:</span>
                    <button
                      type="button"
                      @click="variant = 'default'"
                      class="px-3 py-1 font-bold transition cursor-pointer"
                      :class="variant === 'default' ? 'bg-[#0099FF] text-black' : 'text-zinc-400 hover:text-white'"
                    >
                      Classic (4px)
                    </button>
                    <button
                      type="button"
                      @click="variant = 'slim'"
                      class="px-3 py-1 font-bold transition cursor-pointer"
                      :class="variant === 'slim' ? 'bg-[#0099FF] text-black' : 'text-zinc-400 hover:text-white'"
                    >
                      Slim (3px)
                    </button>
                  </div>

                  <div class="comic-btn-wrap">
                    <button
                      :disabled="!skinFile || isUploading"
                      @click="uploadSkin"
                      class="comic-btn py-2.5 px-6 font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-30"
                      :style="{ '--btn-bg': '#FFCC00', '--btn-color': '#111214' }"
                    >
                      <Check :size="14" />
                      {{ isUploading ? 'Загружаем…' : 'Утвердить форму' }}
                    </button>
                  </div>
                </div>

                <p v-if="statusMsg" class="font-mono text-xs text-[#4ADE80] mt-3">
                  ✔ {{ statusMsg }}
                </p>
              </div>
            </div>
          </div>

          <!-- БЛОК 2: ГРУЗОВОЙ МАНИФЕСТ (Журнал заказов) -->
          <div class="relative group">
            <div class="absolute -top-3 left-4 z-20 pointer-events-none">
              <span class="bg-[#0099FF] text-black font-heading font-black text-[11px] uppercase tracking-wider px-2.5 py-1 rotate-[1.5deg] shadow-[3px_3px_0px_rgba(0,0,0,0.6)]">
                МАНИФЕСТ // ГРУЗОВОЙ ОТСЕК
              </span>
            </div>

            <div
              class="panel-card bg-gradient-to-b from-[#18191d] to-[#121316] p-6 sm:p-7 pt-8 border border-white/10 relative overflow-hidden"
              style="clip-path: polygon(0% 1%, 100% 0%, 99.2% 99%, 0.8% 100%);"
            >
              <div class="comic-dots-pattern" aria-hidden="true" />

              <div class="relative z-10">
                <div class="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                  <div>
                    <h3 class="font-heading font-black text-xl text-white tracking-tight uppercase">
                      История грузов и услуг
                    </h3>
                    <p class="text-xs font-mono text-zinc-500">
                      // Предметы и услуги, прикрепленные к вашей учётной записи
                    </p>
                  </div>
                  <FileText :size="20" class="text-zinc-600 hidden sm:block" />
                </div>

                <!-- Пустое состояние -->
                <div v-if="!purchases.length" class="text-center py-8 border border-dashed border-white/10 bg-black/30 font-mono text-xs text-zinc-500">
                  <p class="mb-1 text-zinc-400 font-bold">Трюм пуст</p>
                  <p class="text-[11px] mb-4">В бортовом журнале пока нет зарегистрированных доставок.</p>
                  <router-link
                    to="/shop"
                    class="inline-flex items-center gap-1.5 text-[#0099FF] hover:underline uppercase text-[11px] font-bold"
                  >
                    Перейти в судовой магазин &rarr;
                  </router-link>
                </div>

                <!-- Список заказов в виде товарной ведомости -->
                <div v-else class="space-y-2.5 font-mono text-xs">
                  <div
                    v-for="p in purchases"
                    :key="p.id"
                    class="manifest-row p-3 bg-black/40 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                  >
                    <div class="flex items-center gap-3">
                      <span class="w-1.5 h-1.5 bg-[#0099FF] rotate-45"></span>
                      <div>
                        <strong class="text-white block font-bold text-sm tracking-tight font-heading uppercase">
                          {{ p.item_name }}
                        </strong>
                        <span class="text-zinc-500 text-[10px]">
                          РЕЙС ОТ {{ new Date(p.created_at.replace(' ', 'T') + 'Z').toLocaleDateString('ru-RU') }}
                        </span>
                      </div>
                    </div>

                    <div :class="deliveryInfo(p.status).stampCls" class="stamp">
                      {{ deliveryInfo(p.status).label }}
                    </div>
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
   ВЫДЕЛЕНИЕ СЛОВА В ЗАГОЛОВКЕ (как «Сервер» на лендинге)
   ========================================================= */
.word-hl {
  display: inline-block;
  color: #181611;
  background: #0099FF;
  font-weight: 900;
  padding: 0 0.28em;
  margin: 0 0.04em;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
  transform: rotate(-1.5deg);
  user-select: none;
}

/* =========================================================
   ПОЛЁТНЫЙ ПАСПОРТ & ПАНЕЛИ
   ========================================================= */
.flight-pass-card,
.panel-card {
  filter: drop-shadow(10px 10px 0px rgba(0, 0, 0, 0.6));
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
              filter 0.25s ease;
}

.group:hover .flight-pass-card,
.group:hover .panel-card {
  transform: translateY(-3px);
  filter: drop-shadow(14px 14px 0px rgba(0, 0, 0, 0.75));
}

/* Выносной круглый значок-шеврон */
.popout-badge {
  position: absolute;
  top: -18px;
  left: -12px;
  z-index: 30;
}

.badge-shadow {
  box-shadow: 6px 6px 0px rgba(0, 0, 0, 0.7);
}

/* Рамка под 3D персонажа */
.pilot-photo-frame {
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.8);
}

/* Точечный растр Ben-Day */
.comic-dots-pattern {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.05;
  background-image: radial-gradient(#0099FF 1.5px, transparent 1.5px);
  background-size: 8px 8px;
  background-position: 0 0;
  z-index: 1;
}

/* Штампы статусов в накладной */
.stamp {
  font-family: 'Russo One', 'Fira Sans Condensed', sans-serif;
  font-size: 10px;
  padding: 3px 8px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  transform: rotate(-1.5deg);
  border-width: 1px;
  border-style: solid;
}

.stamp-green {
  background: rgba(74, 222, 128, 0.12);
  color: #4ADE80;
  border-color: rgba(74, 222, 128, 0.4);
}

.stamp-yellow {
  background: rgba(255, 204, 0, 0.12);
  color: #FFCC00;
  border-color: rgba(255, 204, 0, 0.4);
}

.stamp-red {
  background: rgba(244, 63, 94, 0.12);
  color: #FB7185;
  border-color: rgba(244, 63, 94, 0.4);
}

/* =========================================================
   ФИРМЕННЫЕ КНОПКИ:
   Трапециевидный скос, жесткая тень, ховер с отбеливанием
   ========================================================= */
.comic-btn-wrap {
  position: relative;
  display: inline-flex;
  filter: drop-shadow(6px 6px 0px rgba(0, 0, 0, 0.7));
  transition: filter 0.22s ease;
}

.comic-btn-wrap:hover {
  filter: drop-shadow(8px 8px 0px rgba(0, 0, 0, 0.9));
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
