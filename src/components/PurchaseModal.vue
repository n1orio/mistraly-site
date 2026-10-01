<script setup lang="ts">
import { Check, ChevronLeft, MessageCircle, ShieldCheck, X } from 'lucide-vue-next'
import { usePurchaseStore } from '../stores/purchase'
import { useAuthStore } from '../stores/auth'

const store = usePurchaseStore()
const auth = useAuthStore()

function startAuth() {
  const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID || ''
  const redirect = encodeURIComponent(`${window.location.origin}/auth/discord?purchase=1`)
  location.href =
    `https://discord.com/api/oauth2/authorize?client_id=${clientId}` +
    `&redirect_uri=${redirect}&response_type=code&scope=identify`
}

/**
 * Что именно купит игрок. Для item/unban предмет уходит в очередь выдачи:
 * мод заберёт его при входе, если сейчас его нет на сервере.
 */
const deliveryHint = {
  item: 'Предмет будет выдан при следующем входе на сервер.',
  unban: 'Снятие блокировок произойдёт при следующем входе на сервер.',
  pass: 'Доступ к серверу откроется сразу после оплаты.'
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
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    @click.self="store.close"
  >
    <div class="relative w-full max-w-md bg-[#2B2B2B] border border-white/[0.08] rounded-2xl p-6 shadow-2xl text-white">
      <button
        class="absolute top-5 right-5 text-slate-400 hover:text-white transition"
        @click="store.close"
      >
        <X :size="20" />
      </button>

      <div class="flex items-center justify-between mb-6 pr-8">
        <span class="text-xs font-semibold uppercase tracking-wider text-[#00BBFF]">
          {{ store.item ? 'Оформление заказа' : 'Mistraly Pass' }}
        </span>
        <div class="flex items-center gap-1.5">
          <span
            v-for="n in 3"
            :key="n"
            class="w-6 h-1 rounded-full transition-all"
            :class="store.step >= n ? 'bg-gradient-to-r from-[#0080FF] to-[#00BBFF]' : 'bg-white/10'"
          />
        </div>
      </div>

      <!-- Шаг 1: вход через Discord -->
      <div v-if="store.step === 1" class="flex flex-col items-center text-center">
        <div class="w-14 h-14 rounded-2xl bg-[#5865F2]/10 text-[#5865F2] flex items-center justify-center mb-4">
          <MessageCircle :size="28" />
        </div>
        <h2 class="text-xl font-bold text-white mb-2">Сначала войдите через Discord</h2>
        <p class="text-xs text-slate-400 mb-6 leading-relaxed max-w-xs">
          Для игры на сервере требуется привязка Discord. Ваш аккаунт будет защищён от взлома.
        </p>
        <button
          @click="startAuth"
          class="w-full py-3 rounded-xl font-semibold text-sm text-white bg-[#5865F2] hover:bg-[#4752C4] transition flex items-center justify-center gap-2 mb-4"
        >
          <MessageCircle :size="18" /> Войти через Discord
        </button>
        <div class="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck :size="14" class="text-emerald-400" /> Без паролей и лишней регистрации
        </div>
      </div>

      <!-- Шаг 2: никнейм -->
      <div v-else-if="store.step === 2" class="flex flex-col">
        <button
          v-if="auth.isAuthenticated"
          class="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white mb-4"
          @click="store.step = 1"
        >
          <ChevronLeft :size="14" /> Назад
        </button>
        <h2 class="text-xl font-bold text-white mb-2">Укажите игровой никнейм</h2>
        <p class="text-xs text-slate-400 mb-4">
          От 3 до 16 символов: латиница, цифры и символ подчёркивания. Ник привязывается к вашему
          аккаунту — через него будут выдаваться покупки.
        </p>
        <input
          v-model="store.nickname"
          maxlength="16"
          placeholder="Ваш игровой ник"
          class="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] focus:border-[#0080FF] focus:outline-none text-white text-sm mb-2"
          @input="store.error = ''"
        />
        <span v-if="store.error" class="text-xs text-rose-400 mb-3">{{ store.error }}</span>
        <button
          :disabled="!store.isNicknameValid || store.checking"
          @click="store.checkNickname"
          class="w-full mt-2 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#0080FF] to-[#00BBFF] disabled:opacity-50 transition"
        >
          {{ store.checking ? 'Проверяем ник…' : 'Продолжить →' }}
        </button>
      </div>

      <!-- Шаг 3: подтверждение -->
      <div v-else-if="store.step === 3" class="flex flex-col">
        <button
          class="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white mb-4"
          @click="store.step = 2"
        >
          <ChevronLeft :size="14" /> Изменить ник
        </button>
        <h2 class="text-xl font-bold text-white mb-2">Проверьте данные</h2>
        <p class="text-xs text-slate-400 mb-4">Подтвердите заказ перед оплатой.</p>
        <div class="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-2.5 text-xs text-slate-300 mb-4">
          <div class="flex justify-between">
            <span class="text-slate-500">Игровой ник:</span>
            <strong class="text-white">{{ store.nickname }}</strong>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Привязанный Discord:</span>
            <strong class="text-white">{{ auth.user?.username || auth.discord?.discord_username || 'Привязан' }}</strong>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Товар:</span>
            <strong class="text-white">
              {{ store.item ? store.item.name : 'Проходка Mistraly' }}
              <span v-if="store.item && store.quantity > 1" class="text-slate-400">× {{ store.quantity }}</span>
            </strong>
          </div>
          <div class="border-t border-white/[0.06] pt-2.5 flex justify-between text-sm">
            <span class="font-medium text-white">Итого:</span>
            <strong class="text-[#00BBFF] font-bold">{{ store.total || store.priceLabel }}</strong>
          </div>
        </div>
        <p v-if="hints[store.item?.item_type || 'pass']" class="text-[11px] text-slate-500 mb-3 leading-relaxed">
          {{ hints[store.item?.item_type || 'pass'] }}
        </p>
        <span v-if="store.error" class="text-xs text-rose-400 mb-3">{{ store.error }}</span>
        <button
          :disabled="store.submitting"
          @click="store.confirmOrder"
          class="w-full py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#0080FF] to-[#00BBFF] hover:opacity-90 disabled:opacity-60 transition shadow-lg shadow-[#0080FF]/20"
        >
          {{ store.submitting ? 'Оформляем…' : 'Оплатить' }}
        </button>
      </div>

      <!-- Шаг 4: готово -->
      <div v-else class="flex flex-col items-center text-center py-4">
        <div class="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
          <Check :size="28" />
        </div>
        <h2 class="text-xl font-bold text-white mb-1">Покупка оформлена!</h2>
        <p class="text-xs text-slate-400 mb-2">
          {{ store.result?.item }} для ника <strong class="text-white">{{ store.nickname }}</strong>
        </p>
        <p class="text-[11px] text-slate-500 mb-6">
          {{
            store.result?.delivery
              ? 'Зайдите на сервер — предмет выдаст мод.'
              : 'Доступ открыт, можно заходить на сервер.'
          }}
        </p>
        <button
          @click="store.close"
          class="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#0080FF] to-[#00BBFF] hover:opacity-90 transition"
        >
          Готово
        </button>
      </div>
    </div>
  </div>
</template>