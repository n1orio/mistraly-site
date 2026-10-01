<script setup lang="ts">
import { ref, computed } from 'vue'
import { ShoppingBag, Gavel, Key, Globe, Check, X, ShieldCheck, ArrowRight } from 'lucide-vue-next'
import { usePurchaseStore } from '../stores/purchase'

const purchaseStore = usePurchaseStore()

const shopItems = [
  {
    id: 'unban',
    title: 'Снятие блокировки',
    badge: 'Услуга',
    desc: 'Полное снятие всех варнов и блокировок аккаунта. Возможна очистка построек и инвентаря по личному запросу.',
    price: 500,
    icon: Gavel,
    maxQty: 1,
    accentColor: '#FF4444',
    iconBg: '#2a1212',
    clipPath: 'polygon(0% 1.5%, 100% 0%, 99% 98.5%, 1% 100%)'
  },
  {
    id: 'return-key',
    title: 'Ключ возврата',
    badge: 'Предмет',
    desc: 'Мгновенно возвращает все выпавшие предметы инвентаря после гибели, даже без опасного посещения могилы.',
    price: 50,
    icon: Key,
    maxQty: 10,
    accentColor: '#FFCC00',
    iconBg: '#2a2208',
    clipPath: 'polygon(0.8% 0%, 99.5% 2%, 99% 100%, 0% 98%)'
  },
  {
    id: 'origin-sphere',
    title: 'Сфера происхождения',
    badge: 'Артефакт',
    desc: 'Позволяет сбросить текущую расу и заново выбрать происхождение и класс вашего персонажа.',
    price: 200,
    icon: Globe,
    maxQty: 10,
    accentColor: '#A855F7',
    iconBg: '#1e122b',
    clipPath: 'polygon(0% 2%, 100% 0.5%, 98.5% 99%, 1.5% 97.5%)'
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

// Управление окном заказа
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

<template>
  <!-- Увеличен верхний отступ: pt-28 sm:pt-36 под фиксированный хеадер -->
  <main class="w-full flex-1 flex flex-col items-center justify-start page-bg bg-[var(--bg-page)] text-[var(--text-main)] px-4 pt-28 pb-16 sm:pt-36 sm:pb-20">
    <div class="w-full max-w-5xl">

      <!-- Заголовок страницы с комфортным отступом mb-14 -->
      <div class="text-center mb-14 sm:mb-16">
        <h2 class="font-heading text-3xl sm:text-4xl text-[var(--text-main)] tracking-tight mb-3">
          Магазин <span class="word-hl">сервера</span>
        </h2>
        <p class="text-xs sm:text-sm text-[var(--text-muted)] max-w-2xl mx-auto">
          Официальные цифровые предметы, проходки и сопутствующие услуги сервера Mistraly.
        </p>
      </div>

      <!-- Сетка товаров 3 в ряд -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-12 pt-4 mb-16">
        <div
          v-for="item in shopItems"
          :key="item.id"
          class="card-outer group"
        >
          <!-- Выносная иконка товара -->
          <div class="popout-icon-box pointer-events-none">
            <div
              class="icon-hard-shadow relative z-10 w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3"
              :style="{ backgroundColor: item.iconBg, color: item.accentColor }"
            >
              <component :is="item.icon" :size="28" />
            </div>
          </div>

          <!-- Карточка товара -->
          <div
            class="card-box p-6 sm:p-7 pt-5 pb-8 flex flex-col justify-between h-full min-h-[310px] relative"
            :style="{ clipPath: item.clipPath, '--accent': item.accentColor }"
          >
            <!-- Растр Ben-Day dots -->
            <div class="comic-dots-pattern" aria-hidden="true" />

            <div class="relative z-10">
              <!-- Верх: плашка названия -->
              <div class="flex items-center mb-5 pl-16 sm:pl-20">
                <span
                  class="item-title-tag font-heading font-black text-sm sm:text-base tracking-tight px-3 py-1 inline-block text-white"
                  :style="{ backgroundColor: item.accentColor }"
                >
                  {{ item.title }}
                </span>
              </div>

              <!-- Описание -->
              <p class="text-xs sm:text-sm text-zinc-300/80 leading-relaxed font-normal mb-4 transition-colors duration-200 group-hover:text-zinc-100">
                {{ item.desc }}
              </p>
            </div>

            <!-- Нижний блок: цена и покупка -->
            <div class="relative z-10 pt-4 border-t border-white/[0.08]">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-baseline gap-1.5">
                  <span class="font-heading font-black text-2xl text-white tracking-tight">
                    {{ item.price * (qty[item.id] || 1) }}₽
                  </span>
                  <span v-if="item.maxQty > 1 && (qty[item.id] || 1) > 1" class="text-[11px] text-zinc-500 font-mono">
                    ({{ item.price }}₽/шт)
                  </span>
                </div>

                <!-- Счетчик количества -->
                <div v-if="item.maxQty > 1" class="flex items-center gap-1 bg-[#101113] p-1 border border-white/10">
                  <button
                    class="w-6 h-6 flex items-center justify-center bg-white/5 hover:bg-white/20 text-white font-bold transition text-xs cursor-pointer select-none"
                    @click="setQty(item.id, (qty[item.id] || 1) - 1)"
                  >
                    −
                  </button>
                  <span class="w-6 text-center text-xs font-mono font-bold text-white select-none">
                    {{ qty[item.id] || 1 }}
                  </span>
                  <button
                    class="w-6 h-6 flex items-center justify-center bg-white/5 hover:bg-white/20 text-white font-bold transition text-xs cursor-pointer select-none"
                    @click="setQty(item.id, (qty[item.id] || 1) + 1)"
                  >
                    +
                  </button>
                </div>
              </div>

              <!-- Обертка с гарантированной тенью -->
              <div class="comic-btn-wrap w-full">
                <button
                  @click="openOrder(item)"
                  class="comic-btn w-full py-2.5 px-4 font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                  :style="{ '--btn-bg': item.accentColor, '--btn-color': '#101113' }"
                >
                  <ShoppingBag :size="14" />
                  Купить{{ item.maxQty > 1 ? ' (' + (qty[item.id] || 1) + ' шт.)' : '' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Блок покупки проходки -->
      <div class="mt-8 p-8 border border-white/10 bg-gradient-to-b from-[#18191c] to-[#111214] text-center relative" style="filter: drop-shadow(8px 8px 0px rgba(0,0,0,0.5));">
        <h3 class="font-heading font-black text-xl sm:text-2xl text-white tracking-tight mb-2 uppercase">
          Главный доступ на сервер
        </h3>
        <p class="text-xs sm:text-sm text-[var(--text-muted)] max-w-md mx-auto mb-6">
          Пропуск Mistraly Pass открывает доступ к серверу, лаунчеру на Rust и закрытому сообществу.
        </p>
        <div class="comic-btn-wrap inline-flex">
          <button
            @click="purchaseStore.show"
            class="comic-btn font-heading font-black text-sm uppercase tracking-wider px-8 py-3.5 inline-flex items-center justify-center gap-2 cursor-pointer"
            :style="{ '--btn-bg': '#0099FF', '--btn-color': '#FFFFFF' }"
          >
            Оформить проходку →
          </button>
        </div>
      </div>

    </div>

    <!-- МОДАЛЬНОЕ ОКНО ЗАКАЗА -->
    <div
      v-if="showOrder"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      @click.self="closeOrder"
    >
      <div class="modal-wrapper w-full max-w-md relative select-none">

        <!-- Крестик закрытия -->
        <button
          class="close-btn absolute -top-3 -right-3 z-30 w-8 h-8 bg-[#18191c] hover:bg-white text-white hover:text-black flex items-center justify-center border border-white/20 transition cursor-pointer"
          @click="closeOrder"
        >
          <X :size="16" />
        </button>

        <!-- Основная карточка чека -->
        <div class="modal-card bg-[#151619] p-7 sm:p-8 relative">

          <!-- Режим 1: Оформление заказа -->
          <div v-if="!orderDone">
            <!-- Верхняя строка -->
            <div class="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
              <span
                class="font-heading font-black text-[11px] uppercase tracking-wider px-2.5 py-0.5 text-black"
                :style="{ backgroundColor: orderItem?.accentColor, transform: 'rotate(-1.5deg)' }"
              >
                {{ orderItem?.badge || 'Товар' }}
              </span>
              <span class="font-mono text-xs text-white/30 tracking-widest uppercase">
                #ORD-{{ orderItem?.id.toUpperCase() }}
              </span>
            </div>

            <!-- Название и иконка -->
            <div class="flex items-center gap-4 mb-6">
              <div
                class="w-14 h-14 rounded-lg flex items-center justify-center shrink-0 border border-white/10 shadow-lg"
                :style="{ backgroundColor: orderItem?.iconBg, color: orderItem?.accentColor }"
              >
                <component :is="orderItem?.icon" :size="28" />
              </div>
              <div>
                <h3 class="font-heading font-black text-xl text-white tracking-tight leading-snug">
                  {{ orderItem?.title }}
                </h3>
                <p class="text-xs text-zinc-400 mt-0.5">
                  Мгновенная доставка на сервер
                </p>
              </div>
            </div>

            <!-- Чек заказа -->
            <div class="receipt-box bg-black/45 border border-dashed border-white/15 p-4 mb-6 space-y-3 font-mono text-xs">
              <div class="flex justify-between items-center text-zinc-400">
                <span>Цена за 1 шт:</span>
                <span class="text-white font-bold">{{ orderItem?.price }} ₽</span>
              </div>

              <!-- Изменение количества прямо в чеке -->
              <div class="flex justify-between items-center text-zinc-400 pt-1">
                <span>Количество:</span>
                <div v-if="orderItem?.maxQty > 1" class="flex items-center gap-2 bg-white/5 border border-white/10 px-2 py-0.5">
                  <button
                    class="text-white hover:text-[#0099FF] font-bold text-sm cursor-pointer"
                    @click="orderQty = Math.max(1, orderQty - 1)"
                  >
                    −
                  </button>
                  <span class="text-white font-bold w-4 text-center">{{ orderQty }}</span>
                  <button
                    class="text-white hover:text-[#0099FF] font-bold text-sm cursor-pointer"
                    @click="orderQty = Math.min(orderItem.maxQty, orderQty + 1)"
                  >
                    +
                  </button>
                </div>
                <span v-else class="text-white font-bold">1 шт.</span>
              </div>

              <!-- Итоговая строчка -->
              <div class="flex justify-between items-center pt-3 border-t border-white/10 text-sm">
                <span class="font-heading font-black text-white uppercase tracking-wider text-xs">К ОПЛАТЕ:</span>
                <span class="font-heading font-black text-2xl tracking-tight" :style="{ color: orderItem?.accentColor }">
                  {{ totalPrice }} ₽
                </span>
              </div>
            </div>

            <!-- Инфо-сноска -->
            <div class="flex items-start gap-2.5 mb-6 text-zinc-400 text-[11px] leading-relaxed">
              <ShieldCheck class="shrink-0 text-emerald-400 mt-0.5" :size="16" />
              <span>Оплата через защищенный шлюз <strong>Lava.ru</strong> (СБП, карты РФ, кошельки).</span>
            </div>

            <!-- Кнопка перехода к оплате -->
            <div class="comic-btn-wrap w-full">
              <button
                @click="confirmOrder"
                class="comic-btn w-full py-3.5 px-6 font-heading font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 cursor-pointer"
                :style="{ '--btn-bg': orderItem?.accentColor || '#0099FF', '--btn-color': '#101113' }"
              >
                <ShoppingBag :size="16" />
                Перейти к оплате
                <ArrowRight :size="16" />
              </button>
            </div>
          </div>

          <!-- Режим 2: Успешно оформлено -->
          <div v-else class="flex flex-col items-center text-center py-4">
            <div class="w-16 h-16 bg-emerald-500/10 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mb-4" style="transform: rotate(-3deg);">
              <Check :size="32" />
            </div>

            <span class="font-heading font-black text-xs uppercase tracking-wider text-emerald-400 mb-1">
              Успешно оформлено
            </span>
            <h3 class="font-heading font-black text-2xl text-white tracking-tight mb-2">
              Заказ подтвержден!
            </h3>
            <p class="text-xs text-zinc-400 mb-6 max-w-xs leading-relaxed">
              Предмет <strong>{{ orderItem?.title }}</strong> ({{ orderQty }} шт.) привязан к вашему аккаунту.
            </p>

            <div class="comic-btn-wrap inline-flex">
              <button
                @click="closeOrder"
                class="comic-btn px-10 py-3 font-heading font-black text-xs uppercase tracking-wider cursor-pointer"
                :style="{ '--btn-bg': '#FFFFFF', '--btn-color': '#101113' }"
              >
                Вернуться в магазин
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>

  </main>
</template>

<style scoped>
/* Фирменный стиль выделения слова в заголовке */
.word-hl {
  display: inline-block;
  color: #181611;
  background: #FFCC00;
  font-weight: 400;
  padding: 0 0.28em;
  margin: 0 0.04em;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
  transform: rotate(-1.5deg);
  cursor: default;
  user-select: none;
}

/* Карточка товара с жесткой тенью */
.card-outer {
  position: relative;
  filter: drop-shadow(8px 8px 0px rgba(0, 0, 0, 0.45));
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
              filter 0.22s ease;
}

.card-outer:hover {
  transform: translate(-3px, -4px);
  filter: drop-shadow(13px 13px 0px rgba(0, 0, 0, 0.65));
}

.card-box {
  background: linear-gradient(180deg, #18191c 0%, #111214 100%);
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

.comic-dots-pattern {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  background-image: radial-gradient(var(--accent) 1.5px, transparent 1.5px);
  background-size: 9px 9px;
  background-position: 0 0;
  transition: opacity 0.25s ease;
  z-index: 1;
}

.group:hover .comic-dots-pattern {
  opacity: 0.06;
}

.popout-icon-box {
  position: absolute;
  top: -16px;
  left: -12px;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-hard-shadow {
  box-shadow: 8px 8px 0px rgba(0, 0, 0, 0.45);
}

.item-title-tag {
  transform: rotate(-1.5deg);
  box-shadow: 3px 3px 0px rgba(0, 0, 0, 0.45);
  user-select: none;
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.22s ease;
}

.group:hover .item-title-tag {
  transform: scale(1.05) rotate(-3deg);
  box-shadow: 4px 4px 0px rgba(0, 0, 0, 0.8);
}

/* =========================================================
   ГАРАНТИРОВАННАЯ ЖЕСТКАЯ ТЕНЬ КНОПОК
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

/* При наведении: растет, становится БЕЛОЙ, текст черный */
.comic-btn:hover {
  transform: scale(1.04) rotate(-1.2deg);
  background-color: #FFFFFF !important;
  color: #0d0e10 !important;
}

.comic-btn:active {
  transform: scale(0.96) rotate(-1.2deg);
}

/* =========================================
   СТИЛЬ МОДАЛЬНОГО ОКНА
   ========================================= */
.modal-wrapper {
  filter: drop-shadow(14px 14px 0px rgba(0, 0, 0, 0.75));
}

.modal-card {
  clip-path: polygon(0% 1.2%, 100% 0%, 99% 99%, 1% 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.close-btn {
  clip-path: polygon(0% 10%, 100% 0%, 100% 90%, 0% 100%);
  filter: drop-shadow(3px 3px 0px rgba(0, 0, 0, 0.5));
}
</style>
