<script setup lang="ts">
import { computed } from 'vue'
import { Check, ChevronLeft, Discord, ShieldCheck, X, ExternalLink, Loader2, CreditCard, Ticket } from '../lib/icons'
import { usePurchaseStore, isFree } from '../stores/purchase'
import { useAuthStore } from '../stores/auth'
import { formatRub } from '../api/promo'

const store = usePurchaseStore()
const auth = useAuthStore()

/**
 * Сумма к оплате в рублях.
 *
 * Берём копейки, а не price: price — это монеты витрины, а не деньги.
 * Товаров без price_kopecks или при выключенной оплате показываем 0 ₽,
 * чтобы квитанция не обещала цену, которую никто не спишет.
 */
/** Сумма без скидки: цена × количество. */
const baseKopecks = computed(() => {
  const item = store.item
  // Проходка берётся с витрины: её цена тоже живёт в price_kopecks.
  if (!item) return passPriceKopecks.value ?? 0
  if (isFree(item)) return 0
  return (item.price_kopecks ?? 0) * store.quantity
})

const priceRub = computed(() => {
  const kopecks = store.promo ? store.promo.total_kopecks : baseKopecks.value
  return kopecks ? formatRub(kopecks) : '0 ₽'
})

/** Цена проходки — единственный товар с item_type 'pass' на витрине. */
const passPriceKopecks = computed<number | null>(() => passItem.value?.price_kopecks ?? null)

const isPaid = computed(() => priceRub.value !== '0 ₽')

/** Промокод на 100%: товар платный, но по коду выдаётся без оплаты. */
const freeByPromo = computed(() => !!store.promo && store.promo.total_kopecks === 0 && store.promo.original_kopecks > 0)


