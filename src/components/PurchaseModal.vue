<script setup lang="ts">
import { Check, ChevronLeft, MessageCircle, ShieldCheck, X, Sparkles, Terminal } from 'lucide-vue-next'
import { usePurchaseStore } from '../stores/purchase'
import { useAuthStore } from '../stores/auth'

const store = usePurchaseStore()
const auth = useAuthStore()

function startAuth() {
  const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID || ''
  // Discord сверяет redirect_uri с зарегистрированным ПОБАЙТОВО, включая
  // query-строку. Раньше тут стояло "/auth/discord?purchase=1" — такой URI
  // в приложении не зарегистрирован, и Discord отвечал «Некорректный
  // OAuth2 redirect_uri». Поэтому шлём ровно зарегистрированный путь,
  // а намерение вернуться к покупке передаём через state.
  const redirect = encodeURIComponent(`${window.location.origin}/auth/discord`)
  location.href =
    `https://discord.com/api/oauth2/authorize?client_id=${clientId}` +
    `&redirect_uri=${redirect}&response_type=code&scope=identify` +
    `&state=${encodeURIComponent('purchase')}`
}

/**
 * Подсказки доставки предметов
 */
const deliveryHint = {
  item: 'Предмет будет выдан автоматически при следующем входе на сервер.',
  unban: 'Снятие блокировок применится при следующем подключении к серверу.',
  pass: 'Сезонный пропуск активируется мгновенно после подтверждения оплаты.'
}

const hints: Record<string, string> = {
  pass: deliveryHint.pass,
  item: deliveryHint.item,
  unban: deliveryHint.unban
}
</script>

