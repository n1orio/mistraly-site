<script setup lang="ts">
import { Check, ChevronLeft, MessageCircle, ShieldCheck, X } from 'lucide-vue-next'
import { usePurchaseStore } from '../stores/purchase'
import { useAuthStore } from '../stores/auth'

const store = usePurchaseStore()
const auth = useAuthStore()

function startAuth() {
  const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID || ''
  const redirect = encodeURIComponent(`${window.location.origin}/auth/discord`)
  location.href =
    `https://discord.com/api/oauth2/authorize?client_id=${clientId}` +
    `&redirect_uri=${redirect}&response_type=code&scope=identify` +
    `&state=${encodeURIComponent('purchase')}`
}

const hints: Record<string, string> = {
  pass: 'Сезонный пропуск активируется мгновенно после подтверждения оплаты.',
  item: 'Предмет будет выдан автоматически при следующем входе на сервер.',
  unban: 'Снятие блокировок применится при следующем подключении к серверу.'
}
</script>

<template>
  <div
    v-if="store.open"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none spider-overlay"
    @click.self="store.close"
  >
    <!-- Внешний комиксный контейнер со смещением черного контура -->
    <div class="spider-modal-frame w-full max-w-md relative">

      <!-- Кнопка закрытия (Комиксный стикер с крестиком) -->
      <button
        class="spider-close-btn absolute -top-3 -right-3 z-30 w-9 h-9 bg-[#FF0055] hover:bg-white text-white hover:text-black flex items-center justify-center font-black cursor-pointer transition-all"
        @click="store.close"
      >
        <X :size="18" stroke-width="3" />
      </button>

      <!-- Главная карточка терминала -->
      <div class="spider-card bg-[#0D0E12] border-2 border-white p-7 sm:p-8 relative overflow-hidden text-left">
        <!-- Ben-Day Dots Растр печати комикса -->
        <div class="benday-dots" aria-hidden="true" />

        <!-- Линии скоростного экшена (Spider-Verse Speed Lines) -->
        <div class="speed-lines" aria-hidden="true" />

        <div class="relative z-10">

          <!-- ВЕРХНЯЯ СТРОКА: Стикер и нумератор шагов -->
          <div class="flex items-center justify-between border-b-2 border-black pb-4 mb-6">
            <span class="spider-badge">
              {{ store.item ? 'ORDER // PORTAL' : 'MISTRALY // PASS' }}
            </span>

            <!-- Комиксный степпер 01 / 02 / 03 -->
            <div class="flex items-center gap-2 font-mono text-[11px] font-black">
              <span
                v-for="n in 3"
                :key="n"
                class="step-box"
                :class="{ 'step-active': store.step >= n }"
              >
                0{{ n }}
              </span>
            </div>
          </div>

          <!-- ================= ШАГ 1: DISCORD ================= -->
          <div v-if="store.step === 1" class="flex flex-col items-center text-center py-2">
            <div class="spider-icon-wrap mb-5">
              <div class="spider-icon-bg bg-[#5865F2]">
                <MessageCircle :size="32" class="text-white" stroke-width="2.5" />
              </div>
            </div>

            <h2 class="spider-glitch-title text-2xl font-black uppercase tracking-tight mb-2" data-text="ВХОД В СИСТЕМУ">
              Вход в систему
            </h2>
            <p class="text-xs text-zinc-400 mb-6 leading-relaxed max-w-xs font-mono">
              // Идентификация вселенной: привяжите Discord для генерации вайтлиста и защиты аккаунта.
            </p>

            <button
              @click="startAuth"
              class="spider-btn w-full py-3.5 px-6 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 cursor-pointer bg-[#5865F2] text-white hover:bg-white hover:text-black mb-4"
            >
              <MessageCircle :size="18" stroke-width="2.5" />
              Войти через Discord
            </button>

            <div class="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
              <ShieldCheck :size="15" class="text-[#00E5FF] shrink-0" stroke-width="2.5" />
              <span>Шифрование сессии без паролей</span>
            </div>
          </div>

          <!-- ================= ШАГ 2: ВВОД НИКНЕЙМА ================= -->
          <div v-else-if="store.step === 2" class="flex flex-col">
            <button
              v-if="auth.isAuthenticated"
              class="spider-back-btn inline-flex items-center gap-1 font-mono text-xs text-zinc-400 hover:text-[#00E5FF] mb-3 transition cursor-pointer self-start"
              @click="store.step = 1"
            >
              <ChevronLeft :size="16" stroke-width="3" /> НАЗАД
            </button>

            <h2 class="spider-glitch-title text-2xl font-black uppercase tracking-tight mb-1" data-text="ИГРОВОЙ ТЕГ">
              Игровой тег
            </h2>
            <p class="text-xs text-zinc-400 mb-5 font-mono">
              // Укажите ник в Minecraft (3–16 символов).
            </p>

            <div class="relative mb-3">
              <input
                v-model="store.nickname"
                maxlength="16"
                placeholder="NICKNAME_IN_GAME"
                class="spider-input w-full px-4 py-3 bg-[#050608] border-2 border-white text-white text-sm font-mono placeholder:text-zinc-600 outline-none transition"
                @input="store.error = ''"
              />
            </div>

            <span v-if="store.error" class="text-xs font-mono font-bold text-[#FF0055] mb-3 block">
              [!] {{ store.error }}
            </span>

            <button
              :disabled="!store.isNicknameValid || store.checking"
              @click="store.checkNickname"
              class="spider-btn w-full py-3.5 px-6 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer bg-[#00E5FF] text-black hover:bg-white disabled:opacity-50 mt-2"
            >
              {{ store.checking ? 'СКАНИРУЕМ БАЗУ…' : 'ПОДТВЕРДИТЬ ТЕГ →' }}
            </button>
          </div>

          <!-- ================= ШАГ 3: ЧЕК И ОПЛАТА ================= -->
          <div v-else-if="store.step === 3" class="flex flex-col">
            <button
              class="spider-back-btn inline-flex items-center gap-1 font-mono text-xs text-zinc-400 hover:text-[#00E5FF] mb-3 transition cursor-pointer self-start"
              @click="store.step = 2"
            >
              <ChevronLeft :size="16" stroke-width="3" /> СМЕНИТЬ НИК
            </button>

            <h2 class="spider-glitch-title text-2xl font-black uppercase tracking-tight mb-1" data-text="КВИТАНЦИЯ">
              Квитанция
            </h2>
            <p class="text-xs text-zinc-400 mb-4 font-mono">
              // Финализация ордера перед перемещением:
            </p>

            <!-- Стикер-квитанция с резким контуром -->
            <div class="spider-receipt bg-[#050608] border-2 border-dashed border-[#00E5FF]/60 p-4 mb-4 space-y-2.5 font-mono text-xs">
              <div class="flex justify-between">
                <span class="text-zinc-500">ИГРОК:</span>
                <strong class="text-white">{{ store.nickname || auth.user?.username }}</strong>
              </div>
              <div class="flex justify-between">
                <span class="text-zinc-500">DISCORD:</span>
                <strong class="text-white">{{ auth.user?.username || auth.discord?.discord_username }}</strong>
              </div>
              <div class="flex justify-between">
                <span class="text-zinc-500">ПАКЕТ:</span>
                <strong class="text-[#00E5FF]">
                  {{ store.item ? store.item.name : 'Mistraly Pass' }}
                  <span v-if="store.item && store.quantity > 1"> × {{ store.quantity }}</span>
                </strong>
              </div>

              <div class="border-t-2 border-white/10 pt-2.5 flex justify-between items-center text-sm">
                <span class="font-black text-white uppercase tracking-wider text-xs">ИТОГО К ОПЛАТЕ:</span>
                <strong class="text-xl font-black text-[#FF0055] spider-price">
                  {{ store.total || store.priceLabel }}
                </strong>
              </div>
            </div>

            <p v-if="hints[store.item?.item_type || 'pass']" class="text-[11px] font-mono text-zinc-400 mb-4 leading-relaxed">
              // {{ hints[store.item?.item_type || 'pass'] }}
            </p>

            <span v-if="store.error" class="text-xs font-mono font-bold text-[#FF0055] mb-3 block">
              [!] {{ store.error }}
            </span>

            <button
              :disabled="store.submitting"
              @click="store.confirmOrder"
              class="spider-btn w-full py-4 px-6 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer bg-[#00E5FF] text-black hover:bg-[#FF0055] hover:text-white disabled:opacity-60"
            >
              {{
                store.submitting
                  ? 'ТРАНСФЕР…'
                  : store.isFreeMode
                    ? 'ПОЛУЧИТЬ'
                    : 'ОПЛАТИТЬ →'
              }}
            </button>
          </div>

          <!-- ================= ШАГ 4: УСПЕХ ================= -->
          <div v-else class="flex flex-col items-center text-center py-4">
            <div class="spider-success-badge mb-4">
              <Check :size="36" class="text-black" stroke-width="3" />
            </div>

            <span class="font-black text-xs uppercase tracking-wider text-[#00E5FF] mb-1 font-mono">
              {{ store.isFreeMode ? '[ СТАТУС: ПОЛУЧЕНО ]' : '[ СТАТУС: ОПЛАЧЕНО ]' }}
            </span>
            <h2 class="spider-glitch-title text-2xl font-black uppercase tracking-tight mb-2" data-text="ДОСТУП ОТКРЫТ">
              Доступ открыт!
            </h2>
            <p class="text-xs text-zinc-300 mb-6 font-mono max-w-xs leading-relaxed">
              {{ store.result?.item }} для {{ store.nickname || auth.user?.username || 'вашего аккаунта' }}.
              {{ store.result?.delivery ? 'Предмет ждёт выдачи — зайдите на сервер.' : 'Доступ открыт, подключайтесь.' }}
            </p>

            <button
              @click="store.close"
              class="spider-btn px-10 py-3.5 font-black text-xs uppercase tracking-wider cursor-pointer bg-white text-black hover:bg-[#FF0055] hover:text-white"
            >
              ЗАКРЫТЬ ОКНО
            </button>
          </div>

        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Двойная комиксная тень на все модальное окно (Hard ink drop) */
