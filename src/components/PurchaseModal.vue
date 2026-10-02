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
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none"
    @click.self="store.close"
  >
    <!-- Внешний комиксный фрейм с двойной жесткой тенью -->
    <div class="comic-modal-frame w-full max-w-md relative">

      <!-- Кнопка закрытия (вырезанный стикер) -->
      <button
        class="comic-close-btn absolute -top-3 -right-3 z-30 w-9 h-9 bg-[#FF0055] hover:bg-white text-white hover:text-black flex items-center justify-center cursor-pointer transition-transform"
        @click="store.close"
      >
        <X :size="18" stroke-width="3" />
      </button>

      <!-- Главная карточка: живая вибрирующая бумага -->
      <div class="comic-paper-card relative overflow-hidden bg-[#111216] border-2 border-white/90 p-7 sm:p-8 text-left">

        <!-- СЛОЙ 1: Шевелящаяся текстура волокон бумаги (10 FPS Stop-Motion) -->
        <div class="paper-texture-boil" aria-hidden="true" />

        <!-- СЛОЙ 2: Газетный растр печати (Ben-Day dots) -->
        <div class="breeze-dots" aria-hidden="true" />

        <!-- Контент поверх живой бумаги -->
        <div class="relative z-10">

          <!-- Шапка карточки: Бейдж и шаги 01 / 02 / 03 -->
          <div class="flex items-center justify-between border-b-2 border-white/10 pb-4 mb-6">
            <span class="comic-pill-badge">
              {{ store.item ? 'MISTRALY // ЗАКАЗ' : 'MISTRALY // PASS' }}
            </span>

            <div class="flex items-center gap-1.5 font-mono text-[11px] font-black">
              <span
                v-for="n in 3"
                :key="n"
                class="step-badge"
                :class="{ 'step-badge-active': store.step >= n }"
              >
                0{{ n }}
              </span>
            </div>
          </div>

          <!-- ================= ШАГ 1: DISCORD ================= -->
          <div v-if="store.step === 1" class="flex flex-col items-center text-center py-2">
            <div class="comic-discord-icon mb-5">
              <div class="w-16 h-16 bg-[#5865F2] border-2 border-white flex items-center justify-center">
                <MessageCircle :size="32" class="text-white" stroke-width="2.5" />
              </div>
            </div>

            <h2 class="comic-title text-2xl font-black uppercase tracking-tight text-white mb-2">
              Вход в систему
            </h2>
            <p class="text-xs text-zinc-400 mb-6 leading-relaxed max-w-xs font-mono">
              // Привязка Discord генерирует ваш профиль, открывает вайтлист и защищает аккаунт.
            </p>

            <button
              @click="startAuth"
              class="comic-action-btn w-full py-3.5 px-6 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 cursor-pointer bg-[#5865F2] text-white hover:bg-white hover:text-black mb-4"
            >
              <MessageCircle :size="18" stroke-width="2.5" />
              Войти через Discord
            </button>

            <div class="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
              <ShieldCheck :size="15" class="text-[#00E5FF] shrink-0" stroke-width="2.5" />
              <span>Безопасный шлюз без ввода пароля</span>
            </div>
          </div>

          <!-- ================= ШАГ 2: НИКНЕЙМ ================= -->
          <div v-else-if="store.step === 2" class="flex flex-col">
            <button
              v-if="auth.isAuthenticated"
              class="inline-flex items-center gap-1 font-mono text-xs text-zinc-400 hover:text-[#00E5FF] mb-3 transition cursor-pointer self-start"
              @click="store.step = 1"
            >
              <ChevronLeft :size="16" stroke-width="3" /> НАЗАД
            </button>

            <h2 class="comic-title text-2xl font-black uppercase tracking-tight text-white mb-1">
              Игровой никнейм
            </h2>
            <p class="text-xs text-zinc-400 mb-5 font-mono">
              // Введите ник в Minecraft (от 3 до 16 символов, только латиница).
            </p>

            <div class="relative mb-3">
              <input
                v-model="store.nickname"
                maxlength="16"
                placeholder="Твой никнейм в игре..."
                class="comic-input w-full px-4 py-3 bg-[#08090C] border-2 border-white text-white text-sm font-mono placeholder:text-zinc-600 outline-none transition"
                @input="store.error = ''"
              />
            </div>

            <span v-if="store.error" class="text-xs font-mono font-bold text-[#FF0055] mb-3 block">
              [!] {{ store.error }}
            </span>

            <button
              :disabled="!store.isNicknameValid || store.checking"
              @click="store.checkNickname"
              class="comic-action-btn w-full py-3.5 px-6 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer bg-[#00E5FF] text-black hover:bg-white disabled:opacity-50 mt-2"
            >
              {{ store.checking ? 'ПРОВЕРЯЕМ БАЗУ…' : 'ПРОДОЛЖИТЬ →' }}
            </button>
          </div>

          <!-- ================= ШАГ 3: ЧЕК И ОПЛАТА ================= -->
          <div v-else-if="store.step === 3" class="flex flex-col">
            <button
              class="inline-flex items-center gap-1 font-mono text-xs text-zinc-400 hover:text-[#00E5FF] mb-3 transition cursor-pointer self-start"
              @click="store.step = 2"
            >
              <ChevronLeft :size="16" stroke-width="3" /> СМЕНИТЬ НИК
            </button>

            <h2 class="comic-title text-2xl font-black uppercase tracking-tight text-white mb-1">
              Проверка заказа
            </h2>
            <p class="text-xs text-zinc-400 mb-4 font-mono">
              // Подтвердите реквизиты перед переходом к шлюзу:
            </p>

            <div class="comic-receipt bg-[#08090C] border-2 border-dashed border-[#00E5FF]/60 p-4 mb-4 space-y-2.5 font-mono text-xs">
              <div class="flex justify-between">
                <span class="text-zinc-500">ИГРОК:</span>
                <strong class="text-white">{{ store.nickname || auth.user?.username }}</strong>
              </div>
              <div class="flex justify-between">
                <span class="text-zinc-500">DISCORD:</span>
                <strong class="text-white">{{ auth.user?.username || auth.discord?.discord_username }}</strong>
              </div>
              <div class="flex justify-between">
                <span class="text-zinc-500">ПОЗИЦИЯ:</span>
                <strong class="text-[#00E5FF]">
                  {{ store.item ? store.item.name : 'Mistraly Pass' }}
                  <span v-if="store.item && store.quantity > 1"> × {{ store.quantity }}</span>
                </strong>
              </div>

              <div class="border-t-2 border-white/10 pt-2.5 flex justify-between items-center text-sm">
                <span class="font-black text-white uppercase tracking-wider text-xs">ИТОГО:</span>
                <strong class="text-xl font-black text-[#FF0055]">
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
              class="comic-action-btn w-full py-4 px-6 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer bg-[#00E5FF] text-black hover:bg-[#FF0055] hover:text-white disabled:opacity-60"
            >
              {{
                store.submitting
                  ? 'ОФОРМЛЯЕМ…'
                  : store.isFreeMode
                    ? 'ПОЛУЧИТЬ'
                    : 'ОПЛАТИТЬ →'
              }}
            </button>
          </div>

          <!-- ================= ШАГ 4: УСПЕХ ================= -->
          <div v-else class="flex flex-col items-center text-center py-4">
            <div class="w-16 h-16 bg-[#00E5FF] border-2 border-white flex items-center justify-center mb-4 rotate-[-3deg] shadow-[4px_4px_0px_#000]">
              <Check :size="36" class="text-black" stroke-width="3" />
            </div>

            <span class="font-black text-xs uppercase tracking-wider text-[#00E5FF] mb-1 font-mono">
              {{ store.isFreeMode ? '[ СТАТУС: ПОЛУЧЕНО ]' : '[ СТАТУС: ОПЛАЧЕНО ]' }}
            </span>
            <h2 class="comic-title text-2xl font-black uppercase tracking-tight text-white mb-2">
              Доступ открыт!
            </h2>
            <p class="text-xs text-zinc-300 mb-6 font-mono max-w-xs leading-relaxed">
              // Пропуск активирован для {{ store.nickname || auth.user?.username }}. Запускайте Breeze Launcher и взлетайте.
            </p>

            <button
              @click="store.close"
              class="comic-action-btn px-10 py-3.5 font-black text-xs uppercase tracking-wider cursor-pointer bg-white text-black hover:bg-[#FF0055] hover:text-white"
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
/* Двойная комиксная тень на все окно */
.comic-modal-frame {
  box-shadow: 10px 10px 0px #000, 10px 10px 0px 2px #00E5FF;
  transform: rotate(-0.5deg);
}