// Витрина нужна модалке для цены проходки: её собственный товар — null.
const passItem = computed(() => (store.item ? null : store.passItem))

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
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/85"
    @click.self="store.close"
  >
    <div class="w-full max-w-md relative">
      <button class="close-btn mc-btn mc-btn--muted mc-btn--sm" aria-label="Закрыть" @click="store.close">
    <X :size="24" />
  </button>

  <div class="mc-panel p-6 sm:p-7 text-left max-h-[calc(100vh-40px)] overflow-y-auto">
    <div>

      <!-- ВЕРХНЯЯ СТРОКА: Статус и индикатор шагов -->
      <div class="flex items-center justify-between pb-3 mb-5">
        <span class="mc-tag">{{ store.item ? 'Заказ' : 'Mistraly Pass' }}</span>

        <!-- Рубленый степпер 1-2-3 -->
        <div class="flex items-center gap-1.5 text-[14px]">
          <span
            v-for="n in 3"
            :key="n"
            class="step-dot"
            :class="{ 'is-on': store.step >= n || (store.step === 4 && n === 3) }"
          >
            {{ n }}
          </span>
        </div>
      </div>

      <!-- ================= ШАГ 1: ВХОД ЧЕРЕЗ DISCORD ================= -->
      <div v-if="store.step === 1" class="flex flex-col items-center text-center py-2">
        <span class="mc-slot mb-5"><Discord :size="36" /></span>

        <h2 class="modal-title mb-2">
          Авторизация профиля
        </h2>
        <p class="text-[15px] text-[var(--text-muted)] mb-6 leading-relaxed max-w-xs">
          Для оформления покупки и привязки предметов требуется вход через Discord. Профиль создается мгновенно без паролей.
        </p>

        <button
            @click="startAuth"
            class="mc-btn mc-btn--block mc-btn--discord"
          >
            <Discord :size="24" />
            Войти через Discord
          </button>

        <div class="flex items-center gap-2 text-[14px] text-[var(--text-sub)]">
          <ShieldCheck :size="14" class="text-[var(--ok)] shrink-0" />
          <span>Безопасный шлюз без ввода пароля</span>
        </div>
      </div>

      <!-- ================= ШАГ 2: ВВОД НИКНЕЙМА ================= -->
      <div v-else-if="store.step === 2" class="flex flex-col">
        <button
          v-if="auth.isAuthenticated"
          class="inline-flex items-center gap-1 text-[15px] text-[var(--text-muted)] hover:text-white mb-3 transition cursor-pointer self-start"
          @click="store.step = 1"
        >
          <ChevronLeft :size="14" /> Назад
        </button>

        <h2 class="modal-title mb-1">
          Игровой никнейм
        </h2>
        <p class="text-[15px] text-[var(--text-muted)] mb-5 leading-relaxed">
          Укажите ник (от 3 до 16 символов). Он привязывается к аккаунту один раз — в следующий раз мы спросим сами.
        </p>

        <div class="relative mb-3">
          <input
            v-model="store.nickname"
            maxlength="16"
            placeholder="Ваш ник в Minecraft..."
            class="mc-input"
            @input="store.error = ''"
          />
        </div>

        <span v-if="store.error" class="text-[15px] text-[var(--bad)] mb-3 block">
          ⚠ {{ store.error }}
        </span>

        <button
            :disabled="!store.isNicknameValid || store.checking"
            @click="store.checkNickname"
            class="mc-btn mc-btn--block"
          >
            {{ store.checking ? 'Проверяем базу…' : 'Продолжить →' }}
          </button>
      </div>

      <!-- ================= ШАГ 3: ЧЕК И ПОДТВЕРЖДЕНИЕ ================= -->
      <div v-else-if="store.step === 3" class="flex flex-col">
        <!-- Шаг ввода ника доступен и по кнопке: привязанный ник бывает нужно
             исправить — например, если сменили ник на сервере. -->
        <button
          class="inline-flex items-center gap-1 text-[15px] text-[var(--text-muted)] hover:text-white mb-3 transition cursor-pointer self-start"
          @click="store.step = 2"
        >
          <ChevronLeft :size="14" />
          {{ store.nickname ? 'Изменить ник' : 'Привязать ник' }}
        </button>

        <h2 class="modal-title mb-1">
          Проверка заказа
        </h2>
        <p class="text-[15px] text-[var(--text-muted)] mb-5">
          Подтвердите данные — покупка оформится сразу.
        </p>

        <!-- Квитанция заказа с пунктирной рамкой -->
        <div class="mc-well mb-4 p-4 space-y-2 text-[15px]">
          <div class="flex justify-between">
            <span class="text-[var(--text-sub)]">Получатель:</span>
            <strong class="text-white">{{ store.nickname || auth.user?.username || 'Привязан к аккаунту' }}</strong>
          </div>
          <div class="flex justify-between">
            <span class="text-[var(--text-sub)]">Discord:</span>
            <strong class="text-white">{{ auth.user?.username || auth.discord?.discord_username || 'Привязан' }}</strong>
          </div>
          <div class="flex justify-between">
            <span class="text-[var(--text-sub)]">Позиция:</span>
            <strong class="text-white">
              {{ store.item ? store.item.name : 'Mistraly Pass' }}
              <span v-if="store.item && store.quantity > 1" class="text-[var(--sky)]"> × {{ store.quantity }}</span>
            </strong>
          </div>
          <div v-if="store.promo" class="flex justify-between">
            <span class="text-[var(--text-sub)]">Без скидки:</span>
            <span class="text-[var(--text-sub)] line-through">{{ formatRub(store.promo.original_kopecks) }}</span>
          </div>
          <div v-if="store.promo" class="flex justify-between">
            <span class="text-[var(--text-sub)]">Промокод {{ store.promo.code }}:</span>
            <strong class="text-[var(--ok)]">−{{ formatRub(store.promo.discount_kopecks) }} ({{ store.promo.discount_percent }}%)</strong>
          </div>
          <div class="flex justify-between items-baseline">
            <span class="text-[var(--text-sub)]">К оплате:</span>
            <strong class="text-white text-base">
              {{ freeByPromo ? 'Бесплатно' : priceRub }}
              <span v-if="isPaid" class="text-[10px] text-[var(--sky)] font-normal ml-1">(через Lava)</span>
            </strong>
          </div>
        </div>

        <!-- Промокод: обычный или код автора -->
        <form class="promo-row mb-4" @submit.prevent="store.applyPromo">
          <label class="sr-only" for="promo">Промокод</label>
          <div class="promo-field mc-well">
            <Ticket :size="24" class="text-[var(--text-sub)] shrink-0" />
            <input
              id="promo"
              v-model.trim="store.promoCode"
              :disabled="!!store.promo"
              maxlength="32"
              autocomplete="off"
              spellcheck="false"
              placeholder="Промокод"
              class="promo-input"
              @input="store.promoError = ''"
            />
          </div>
          <button
            v-if="store.promo"
            type="button"
            class="mc-btn mc-btn--muted mc-btn--sm"
            @click="store.clearPromo"
          >
            Убрать
          </button>
          <button
            v-else
            type="submit"
            class="mc-btn mc-btn--sm"
            :disabled="!store.promoCode || store.promoChecking"
          >
            {{ store.promoChecking ? '…' : 'Применить' }}
          </button>
        </form>
        <span v-if="store.promoError" class="text-[15px] text-[var(--bad)] -mt-2 mb-3 block">
          {{ store.promoError }}
        </span>

        <p v-if="hints[store.item?.item_type || 'pass']" class="text-[14px] text-[var(--text-sub)] mb-4 leading-relaxed">
          {{ hints[store.item?.item_type || 'pass'] }}
        </p>

        <span v-if="store.error" class="text-[15px] text-[var(--bad)] mb-3 block">
          ⚠ {{ store.error }}
        </span>

        <button
            :disabled="store.submitting"
            @click="store.confirmOrder"
            class="mc-btn mc-btn--block"
          >
            {{ store.submitting ? 'Оформляем…' : freeByPromo ? 'Получить бесплатно' : 'Купить' }}
          </button>
      </div>

      <!-- ================= ШАГ 5: ОПЛАТА LAVA ================= -->
      <div v-else-if="store.step === 5" class="flex flex-col">
        <h2 class="modal-title mb-1">
          Оплата
        </h2>
        <p class="text-[15px] text-[var(--text-muted)] mb-5 leading-relaxed">
          Счёт на <strong class="text-white">{{ priceRub }}</strong> выставлен в Lava.
          Товар выдадим сразу после подтверждения платежа.
        </p>

        <div class="mc-well mb-4 p-4 space-y-2 text-[15px]">
          <div class="flex justify-between">
            <span class="text-[var(--text-sub)]">Позиция:</span>
            <strong class="text-white">{{ store.result?.item || 'Mistraly Pass' }}</strong>
          </div>
          <div class="flex justify-between">
            <span class="text-[var(--text-sub)]">Сумма:</span>
            <strong class="text-white">{{ priceRub }}</strong>
          </div>
          <div class="flex justify-between">
            <span class="text-[var(--text-sub)]">Номер заказа:</span>
            <strong class="text-[var(--text-muted)] text-[11px] break-all">{{ store.orderId }}</strong>
          </div>
        </div>

        <p v-if="store.error" class="text-[15px] text-[var(--warn)] mb-3 block leading-relaxed">
          ⚠ {{ store.error }}
        </p>

        <button
            :disabled="!store.payUrl"
            @click="store.redirectToPayment"
            class="mc-btn mc-btn--block"
          >
            <ExternalLink :size="15" />
            Перейти к оплате
          </button>

        <!-- Запасной путь: платёж может пройти, а вебхук задержаться.
             Кнопка спрашивает статус у бэкенда, а не у Lava напрямую,
             и переходит к «получено» только при status = success. -->
        <button
            :disabled="store.submitting"
            @click="store.checkPayment"
            class="mc-btn mc-btn--block mc-btn--muted"
          >
            <Loader2 v-if="store.submitting" :size="14" class="animate-spin" />
            <CreditCard v-else :size="14" />
            {{ store.submitting ? 'Проверяем…' : 'Я оплатил — проверить' }}
          </button>

        <p class="text-[14px] text-[var(--text-sub)] mt-4 text-center leading-relaxed">
          Подтверждение приходит от Lava автоматически. Обычно 1–2 минуты, но иногда до 15.
        </p>
      </div>

      <!-- ================= ШАГ 4: ГОТОВО ================= -->
      <div v-else class="flex flex-col items-center text-center py-4">
        <span class="mc-slot mb-4 text-[var(--ok)]" style="color:var(--ok)"><Check :size="36" /></span>

        <span class="mc-tag mc-tag--ok mb-3">
          ПОЛУЧЕНО
        </span>
        <h2 class="modal-title mb-2">
          Заказ выполнен!
        </h2>
        <p class="text-[15px] text-[var(--text-muted)] mb-2">
          {{ store.result?.item }} для игрока <strong class="text-white">{{ store.nickname || auth.user?.username || 'вашего аккаунта' }}</strong>
        </p>
        <p class="text-[14px] text-[var(--text-sub)] mb-6 max-w-xs leading-relaxed">
          {{
            store.result?.delivery
              ? 'Зайдите на сервер — предмет будет выдан модом в инвентарь.'
              : 'Доступ открыт. Скачайте лаунчер и подключайтесь.'
          }}
        </p>

        <button
            @click="store.close"
            class="mc-btn mc-btn--block mc-btn--muted"
          >
            Закрыть окно
          </button>
      </div>

    </div>
  </div>

</div>

  </div>
</template>
<style scoped>
.close-btn {
  position: absolute;
  top: -14px;
  right: -8px;
  z-index: 30;
  padding: 4px 4px 6px;
}
.modal-title {
  margin: 0 0 6px;
  font-size: 24px;
  line-height: 1.2;
}
.step-dot {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  background: var(--well);
  color: var(--text-sub);
  font-weight: 700;
}
.step-dot.is-on {
  background: var(--blue);
  color: #fff;
}
.promo-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.promo-field {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 0 10px;
}
.promo-field:focus-within {
  --edge: var(--sky);
}
.promo-input {
  flex: 1;
  min-width: 0;
  padding: 8px 0;
  background: transparent;
  border: 0;
  outline: 0;
  color: #fff;
  font: inherit;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.promo-input::placeholder {
  color: var(--text-sub);
  text-transform: none;
  letter-spacing: 0;
}
.promo-input:disabled {
  color: var(--ok);
}
</style>
