<script setup lang="ts">
import { ref, computed, onMounted, markRaw } from 'vue'
import { ShoppingBag, Gavel, Key, Globe } from '../lib/icons'
import { usePurchaseStore, isFree } from '../stores/purchase'
import { api, unwrap, errorMessage } from '../api/client'
import type { ShopItem } from '../stores/purchase'

const purchaseStore = usePurchaseStore()

const presentation: Record<string, { title: string; badge: string; icon: any; maxQty: number }> = {
  'service_unban': {
    title: 'Снятие блокировки',
    badge: 'Услуга',
    icon: markRaw(Gavel),
    maxQty: 1
  },
  'item_return_key': {
    title: 'Ключ возврата',
    badge: 'Предмет',
    icon: markRaw(Key),
    maxQty: 10
  },
  'item_origin_sphere': {
    title: 'Сфера происхождения',
    badge: 'Артефакт',
    icon: markRaw(Globe),
    maxQty: 10
  }
}

const fallback: (typeof presentation)[string] = {
  title: 'Товар',
  badge: 'Предмет',
  icon: markRaw(ShoppingBag),
  maxQty: 1
}

interface Card extends ShopItem {
  title: string
  badge: string
  desc: string
  icon: any
  maxQty: number
}

const cards = ref<Card[]>([])
/** Проходка с той же витрины: в сторе она грузится только при открытии модалки. */
const pass = ref<ShopItem | null>(null)
const loadError = ref('')
const loading = ref(true)

onMounted(async () => {
  try {
    const items = await unwrap<ShopItem[]>(api.get('/shop/items'))
    pass.value = items.find((i) => i.item_type === 'pass') ?? null
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
          maxQty: look.maxQty
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

function formatRub(kopecks: number): string {
  return `${(kopecks / 100).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽`
}

/**
 * Цена карточки с учётом выбранного количества.
 *
 * price_kopecks — источник истины: price в монетах витрины к деньгам
 * отношения не имеет. Умножаем здесь, чтобы игрок видел итог до открытия
 * модалки, а не после подтверждения.
 */
function totalRub(item: Card): string {
  if (isFree(item)) return '0 ₽'
  const kopecks = (item.price_kopecks ?? 0) * (qty.value[item.id] || 1)
  return formatRub(kopecks)
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
  <main class="w-full flex-1 flex flex-col items-center justify-start text-[var(--text-main)] px-4 pt-14 pb-16 sm:pt-20 sm:pb-20">
    <div class="w-full max-w-5xl">
      <div class="section-head">
        <h1 class="section-title">Магазин <span class="word-hl">сервера</span></h1>
        <p class="section-sub max-w-2xl mx-auto">
          Официальные цифровые предметы, проходки и сопутствующие услуги сервера Mistraly.
        </p>
      </div>

      <div v-if="loading" class="text-center mb-16"><span class="mc-spinner" aria-label="Загружаем товары" /></div>
      <p v-else-if="loadError" class="text-center text-[var(--bad)] mb-16">{{ loadError }}</p>

      <div v-else-if="cards.length" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <article v-for="item in cards" :key="item.id" class="item mc-panel">
          <div class="flex items-center gap-4 mb-4">
            <span class="mc-slot"><component :is="item.icon" :size="36" /></span>
            <div class="min-w-0">
              <span class="mc-tag mc-tag--dim">{{ item.badge }}</span>
              <h2 class="item-title">{{ item.title }}</h2>
            </div>
          </div>

          <!-- Цена: рубли, а не монеты витрины. Количество учитываем сразу,
               иначе кнопка «Купить (5 шт.)» стоила бы цену одной штуки. -->
          <div class="flex items-baseline gap-2 mb-3">
            <span class="item-price">{{ totalRub(item) }}</span>
            <span v-if="!item.payments_enabled" class="mc-tag mc-tag--ok">Бесплатно</span>
          </div>

          <p class="item-text">{{ item.desc }}</p>

          <div v-if="item.maxQty > 1" class="qty mc-well">
            <button type="button" aria-label="Меньше" @click="setQty(item.id, (qty[item.id] || 1) - 1)">−</button>
            <span>{{ qty[item.id] || 1 }}</span>
            <button type="button" aria-label="Больше" @click="setQty(item.id, (qty[item.id] || 1) + 1)">+</button>
          </div>

          <button class="mc-btn mc-btn--block" @click="openOrder(item)">
            <ShoppingBag :size="24" />
            Купить{{ item.maxQty > 1 ? ' (' + (qty[item.id] || 1) + ' шт.)' : '' }}
          </button>
        </article>
      </div>

      <p v-else class="text-center text-[var(--text-muted)] mb-16">Товары временно недоступны.</p>

      <!-- Блок покупки проходки -->
      <section class="pass mc-panel">
        <h2 class="pass-title">Главный доступ на сервер</h2>
        <p class="pass-text">
          Пропуск Mistraly Pass открывает доступ к серверу, лаунчеру на Rust и закрытому сообществу.
          Бессрочный, покупается один раз.
        </p>
        <!-- Цена проходки берётся с витрины: price в монетах — не рубли. -->
        <div v-if="!purchaseStore.hasActivePass" class="pass-price">
          <!-- Приём оплаты выключен — проходка бесплатна, как и товары выше. -->
          <template v-if="!pass">{{ loading ? '…' : '' }}</template>
          <template v-else-if="isFree(pass)">Бесплатно</template>
          <template v-else>{{ formatRub(pass.price_kopecks ?? 0) }}</template>
        </div>

        <!-- При действующей проходке повторная оплата не нужна. -->
        <button v-if="!purchaseStore.hasActivePass" class="mc-btn" @click="handlePassClick">
          Оформить проходку →
        </button>
        <p v-else class="text-[var(--ok)] m-0">Проходка уже оформлена — доступ бессрочный.</p>
      </section>
    </div>
  </main>
</template>

<style scoped>
.item {
  display: flex;
  flex-direction: column;
  padding: 18px;
}
.item .mc-slot {
}
.item-title {
  font-family: 'Noto Sans', 'Helvetica Neue', Arial, sans-serif;
  font-weight: 700;
  margin: 6px 0 0;
  font-size: 17px;
  line-height: 1.25;
}
.item-price {
  font-family: 'Minecraft Ten', 'Noto Sans', sans-serif;
  font-size: 24px;
  color: var(--sky);
}
.item-text {
  flex: 1;
  margin: 0 0 14px;
  color: var(--text-muted);
  font-size: 16px;
  line-height: 1.45;
}
.qty {
  display: flex;
  align-items: center;
  align-self: flex-end;
  margin: 0 0 14px;
  padding: 3px;
}
.qty button {
  width: 32px;
  height: 32px;
  background: var(--panel-hi);
  color: #fff;
  border: 0;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
}
.qty button:hover {
  background: var(--blue);
}
.qty span {
  width: 36px;
  text-align: center;
  font-weight: 700;
}
.pass {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 20px;
  text-align: center;
}
.pass-title {
  margin: 0 0 8px;
  font-size: 24px;
  line-height: 1.25;
}
.pass-text {
  max-width: 480px;
  margin: 0 0 16px;
  color: var(--text-muted);
}
.pass-price {
  margin-bottom: 16px;
  font-family: 'Minecraft Ten', 'Noto Sans', sans-serif;
  font-size: 32px;
  color: var(--sky);
}
</style>