/* ============================================================
   АНИМИРОВАННАЯ ТЕКСТУРА БУМАГИ (Spider-Verse Paper Boil)
   ============================================================ */
.paper-texture-boil {
  position: absolute;
  inset: -60px; /* Вылет, чтобы не было видно краев при сдвигах */
  pointer-events: none;
  z-index: 1;
  opacity: 0.22;
  mix-blend-mode: overlay;

  /* Процедурный шум волокон крафтовой бумаги (Data URI SVG) */
  background-image:
    radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.12), transparent 75%),
    url("data:image/svg+xml,%3Csvg viewBox='0 0 240 240' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paperNoise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paperNoise)' opacity='0.8'/%3E%3C/svg%3E");
  background-size: auto, 180px 180px;

  /* Дискретная покадровая смена положений бумаги (10 FPS) */
  animation: paperBoilMotion 0.8s steps(1) infinite;
}

@keyframes paperBoilMotion {
  0% {
    transform: translate(0px, 0px) scale(1) rotate(0deg);
    background-position: 0 0, 0 0;
  }
  12% {
    transform: translate(-4px, 3px) scale(1.02) rotate(0.4deg);
    background-position: 30px -20px, 50px 20px;
  }
  25% {
    transform: translate(3px, -3px) scale(0.99) rotate(-0.5deg);
    background-position: -50px 30px, -30px 60px;
  }
  37% {
    transform: translate(-3px, -2px) scale(1.01) rotate(0.3deg);
    background-position: 20px 50px, 40px -30px;
  }
  50% {
    transform: translate(4px, 2px) scale(0.98) rotate(-0.3deg);
    background-position: -40px -20px, -60px -20px;
  }
  62% {
    transform: translate(-2px, 4px) scale(1.02) rotate(0.5deg);
    background-position: 60px 20px, 30px 40px;
  }
  75% {
    transform: translate(3px, -1px) scale(1) rotate(-0.4deg);
    background-position: -20px -50px, 20px -60px;
  }
  87% {
    transform: translate(-1px, -3px) scale(1.01) rotate(0.2deg);
    background-position: 40px -40px, -40px 30px;
  }
  100% {
    transform: translate(0px, 0px) scale(1) rotate(0deg);
    background-position: 0 0, 0 0;
  }
}

