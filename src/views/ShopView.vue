<script setup lang="ts">
import { ref, computed } from 'vue'
import { ShoppingBag, Gavel, Key, Globe, Check, X } from 'lucide-vue-next'
import { usePurchaseStore } from '../stores/purchase'
const purchaseStore = usePurchaseStore()

const shopItems = [
  {
    id: 'unban',
    title: 'Снятие блокировки',
    desc: 'Снятие всех варнов и блокировок. Возможна очистка построек и инвентаря по запросу.',
    price: 500,
    icon: Gavel,
    maxQty: 1,
  },
  {
    id: 'return-key',
    title: 'Ключ возврата',
    desc: 'Возвращает все выпавшие предметы после смерти, даже без посещения могилы.',
    price: 50,
    icon: Key,
    maxQty: 10,
  },
  {
    id: 'origin-sphere',
    title: 'Сфера происхождения',
    desc: 'Позволяет сменить происхождение и класс персонажа.',
    price: 200,
    icon: Globe,
    maxQty: 10,
  },
]

const qty = ref<Record<string, number>>({})
shopItems.forEach(item => { qty.value[item.id] = 1 })

function setQty(id: string, val: number) {
  const item = shopItems.find(i => i.id === id)
  if (!item) return
  if (val < 1) val = 1
  if (val > item.maxQty) val = item.maxQty
  qty.value[id] = val
}

// Order modal
const showOrder = ref(false)
const orderItem = ref<any>(null)
const orderQty = ref(1)
const orderDone = ref(false)

function openOrder(item: typeof shopItems[number]) {
  orderItem.value = item
  orderQty.value = qty.value[item.id] || 1
  orderDone.value = false
  showOrder.value = true
}

function confirmOrder() {
  orderDone.value = true
  // В будущем: редирект на lava.ru
  // window.location.href = `https://lava.ru/order/...`
}

function closeOrder() {
  showOrder.value = false
  orderItem.value = null
}

const totalPrice = computed(() => {
  if (!orderItem.value) return 0
  return orderItem.value.price * orderQty.value
})
</script>
<template><main class="w-full flex-1 flex flex-col items-center justify-start page-bg bg-[var(--bg-page)] text-[var(--text-main)] px-4 py-12"><div class="w-full max-w-5xl"><div class="mb-10 text-left"><span class="text-xs font-bold uppercase tracking-wider text-[#0099FF]">Breeze Store</span><h1 class="font-heading text-3xl sm:text-4xl font-black text-[var(--text-main)] mt-1 mb-2">Магазин</h1><p class="text-sm text-[var(--text-muted)]">Предметы и услуги сервера Breeze.</p></div>

<div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8"><div v-for="item in shopItems" :key="item.id" class="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[#0099FF]/40 transition rounded-2xl p-6 flex flex-col"><div class="flex-1"><div class="w-11 h-11 rounded-xl bg-[#0099FF]/10 text-[#0099FF] flex items-center justify-center mb-4"><component :is="item.icon" :size="22" /></div><h3 class="font-heading text-base font-bold text-[var(--text-main)] mb-1">{{ item.title }}</h3><p class="text-xs text-[var(--text-muted)] leading-relaxed mb-2">{{ item.desc }}</p></div><div class="mt-5 pt-4 border-t border-[var(--border-color)]"><div class="flex items-center justify-between mb-3"><span class="text-lg font-bold text-[#0099FF]">{{ item.price }}₽</span><span v-if="item.maxQty > 1" class="text-[11px] text-[var(--text-muted)]">за шт.</span></div><div v-if="item.maxQty > 1" class="flex items-center justify-between mb-3"><span class="text-xs text-[var(--text-muted)]">Количество</span><div class="flex items-center gap-1"><button class="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[#0099FF]/40 transition text-sm font-bold" @click="setQty(item.id, (qty[item.id] || 1) - 1)">−</button><span class="w-8 text-center text-sm font-bold text-[var(--text-main)]">{{ qty[item.id] || 1 }}</span><button class="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[#0099FF]/40 transition text-sm font-bold" @click="setQty(item.id, (qty[item.id] || 1) + 1)">+</button></div></div><button @click="openOrder(item)" class="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#0099FF] to-[#0080FF] hover:opacity-90 transition flex items-center justify-center gap-2"><ShoppingBag :size="14" /> Купить{{ item.maxQty > 1 ? ' ' + (qty[item.id] || 1) + ' шт.' : '' }}</button></div></div></div>

<!-- Покупка проходки -->
<div class="text-center"><p class="text-xs text-[var(--text-muted)] mb-4">Оформить проходку на сервер</p><button @click="purchaseStore.show" class="px-7 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#0099FF] to-[#0080FF] hover:opacity-90 transition shadow-lg shadow-[#0099FF]/25">Оформить проходку →</button></div>

</div>

<!-- Order modal -->
<div v-if="showOrder" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" @click.self="closeOrder">
  <div class="relative w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-2xl">
    <button class="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-main)] transition" @click="closeOrder"><X :size="18" /></button>

    <div v-if="!orderDone">
      <div class="w-11 h-11 rounded-xl bg-[#0099FF]/10 text-[#0099FF] flex items-center justify-center mb-4"><component :is="orderItem?.icon" :size="22" /></div>
      <h3 class="font-heading text-lg font-bold text-[var(--text-main)] mb-1">Подтверждение</h3>
      <p class="text-xs text-[var(--text-muted)] mb-5">Вы собираетесь приобрести:</p>
      <div class="bg-[var(--bg-card-hover)] rounded-xl p-4 mb-5 space-y-2">
        <div class="flex justify-between text-sm"><span class="text-[var(--text-muted)]">Товар</span><strong class="text-[var(--text-main)]">{{ orderItem?.title }}</strong></div>
        <div class="flex justify-between text-sm"><span class="text-[var(--text-muted)]">Количество</span><strong class="text-[var(--text-main)]">{{ orderQty }}</strong></div>
        <div class="flex justify-between text-sm pt-2 border-t border-[var(--border-color)]"><span class="text-[var(--text-muted)]">Сумма</span><strong class="text-lg text-[#0099FF]">{{ totalPrice }}₽</strong></div>
      </div>
      <p class="text-[11px] text-[var(--text-muted)] mb-5 leading-relaxed">В будущем оплата будет проходить через Lava.ru. Пока что заказ оформляется в тестовом режиме.</p>
      <button @click="confirmOrder" class="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#0099FF] to-[#0080FF] hover:opacity-90 transition flex items-center justify-center gap-2"><ShoppingBag :size="16" /> Оформить заказ</button>
    </div>

    <div v-else class="flex flex-col items-center text-center py-4">
      <div class="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4"><Check :size="28" /></div>
      <h3 class="font-heading text-lg font-bold text-[var(--text-main)] mb-1">Заказ оформлен!</h3>
      <p class="text-xs text-[var(--text-muted)] mb-2">{{ orderItem?.title }} x{{ orderQty }} — {{ totalPrice }}₽</p>
      <p class="text-[11px] text-[var(--text-muted)] mb-6">В будущем здесь будет оплата через Lava.ru.</p>
      <button @click="closeOrder" class="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#0099FF] to-[#0080FF] hover:opacity-90 transition">Готово</button>
    </div>
  </div>
</div>

</main></template>