.spider-modal-frame {
  box-shadow: 10px 10px 0px #000, 10px 10px 0px 2px #00E5FF;
  transform: rotate(-0.5deg);
}

/* Ben-Day Dots (Газетный растр Майлза Моралеса) */
.benday-dots {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.12;
  background-image: radial-gradient(#00E5FF 1.5px, transparent 1.5px);
  background-size: 8px 8px;
  z-index: 1;
}

/* Тонкие диагональные полосы скорости (Speed Lines) */
.speed-lines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.04;
  background: repeating-linear-gradient(
    -45deg,
    #FFFFFF,
    #FFFFFF 2px,
    transparent 2px,
    transparent 10px
  );
  z-index: 1;
}

/* RGB Glitch Заголовки (Spider-Verse Chromatic Aberration) */
.spider-glitch-title {
  color: #FFFFFF;
  text-shadow: -2px 0px 0px #00E5FF, 2px 0px 0px #FF0055;
  letter-spacing: -0.03em;
}

/* Стикер верхнего бейджа */
.spider-badge {
  font-family: monospace;
  font-weight: 900;
  font-size: 11px;
  background: #FF0055;
  color: #FFFFFF;
  padding: 3px 8px;
  transform: rotate(-2deg);
  box-shadow: 3px 3px 0px #000;
  border: 1px solid #FFF;
}