/* Вибрация контура самой карточки (Рубленые края вырезанного листа) */
.comic-paper-card {
  animation: cardEdgeJitter 1.2s steps(4) infinite;
}

@keyframes cardEdgeJitter {
  0%, 100% {
    clip-path: polygon(0% 0.8%, 100% 0%, 99.3% 99.4%, 0.7% 100%);
  }
  25% {
    clip-path: polygon(0.5% 0%, 99.5% 0.7%, 100% 100%, 0% 99.2%);
  }
  50% {
    clip-path: polygon(0% 0.6%, 100% 0.2%, 99% 99.7%, 0.4% 100%);
  }
  75% {
    clip-path: polygon(0.7% 0.2%, 99.3% 0%, 100% 99.2%, 0% 99.8%);
  }
}

/* Ben-Day Dots Точечный растр */
.breeze-dots {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.08;
  background-image: radial-gradient(#00E5FF 1.5px, transparent 1.5px);
  background-size: 8px 8px;
  z-index: 1;
}

/* Заголовки с эффектом хроматической аберрации */
.comic-title {
  text-shadow: -2px 0px 0px #00E5FF, 2px 0px 0px #FF0055;
  letter-spacing: -0.02em;
}

/* Верхний стикер */
.comic-pill-badge {
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

/* Шаги 01, 02, 03 */
.step-badge {
  padding: 2px 6px;
  border: 1.5px solid rgba(255, 255, 255, 0.2);
  color: #71717A;
  background: #000;
}

.step-badge-active {
  background: #00E5FF;
  color: #000;
  border-color: #00E5FF;
  box-shadow: 2px 2px 0px #000;
}

/* Иконка Discord */
.comic-discord-icon {
  transform: rotate(-3deg);
  filter: drop-shadow(4px 4px 0px #000);
}

/* Кнопка закрытия */
.comic-close-btn {
  border: 2px solid #000;
  box-shadow: 3px 3px 0px #FFF;
  transform: rotate(4deg);
}
.comic-close-btn:hover {
  transform: scale(1.1) rotate(0deg);
}

/* Поле ввода */
.comic-input {
  box-shadow: 4px 4px 0px #000;
}
.comic-input:focus {
  border-color: #00E5FF;
  box-shadow: 4px 4px 0px #000, 4px 4px 0px 2px #00E5FF;
}

/* Кнопки действия (Покадровый отклик без мыла) */
.comic-action-btn {
  border: 2px solid #000;
  box-shadow: 5px 5px 0px #000, 5px 5px 0px 2px #FFF;
  transform: rotate(-1deg);
  transition: none; /* Убираем плавность */
}

.comic-action-btn:hover:not(:disabled) {
  transform: scale(1.03) rotate(0.8deg);
  box-shadow: 7px 7px 0px #000, 7px 7px 0px 2px #00E5FF;
  background-color: #FFFFFF !important;
  color: #000000 !important;
}

.comic-action-btn:active:not(:disabled) {
  transform: scale(0.97) translate(2px, 2px) rotate(-1deg);
  box-shadow: 2px 2px 0px #000;
}

.comic-receipt {
  box-shadow: inset 2px 2px 0px rgba(0, 0, 0, 0.5), 4px 4px 0px #000;
}
</style>
