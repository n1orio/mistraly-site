<script setup lang="ts">
import { ref, computed, onMounted, markRaw } from 'vue'
import { ShoppingBag, Gavel, Key, Globe } from 'lucide-vue-next'
import { usePurchaseStore } from '../stores/purchase'
import { api, unwrap, errorMessage } from '../api/client'
import type { ShopItem } from '../stores/purchase'

const purchaseStore = usePurchaseStore()

const presentation: Record<string, { title: string; badge: string; icon: any; maxQty: number; accentColor: string; iconBg: string; clipPath: string }> = {
  'service_unban': {
    title: 'Снятие блокировки',
    badge: 'Услуга',
    icon: markRaw(Gavel),
    maxQty: 1,
    accentColor: '#FF4444',
    iconBg: '#2a1212',
    clipPath: 'polygon(0% 1.5%, 100% 0%, 99% 98.5%, 1% 100%)'
  },
  'item_return_key': {
    title: 'Ключ возврата',
    badge: 'Предмет',
    icon: markRaw(Key),
    maxQty: 10,
    accentColor: '#FFCC00',
    iconBg: '#2a2208',
    clipPath: 'polygon(0.8% 0%, 99.5% 2%, 99% 100%, 0% 98%)'
  },
  'item_origin_sphere': {
    title: 'Сфера происхождения',
    badge: 'Артефакт',
    icon: markRaw(Globe),
    maxQty: 10,
    accentColor: '#A855F7',
    iconBg: '#1e122b',
    clipPath: 'polygon(0% 2%, 100% 0.5%, 98.5% 99%, 1.5% 97.5%)'
  }
}

const fallback: (typeof presentation)[string] = {
  title: 'Товар',
  badge: 'Предмет',
  icon: markRaw(ShoppingBag),
  maxQty: 1,
  accentColor: '#0099FF',
  iconBg: '#101113',
  clipPath: 'polygon(0% 2%, 100% 0.5%, 98.5% 99%, 1.5% 97.5%)'
}

interface Card extends ShopItem {
  title: string
  badge: string
  desc: string
  icon: any
  maxQty: number
  accentColor: string
  iconBg: string
  clipPath: string
}

const cards = ref<Card[]>([])
const loadError = ref('')
const loading = ref(true)

onMounted(async () => {
  try {
    const items = await unwrap<ShopItem[]>(api.get('/shop/items'))
    cards.value = items
      .filter((i) => i.item_type !== 'pass')
      .map((i) => {
        const look = presentation[i.id] || { ...fallback, title: i.name }
        return {
          ...i,
          title: look.title,
          badge: look.badge,
          desc: i.description || '',
          icon: look.icon,
          maxQty: look.maxQty,
          accentColor: look.accentColor,
          iconBg: look.iconBg,
          clipPath: look.clipPath
        }
      })
  } catch (e) {
    loadError.value = errorMessage(e, 'Не удалось загрузить товары')
  } finally {
    loading.value = false
  }
})

const qty = ref<Record<string, number>>({})

function setQty(id: string, val: number) {
  const item = cards.value.find((i) => i.id === id)
  if (!item) return
  if (val < 1) val = 1
  if (val > item.maxQty) val = item.maxQty
  qty.value[id] = val
}

function openOrder(item: Card) {
  purchaseStore.showItem(item, qty.value[item.id] || 1)
}

function handlePassClick() {
  if (typeof (purchaseStore as any).showPass === 'function') {
    ;(purchaseStore as any).showPass()
  } else if (typeof (purchaseStore as any).show === 'function') {
    ;(purchaseStore as any).show()
  }
}
</script>

<template>
  <main class="w-full flex-1 flex flex-col items-center justify-start page-bg bg-[var(--bg-page)] text-[var(--text-main)] px-4 pt-28 pb-16 sm:pt-36 sm:pb-20">
    <div class="w-full max-w-5xl">

      <!-- Заголовок страницы -->
      <div class="text-center mb-14 sm:mb-16">
        <h2 class="font-heading text-3xl sm:text-4xl text-[var(--text-main)] tracking-tight mb-3">
          Магазин <span class="word-hl">сервера</span>
        </h2>
        <p class="text-xs sm:text-sm text-[var(--text-muted)] max-w-2xl mx-auto">
          Официальные цифровые предметы, проходки и сопутствующие услуги сервера Mistraly.
        </p>
      </div>

      <!-- Состояние загрузки витрины -->
      <p v-if="loading" class="text-center text-sm text-zinc-500 mb-16 font-mono">Загружаем товары…</p>
      <p v-else-if="loadError" class="text-center text-sm text-rose-400 mb-16 font-mono">{{ loadError }}</p>

      <!-- Сетка товаров 3 в ряд -->
      <div
        v-else-if="cards.length"
        class="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-12 pt-4 mb-16"
      >
        <div
          v-for="item in cards"
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

              <!-- Обертка кнопки покупки -->
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

      <!-- Пустое состояние -->
      <p v-else class="text-center text-sm text-zinc-500 mb-16 font-mono">Товары временно недоступны.</p>

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
            @click="handlePassClick"
            class="comic-btn font-heading font-black text-sm uppercase tracking-wider px-8 py-3.5 inline-flex items-center justify-center gap-2 cursor-pointer"
            :style="{ '--btn-bg': '#0099FF', '--btn-color': '#FFFFFF' }"
          >
            Оформить проходку →
          </button>
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

/* Вылет иконки за край */
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
</style>
