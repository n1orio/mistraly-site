<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import SkinViewer3D from '../components/SkinViewer3D.vue'
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

/** Формат скина сменили — обновляем профиль, чтобы подпись не откатилась. */
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

function deliveryLabel(status: string): { text: string; cls: string } {
  switch (status) {
    case 'pending':
      return { text: 'Будет выдано при входе', cls: 'text-[#F6C442]' }
    case 'failed':
      return { text: 'Ошибка — напишите в тикеты', cls: 'text-[#FF4A4A]' }
    default:
      return { text: 'Выдано на сервере', cls: 'text-[#4ADE80]' }
  }
}
</script>

<template>
  <main class="w-full flex-1 flex flex-col items-center justify-start py-20 px-4 relative overflow-hidden page-bg select-none">

    <!-- Фоновая пунктирная линия по центру как на лендинге -->
    <div class="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 border-r-2 border-dashed border-[#4D4B33] pointer-events-none opacity-25"></div>

    <div class="w-full max-w-5xl relative z-10">

      <!-- ================= ШАПКА КАБИНЕТА ================= -->
      <div class="relative mb-14 group">
        <div class="relative card-shift-l">

          <!-- Стикер шапки -->
          <div class="stage-sticker-wrap absolute -top-8 left-3 z-30 select-none">
            <div class="text-[15px] font-black tracking-[0.04em] uppercase text-[#EFEBD9] leading-none mb-1 pl-1">
              АККАУНТ
            </div>
            <div class="bg-[#5865F2] text-white px-2.5 py-1 shadow-[3px_4px_0px_#1E2465] transform -rotate-2">
              <div class="text-[17px] font-black tracking-[-0.01em] uppercase text-[#181611] leading-tight">
                {{ user?.role === 'admin' ? 'АДМИНИСТРАТОР' : 'ПИЛОТ' }}
              </div>
            </div>
          </div>

          <!-- Наклонная плашка пользователя -->
          <div style="--card-fill:#161926;--card-border:#2D334D;--btn-shadow:#181B38" class="relative skew-card p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span class="text-xs font-bold uppercase tracking-widest text-[#60A5FA] block mb-1">
                Личный терминал Mistraly
              </span>
              <h1 class="deadlock-heading text-3xl sm:text-4xl text-[#EFEBD9] tracking-wide drop-shadow-[2px_2px_0px_rgba(0,0,0,0.7)]">
                {{ user?.username || auth.discord?.discord_username || 'Игрок' }}
              </h1>
            </div>

            <span class="skew-wrap">
              <button
                @click="logout"
                style="--btn-bg:#FF4A4A; --btn-color:#FFFFFF; --btn-shadow:#501111"
                class="skew-btn px-4 py-2 font-black text-xs uppercase tracking-widest cursor-pointer flex items-center gap-1.5"
              >
                <LogOut :size="13" /> Выйти
              </button>
            </span>
          </div>

        </div>
      </div>

      <!-- ================= ДВЕ КОЛОНКИ С КАРТОЧКАМИ ================= -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">

        <!-- ЛЕВАЯ КОЛОНКА (Статус проходки и инфо) -->
        <div class="lg:col-span-1 flex flex-col gap-10">

          <!-- КАРТОЧКА: ПРОХОДКА (Шаг 1 стиля) -->
          <div class="relative w-full group">
            <div class="stage-sticker-wrap absolute -top-7 left-3 z-30 select-none">
              <div class="text-[14px] font-black tracking-[0.04em] uppercase text-[#EFEBD9] leading-none mb-1 pl-1">
                СТАТУС
              </div>
              <div :class="hasPass ? 'bg-[#84CC16]' : 'bg-[#E05929]'" class="px-2.5 py-1 shadow-[3px_4px_0px_#14130E] transform -rotate-2">
                <div class="text-[16px] font-black tracking-[-0.01em] uppercase text-[#181611] leading-tight">
                  {{ hasPass ? 'АКТИВЕН' : 'ЗАКРЫТО' }}
                </div>
              </div>
            </div>

            <div style="--card-fill:#19221E;--card-border:#2D3F37;--btn-shadow:#0C1512" class="relative skew-card p-6 pt-9">
              <span class="text-sm font-bold text-[#D1FAE5] tracking-tight block mb-1">
                Доступ на сервер
              </span>
              <h3 class="text-2xl text-[#4ADE80] tracking-wide mb-3 drop-shadow-[1px_2px_0px_rgba(0,0,0,0.55)]">
                {{ hasPass ? 'Проходка активна' : 'Проходка отсутствует' }}
              </h3>
              <p class="text-xs text-[#D1FAE5] leading-relaxed mb-6 font-mono">
                {{
                  pass?.expires_at
                    ? `Действует до: ${new Date(pass.expires_at).toLocaleDateString('ru-RU')}`
                    : 'Бессрочный доступ на все воздушные маршруты Mistraly.'
                }}
              </p>

              <span class="skew-wrap w-full">
                <button
                  v-if="!hasPass"
                  @click="buyPass"
                  style="--btn-bg:#F6C442; --btn-color:#1C1B0D; --btn-shadow:#2A2912"
                  class="skew-btn w-full py-3 font-black text-xs uppercase tracking-widest cursor-pointer text-center"
                >
                  Купить проходку &rarr;
                </button>
                <a
                  v-else
                  href="/#launcher"
                  style="--btn-bg:#4ADE80; --btn-color:#142306; --btn-shadow:#0C1512"
                  class="skew-btn w-full py-3 font-black text-xs uppercase tracking-widest cursor-pointer text-center flex items-center justify-center gap-2 text-decoration-none"
                >
                  <Download :size="15" /> Скачать лаунчер
                </a>
              </span>
            </div>
          </div>

          <!-- КАРТОЧКА: ДАННЫЕ ПРОФИЛЯ -->
          <div class="relative w-full group">
            <div style="--card-fill:#161926;--card-border:#2D334D;--btn-shadow:#181B38" class="relative skew-card skew-card-flip p-6 space-y-4 font-mono text-xs text-[#C7D2FE]">
              <div class="flex justify-between border-b border-white/10 pb-2.5">
                <span class="text-zinc-400">Игровой ник:</span>
                <strong class="text-white font-bold">{{ linkedNickname?.nickname || 'не привязан' }}</strong>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-zinc-400">Discord:</span>
                <strong class="text-white font-bold">{{ auth.discord?.discord_username || 'привязан' }}</strong>
              </div>
            </div>
          </div>

        </div>

        <!-- ПРАВАЯ КОЛОНКА (Скин и Покупки) -->
        <div class="lg:col-span-2 flex flex-col gap-10">

          <!-- КАРТОЧКА: КАСТОМНЫЙ СКИН -->
          <div class="relative w-full group">
            <div class="stage-sticker-wrap absolute -top-7 right-4 z-30 select-none text-right">
              <div class="text-[14px] font-black tracking-[0.04em] uppercase text-[#EFEBD9] leading-none mb-1 pr-1">
                ГАРДЕРОБ
              </div>
              <div class="bg-[#F6C442] text-[#181611] px-2.5 py-1 shadow-[3px_4px_0px_#14130E] transform rotate-2">
                <div class="text-[16px] font-black tracking-[-0.01em] uppercase text-[#181611] leading-tight">
                  СКИН 3D
                </div>
              </div>
            </div>

            <div style="--card-fill:#383719;--card-border:#575427;--btn-shadow:#2A2912" class="relative skew-card skew-card-flip p-7 pt-9">
              <span class="text-sm font-bold text-[#EFEBD9] tracking-tight block mb-1">
                Внешний вид пилота
              </span>
              <h3 class="text-2xl text-[#F6C442] tracking-wide mb-2 drop-shadow-[1px_2px_0px_rgba(0,0,0,0.55)]">
                Кастомизация скина
              </h3>
              <p class="text-xs text-[#EFEBD9] leading-relaxed mb-6 font-mono">
                // Поддерживаются форматы Classic (64×32) и Slim (64×64). Файл мгновенно синхронизируется с сервером.
              </p>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div class="space-y-4">
                  <label class="w-full border-2 border-dashed border-[#F6C442]/40 hover:border-[#F6C442] bg-black/40 transition p-4 flex flex-col items-center justify-center cursor-pointer text-center group/upload">
                    <Upload :size="24" class="text-[#F6C442] group-hover/upload:scale-110 transition mb-2" />
                    <span class="text-xs font-mono font-bold text-white block">
                      {{ skinFile ? skinFile.name : 'ВЫБРАТЬ .PNG ФАЙЛ' }}
                    </span>
                    <span class="text-[10px] font-mono text-zinc-400 mt-1">До 1 МБ (64x64 или 64x32)</span>
                    <input type="file" accept="image/png" class="hidden" @change="onFileSelect" />
                  </label>

                  <div class="flex items-center gap-3 font-mono text-xs text-white">
                    <span>Формат:</span>
                    <select v-model="variant" class="bg-black/60 border border-white/20 px-3 py-1.5 text-xs text-white outline-none">
                      <option value="default">Classic 64×32</option>
                      <option value="slim">Slim 64×64</option>
                    </select>
                  </div>

                  <span class="skew-wrap">
                    <button
                      :disabled="!skinFile"
                      @click="uploadSkin"
                      style="--btn-bg:#F6C442; --btn-color:#181611"
                      class="skew-btn px-6 py-2.5 font-black text-xs uppercase tracking-widest cursor-pointer disabled:opacity-40"
                    >
                      Загрузить скин
                    </button>
                  </span>

                  <p v-if="statusMsg" class="text-xs font-mono text-[#4ADE80] mt-1">{{ statusMsg }}</p>
                </div>

                <!-- 3D-модель скина с вращением мышью -->
                <div class="flex justify-center items-center bg-black/40 p-4 border border-white/10 min-h-[220px]">
                  <SkinViewer3D
                    :skin-url="skinPreviewUrl"
                    :variant="user?.skin_variant"
                    :variant-changed="onVariantChanged"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- КАРТОЧКА: ИСТОРИЯ ПОКУПОК -->
          <div class="relative w-full group">
            <div class="stage-sticker-wrap absolute -top-7 left-3 z-30 select-none">
              <div class="text-[14px] font-black tracking-[0.04em] uppercase text-[#EFEBD9] leading-none mb-1 pl-1">
                ЖУРНАЛ
              </div>
              <div class="bg-[#5865F2] text-white px-2.5 py-1 shadow-[3px_4px_0px_#1E2465] transform -rotate-2">
                <div class="text-[16px] font-black tracking-[-0.01em] uppercase text-[#181611] leading-tight">
                  ЗАКАЗЫ
                </div>
              </div>
            </div>

            <div style="--card-fill:#161926;--card-border:#2D334D;--btn-shadow:#181B38" class="relative skew-card p-7 pt-9">
              <span class="text-sm font-bold text-[#C7D2FE] tracking-tight block mb-1">
                Транзакции и предметы
              </span>
              <h3 class="text-2xl text-[#60A5FA] tracking-wide mb-3 drop-shadow-[1px_2px_0px_rgba(0,0,0,0.55)]">
                История покупок
              </h3>
              <p class="text-xs text-[#C7D2FE] leading-relaxed mb-6 font-mono">
                // Предметы начисляются автоматически через модпак Create при подключении к серверу.
              </p>

              <div v-if="!purchases.length" class="text-xs font-mono text-zinc-400 py-4 text-center border border-dashed border-white/10 bg-black/20">
                Заказов пока не зарегистрировано.
              </div>

              <div v-else class="space-y-3 font-mono text-xs">
                <div
                  v-for="p in purchases"
                  :key="p.id"
                  class="flex items-center justify-between bg-black/40 border border-white/10 p-3.5 transition hover:border-[#60A5FA]/60"
                >
                  <div>
                    <strong class="text-white block font-bold text-sm">{{ p.item_name }}</strong>
                    <span class="text-zinc-500 text-[11px]">
                      {{ new Date(p.created_at.replace(' ', 'T') + 'Z').toLocaleDateString('ru-RU') }}
                    </span>
                  </div>
                  <span class="font-bold text-xs" :class="deliveryLabel(p.status).cls">
                    {{ deliveryLabel(p.status).text }}
                  </span>
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
/* Фирменный шрифт заголовков Deadlock / Comic */
h1, h3, .deadlock-heading {
  font-family: 'Russo One', 'Fira Sans Condensed', sans-serif;
}

/* Заголовок с ником игрока: класс используется в разметке, но стилей
   для него не было — текст выводился обычным шрифтом вместо
   фирменного заголовка сайта. */
.deadlock-heading {
  font-family: 'Russo One', 'Fira Sans Condensed', sans-serif;
  font-weight: 400;
}

/* =========================================================
   СКОШЕННЫЕ КАРТОЧКИ (Deadlock / Comic Polygons)
   ========================================================= */
.skew-card {
  background: var(--card-border, #5C592C);
  clip-path: polygon(0% 0%, 100% 8%, 100% 92%, 0% 100%);
  transform: rotate(-1.2deg) skewX(4deg);
  filter: drop-shadow(8px 10px 14px rgba(0, 0, 0, 0.6));
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
              filter 0.22s ease;
}

.skew-card::before {
  content: '';
  position: absolute;
  inset: 4px;
  background: var(--card-fill, #403F1E);
  clip-path: inherit;
  z-index: 0;
}

.skew-card > * {
  position: relative;
  z-index: 1;
}

.group:hover .skew-card {
  transform: rotate(-1.2deg) skewX(4deg) translate(-2px, -3px);
  filter: drop-shadow(12px 14px 18px rgba(0, 0, 0, 0.75));
}

.skew-card-flip {
  clip-path: polygon(0% 8%, 100% 0%, 100% 100%, 0% 92%);
  transform: rotate(-1.2deg) skewX(-4deg);
}

.group:hover .skew-card-flip {
  transform: rotate(-1.2deg) skewX(-4deg) translate(2px, -3px);
}

/* Сдвиг плашки шапки */
.card-shift-l {
  translate: -15px 0;
}
@media (max-width: 767px) {
  .card-shift-l { translate: 0 0; }
}

/* =========================================================
   СТИКЕРЫ ЭТАПОВ И СТАТУСОВ
   ========================================================= */
.stage-sticker-wrap {
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-origin: bottom center;
}

.group:hover .stage-sticker-wrap {
  transform: translateY(-4px) scale(1.06);
}

/* =========================================================
   СКОШЕННЫЕ КНОПКИ С БЕЛЫМ ХОВЕРОМ
   ========================================================= */
.skew-wrap {
  display: inline-block;
  filter: drop-shadow(6px 6px 0 var(--btn-shadow, rgba(0, 0, 0, 0.7)));
  transition: filter 0.2s ease;
}

.skew-wrap:hover {
  filter: drop-shadow(8px 8px 0 var(--btn-shadow, rgba(0, 0, 0, 0.9)));
}

.skew-btn {
  position: relative;
  display: inline-block;
  color: var(--btn-color, #FFFFFF);
  transform-origin: center;
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
              color 0.2s ease;
  will-change: transform;
}

/*
 * Кнопка с иконкой: центрируем содержимое здесь, а не классом `flex`
 * в разметке. Tailwind-утилита попадала в итоговый CSS раньше этого
 * правила, и `display: inline-block` её перебивал — justify-center и
 * gap не применялись, иконка уезжала на левый край плашки.
 */
.skew-btn:has(svg) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  isolation: isolate;
}

.skew-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: var(--btn-bg, #E05929);
  clip-path: polygon(0% 0%, 100% 10%, 100% 90%, 0% 100%);
  transform: rotate(-1.2deg) skewX(4deg);
  transition: background-color 0.2s ease, transform 0.22s ease;
}

.skew-btn:hover {
  transform: scale(1.06);
  color: #0D0E10 !important;
}

.skew-btn:hover::before {
  background-color: #FFFFFF !important;
}

.skew-btn:active {
  transform: scale(0.97);
}
</style>