<template>
  <div
    v-if="store.open"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none"
    @click.self="store.close"
  >
    <div class="modal-outer w-full max-w-md relative">

      <!-- Кнопка закрытия (крестик) со скосом -->
      <button
        class="close-btn absolute -top-3 -right-3 z-30 w-8 h-8 bg-[#18191c] hover:bg-white text-white hover:text-black flex items-center justify-center border border-white/20 transition cursor-pointer"
        @click="store.close"
      >
        <X :size="16" />
      </button>

      <!-- Карточка терминала покупки -->
      <div
        class="modal-card bg-[#151619] p-7 sm:p-8 relative overflow-hidden text-left"
        style="clip-path: polygon(0% 1.2%, 100% 0%, 99% 99%, 1% 100%);"
      >
        <!-- Тонкий фоновый полутоновый растр -->
        <div class="comic-dots-pattern" aria-hidden="true" />

        <div class="relative z-10">

          <!-- ВЕРХНЯЯ СТРОКА: Статус и индикатор шагов -->
          <div class="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <span
              class="font-heading font-black text-[11px] uppercase tracking-wider px-2.5 py-0.5 text-black"
              style="background-color: #0099FF; transform: rotate(-1.5deg);"
            >
              {{ store.item ? 'ТЕРМИНАЛ // ЗАКАЗ' : 'MISTRALY PASS' }}
            </span>

            <!-- Рубленый степпер 1-2-3 -->
            <div class="flex items-center gap-1.5 font-mono text-[10px]">
              <span
                v-for="n in 3"
                :key="n"
                class="px-1.5 py-0.5 border font-bold transition-all"
                :class="store.step >= n
                  ? 'bg-[#0099FF] text-black border-[#0099FF]'
                  : 'bg-white/5 text-zinc-500 border-white/10'"
              >
                0{{ n }}
              </span>
            </div>
          </div>

          <!-- ================= ШАГ 1: ВХОД ЧЕРЕЗ DISCORD ================= -->
          <div v-if="store.step === 1" class="flex flex-col items-center text-center py-2">
            <div
              class="w-16 h-16 rounded-xl bg-[#5865F2]/15 text-[#5865F2] border border-[#5865F2]/30 flex items-center justify-center mb-5"
              style="transform: rotate(-2deg); box-shadow: 4px 4px 0px rgba(0,0,0,0.5);"
            >
              <MessageCircle :size="30" />
            </div>

            <h2 class="font-heading font-black text-2xl text-white tracking-tight uppercase mb-2">
              Авторизация профиля
            </h2>
            <p class="text-xs text-zinc-400 mb-6 leading-relaxed max-w-xs">
              Для оформления покупки и привязки предметов требуется вход через Discord. Профиль создается мгновенно без паролей.
            </p>

            <div class="comic-btn-wrap w-full mb-4">
              <button
                @click="startAuth"
                class="comic-btn w-full py-3.5 px-6 font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 cursor-pointer"
                :style="{ '--btn-bg': '#5865F2', '--btn-color': '#FFFFFF' }"
              >
                <MessageCircle :size="16" />
                Войти через Discord
              </button>
            </div>

            <div class="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
              <ShieldCheck :size="14" class="text-emerald-400 shrink-0" />
              <span>Безопасный шлюз без ввода пароля</span>
            </div>
          </div>

          <!-- ================= ШАГ 2: ВВОД НИКНЕЙМА ================= -->
          <div v-else-if="store.step === 2" class="flex flex-col">
            <button
              v-if="auth.isAuthenticated"
              class="inline-flex items-center gap-1 font-mono text-xs text-zinc-500 hover:text-white mb-3 transition cursor-pointer self-start"
              @click="store.step = 1"
            >
              <ChevronLeft :size="14" /> Назад
            </button>

            <h2 class="font-heading font-black text-2xl text-white tracking-tight uppercase mb-1">
              Игровой никнейм
            </h2>
            <p class="text-xs text-zinc-400 mb-5 leading-relaxed">
              Укажите ник (от 3 до 16 символов). Покупки и проходка привязываются к нему в базе сервера.
            </p>

            <div class="relative mb-3">
              <input
                v-model="store.nickname"
                maxlength="16"
                placeholder="Ваш ник в Minecraft..."
                class="w-full px-4 py-3 bg-black/45 border border-white/15 focus:border-[#0099FF] text-white text-sm font-mono placeholder:text-zinc-600 outline-none transition"
                style="clip-path: polygon(0% 6%, 100% 0%, 100% 94%, 0% 100%);"
                @input="store.error = ''"
              />
            </div>

            <span v-if="store.error" class="text-xs font-mono text-rose-400 mb-3 block">
              ⚠ {{ store.error }}
            </span>

            <div class="comic-btn-wrap w-full mt-2">
              <button
                :disabled="!store.isNicknameValid || store.checking"
                @click="store.checkNickname"
                class="comic-btn w-full py-3.5 px-6 font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                :style="{ '--btn-bg': '#0099FF', '--btn-color': '#FFFFFF' }"
              >
                {{ store.checking ? 'Проверяем базу…' : 'Продолжить →' }}
              </button>
            </div>
          </div>

          <!-- ================= ШАГ 3: ЧЕК И ПОДТВЕРЖДЕНИЕ ================= -->
          <div v-else-if="store.step === 3" class="flex flex-col">
            <button
              class="inline-flex items-center gap-1 font-mono text-xs text-zinc-500 hover:text-white mb-3 transition cursor-pointer self-start"
              @click="store.step = 2"
            >
              <ChevronLeft :size="14" /> Изменить ник
            </button>

            <h2 class="font-heading font-black text-2xl text-white tracking-tight uppercase mb-1">
              Проверка заказа
            </h2>
            <p class="text-xs text-zinc-400 mb-5">
              {{
                store.isFreeMode
                  ? 'Подтвердите данные — выдача произойдёт сразу:'
                  : 'Подтвердите данные перед переходом к оплате:'
              }}
            </p>

            <!-- Квитанция заказа с пунктирной рамкой -->
            <div class="receipt-box bg-black/45 border border-dashed border-white/15 p-4 mb-4 space-y-2.5 font-mono text-xs">
              <div class="flex justify-between">
                <span class="text-zinc-500">Получатель:</span>
                <strong class="text-white">{{ store.nickname }}</strong>
              </div>
              <div class="flex justify-between">
                <span class="text-zinc-500">Discord:</span>
                <strong class="text-white">{{ auth.user?.username || auth.discord?.discord_username || 'Привязан' }}</strong>
              </div>
              <div class="flex justify-between">
                <span class="text-zinc-500">Позиция:</span>
                <strong class="text-white">
                  {{ store.item ? store.item.name : 'Mistraly Pass' }}
                  <span v-if="store.item && store.quantity > 1" class="text-[#0099FF]"> × {{ store.quantity }}</span>
                </strong>
              </div>

              <div class="border-t border-white/10 pt-2.5 flex justify-between items-center text-sm">
                <span class="font-heading font-black text-white uppercase tracking-wider text-xs">ИТОГО:</span>
                <strong class="font-heading font-black text-xl text-[#0099FF]">
                  {{ store.total || store.priceLabel }}
                </strong>
              </div>
            </div>

            <p v-if="hints[store.item?.item_type || 'pass']" class="text-[11px] font-mono text-zinc-500 mb-4 leading-relaxed">
              // {{ hints[store.item?.item_type || 'pass'] }}
            </p>

            <span v-if="store.error" class="text-xs font-mono text-rose-400 mb-3 block">
              ⚠ {{ store.error }}
            </span>

            <div class="comic-btn-wrap w-full">
              <button
                :disabled="store.submitting"
                @click="store.confirmOrder"
                class="comic-btn w-full py-3.5 px-6 font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                :style="{ '--btn-bg': '#0099FF', '--btn-color': '#FFFFFF' }"
              >
                {{
                  store.submitting
                    ? 'Оформляем…'
                    : store.isFreeMode
                      ? 'Получить'
                      : 'Перейти к оплате'
                }}
              </button>
            </div>
          </div>

          <!-- ================= ШАГ 4: ГОТОВО ================= -->
          <div v-else class="flex flex-col items-center text-center py-4">
            <div
              class="w-16 h-16 bg-emerald-500/15 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mb-4"
              style="transform: rotate(3deg); box-shadow: 4px 4px 0px rgba(0,0,0,0.5);"
            >
              <Check :size="32" />
            </div>

            <span class="font-heading font-black text-xs uppercase tracking-wider text-emerald-400 mb-1">
              {{ store.isFreeMode ? 'ПОЛУЧЕНО' : 'УСПЕШНО ОПЛАЧЕНО' }}
            </span>
            <h2 class="font-heading font-black text-2xl text-white tracking-tight uppercase mb-2">
              Заказ выполнен!
            </h2>
            <p class="text-xs text-zinc-400 mb-2">
              {{ store.result?.item }} для игрока <strong class="text-white">{{ store.nickname }}</strong>
            </p>
            <p class="text-[11px] font-mono text-zinc-500 mb-6 max-w-xs leading-relaxed">
              {{
                store.result?.delivery
                  ? 'Зайдите на сервер — предмет будет выдан модом в инвентарь.'
                  : 'Доступ открыт. Скачайте лаунчер и подключайтесь.'
              }}
            </p>

            <div class="comic-btn-wrap inline-flex">
              <button
                @click="store.close"
                class="comic-btn px-10 py-3 font-heading font-black text-xs uppercase tracking-wider cursor-pointer"
                :style="{ '--btn-bg': '#FFFFFF', '--btn-color': '#101113' }"
              >
                Закрыть окно
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Внешняя тень модального окна */
.modal-outer {
  filter: drop-shadow(14px 14px 0px rgba(0, 0, 0, 0.8));
}

.modal-card {
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* Крестик закрытия */
.close-btn {
  clip-path: polygon(0% 10%, 100% 0%, 100% 90%, 0% 100%);
  filter: drop-shadow(3px 3px 0px rgba(0, 0, 0, 0.5));
}

/* Фоновый точечный растр */
.comic-dots-pattern {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.06;
  background-image: radial-gradient(#0099FF 1.5px, transparent 1.5px);
  background-size: 9px 9px;
  background-position: 0 0;
  z-index: 1;
}

/* =========================================================
   ФИРМЕННЫЕ КНОПКИ В СТИЛЕ САЙТА:
   Жесткая тень, при ховере растут, БЕЛЕЮТ, текст чернеет
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

/* Ховер: рост, белый фон, черный текст */
.comic-btn:hover {
  transform: scale(1.04) rotate(-1.2deg);
  background-color: #FFFFFF !important;
  color: #0d0e10 !important;
}

.comic-btn:active {
  transform: scale(0.96) rotate(-1.2deg);
}
</style>