/* Кубики шагов 01, 02, 03 */
.step-box {
  padding: 2px 6px;
  border: 1.5px solid rgba(255, 255, 255, 0.2);
  color: #71717A;
  background: #000;
}

.step-active {
  background: #00E5FF;
  color: #000;
  border-color: #00E5FF;
  box-shadow: 2px 2px 0px #000;
}

/* Иконка Discord в комиксном оформлении */
.spider-icon-wrap {
  transform: rotate(-3deg);
}
.spider-icon-bg {
  width: 64px;
  height: 64px;
  border: 2px solid #FFF;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 5px 5px 0px #000, 5px 5px 0px 1px #00E5FF;
}

/* Подложка: лёгкий циановый отсвет по краю — «портал», а не просто затемнение */
.spider-overlay {
  box-shadow: inset 0 0 120px 20px rgba(0, 229, 255, 0.06);
}

/* Кнопка «Назад» */
.spider-back-btn {
  font-weight: 700;
  letter-spacing: 0.04em;
}
.spider-back-btn:hover {
  transform: translateX(-2px);
}

/* Кнопка закрытия */
.spider-close-btn {
  border: 2px solid #000;
  box-shadow: 3px 3px 0px #FFF;
  transform: rotate(4deg);
}
.spider-close-btn:hover {
  transform: scale(1.1) rotate(0deg);
}

/* Поле ввода ника */
.spider-input {
  box-shadow: 4px 4px 0px #000, 4px 4px 0px 1px rgba(255, 255, 255, 0.2);
}
.spider-input:focus {
  border-color: #00E5FF;
  box-shadow: 4px 4px 0px #000, 4px 4px 0px 2px #00E5FF;
}

/* ФИРМЕННЫЕ КНОПКИ В СТИЛЕ SPIDER-VERSE */
.spider-btn {
  border: 2px solid #000;
  box-shadow: 5px 5px 0px #000, 5px 5px 0px 2px #FFF;
  transform: rotate(-1deg);
  transition: transform 0.15s cubic-bezier(0.2, 0.9, 0.3, 1.3),
              box-shadow 0.15s ease,
              background-color 0.15s ease,
              color 0.15s ease;
}

.spider-btn:hover:not(:disabled) {
  transform: scale(1.03) rotate(0.5deg);
  box-shadow: 7px 7px 0px #000, 7px 7px 0px 2px #00E5FF;
}

.spider-btn:active:not(:disabled) {
  transform: scale(0.97) rotate(-1deg);
  box-shadow: 2px 2px 0px #000;
}

/* Квитанция */
.spider-receipt {
  box-shadow: inset 2px 2px 0px rgba(0, 0, 0, 0.5), 4px 4px 0px #000;
}

.spider-price {
  text-shadow: 2px 2px 0px #000;
}

/* Бейдж успешного завершения */
.spider-success-badge {
  width: 64px;
  height: 64px;
  background: #00E5FF;
  border: 2px solid #FFF;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 5px 5px 0px #000;
  transform: rotate(-4deg);
}
</style>
